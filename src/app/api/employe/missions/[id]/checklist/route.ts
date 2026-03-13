import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "EMPLOYE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { userId: session.userId },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }

  const mission = await prisma.mission.findFirst({
    where: { id, employeeId: employee.id },
    include: {
      site: {
        include: {
          checklists: {
            include: {
              items: { orderBy: [{ category: "asc" }, { order: "asc" }] },
            },
            take: 1,
          },
        },
      },
      results: true,
    },
  });

  if (!mission) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const template = mission.site.checklists[0] ?? null;
  const items = template?.items ?? [];

  // Merge items avec les résultats existants
  const resultsMap = new Map(
    mission.results.map((r) => [`${r.itemLabel}__${r.category ?? ""}`, r])
  );

  const mergedItems = items.map((item) => {
    const result = resultsMap.get(`${item.label}__${item.category ?? ""}`);
    return {
      id: item.id,
      label: item.label,
      category: item.category,
      order: item.order,
      isRequired: item.isRequired,
      photoRequired: item.photoRequired,
      isCompleted: result?.isCompleted ?? false,
      resultId: result?.id ?? null,
    };
  });

  const total = mergedItems.length;
  const completed = mergedItems.filter((i) => i.isCompleted).length;
  const requiredTotal = mergedItems.filter((i) => i.isRequired).length;
  const requiredCompleted = mergedItems.filter(
    (i) => i.isRequired && i.isCompleted
  ).length;

  return NextResponse.json({
    missionId: mission.id,
    site: mission.site.name,
    address: mission.site.address,
    startTime: mission.startTime,
    endTime: mission.endTime,
    status: mission.status,
    hasChecklist: !!template,
    checklist: template
      ? { id: template.id, name: template.name, items: mergedItems }
      : null,
    progress: { total, completed, requiredTotal, requiredCompleted },
  });
}

const patchSchema = z.object({
  itemLabel: z.string(),
  category: z.string().nullable(),
  isCompleted: z.boolean(),
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

  const body = await req.json();
  const result = patchSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { itemLabel, category, isCompleted } = result.data;

  // Upsert manuel (pas de contrainte unique sur la combinaison dans le schema)
  const existing = await prisma.checklistResult.findFirst({
    where: { missionId: id, itemLabel, category },
    select: { id: true },
  });

  if (existing) {
    await prisma.checklistResult.update({
      where: { id: existing.id },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });
  } else {
    await prisma.checklistResult.create({
      data: {
        missionId: id,
        itemLabel,
        category,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });
  }

  return NextResponse.json({ success: true });
}
