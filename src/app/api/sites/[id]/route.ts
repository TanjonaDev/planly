import { NextRequest, NextResponse } from "next/server";
import { requireGerant } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

  const site = await prisma.site.findFirst({
    where: { id, companyId: company.id },
    include: {
      checklists: {
        include: {
          items: { orderBy: { order: "asc" } },
        },
      },
      missions: {
        include: {
          employee: { include: { user: true } },
        },
        orderBy: { date: "desc" },
        take: 5,
      },
    },
  });

  if (!site) {
    return NextResponse.json({ error: "Site introuvable" }, { status: 404 });
  }

  // Grouper les items de checklist par catégorie
  const checklists = site.checklists.map((tpl) => {
    const categories: Record<string, typeof tpl.items> = {};
    for (const item of tpl.items) {
      const cat = item.category ?? "Général";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(item);
    }

    return {
      id: tpl.id,
      name: tpl.name,
      categories: Object.entries(categories).map(([name, items]) => ({
        name,
        items: items.map((i) => ({
          id: i.id,
          label: i.label,
          isRequired: i.isRequired,
          photoRequired: i.photoRequired,
          order: i.order,
        })),
      })),
    };
  });

  return NextResponse.json({
    id: site.id,
    name: site.name,
    address: site.address,
    contactName: site.contactName,
    contactPhone: site.contactPhone,
    isActive: site.isActive,
    checklists,
    recentMissions: site.missions.map((m) => ({
      id: m.id,
      date: format(new Date(m.date), "d MMM yyyy", { locale: fr }),
      startTime: m.startTime,
      endTime: m.endTime,
      status: m.status,
      employee: m.employee
        ? `${m.employee.user.firstName} ${m.employee.user.lastName}`
        : null,
    })),
  });
}
