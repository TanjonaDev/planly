"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  CheckSquare,
  Camera,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { clsx } from "clsx";

type ChecklistItem = {
  id: string;
  label: string;
  isRequired: boolean;
  photoRequired: boolean;
  order: number;
};

type ChecklistCategory = {
  name: string;
  items: ChecklistItem[];
};

type Checklist = {
  id: string;
  name: string;
  categories: ChecklistCategory[];
};

type RecentMission = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PLANNED" | "UNASSIGNED" | "CANCELLED";
  employee: string | null;
};

type SiteDetail = {
  id: string;
  name: string;
  address: string;
  contactName: string | null;
  contactPhone: string | null;
  isActive: boolean;
  checklists: Checklist[];
  recentMissions: RecentMission[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const missionStatusConfig = {
  COMPLETED: { icon: CheckCircle2, color: "text-green-500", label: "Terminée" },
  IN_PROGRESS: { icon: Clock, color: "text-blue-500", label: "En cours" },
  PLANNED: { icon: Clock, color: "text-gray-400", label: "Planifiée" },
  UNASSIGNED: { icon: AlertCircle, color: "text-red-500", label: "Non assignée" },
  CANCELLED: { icon: Clock, color: "text-gray-300", label: "Annulée" },
};

export default function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useSWR<SiteDetail>(`/api/sites/${id}`, fetcher);

  if (isLoading || !data) {
    return (
      <div>
        <div className="page-header flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-7 w-48 bg-gray-200 rounded-[2rem] animate-pulse" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const checklist = data.checklists[0] ?? null;

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-center gap-3">
        <Link href="/sites" className="p-2 rounded-full hover:bg-gray-100 shrink-0">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-bold truncate">{data.name}</h1>
          {!data.isActive && (
            <span className="text-sm text-gray-400">Inactif</span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Infos site */}
        <div className="card space-y-3">
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <span>{data.address}</span>
          </div>
          {data.contactName && (
            <div className="flex items-center gap-2 text-gray-700">
              <User size={16} className="text-gray-400 shrink-0" />
              <span>{data.contactName}</span>
            </div>
          )}
          {data.contactPhone && (
            <a
              href={`tel:${data.contactPhone}`}
              className="flex items-center gap-2 text-brand-600 font-medium"
            >
              <Phone size={16} className="shrink-0" />
              <span>{data.contactPhone}</span>
            </a>
          )}
        </div>

        {/* Checklist */}
        {checklist ? (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare size={18} className="text-brand-600" />
              <h2 className="font-semibold text-body">{checklist.name}</h2>
            </div>

            <div className="space-y-4">
              {checklist.categories.map((cat) => (
                <div key={cat.name}>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {cat.name}
                  </h3>
                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-1"
                      >
                        <div
                          className={clsx(
                            "w-5 h-5 rounded border-2 shrink-0",
                            item.isRequired
                              ? "border-brand-400"
                              : "border-gray-300"
                          )}
                        />
                        <span className="flex-1 text-gray-700">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          {!item.isRequired && (
                            <span className="text-xs text-gray-400">optionnel</span>
                          )}
                          {item.photoRequired && (
                            <Camera size={14} className="text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card text-center py-6 text-gray-400">
            <CheckSquare size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune checklist configurée</p>
          </div>
        )}

        {/* Missions récentes */}
        {data.recentMissions.length > 0 && (
          <div>
            <h2 className="font-semibold text-body mb-3">Missions récentes</h2>
            <div className="space-y-2">
              {data.recentMissions.map((mission) => {
                const config = missionStatusConfig[mission.status];
                const Icon = config.icon;

                return (
                  <div key={mission.id} className="card flex items-center gap-3">
                    <Icon size={20} className={clsx("shrink-0", config.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {mission.startTime}–{mission.endTime}
                        <span className="text-gray-400 font-normal">
                          {" "}· {mission.date}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {mission.employee ?? (
                          <span className="text-red-500">Non assignée</span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm text-gray-400 shrink-0">
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
