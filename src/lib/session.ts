import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// Returns an object compatible with existing API routes (session.userId, session.user.*)
export async function getSession() {
  // Dev bypass: cookie "dev-session" contenant un userId
  if (process.env.NODE_ENV === "development") {
    const cookieStore = await cookies();
    const devUserId = cookieStore.get("dev-session")?.value;
    if (devUserId) {
      const user = await prisma.user.findUnique({ where: { id: devUserId } });
      if (user) {
        return {
          userId: user.id,
          user: {
            id: user.id,
            email: user.phone ?? "",
            role: user.role as string,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        };
      }
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    user: session.user,
  };
}

export async function requireGerant() {
  const session = await getSession();
  if (!session || session.user.role !== "GERANT") return null;
  return session;
}

export async function requireEmploye() {
  const session = await getSession();
  if (!session || session.user.role !== "EMPLOYE") return null;
  return session;
}
