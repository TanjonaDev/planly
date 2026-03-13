"use client";

import useSWR from "swr";
import Link from "next/link";
import { Bell, AlertTriangle, CheckCircle2, Clock, ChevronRight, ClipboardList, UserX, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

type DashboardData = {
  gerant: { firstName: string; lastName: string };
  alerts: Array<{
    id: string;
    message: string;
    site: string;
    time: string;
  }>;
  todayMissions: Array<{
    id: string;
    site: string;
    employee: string | null;
    startTime: string;
    endTime: string;
    status: "COMPLETED" | "IN_PROGRESS" | "PLANNED" | "UNASSIGNED" | "CANCELLED";
  }>;
  weekStats: {
    totalMissions: number;
    completedMissions: number;
    absences: number;
    checklistRate: number;
  };
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusBar: Record<string, string> = {
  COMPLETED: "bg-blue-500",
  IN_PROGRESS: "bg-purple-500",
  PLANNED: "bg-gray-300",
  UNASSIGNED: "bg-red-500",
  CANCELLED: "bg-gray-200",
};

export default function DashboardPage() {
  const { data, isLoading } = useSWR<DashboardData>("/api/dashboard", fetcher);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const todayShort = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (isLoading || !data) {
    return (
      <div className="page">
        {/* Skeleton header */}
        <div className="px-6 pt-8 pb-4 bg-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-36 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-4 w-28 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse mt-1" />
          </div>
        </div>
        <div className="px-6 mt-4 space-y-4">
          <div className="h-28 bg-white rounded-3xl shadow-md animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse shadow-sm" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl shadow-sm animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalToday = data.todayMissions.length;
  const unassignedToday = data.todayMissions.filter(
    (m) => m.status === "UNASSIGNED" || m.employee === null
  ).length;
  const hasIssues = unassignedToday > 0 || data.alerts.length > 0;

  return (
    <div className="page">
      {/* White header with avatar + greeting + bell */}
      <div className="px-6 pt-8 pb-4 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {data.gerant.firstName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Bonjour, {data.gerant.firstName}
              </h1>
              <p className="text-sm text-gray-500 capitalize">{today}</p>
            </div>
          </div>
          <Link
            href="/alertes"
            className="relative mt-1 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-700" />
            {data.alerts.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </Link>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="px-6 mt-4 mb-4">
        <div
          className={clsx(
            "relative rounded-3xl p-6 overflow-hidden shadow-md",
            hasIssues
              ? "bg-gradient-to-br from-orange-300 via-amber-200 to-yellow-100"
              : "bg-gradient-to-br from-purple-400 via-purple-300 to-pink-200"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center flex-shrink-0">
              <ClipboardList
                className={clsx("w-5 h-5", hasIssues ? "text-orange-600" : "text-purple-600")}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">
                Résumé de la journée
              </p>
              {hasIssues ? (
                <div className="space-y-0.5">
                  {unassignedToday > 0 && (
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      {unassignedToday} non assignée{unassignedToday > 1 ? "s" : ""}
                    </h2>
                  )}
                  {data.alerts.length > 0 && (
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      {data.alerts.length} absence{data.alerts.length > 1 ? "s" : ""} signalée{data.alerts.length > 1 ? "s" : ""}
                    </h2>
                  )}
                </div>
              ) : (
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  Toutes les missions sont pourvues
                </h2>
              )}
              <p className="text-sm text-gray-800 mt-1">
                {totalToday} mission{totalToday > 1 ? "s" : ""} aujourd'hui
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {data.alerts.length > 0 && (
        <div className="px-6 mb-4 space-y-2">
          {data.alerts.map((alert) => (
            <Link
              key={alert.id}
              href={`/alertes/${alert.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{alert.message}</p>
                <p className="text-sm text-gray-500">{alert.site} · {alert.time}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Votre journée */}
      <div className="px-6 mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Votre journée</h3>

        {/* 3 stat cards avec gradients */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center mb-3">
              <ClipboardList className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalToday}</p>
            <p className="text-xs text-gray-700 mt-1">mission{totalToday > 1 ? "s" : ""}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center mb-3">
              <AlertCircle className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{unassignedToday}</p>
            <p className="text-xs text-gray-700 mt-1">non assignée{unassignedToday > 1 ? "s" : ""}</p>
          </div>

          <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center mb-3">
              <UserX className="w-4 h-4 text-pink-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.weekStats.absences}</p>
            <p className="text-xs text-gray-700 mt-1">absences</p>
          </div>
        </div>
      </div>

      {/* Missions du jour */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide capitalize">
            {todayShort}
          </h4>
        </div>

        {data.todayMissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-2">
            <CheckCircle2 size={28} className="text-gray-200" />
            <p className="text-sm text-gray-500">Aucune mission aujourd'hui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.todayMissions.map((mission) => (
              <div
                key={mission.id}
                className="relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusBar[mission.status]}`} />
                <div className="pl-5 pr-12 py-4">
                  <h5 className="font-bold text-gray-900 mb-1 truncate">{mission.site}</h5>
                  <p className={clsx("text-sm mb-2", mission.employee ? "text-gray-600" : "text-red-500 font-medium")}>
                    {mission.employee ?? "Non assignée"}
                  </p>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {mission.startTime}–{mission.endTime}
                  </span>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {mission.status === "COMPLETED" && <CheckCircle2 size={18} className="text-green-500" />}
                  {mission.status === "IN_PROGRESS" && <Clock size={18} className="text-blue-500" />}
                  {mission.status === "UNASSIGNED" && <AlertTriangle size={18} className="text-red-400" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats semaine */}
      <div className="px-6 pb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cette semaine</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-brand-600">
              {data.weekStats.completedMissions}/{data.weekStats.totalMissions}
            </p>
            <p className="text-sm text-gray-500 mt-1">Terminées</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-amber-500">
              {data.weekStats.absences}
            </p>
            <p className="text-sm text-gray-500 mt-1">Absence(s)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
