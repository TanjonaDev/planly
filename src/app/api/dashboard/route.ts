import { NextResponse } from "next/server";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { requireGerant } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireGerant();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const company = await prisma.company.findFirst({
    where: { ownerId: session.userId },
  });

  if (!company) {
    return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [todayMissions, openAbsences, weekMissions, weekAbsences] =
    await Promise.all([
      prisma.mission.findMany({
        where: {
          site: { companyId: company.id },
          date: { gte: todayStart, lte: todayEnd },
        },
        include: {
          site: true,
          employee: { include: { user: true } },
        },
        orderBy: { startTime: "asc" },
      }),

      prisma.absence.findMany({
        where: {
          employee: { companyId: company.id },
          status: "REPORTED",
        },
        include: {
          employee: { include: { user: true } },
          mission: { include: { site: true } },
        },
        orderBy: { reportedAt: "desc" },
        take: 10,
      }),

      prisma.mission.findMany({
        where: {
          site: { companyId: company.id },
          date: { gte: weekStart, lte: weekEnd },
        },
        include: { results: true },
      }),

      prisma.absence.count({
        where: {
          employee: { companyId: company.id },
          mission: { date: { gte: weekStart, lte: weekEnd } },
        },
      }),
    ]);

  // Alertes : absences ouvertes + missions non assignées aujourd'hui
  const alerts: Array<{
    id: string;
    message: string;
    site: string;
    time: string;
  }> = [];

  for (const absence of openAbsences) {
    alerts.push({
      id: absence.id,
      message: `${absence.employee.user.firstName} ${absence.employee.user.lastName} — absent(e)`,
      site: absence.mission.site.name,
      time: `${absence.mission.startTime}–${absence.mission.endTime}`,
    });
  }

  // Taux checklist : missions COMPLETED avec au moins un résultat coché
  const completedMissions = weekMissions.filter((m) => m.status === "COMPLETED");
  const inProgressMissions = weekMissions.filter((m) => m.status === "IN_PROGRESS");
  const withChecklist = completedMissions.filter((m) =>
    m.results.some((r) => r.isCompleted)
  );
  const checklistRate =
    completedMissions.length > 0
      ? Math.round((withChecklist.length / completedMissions.length) * 100)
      : 0;

  return NextResponse.json({
    gerant: {
      firstName: session.user.firstName,
      lastName: session.user.lastName,
    },
    alerts,
    todayMissions: todayMissions.map((m) => ({
      id: m.id,
      site: m.site.name,
      employee: m.employee
        ? `${m.employee.user.firstName} ${m.employee.user.lastName}`
        : null,
      startTime: m.startTime,
      endTime: m.endTime,
      status: m.status,
    })),
    weekStats: {
      totalMissions: weekMissions.length,
      completedMissions: completedMissions.length + inProgressMissions.length,
      absences: weekAbsences,
      checklistRate,
    },
  });
}
