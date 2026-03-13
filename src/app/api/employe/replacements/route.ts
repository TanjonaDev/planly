import { NextResponse } from "next/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== "EMPLOYE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: session.userId },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }

  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: `replacement:${employee.id}`,
      expires: { gt: new Date() },
    },
  });

  if (!token) return NextResponse.json([]);

  const absence = await prisma.absence.findUnique({
    where: { id: token.token },
    include: {
      employee: { include: { user: true } },
      mission: { include: { site: true } },
    },
  });

  if (!absence || absence.status !== "REPORTED") return NextResponse.json([]);

  return NextResponse.json([
    {
      absenceId: absence.id,
      absentName: `${absence.employee.user.firstName} ${absence.employee.user.lastName}`,
      site: absence.mission.site.name,
      address: absence.mission.site.address,
      date: format(new Date(absence.mission.date), "EEEE d MMMM", { locale: fr }),
      startTime: absence.mission.startTime,
      endTime: absence.mission.endTime,
    },
  ]);
}
