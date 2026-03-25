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

// Couleurs des bordures de sites
const siteColors = [
  "border-blue-500",
  "border-purple-500",
  "border-pink-500",
  "border-orange-500",
  "border-teal-500",
  "border-indigo-500",
];

export default function SitesPage() {
  const { data, isLoading } = useSWR<Site[]>("/api/sites", fetcher);
  const router = useRouter();

  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto space-y-4 pb-32">
      {/* Titre */}
      <div className="pt-2">
        <h2 className="font-headline font-bold text-xl text-[#2c2f30]">Sites</h2>
        {Array.isArray(data) && (
          <p className="text-sm text-[#595c5d]">{data.filter((s) => s.isActive).length} site{data.filter((s) => s.isActive).length > 1 ? "s" : ""} actif{data.filter((s) => s.isActive).length > 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Bouton ajouter pleine largeur */}
      <Link
        href="/sites/nouveau"
        className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-[2rem] shadow-md flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
        style={{ minHeight: "56px" }}
      >
        <Plus size={20} />
        Ajouter un site
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.03)] animate-pulse" />
          ))}
        </div>
      ) : !Array.isArray(data) || data.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_24px_rgba(12,15,16,0.03)] text-center">
          <p className="text-[#595c5d]">Aucun site</p>
          <p className="text-sm text-gray-400 mt-1">Appuyez sur "Ajouter" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((site, idx) => {
            const borderColor = siteColors[idx % siteColors.length];
            return (
              <div
                key={site.id}
                onClick={() => router.push(`/sites/${site.id}`)}
                className={clsx(
                  "bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.03)] p-4 border-l-4 hover:scale-[1.01] transition-all cursor-pointer",
                  borderColor,
                  !site.isActive && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-headline font-bold text-[#2c2f30] truncate">{site.name}</h3>
                      {!site.isActive && (
                        <span className="text-xs text-gray-400 shrink-0">inactif</span>
                      )}
                    </div>

                    <div className="flex items-start gap-1.5 mb-3">
                      <MapPin className="w-4 h-4 text-[#595c5d] mt-0.5 shrink-0" />
                      <p className="text-sm text-[#595c5d]">{site.address}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {site.hasChecklist && (
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-[#595c5d]" />
                          <span className="text-sm text-[#2c2f30] font-medium">Checklist</span>
                        </div>
                      )}
                      {site.contactPhone && (
                        <a
                          href={`tel:${site.contactPhone}`}
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-4 h-4 text-[#595c5d]" />
                          <span className="text-sm text-[#2c2f30]">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
