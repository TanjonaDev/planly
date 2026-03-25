"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Plus,
} from "lucide-react";
import { format, addDays, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { clsx } from "clsx";

type DashboardData = {
  gerant: { firstName: string; lastName: string };
  alerts: Array<{ id: string; message: string; site: string; time: string }>;
  todayMissions: Array<{
    id: string;
    site: string;
    employee: string | null;
    startTime: string;
    endTime: string;
    status: "COMPLETED" | "IN_PROGRESS" | "PLANNED" | "UNASSIGNED" | "CANCELLED";
  }>;
  weekStats: { totalMissions: number; completedMissions: number; absences: number; checklistRate: number };
};

type Mission = {
  id: string;
  site: string;
  employee: string | null;
  startTime: string;
  endTime: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PLANNED" | "UNASSIGNED" | "CANCELLED";
};

type PlanningData = {
  weekLabel: string;
  days: Array<{ date: string; label: string; dayName: string; missions: Mission[] }>;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusBadge: Record<string, { label: string; classes: string }> = {
  COMPLETED: { label: "Terminée", classes: "bg-blue-50 text-blue-700" },
  IN_PROGRESS: { label: "En cours", classes: "bg-blue-100 text-[#1B30F5]" },
  PLANNED: { label: "Planifiée", classes: "bg-gray-100 text-gray-600" },
  UNASSIGNED: { label: "Non assignée", classes: "bg-red-50 text-[#f74b6d]" },
  CANCELLED: { label: "Annulée", classes: "bg-gray-100 text-gray-400" },
};

const missionColors = [
  "border-[#1B30F5]", "border-purple-500", "border-pink-500",
  "border-orange-500", "border-teal-500", "border-indigo-500",
];

const avatarColors = [
  { bg: "bg-blue-100", text: "text-[#1B30F5]" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
];

function getSiteInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getWeekMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export default function DashboardPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day === 6 ? 5 : day - 1;
  });
  const dayScrollRef = useRef<HTMLDivElement>(null);

  const { data: dashData } = useSWR<DashboardData>("/api/dashboard", fetcher);
  const fromParam = format(weekStart, "yyyy-MM-dd");
  const { data: planningData, isLoading: planningLoading } = useSWR<PlanningData>(
    `/api/planning?from=${fromParam}`,
    fetcher
  );

  useEffect(() => {
    const container = dayScrollRef.current;
    if (!container) return;
    const activeBtn = container.children[selectedDay] as HTMLElement;
    if (activeBtn) activeBtn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedDay]);

  const today = format(new Date(), "yyyy-MM-dd");
  const selectedMissions = planningData?.days?.[selectedDay]?.missions ?? [];
  const selectedDayName = planningData?.days?.[selectedDay]?.dayName ?? "";

  return (
    <div className="pt-20 pb-32">

      {/* Sélecteur de semaine */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => { setWeekStart((d) => subWeeks(d, 1)); setSelectedDay(0); }}
          className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg active:scale-95 transition-all"
        >
          <ChevronLeft size={20} className="text-[#2c2f30]" />
        </button>
        <span className="font-headline font-bold text-[#2c2f30] text-sm capitalize">
          {planningData?.weekLabel ?? "…"}
        </span>
        <button
          onClick={() => { setWeekStart((d) => addWeeks(d, 1)); setSelectedDay(0); }}
          className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg active:scale-95 transition-all"
        >
          <ChevronRight size={20} className="text-[#2c2f30]" />
        </button>
      </div>

      {/* Sélecteur de jours */}
      <div
        ref={dayScrollRef}
        className="flex gap-3 overflow-x-auto px-6 pb-4 no-scrollbar"
      >
        {Array.from({ length: 7 }, (_, i) => {
          const date = addDays(weekStart, i);
          const dateStr = format(date, "yyyy-MM-dd");
          const isToday = dateStr === today;
          const isSelected = i === selectedDay;
          const dayLabel = planningData?.days[i]?.label ?? format(date, "EEE d", { locale: fr });
          const missionCount = planningData?.days[i]?.missions.length ?? 0;

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 min-w-[64px] h-20 rounded-full transition-all",
                isSelected
                  ? "bg-[#1B30F5] text-white shadow-lg shadow-blue-200"
                  : isToday
                  ? "bg-white text-[#2c2f30] shadow-md ring-2 ring-[#1B30F5]/20"
                  : "bg-white text-[#595c5d] shadow-sm"
              )}
            >
              <span className="text-[10px] font-medium uppercase tracking-widest">{dayLabel}</span>
              {missionCount > 0 && (
                <span className={clsx("text-lg font-headline font-bold", isSelected ? "text-white" : "text-[#2c2f30]")}>
                  {missionCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-6 max-w-2xl mx-auto space-y-6 pt-2">

        {/* Alertes */}
        {dashData?.alerts && dashData.alerts.length > 0 && (
          <section className="space-y-3">
            {dashData.alerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/alertes/${alert.id}`}
                className="bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.05)] p-4 flex items-center gap-3 border-l-4 border-[#f74b6d] hover:scale-[1.01] transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-[#f74b6d]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-[#2c2f30] truncate">{alert.message}</p>
                  <p className="text-sm text-[#595c5d]">{alert.site} · {alert.time}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </section>
        )}

        {/* Missions du jour sélectionné */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl text-[#2c2f30] capitalize">
              {selectedDayName || "Missions"}
            </h2>
            <Link
              href="/planning/nouvelle-mission"
              className="bg-[#0c0f10] text-white font-semibold px-4 py-2.5 rounded-[1.5rem] shadow-md flex items-center gap-1.5 text-sm hover:bg-gray-800 transition-colors"
              style={{ minHeight: "44px" }}
            >
              <Plus size={16} />
              Mission
            </Link>
          </div>

          {planningLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.03)] animate-pulse" />
              ))}
            </div>
          ) : selectedMissions.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_24px_rgba(12,15,16,0.03)] flex flex-col items-center gap-2 text-center">
              <CheckCircle2 size={28} className="text-gray-200" />
              <p className="text-sm text-[#595c5d]">Aucune mission ce jour</p>
              <p className="text-xs text-gray-400">Appuyez sur "+ Mission" pour en créer une</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedMissions.map((mission, idx) => {
                const borderColor = missionColors[idx % missionColors.length];
                const avatar = avatarColors[idx % avatarColors.length];
                const initials = getSiteInitials(mission.site);
                const badge = statusBadge[mission.status] ?? statusBadge.PLANNED;

                return (
                  <div
                    key={mission.id}
                    className={clsx(
                      "bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.03)] p-4 flex items-center justify-between border-l-4 hover:scale-[1.01] transition-all cursor-pointer",
                      borderColor
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={clsx("w-14 h-14 rounded-full flex items-center justify-center font-headline font-black text-lg shrink-0", avatar.bg, avatar.text)}>
                        {initials}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-headline font-bold text-[#2c2f30] tracking-tight">{mission.site}</h3>
                        <div className="flex items-center gap-1.5 text-[#595c5d] text-xs font-medium">
                          <MapPin size={12} />
                          <span className={clsx(!mission.employee && "text-[#f74b6d] font-semibold")}>
                            {mission.employee ?? "Non assignée"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={clsx("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", badge.classes)}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-[#595c5d]">
                        {mission.status === "IN_PROGRESS" ? "MAINTENANT" : `${mission.startTime}–${mission.endTime}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Stats semaine */}
        {dashData?.weekStats && (
          <section className="space-y-3">
            <h2 className="font-headline font-bold text-xl text-[#2c2f30]">Cette semaine</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.04)] p-5 text-center border-l-4 border-[#1B30F5]">
                <p className="text-2xl font-headline font-extrabold text-[#1B30F5] leading-none">
                  {dashData.weekStats.completedMissions}/{dashData.weekStats.totalMissions}
                </p>
                <p className="text-xs font-medium text-[#595c5d] mt-2">Terminées</p>
              </div>
              <div className="bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(12,15,16,0.04)] p-5 text-center border-l-4 border-amber-400">
                <p className="text-2xl font-headline font-extrabold text-amber-500 leading-none">
                  {dashData.weekStats.absences}
                </p>
                <p className="text-xs font-medium text-[#595c5d] mt-2">Absence(s)</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
