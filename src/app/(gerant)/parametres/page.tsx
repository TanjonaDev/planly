"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Building2, Bell, ChevronRight, LogOut } from "lucide-react";

const isDev = process.env.NODE_ENV === "development";

const sections = [
  {
    title: "Urgent",
    items: [
      {
        href: "/alertes",
        icon: Bell,
        label: "Alertes & absences",
        description: "Gérer les absences et trouver des remplaçants",
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
      },
    ],
  },
  {
    title: "Gestion",
    items: [
      {
        href: "/sites",
        icon: Building2,
        label: "Sites & contrats",
        description: "Gérer les sites et leurs checklists",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      },
    ],
  },
];

export default function ParametresPage() {
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
    <div className="page">
      {/* White header */}
      <div className="px-6 pt-8 pb-4 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Plus</h1>
        <p className="text-sm text-gray-500">Options et paramètres</p>
      </div>

      <div className="px-6 pt-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {section.title}
            </p>
            <div className="space-y-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon size={24} className={item.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-0.5">{item.label}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md hover:bg-red-50 transition-all border border-transparent hover:border-red-100 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <LogOut size={24} className="text-red-600" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-bold text-red-600">Se déconnecter</h3>
          </div>
        </button>
      </div>
    </div>
  );
}
