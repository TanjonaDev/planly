import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

const bodySchema = z.object({ accept: z.boolean() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ absenceId: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "EMPLOYE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { absenceId } = await params;
  const body = await req.json();
  const result = bodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }

  // Vérifier que la demande lui est bien destinée
  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: `replacement:${employee.id}`,
      token: absenceId,
      expires: { gt: new Date() },
    },
  });
  if (!token) {
    return NextResponse.json({ error: "Demande expirée ou introuvable" }, { status: 404 });
  }

  // Supprimer le token dans tous les cas
  await prisma.verificationToken.deleteMany({
    where: { identifier: `replacement:${employee.id}` },
  });

  if (!result.data.accept) {
    return NextResponse.json({ success: true });
  }

  const absence = await prisma.absence.findUnique({
    where: { id: absenceId },
    include: {
      employee: { include: { user: true } },
      mission: { include: { site: true } },
    },
  });

  if (!absence || absence.status !== "REPORTED") {
    return NextResponse.json({ error: "Cette mission a déjà été pourvue" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.mission.update({
      where: { id: absence.missionId },
      data: { status: "PLANNED", employeeId: employee.id },
    }),
    prisma.absence.update({
      where: { id: absenceId },
      data: { status: "REPLACEMENT_FOUND" },
    }),
  ]);

  const missionDate = format(new Date(absence.mission.date), "d MMMM", { locale: fr });

  // Prévenir le gérant
  const company = await prisma.company.findUnique({
    where: { id: employee.companyId },
    include: { owner: true },
  });
  if (company?.owner.phone) {
    await sendSMS(
      company.owner.phone,
      `✅ ${employee.user.firstName} ${employee.user.lastName} a accepté de remplacer ${absence.employee.user.firstName} pour ${absence.mission.site.name} le ${missionDate}.`
    );
  }

  return NextResponse.json({ success: true });
}
