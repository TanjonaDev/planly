import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "EMPLOYE") redirect("/mes-missions");
  redirect("/dashboard");
}
