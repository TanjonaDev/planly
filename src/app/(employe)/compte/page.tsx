"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

const isDev = process.env.NODE_ENV === "development";

export default function ComptePage() {
  const router = useRouter();

  async function handleLogout() {
    if (isDev) {
      await fetch("/api/dev-logout", { method: "POST" });
      router.push("/login");
    } else {
      signOut({ callbackUrl: "/login" });
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-8 pb-5 bg-white" style={{ boxShadow: "0 1px 0 #E5E7EB" }}>
        <h1 className="text-xl font-bold text-gray-900">Mon compte</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Avatar placeholder */}
        <div className="bg-white rounded-[1.5rem] shadow-sm px-4 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
            <User size={24} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Mon profil</p>
            <p className="text-sm text-gray-500 mt-0.5">Employé</p>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-[1.5rem] shadow-sm px-4 py-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-[2rem] bg-red-50 flex items-center justify-center shrink-0">
            <LogOut size={20} className="text-red-500" />
          </div>
          <span className="font-semibold text-red-500">Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}
