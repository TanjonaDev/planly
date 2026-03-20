import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Non disponible" }, { status: 403 });
  }

  try {
    const { role, phone } = await req.json();
    const where = phone ? { phone } : { role };
    const user = await prisma.user.findFirst({ where });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const res = NextResponse.json({ ok: true, userId: user.id });
    res.headers.set(
      "Set-Cookie",
      `dev-session=${user.id}; Path=/; Max-Age=${60 * 60 * 24}; HttpOnly; SameSite=Lax`
    );
    return res;
  } catch (err) {
    console.error("dev-login error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
