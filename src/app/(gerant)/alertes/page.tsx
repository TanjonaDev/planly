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
    <div className="pt-24 px-6 max-w-2xl mx-auto space-y-4 pb-32">
      {/* Titre */}
      <div className="pt-2">
        <h2 className="font-headline font-bold text-xl text-[#2c2f30]">Alertes</h2>
        <p className="text-sm text-[#595c5d]">Absences et remplacements</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.03)] animate-pulse" />
          ))}
        </div>
      ) : !Array.isArray(data) || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4 shadow-md">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-headline font-bold text-xl text-[#2c2f30] mb-2">Tout va bien !</h2>
          <p className="text-[#595c5d] text-center">Aucune absence en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((absence) => (
            <Link
              key={absence.id}
              href={`/alertes/${absence.id}`}
              className={clsx(
                "bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.03)] p-4 flex items-center gap-3 border-l-4 hover:scale-[1.01] transition-all cursor-pointer",
                absence.status === "UNRESOLVED" ? "border-[#f74b6d]" : "border-amber-400"
              )}
            >
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  absence.status === "UNRESOLVED" ? "bg-red-50" : "bg-amber-50"
                )}
              >
                <AlertTriangle
                  size={20}
                  className={absence.status === "UNRESOLVED" ? "text-[#f74b6d]" : "text-amber-500"}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-headline font-bold text-[#2c2f30]">{absence.employee.name}</p>
                <p className="text-sm text-[#595c5d] truncate capitalize">
                  {absence.mission.site} · {absence.mission.date}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={12} className="text-[#595c5d]" />
                  <span className="text-xs text-[#595c5d]">
                    Signalée le {absence.reportedAt}
                  </span>
                </div>
              </div>

              <ChevronRight size={20} className="text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
