"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format, addDays, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { clsx } from "clsx";

type Mission = {
  id: string;
  site: string;
  employee: string | null;
  startTime: string;
  endTime: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PLANNED" | "UNASSIGNED" | "CANCELLED";
};

type Day = {
  date: string;
  label: string;
  dayName: string;
  missions: Mission[];
};

type PlanningData = {
  weekLabel: string;
  days: Day[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusConfig = {
  COMPLETED: {
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bg: "bg-blue-50",
    icon: CheckCircle2,
    label: "Terminée",
  },
  IN_PROGRESS: {
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bg: "bg-purple-50",
    icon: Clock,
    label: "En cours",
  },
  PLANNED: {
    color: "bg-gray-300",
    textColor: "text-gray-600",
    bg: "bg-gray-50",
    icon: Clock,
    label: "Planifiée",
  },
  UNASSIGNED: {
    color: "bg-red-500",
    textColor: "text-red-700",
    bg: "bg-red-50",
    icon: AlertTriangle,
    label: "Non assignée",
  },
  CANCELLED: {
    color: "bg-gray-200",
    textColor: "text-gray-500",
    bg: "bg-gray-50",
    icon: Clock,
    label: "Annulée",
  },
};

// Couleurs des bordures de missions (comme dans Figma)
const missionColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-indigo-500",
];

function getWeekMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export default function PlanningPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = new Date().getDay();
    // Si on est samedi/dimanche, on reste sur vendredi
    return day === 0 ? 6 : day === 6 ? 5 : day - 1;
  });

  const dayScrollRef = useRef<HTMLDivElement>(null);

  const fromParam = format(weekStart, "yyyy-MM-dd");
  const { data, isLoading } = useSWR<PlanningData>(
    `/api/planning?from=${fromParam}`,
    fetcher
  );

  // Scroll le jour sélectionné en vue
  useEffect(() => {
    const container = dayScrollRef.current;
    if (!container) return;
    const activeBtn = container.children[selectedDay] as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [selectedDay]);

  function prevWeek() {
    setWeekStart((d) => subWeeks(d, 1));
    setSelectedDay(0);
  }

  function nextWeek() {
    setWeekStart((d) => addWeeks(d, 1));
    setSelectedDay(0);
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const selectedMissions = data?.days[selectedDay]?.missions ?? [];
  const selectedDayName = data?.days[selectedDay]?.dayName ?? "";

  return (
    <div className="page">
      {/* White header */}
      <div className="px-6 pt-8 pb-4 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Planning</h1>
          <Link href="/planning/nouvelle-mission" className="bg-gray-900 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 text-sm">
            <Plus size={16} />
            Mission
          </Link>
        </div>
      </div>

      {/* Sélecteur de semaine */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
        <button
          onClick={prevWeek}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="font-semibold text-body capitalize">
          {isLoading ? "Chargement..." : (data?.weekLabel ?? "—")}
        </span>
        <button
          onClick={nextWeek}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Sélecteur de jours (scroll horizontal) - rounded-full comme Figma */}
      <div
        ref={dayScrollRef}
        className="flex gap-2 overflow-x-auto px-6 py-4 bg-white no-scrollbar"
      >
        {Array.from({ length: 7 }, (_, i) => {
          const date = addDays(weekStart, i);
          const dateStr = format(date, "yyyy-MM-dd");
          const isToday = dateStr === today;
          const isSelected = i === selectedDay;
          const dayLabel = data?.days[i]?.label ?? format(date, "EEE d");
          const missionCount = data?.days[i]?.missions.length ?? 0;

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={clsx(
                "flex flex-col items-center justify-center min-w-[56px] h-16 rounded-full shrink-0 transition-all",
                isSelected
                  ? "bg-gray-900 text-white shadow-md"
                  : isToday
                  ? "bg-white text-gray-900 ring-2 ring-gray-200"
                  : "bg-white text-gray-600"
              )}
            >
              <span className="text-xs font-medium capitalize">{dayLabel}</span>
              {missionCount > 0 ? (
                <span
                  className={clsx(
                    "text-xs font-bold leading-tight",
                    isSelected ? "text-white" : "text-gray-900"
                  )}
                >
                  {missionCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Missions du jour */}
      <div className="px-6 py-4">
        {selectedDayName && (
          <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
            {selectedDayName}
          </h3>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl shadow-sm animate-pulse" />
            ))}
          </div>
        ) : selectedMissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
            <p className="text-gray-500">Aucune mission ce jour</p>
            <p className="text-sm text-gray-400 mt-1">Appuyez sur "+ Mission" pour en créer une</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedMissions.map((mission, idx) => {
              const missionColor = missionColors[idx % missionColors.length];

              return (
                <div
                  key={mission.id}
                  className="relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${missionColor}`} />
                  <div className="pl-5 pr-4 py-4">
                    <h5 className="font-bold text-gray-900 mb-1 truncate">{mission.site}</h5>
                    <p className={clsx("text-sm mb-2", mission.employee ? "text-gray-600" : "text-red-500 font-medium")}>
                      {mission.employee ?? "Non assignée"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {mission.startTime}–{mission.endTime}
                      </span>
                      <span className={clsx(
                        "text-xs font-medium px-2.5 py-1 rounded-full",
                        statusConfig[mission.status].bg,
                        statusConfig[mission.status].textColor
                      )}>
                        {statusConfig[mission.status].label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
