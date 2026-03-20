import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

function twiml(message: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get("From") as string;
  const body = (formData.get("Body") as string)?.trim().toUpperCase() ?? "";

  if (!from) return twiml("Message reçu.");

  const isYes = body === "OUI" || body === "YES" || body === "O";
  const isNo = body === "NON" || body === "NO" || body === "N";

  if (!isYes && !isNo) {
    return twiml("Répondez OUI ou NON pour confirmer votre disponibilité.");
  }

  // Retrouver l'employé par son numéro de téléphone
  const replacementUser = await prisma.user.findFirst({ where: { phone: from } });
  if (!replacementUser) {
    return twiml("Numéro non reconnu dans notre système.");
  }

  const replacementEmployee = await prisma.employee.findUnique({
    where: { userId: replacementUser.id },
  });
  if (!replacementEmployee) {
    return twiml("Employé introuvable.");
  }

  // Retrouver la demande en attente via VerificationToken (identifier = replacement:{employeeId})
  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: `replacement:${replacementEmployee.id}`,
      expires: { gt: new Date() },
    },
  });

  if (!token) {
    return twiml("Aucune demande de remplacement en attente pour ce numéro.");
  }

  const absenceId = token.token;
  await prisma.verificationToken.deleteMany({
    where: { identifier: `replacement:${replacementEmployee.id}` },
  });

  if (isNo) {
    return twiml("Compris, merci pour votre réponse.");
  }

  // OUI → résoudre l'absence et réassigner la mission
  const absence = await prisma.absence.findUnique({
    where: { id: absenceId },
    include: {
      employee: { include: { user: true } },
      mission: { include: { site: true } },
    },
  });

  if (!absence || absence.status !== "REPORTED") {
    return twiml("Cette mission a déjà été pourvue, merci.");
  }

  await prisma.$transaction([
    prisma.mission.update({
      where: { id: absence.missionId },
      data: { status: "PLANNED", employeeId: replacementEmployee.id },
    }),
    prisma.absence.update({
      where: { id: absenceId },
      data: { status: "REPLACEMENT_FOUND" },
    }),
  ]);

  const missionDateStr = format(new Date(absence.mission.date), "d MMMM", { locale: fr });

  // Prévenir le gérant
  const company = await prisma.company.findUnique({
    where: { id: replacementEmployee.companyId },
    include: { owner: true },
  });
  if (company) {
    await sendSMS(
      company.owner.phone ?? "",
      `✅ ${replacementUser.firstName} ${replacementUser.lastName} a accepté de remplacer ${absence.employee.user.firstName} pour ${absence.mission.site.name} le ${missionDateStr}.`
    );
  }

  return twiml(
    `Parfait ${replacementUser.firstName} ! Votre présence à ${absence.mission.site.name} le ${missionDateStr} de ${absence.mission.startTime} à ${absence.mission.endTime} est confirmée. Merci !`
  );
}
