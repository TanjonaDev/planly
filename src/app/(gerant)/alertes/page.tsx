"use client";

import useSWR from "swr";
import Link from "next/link";
import { AlertTriangle, Clock, ChevronRight, CheckCircle } from "lucide-react";
import { clsx } from "clsx";

type Absence = {
  id: string;
  status: "REPORTED" | "UNRESOLVED";
  reason: string | null;
  reportedAt: string;
  employee: { name: string; phone: string };
  mission: {
    site: string;
    date: string;
    startTime: string;
    endTime: string;
  };
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AlertesPage() {
  const { data, isLoading } = useSWR<Absence[]>("/api/absences", fetcher);

  return (
    <div className="page">
      {/* White header */}
      <div className="px-6 pt-8 pb-4 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Alertes</h1>
        <p className="text-sm text-gray-500">Absences et remplacements</p>
      </div>

      <div className="px-6 pt-4 space-y-3">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />
          ))
        ) : !Array.isArray(data) || data.length === 0 ? (
          /* Empty state comme Figma */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4 shadow-md">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Tout va bien !</h2>
            <p className="text-gray-500 text-center">Aucune absence en attente</p>
          </div>
        ) : (
          data.map((absence) => (
            <Link
              key={absence.id}
              href={`/alertes/${absence.id}`}
              className={clsx(
                "relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex items-center gap-3 p-4",
              )}
            >
              {/* Colored left border */}
              <div
                className={clsx(
                  "absolute left-0 top-0 bottom-0 w-1.5",
                  absence.status === "UNRESOLVED" ? "bg-red-500" : "bg-amber-400"
                )}
              />
              <div className="pl-2 flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    absence.status === "UNRESOLVED" ? "bg-red-100" : "bg-amber-100"
                  )}
                >
                  <AlertTriangle
                    size={20}
                    className={absence.status === "UNRESOLVED" ? "text-red-600" : "text-amber-600"}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{absence.employee.name}</p>
                  <p className="text-sm text-gray-600 truncate capitalize">
                    {absence.mission.site} · {absence.mission.date}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      Signalée le {absence.reportedAt}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight size={20} className="text-gray-300 shrink-0" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
