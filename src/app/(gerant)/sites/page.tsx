"use client";

import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, MapPin, Phone, CheckSquare } from "lucide-react";
import { clsx } from "clsx";

type Site = {
  id: string;
  name: string;
  address: string;
  contactName: string | null;
  contactPhone: string | null;
  isActive: boolean;
  missionsCount: number;
  hasChecklist: boolean;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Couleurs des bordures de sites (comme Figma)
const siteColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-indigo-500",
];

export default function SitesPage() {
  const { data, isLoading } = useSWR<Site[]>("/api/sites", fetcher);
  const router = useRouter();

  return (
    <div className="page">
      {/* White header */}
      <div className="px-6 pt-8 pb-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sites</h1>
            {data && (
              <p className="text-sm text-gray-500">{data.filter((s) => s.isActive).length} site{data.filter((s) => s.isActive).length > 1 ? "s" : ""} actif{data.filter((s) => s.isActive).length > 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pt-4 space-y-3">
        {/* Bouton ajouter pleine largeur */}
        <Link
          href="/sites/nouveau"
          className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          Ajouter un site
        </Link>

        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />
          ))
        ) : !data || data.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
            <p className="text-gray-500">Aucun site</p>
            <p className="text-sm text-gray-400 mt-1">Appuyez sur "Ajouter" pour commencer</p>
          </div>
        ) : (
          data.map((site, idx) => {
            const borderColor = siteColors[idx % siteColors.length];
            return (
              <div
                key={site.id}
                onClick={() => router.push(`/sites/${site.id}`)}
                className={clsx(
                  "relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer",
                  !site.isActive && "opacity-60"
                )}
              >
                {/* Colored left border */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${borderColor}`} />

                <div className="pl-5 pr-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 truncate">{site.name}</h3>
                        {!site.isActive && (
                          <span className="text-xs text-gray-400 shrink-0">inactif</span>
                        )}
                      </div>

                      <div className="flex items-start gap-1.5 mb-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-500">{site.address}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        {site.hasChecklist && (
                          <div className="flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 font-medium">Checklist</span>
                          </div>
                        )}
                        {site.contactPhone && (
                          <a
                            href={`tel:${site.contactPhone}`}
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {site.contactName ?? site.contactPhone}
                            </span>
                          </a>
                        )}
                      </div>
                    </div>

                    <button className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
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
