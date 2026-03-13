import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "1"), 7);

  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(addDays(now, days - 1));

  const missions = await prisma.mission.findMany({
    where: {
      employeeId: employee.id,
      date: { gte: from, lte: to },
      status: { notIn: ["CANCELLED"] },
    },
    include: { site: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(
    missions.map((m) => ({
      id: m.id,
      site: m.site.name,
      address: m.site.address,
      date: format(new Date(m.date), "EEEE d MMMM", { locale: fr }),
      startTime: m.startTime,
      endTime: m.endTime,
      status: m.status,
    }))
  );
}
