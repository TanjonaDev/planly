import { NextRequest, NextResponse } from "next/server";
import { requireGerant } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const DAY_ORDER: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireGerant();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findFirst({
    where: { ownerId: session.userId },
  });
  if (!company) {
    return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, companyId: company.id },
    include: {
      user: true,
      availabilities: { orderBy: { dayOfWeek: "asc" } },
      missions: {
        include: { site: true },
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    id: employee.id,
    firstName: employee.user.firstName,
    lastName: employee.user.lastName,
    phone: employee.user.phone,
    zones: employee.zones,
    skills: employee.skills,
    reliabilityScore: employee.reliabilityScore,
    isActive: employee.user.isActive,
    notes: employee.notes,
    availabilities: employee.availabilities
      .sort((a, b) => DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek])
      .map((a) => ({
        dayOfWeek: a.dayOfWeek,
        dayLabel: DAY_LABELS[a.dayOfWeek],
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    recentMissions: employee.missions.map((m) => ({
      id: m.id,
      site: m.site.name,
      date: format(new Date(m.date), "d MMM yyyy", { locale: fr }),
      status: m.status,
    })),
  });
}
