"use client";

import useSWR from "swr";
import Link from "next/link";
import { Plus, ChevronRight, Phone } from "lucide-react";
import { clsx } from "clsx";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  zones: string[];
  reliabilityScore: number;
  isActive: boolean;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const avatarColors = [
  { bg: "bg-blue-100", text: "text-[#1B30F5]" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
];

function getAvatarColor(name: string) {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % avatarColors.length;
  return avatarColors[idx];
}

function getScoreColor(score: number) {
  if (score >= 8) return "bg-green-100 text-green-700";
  if (score >= 6) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-[#f74b6d]";
}

export default function EmployesPage() {
  const { data, isLoading } = useSWR<Employee[]>("/api/employes", fetcher);

  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto space-y-4 pb-32">
      {/* Titre */}
      <div className="pt-2">
        <h2 className="font-headline font-bold text-xl text-[#2c2f30]">Équipe</h2>
        {Array.isArray(data) && (
          <p className="text-sm text-[#595c5d]">{data.length} membre{data.length > 1 ? "s" : ""} actif{data.length > 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Bouton ajouter pleine largeur */}
      <Link
        href="/employes/nouveau"
        className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-[2rem] shadow-md flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
        style={{ minHeight: "56px" }}
      >
        <Plus size={20} />
        Ajouter un membre
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.03)] animate-pulse" />
          ))}
        </div>
      ) : !Array.isArray(data) || data.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_24px_rgba(12,15,16,0.03)] text-center">
          <p className="text-[#595c5d]">Aucun employé</p>
          <p className="text-sm text-gray-400 mt-1">Appuyez sur "Ajouter" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((emp) => {
            const avatarColor = getAvatarColor(emp.firstName);
            return (
              <div
                key={emp.id}
                className={clsx(
                  "bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.03)] p-4 border-l-4 border-[#1B30F5] hover:scale-[1.01] transition-all",
                  !emp.isActive && "opacity-60"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar initiales */}
                  <div
                    className={clsx(
                      "w-12 h-12 rounded-full flex items-center justify-center font-headline font-black text-lg shrink-0",
                      avatarColor.bg,
                      avatarColor.text
                    )}
                  >
                    {(emp.firstName.charAt(0) + (emp.lastName.charAt(0) || "")).toUpperCase()}
                  </div>

                  {/* Info */}
                  <Link href={`/employes/${emp.id}`} className="flex-1 min-w-0">
                    <h3 className="font-headline font-bold text-[#2c2f30] mb-0.5">
                      {emp.firstName} {emp.lastName}
                      {!emp.isActive && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">inactif</span>
                      )}
                    </h3>
                    <p className="text-sm text-[#595c5d] truncate">{emp.zones.join(", ")}</p>
                  </Link>

                  {/* Score fiabilité */}
                  <div className={clsx("px-3 py-1.5 rounded-full font-bold text-sm shrink-0", getScoreColor(emp.reliabilityScore))}>
                    {emp.reliabilityScore.toFixed(1)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`tel:${emp.phone}`}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone size={20} className="text-gray-400" />
                    </a>
                    <Link href={`/employes/${emp.id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ChevronRight size={20} className="text-gray-400" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
