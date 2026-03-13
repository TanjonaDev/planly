import { NextResponse } from "next/server";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Non disponible" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("dev-session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
