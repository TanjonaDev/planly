"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Wrench,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";

type Availability = {
  dayOfWeek: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
};

type RecentMission = {
  id: string;
  site: string;
  date: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PLANNED" | "UNASSIGNED" | "CANCELLED";
};

type EmployeeDetail = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  zones: string[];
  skills: string[];
  reliabilityScore: number;
  isActive: boolean;
  notes: string | null;
  availabilities: Availability[];
  recentMissions: RecentMission[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const missionStatusConfig = {
  COMPLETED: { icon: CheckCircle2, color: "text-green-500", label: "Terminée" },
  IN_PROGRESS: { icon: Clock, color: "text-blue-500", label: "En cours" },
  PLANNED: { icon: Clock, color: "text-gray-400", label: "Planifiée" },
  UNASSIGNED: { icon: AlertTriangle, color: "text-red-500", label: "Non assignée" },
  CANCELLED: { icon: Clock, color: "text-gray-300", label: "Annulée" },
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "text-green-600 bg-green-100"
      : score >= 6
      ? "text-amber-600 bg-amber-100"
      : "text-red-600 bg-red-100";

  return (
    <span className={`badge text-lg font-bold ${color}`}>
      <Star size={16} className="mr-1" />
      {score.toFixed(1)}/10
    </span>
  );
}

export default function EmployeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useSWR<EmployeeDetail>(
    `/api/employes/${id}`,
    fetcher
  );

  if (isLoading || !data) {
    return (
      <div>
        <div className="page-header flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-7 w-40 bg-gray-200 rounded-[2rem] animate-pulse" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-center gap-3">
        <Link
          href="/employes"
          className="p-2 rounded-full hover:bg-gray-100 shrink-0"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-bold">
            {data.firstName} {data.lastName}
          </h1>
          {!data.isActive && (
            <span className="text-sm text-gray-400">Inactif</span>
          )}
        </div>
        <a
          href={`tel:${data.phone}`}
          className="btn-primary !py-2 !px-4 !min-h-0 gap-2 shrink-0"
        >
          <Phone size={18} />
          <span>Appeler</span>
        </a>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Infos principales */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Fiabilité</span>
            <ScoreBadge score={data.reliabilityScore} />
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Phone size={16} className="text-gray-400 shrink-0" />
            <span>{data.phone}</span>
          </div>
          {data.zones.length > 0 && (
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <span>{data.zones.join(", ")}</span>
            </div>
          )}
          {data.skills.length > 0 && (
            <div className="flex items-start gap-2 text-gray-700">
              <Wrench size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.notes && (
            <p className="text-sm text-gray-500 border-t pt-3">{data.notes}</p>
          )}
        </div>

        {/* Disponibilités */}
        {data.availabilities.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-gray-400" />
              <h2 className="font-semibold text-body">Disponibilités</h2>
            </div>
            <div className="space-y-2">
              {data.availabilities.map((avail) => (
                <div
                  key={avail.dayOfWeek}
                  className="flex items-center justify-between"
                >
                  <span className="text-gray-700">{avail.dayLabel}</span>
                  <span className="font-medium text-brand-600">
                    {avail.startTime} – {avail.endTime}
                  </span>
                </div>
              ))}
            </div>
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
                      <p className="font-medium truncate">{mission.site}</p>
                      <p className="text-sm text-gray-500">{mission.date}</p>
                    </div>
                    <span className="text-sm text-gray-400">{config.label}</span>
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
