import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/sms";

const schema = z.object({
  phone: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Numéro de téléphone invalide" },
      { status: 400 }
    );
  }

  const { phone } = result.data;

  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Numéro non reconnu" }, { status: 404 });
  }

  const code = String(randomInt(100000, 999999));
  const hashedCode = createHash("sha256").update(code).digest("hex");
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier: phone } });
  await prisma.verificationToken.create({
    data: { identifier: phone, token: hashedCode, expires },
  });

  const smsResult = await sendVerificationCode(phone, code);
  if (!smsResult.success) {
    return NextResponse.json(
      { error: "Échec de l'envoi du SMS" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
