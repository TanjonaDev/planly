"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, Users, Settings } from "lucide-react";
import { clsx } from "clsx";
import useSWR from "swr";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/alertes", label: "Alertes", icon: Bell },
  { href: "/employes", label: "Équipe", icon: Users },
  { href: "/parametres", label: "Plus", icon: Settings },
];

type DashboardData = {
  gerant: { firstName: string; lastName: string };
  alerts: Array<{ id: string }>;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function GerantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data } = useSWR<DashboardData>("/api/dashboard", fetcher);

  const firstName = data?.gerant?.firstName ?? "";
  const hasAlerts = (data?.alerts?.length ?? 0) > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f6f7" }}>
      {/* Fixed header */}
      <header className="fixed top-0 w-full z-50 bg-[#f5f6f7]/80 backdrop-blur-xl shadow-[0_12px_32px_rgba(12,15,16,0.06)] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1B30F5] font-bold border-2 border-white shrink-0">
            {firstName ? firstName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-[#595c5d] text-xs uppercase tracking-wider">
              Welcome back
            </p>
            <h1 className="font-headline font-bold text-lg tracking-tight text-[#1B30F5]">
              {firstName ? `Bonjour ${firstName}` : "Bonjour"}
            </h1>
          </div>
        </div>
        <Link
          href="/alertes"
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100/50 transition-all active:scale-95 duration-200"
        >
          <Bell className="w-5 h-5 text-slate-500" />
          {hasAlerts && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#f74b6d] rounded-full" />
          )}
        </Link>
      </header>

      <main>{children}</main>

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
