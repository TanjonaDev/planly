import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
});

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { phone, code } = result.data;
  const hashedCode = createHash("sha256").update(code).digest("hex");

  const verificationToken = await prisma.verificationToken.findFirst({
    where: { identifier: phone, token: hashedCode },
  });

  if (!verificationToken) {
    return NextResponse.json({ error: "Code invalide" }, { status: 401 });
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: phone } });
    return NextResponse.json({ error: "Code expiré" }, { status: 401 });
  }

  // Suppression immédiate — usage unique
  await prisma.verificationToken.deleteMany({ where: { identifier: phone } });

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  const response = NextResponse.json({ success: true, role: user.role });
  response.cookies.set("session-token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });

  return response;
}
