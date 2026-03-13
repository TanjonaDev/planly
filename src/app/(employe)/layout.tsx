"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, AlertTriangle, User } from "lucide-react";
import { clsx } from "clsx";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const navItems = [
  { href: "/mes-missions", label: "Missions", icon: ClipboardList },
  { href: "/absence", label: "Absence", icon: AlertTriangle },
  { href: "/compte", label: "Compte", icon: User },
];

export default function EmployeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: replacements } = useSWR("/api/employe/replacements", fetcher, {
    refreshInterval: 30000,
  });
  const hasPendingReplacement = Array.isArray(replacements) && replacements.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <main className="page">{children}</main>

      {/* Floating dark pill nav */}
      <div className="fixed bottom-6 left-0 right-0 px-5 z-50 pb-[env(safe-area-inset-bottom)]">
        <nav className="bg-gray-900 rounded-full px-4 py-3 shadow-2xl max-w-sm mx-auto">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              const showBadge = item.href === "/mes-missions" && hasPendingReplacement;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "p-2.5 rounded-full transition-all relative",
                    isActive ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"
                  )}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                  {showBadge && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-gray-900" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
