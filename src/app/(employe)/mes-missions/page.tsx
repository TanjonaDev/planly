"use client";

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, Play, ClipboardList, UserCheck, X } from "lucide-react";
import { clsx } from "clsx";

type ReplacementRequest = {
  absenceId: string;
  absentName: string;
  site: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
};

type Mission = {
  id: string;
  site: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PLANNED" | "UNASSIGNED" | "CANCELLED";
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusConfig = {
  COMPLETED: {
    label: "Terminée",
    bar: "bg-green-500",
    badge: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    label: "En cours",
    bar: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  PLANNED: {
    label: "À faire",
    bar: "bg-gray-300",
    badge: "bg-gray-100 text-gray-600",
    icon: Clock,
  },
  UNASSIGNED: {
    label: "Non assignée",
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-600",
    icon: Clock,
  },
  CANCELLED: {
    label: "Annulée",
    bar: "bg-gray-200",
    badge: "bg-gray-100 text-gray-400",
    icon: Clock,
  },
};

const missionColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-indigo-500",
];

export default function MesMissionsPage() {
  const { data, isLoading, mutate } = useSWR<Mission[]>(
    "/api/employe/missions",
    fetcher,
  );
  const { data: replacements, mutate: mutateReplacements } = useSWR<ReplacementRequest[]>(
    "/api/employe/replacements",
    fetcher,
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function updateMission(id: string, action: "start" | "complete") {
    setLoadingId(id);
    try {
      await fetch(`/api/employe/missions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await mutate();
    } finally {
      setLoadingId(null);
    }
  }

  async function respondReplacement(absenceId: string, accept: boolean) {
    setRespondingId(absenceId);
    try {
      await fetch(`/api/employe/replacements/${absenceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      await Promise.all([mutateReplacements(), mutate()]);
    } finally {
      setRespondingId(null);
    }
  }

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const pendingReplacements = Array.isArray(replacements) ? replacements : [];

  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-8 pb-5 bg-white" style={{ boxShadow: "0 1px 0 #E5E7EB" }}>
        <h1 className="text-xl font-bold text-gray-900">Mes missions</h1>
        <p className="text-sm text-gray-500 capitalize mt-0.5">{today}</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Demandes de remplacement */}
        {pendingReplacements.map((req) => (
          <div
            key={req.absenceId}
            className="bg-white rounded-[1.5rem] shadow-sm overflow-hidden"
          >
            <div className="h-1 bg-orange-400" />
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-[2rem] bg-orange-100 flex items-center justify-center shrink-0">
                  <UserCheck size={18} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">Demande de remplacement</p>
                  <p className="text-sm text-orange-600 font-medium mt-0.5">
                    {req.absentName} est absent(e)
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-[2rem] p-3 space-y-1.5">
                <p className="font-semibold text-gray-900">{req.site}</p>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600 capitalize">
                    {req.date} · {req.startTime}–{req.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-500 truncate">{req.address}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => respondReplacement(req.absenceId, true)}
                  disabled={respondingId === req.absenceId}
                  className="flex-1 bg-gray-900 text-white font-bold py-3.5 rounded-[2rem] flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
                >
                  <CheckCircle2 size={16} />
                  {respondingId === req.absenceId ? "..." : "Accepter"}
                </button>
                <button
                  onClick={() => respondReplacement(req.absenceId, false)}
                  disabled={respondingId === req.absenceId}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-[2rem] flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
                >
                  <X size={16} />
                  Refuser
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Missions du jour */}
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="h-24 bg-white rounded-[1.5rem] shadow-sm animate-pulse" />
          ))
        ) : !Array.isArray(data) || data.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <p className="font-semibold text-gray-900">Aucune mission aujourd'hui</p>
            <p className="text-sm text-gray-400 mt-1">Profitez de votre journée !</p>
          </div>
        ) : (
          data.map((mission, idx) => {
            const config = statusConfig[mission.status];
            const Icon = config.icon;
            const missionColor = missionColors[idx % missionColors.length];

            return (
              <div
                key={mission.id}
                className="relative bg-white rounded-[1.5rem] shadow-sm overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${missionColor}`} />
                <div className="pl-5 pr-4 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{mission.site}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Icon size={14} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-500">
                          {mission.startTime}–{mission.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin size={14} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-500 truncate">
                          {mission.address}
                        </span>
                      </div>
                    </div>
                    <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full shrink-0", config.badge)}>
                      {config.label}
                    </span>
                  </div>

                  {mission.status === "PLANNED" && (
                    <button
                      onClick={() => updateMission(mission.id, "start")}
                      disabled={loadingId === mission.id}
                      className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-[2rem] flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
                    >
                      <Play size={16} />
                      {loadingId === mission.id ? "Démarrage..." : "Commencer la mission"}
                    </button>
                  )}

                  {mission.status === "IN_PROGRESS" && (
                    <Link
                      href={`/missions/${mission.id}`}
                      className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-[2rem] flex items-center justify-center gap-2"
                    >
                      <ClipboardList size={16} />
                      Faire la checklist
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
