import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  action: z.enum(["start", "complete"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "EMPLOYE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = patchSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: session.userId },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }

  const mission = await prisma.mission.findFirst({
    where: { id, employeeId: employee.id },
  });
  if (!mission) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const { action } = result.data;

  if (action === "start" && mission.status !== "PLANNED") {
    return NextResponse.json({ error: "La mission ne peut pas être démarrée" }, { status: 400 });
  }
  if (action === "complete" && mission.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "La mission n'est pas en cours" }, { status: 400 });
  }

  const newStatus = action === "start" ? "IN_PROGRESS" : "COMPLETED";
  await prisma.mission.update({ where: { id }, data: { status: newStatus } });

  return NextResponse.json({ success: true, status: newStatus });
}
