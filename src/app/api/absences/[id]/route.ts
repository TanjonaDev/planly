import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireGerant } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendReplacementRequest } from "@/lib/sms";

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

  const absence = await prisma.absence.findFirst({
    where: { id, employee: { companyId: company.id } },
    include: {
      employee: { include: { user: true } },
      mission: { include: { site: true } },
    },
  });
  if (!absence) {
    return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    id: absence.id,
    status: absence.status,
    reason: absence.reason,
    reportedAt: format(absence.reportedAt, "d MMM HH:mm", { locale: fr }),
    employee: {
      id: absence.employee.id,
      name: `${absence.employee.user.firstName} ${absence.employee.user.lastName}`,
      phone: absence.employee.user.phone,
    },
    mission: {
      id: absence.mission.id,
      site: absence.mission.site.name,
      address: absence.mission.site.address,
      date: format(new Date(absence.mission.date), "EEEE d MMMM yyyy", { locale: fr }),
      startTime: absence.mission.startTime,
      endTime: absence.mission.endTime,
    },
  });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("contact"), employeeId: z.string() }),
  z.object({ action: z.literal("unresolved") }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireGerant();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = patchSchema.safeParse(body);
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
    where: { id, employee: { companyId: company.id } },
    include: { mission: { include: { site: true } } },
  });
  if (!absence) {
    return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
  }

  if (result.data.action === "unresolved") {
    await prisma.absence.update({ where: { id }, data: { status: "UNRESOLVED" } });
    return NextResponse.json({ success: true });
  }

  // Contact un remplaçant par SMS
  const { employeeId } = result.data;
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: company.id },
    include: { user: true },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }

  const mission = absence.mission;
  const missionDate = format(new Date(mission.date), "EEEE d MMMM", { locale: fr });

  // Stocker la demande en attente dans VerificationToken
  // identifier = "replacement:{employeeId}" (indépendant du numéro de téléphone)
  // token = absenceId, expires = 2h
  await prisma.verificationToken.deleteMany({
    where: { identifier: `replacement:${employee.id}` },
  });
  await prisma.verificationToken.create({
    data: {
      identifier: `replacement:${employee.id}`,
      token: absence.id,
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  await sendReplacementRequest(
    employee.user.phone,
    employee.user.firstName,
    mission.site.name,
    missionDate,
    `${mission.startTime}–${mission.endTime}`
  );

  return NextResponse.json({ success: true });
}
