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

  const sites = await prisma.site.findMany({
    where: { companyId: company.id },
    include: {
      _count: {
        select: {
          missions: true,
          checklists: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    sites.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      contactName: s.contactName,
      contactPhone: s.contactPhone,
      isActive: s.isActive,
      missionsCount: s._count.missions,
      hasChecklist: s._count.checklists > 0,
    }))
  );
}

const createSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
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

  const { name, address, contactName, contactPhone } = result.data;

  const site = await prisma.site.create({
    data: {
      companyId: company.id,
      name,
      address,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
    },
  });

  return NextResponse.json({ id: site.id }, { status: 201 });
}
