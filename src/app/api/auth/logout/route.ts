import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({ where: { sessionToken } });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("session-token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
