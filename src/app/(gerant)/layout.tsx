"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, Settings } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/planning", label: "Planning", icon: Calendar },
  { href: "/employes", label: "Équipe", icon: Users },
  { href: "/parametres", label: "Plus", icon: Settings },
];

export default function GerantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F5F5" }}>
      <main className="page">{children}</main>

      {/* Floating dark pill bottom nav */}
      <div className="fixed bottom-6 left-0 right-0 px-5 z-50 pb-[env(safe-area-inset-bottom)]">
        <nav className="bg-gray-900 rounded-full px-4 py-3 shadow-2xl max-w-sm mx-auto">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "p-2.5 rounded-full transition-all",
                    isActive
                      ? "bg-white text-gray-900"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
