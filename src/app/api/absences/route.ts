import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSession, requireGerant } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendAbsenceAlert } from "@/lib/sms";

const postSchema = z.object({
  missionId: z.string(),
  reason: z.string().optional(),
});

// Employé signale une absence
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "EMPLOYE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const result = postSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { missionId, reason } = result.data;

  const employee = await prisma.employee.findUnique({
    where: { userId: session.userId },
    include: { company: { include: { owner: true } } },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }

  const mission = await prisma.mission.findFirst({
    where: { id: missionId, employeeId: employee.id },
    include: { site: true },
  });
  if (!mission) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const existing = await prisma.absence.findUnique({ where: { missionId } });
  if (existing) {
    return NextResponse.json({ error: "Absence déjà signalée" }, { status: 409 });
  }

  const absence = await prisma.absence.create({
    data: { employeeId: employee.id, missionId, reason: reason ?? null },
  });

  // Désassigner la mission
  await prisma.mission.update({
    where: { id: missionId },
    data: { status: "UNASSIGNED", employeeId: null },
  });

  // SMS au gérant
  await sendAbsenceAlert(
    employee.company.owner.phone,
    `${session.user.firstName} ${session.user.lastName}`,
    mission.site.name,
    `${mission.startTime}–${mission.endTime}`
  );

  return NextResponse.json({ success: true, absenceId: absence.id }, { status: 201 });
}

// Gérant récupère les absences ouvertes
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

  const absences = await prisma.absence.findMany({
    where: {
      employee: { companyId: company.id },
      status: { in: ["REPORTED", "UNRESOLVED"] },
    },
    include: {
      employee: { include: { user: true } },
      mission: { include: { site: true } },
    },
    orderBy: { reportedAt: "desc" },
  });

  return NextResponse.json(
    absences.map((a) => ({
      id: a.id,
      status: a.status,
      reason: a.reason,
      reportedAt: format(a.reportedAt, "d MMM HH:mm", { locale: fr }),
      employee: {
        name: `${a.employee.user.firstName} ${a.employee.user.lastName}`,
        phone: a.employee.user.phone,
      },
      mission: {
        site: a.mission.site.name,
        date: format(new Date(a.mission.date), "EEEE d MMMM", { locale: fr }),
        startTime: a.mission.startTime,
        endTime: a.mission.endTime,
      },
    }))
  );
}
