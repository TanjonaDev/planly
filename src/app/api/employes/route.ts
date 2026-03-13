import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

  const employees = await prisma.employee.findMany({
    where: { companyId: company.id },
    include: {
      user: true,
      _count: { select: { missions: true } },
    },
    orderBy: { reliabilityScore: "desc" },
  });

  return NextResponse.json(
    employees.map((e) => ({
      id: e.id,
      firstName: e.user.firstName,
      lastName: e.user.lastName,
      phone: e.user.phone,
      zones: e.zones,
      skills: e.skills,
      reliabilityScore: e.reliabilityScore,
      isActive: e.user.isActive,
      missionsCount: e._count.missions,
    }))
  );
}

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(6),
  zones: z.array(z.string()).default([]),
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
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides", details: result.error.flatten() }, { status: 400 });
  }

  const { firstName, lastName, phone, zones, notes } = result.data;

  // Vérifier que le téléphone n'est pas déjà utilisé
  const existing = await prisma.user.findFirst({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "Ce numéro est déjà utilisé" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      phone,
      role: "EMPLOYE",
      employee: {
        create: {
          companyId: company.id,
          zones,
          notes,
        },
      },
    },
    include: { employee: true },
  });

  return NextResponse.json({ id: user.employee!.id }, { status: 201 });
}
