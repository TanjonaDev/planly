import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireGerant } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { suggestReplacements } from "@/lib/ai";

const schema = z.object({ absenceId: z.string() });

const DAY_MAP: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export async function POST(req: NextRequest) {
  const session = await requireGerant();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const company = await prisma.company.findFirst({
    where: { ownerId: session.userId },
  });
  if (!company) {
    return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
  }

  const absence = await prisma.absence.findFirst({
    where: { id: result.data.absenceId, employee: { companyId: company.id } },
    include: {
      employee: { include: { user: true } },
      mission: { include: { site: true } },
    },
  });
  if (!absence) {
    return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
  }

  const mission = absence.mission;
  const missionDate = new Date(mission.date);
  const dayOfWeek = DAY_MAP[missionDate.getDay()];
  const dateStr = format(missionDate, "yyyy-MM-dd");

  const candidates = await prisma.employee.findMany({
    where: {
      companyId: company.id,
      id: { not: absence.employeeId },
      user: { isActive: true },
    },
    include: {
      user: true,
      availabilities: true,
      missions: {
        where: {
          date: {
            gte: new Date(`${dateStr}T00:00:00`),
            lte: new Date(`${dateStr}T23:59:59`),
          },
          status: { not: "CANCELLED" },
        },
      },
    },
  });

  // Pré-scoring pour chaque candidat
  const scoredCandidates = await Promise.all(
    candidates.map(async (emp) => {
      // 1. Disponibilité sur le créneau (30pts)
      const avail = emp.availabilities.find((a) => a.dayOfWeek === dayOfWeek);
      const availScore = avail ? 30 : 0;

      // 2. Historique sur ce site (25pts)
      const siteHistory = await prisma.mission.count({
        where: { employeeId: emp.id, siteId: mission.siteId, status: "COMPLETED" },
      });
      const siteScore = Math.min(25, siteHistory * 5);

      // 3. Zone géographique (20pts) — correspondance nom/adresse du site
      const siteText = [mission.site.name, mission.site.address].join(" ").toLowerCase();
      const zoneMatch = emp.zones.some((z) => siteText.includes(z.toLowerCase()));
      const zoneScore = zoneMatch ? 20 : 10;

      // 4. Fiabilité (15pts)
      const reliabilityScore = (emp.reliabilityScore / 10) * 15;

      // 5. Charge de travail (10pts)
      const workloadScore = Math.max(0, 10 - emp.missions.length * 3);

      return {
        id: emp.id,
        firstName: emp.user.firstName,
        lastName: emp.user.lastName,
        zones: emp.zones,
        skills: emp.skills,
        reliabilityScore: emp.reliabilityScore,
        isAvailable: !!avail,
        siteHistory,
        preScore: availScore + siteScore + zoneScore + reliabilityScore + workloadScore,
      };
    })
  );

  const topCandidates = scoredCandidates
    .sort((a, b) => b.preScore - a.preScore)
    .slice(0, 6);

  if (topCandidates.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const aiResult = await suggestReplacements({
      siteName: mission.site.name,
      date: format(missionDate, "EEEE d MMMM yyyy", { locale: fr }),
      startTime: mission.startTime,
      endTime: mission.endTime,
      absentEmployee: `${absence.employee.user.firstName} ${absence.employee.user.lastName}`,
      candidates: topCandidates.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        zones: c.zones,
        skills: c.skills,
        reliabilityScore: c.reliabilityScore,
        isAvailable: c.isAvailable,
        siteHistory: c.siteHistory,
      })),
    });

    const suggestions = aiResult.suggestions
      .slice(0, 3)
      .map((s) => {
        const candidate = topCandidates.find((c) => c.id === s.employeeId);
        if (!candidate) return null;
        return {
          employeeId: s.employeeId,
          name: `${candidate.firstName} ${candidate.lastName}`,
          score: s.score,
          reason: s.reason,
          isAvailable: candidate.isAvailable,
          reliabilityScore: candidate.reliabilityScore,
          siteHistory: candidate.siteHistory,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI suggestion failed, fallback to pre-scores:", error);
    const fallback = topCandidates.slice(0, 3).map((c) => ({
      employeeId: c.id,
      name: `${c.firstName} ${c.lastName}`,
      score: Math.round(c.preScore),
      reason: c.isAvailable
        ? "Disponible sur ce créneau"
        : "Pas de disponibilité enregistrée pour ce jour",
      isAvailable: c.isAvailable,
      reliabilityScore: c.reliabilityScore,
      siteHistory: c.siteHistory,
    }));
    return NextResponse.json({ suggestions: fallback });
  }
}
