import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Non disponible" }, { status: 403 });
  }

  const { role, phone } = await req.json();
  const where = phone ? { phone } : { role };
  const user = await prisma.user.findFirst({ where });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("dev-session", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });
  return res;
}
