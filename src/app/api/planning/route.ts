import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addDays, startOfDay, endOfDay, parseISO, format, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { requireGerant } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

  // ?from=2026-03-03 (lundi de la semaine)
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");

  let weekStart: Date;
  if (fromParam) {
    const parsed = parseISO(fromParam);
    weekStart = isValid(parsed) ? parsed : new Date();
  } else {
    weekStart = new Date();
  }
  weekStart = startOfDay(weekStart);
  const weekEnd = endOfDay(addDays(weekStart, 6));

  const missions = await prisma.mission.findMany({
    where: {
      site: { companyId: company.id },
      date: { gte: weekStart, lte: weekEnd },
    },
    include: {
      site: true,
      employee: { include: { user: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayMissions = missions.filter(
      (m) => format(new Date(m.date), "yyyy-MM-dd") === dateStr
    );

    return {
      date: dateStr,
      label: format(date, "EEE d", { locale: fr }),
      dayName: format(date, "EEEE d MMMM", { locale: fr }),
      missions: dayMissions.map((m) => ({
        id: m.id,
        site: m.site.name,
        employee: m.employee
          ? `${m.employee.user.firstName} ${m.employee.user.lastName}`
          : null,
        startTime: m.startTime,
        endTime: m.endTime,
        status: m.status,
      })),
    };
  });

  const weekLabel = `${format(weekStart, "d")} – ${format(
    addDays(weekStart, 6),
    "d MMMM yyyy",
    { locale: fr }
  )}`;

  return NextResponse.json({ weekLabel, days });
}

const createMissionSchema = z.object({
  siteId: z.string().min(1),
  employeeId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const result = createMissionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides", details: result.error.flatten() }, { status: 400 });
  }

  const { siteId, employeeId, date, startTime, endTime, notes } = result.data;

  // Vérifier que le site appartient à la company
  const site = await prisma.site.findFirst({
    where: { id: siteId, companyId: company.id },
  });
  if (!site) {
    return NextResponse.json({ error: "Site introuvable" }, { status: 404 });
  }

  const mission = await prisma.mission.create({
    data: {
      siteId,
      employeeId: employeeId || null,
      date: parseISO(date),
      startTime,
      endTime,
      notes: notes || null,
      status: employeeId ? "PLANNED" : "UNASSIGNED",
    },
  });

  return NextResponse.json({ id: mission.id }, { status: 201 });
}
