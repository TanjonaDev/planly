"use client";

import useSWR from "swr";
import Link from "next/link";
import { Plus, ChevronRight, Phone } from "lucide-react";

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

// Couleurs d'avatars variées comme dans Figma
const avatarColors = [
  { bg: "bg-blue-100", text: "text-blue-700" },
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
  return "bg-red-100 text-red-700";
}

export default function EmployesPage() {
  const { data, isLoading } = useSWR<Employee[]>("/api/employes", fetcher);

  return (
    <div className="page">
      {/* White header */}
      <div className="px-6 pt-8 pb-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Équipe</h1>
            {data && (
              <p className="text-sm text-gray-500">{data.length} membre{data.length > 1 ? "s" : ""} actif{data.length > 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pt-4 space-y-3">
        {/* Bouton ajouter pleine largeur */}
        <Link
          href="/employes/nouveau"
          className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          Ajouter un membre
        </Link>

        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl shadow-sm animate-pulse" />
          ))
        ) : !data || data.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
            <p className="text-gray-500">Aucun employé</p>
            <p className="text-sm text-gray-400 mt-1">Appuyez sur "Ajouter" pour commencer</p>
          </div>
        ) : (
          data.map((emp) => {
            const avatarColor = getAvatarColor(emp.firstName);
            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar coloré */}
                  <div
                    className={`w-12 h-12 rounded-full ${avatarColor.bg} ${avatarColor.text} flex items-center justify-center font-semibold text-lg shrink-0`}
                  >
                    {emp.firstName.charAt(0)}
                  </div>

                  {/* Info */}
                  <Link href={`/employes/${emp.id}`} className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-0.5">
                      {emp.firstName} {emp.lastName}
                      {!emp.isActive && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">inactif</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{emp.zones.join(", ")}</p>
                  </Link>

                  {/* Score fiabilité */}
                  <div className={`px-3 py-1.5 rounded-full font-bold text-sm ${getScoreColor(emp.reliabilityScore)} shrink-0`}>
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
          })
        )}
      </div>
    </div>
  );
}
