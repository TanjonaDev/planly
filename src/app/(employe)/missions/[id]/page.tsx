"use client";

import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Flag,
  ClipboardList,
} from "lucide-react";
import { clsx } from "clsx";

type ChecklistItem = {
  id: string;
  label: string;
  category: string | null;
  order: number;
  isRequired: boolean;
  photoRequired: boolean;
  isCompleted: boolean;
  resultId: string | null;
};

type ChecklistData = {
  missionId: string;
  site: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  hasChecklist: boolean;
  checklist: {
    id: string;
    name: string;
    items: ChecklistItem[];
  } | null;
  progress: {
    total: number;
    completed: number;
    requiredTotal: number;
    requiredCompleted: number;
  };
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Optimistic local state pour les items
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>({});

  const { data, mutate } = useSWR<ChecklistData>(
    `/api/employe/missions/${id}/checklist`,
    fetcher
  );

  async function toggleItem(item: ChecklistItem) {
    const newValue = !(localOverrides[item.id] ?? item.isCompleted);
    // Optimistic update
    setLocalOverrides((prev) => ({ ...prev, [item.id]: newValue }));
    setToggling(item.id);

    try {
      await fetch(`/api/employe/missions/${id}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemLabel: item.label,
          category: item.category,
          isCompleted: newValue,
        }),
      });
      await mutate();
    } catch {
      // Rollback en cas d'erreur
      setLocalOverrides((prev) => ({ ...prev, [item.id]: !newValue }));
    } finally {
      setToggling(null);
    }
  }

  async function completeMission() {
    setCompleting(true);
    try {
      await fetch(`/api/employe/missions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      router.push("/mes-missions");
    } finally {
      setCompleting(false);
    }
  }

  // Items avec overrides locaux appliqués
  const items = useMemo(() => {
    return (data?.checklist?.items ?? []).map((item) => ({
      ...item,
      isCompleted: localOverrides[item.id] ?? item.isCompleted,
    }));
  }, [data, localOverrides]);

  // Recalcul du progress avec overrides
  const progress = useMemo(() => {
    if (!data) return data?.progress;
    const total = items.length;
    const completed = items.filter((i) => i.isCompleted).length;
    const requiredTotal = items.filter((i) => i.isRequired).length;
    const requiredCompleted = items.filter((i) => i.isRequired && i.isCompleted).length;
    return { total, completed, requiredTotal, requiredCompleted };
  }, [items, data]);

  // Grouper par catégorie
  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of items) {
      const cat = item.category ?? "Général";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const allRequiredDone =
    progress ? progress.requiredCompleted >= progress.requiredTotal : false;
  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  if (!data) {
    return (
      <div className="page">
        <div className="px-4 pt-6 pb-4 bg-white">
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-36 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl shadow-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{data.site}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1">
                <Clock size={13} className="text-gray-400" />
                <span className="text-sm text-gray-500">
                  {data.startTime}–{data.endTime}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={13} className="text-gray-400" />
                <span className="text-sm text-gray-500 truncate">{data.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        {data.hasChecklist && progress && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {progress.completed}/{progress.total} tâches
              </span>
              <span className="text-sm font-bold text-gray-900">{progressPercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  background:
                    progressPercent === 100
                      ? "linear-gradient(to right, #16a34a, #22c55e)"
                      : "linear-gradient(to right, #6366f1, #8b5cf6)",
                }}
              />
            </div>
            {progress.requiredTotal > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                {progress.requiredCompleted}/{progress.requiredTotal} obligatoires
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 py-4 space-y-5">
        {!data.hasChecklist ? (
          /* Pas de checklist pour ce site */
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <ClipboardList size={28} className="text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Aucune checklist</p>
              <p className="text-sm text-gray-400 mt-1">
                Ce site n'a pas de checklist configurée
              </p>
            </div>
          </div>
        ) : (
          grouped.map(([category, categoryItems]) => (
            <div key={category}>
              {/* En-tête de catégorie */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                {category}
              </p>

              <div className="space-y-2">
                {categoryItems.map((item) => {
                  const isChecked = item.isCompleted;
                  const isLoading = toggling === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item)}
                      disabled={isLoading || data.status === "COMPLETED"}
                      className={clsx(
                        "w-full flex items-center gap-4 bg-white rounded-2xl px-4 shadow-sm transition-all text-left",
                        isChecked ? "opacity-75" : "",
                        data.status !== "COMPLETED" && "active:scale-[0.98]"
                      )}
                      style={{ minHeight: 64 }}
                    >
                      {/* Checkbox */}
                      <div className="shrink-0">
                        {isLoading ? (
                          <div className="w-7 h-7 rounded-full border-2 border-gray-300 border-t-purple-500 animate-spin" />
                        ) : isChecked ? (
                          <CheckCircle2 size={28} className="text-green-500" />
                        ) : (
                          <Circle size={28} className="text-gray-300" />
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0 py-4">
                        <p
                          className={clsx(
                            "text-base font-medium leading-snug",
                            isChecked
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          )}
                        >
                          {item.label}
                        </p>
                        {item.isRequired && !isChecked && (
                          <p className="text-xs text-red-400 mt-0.5">Obligatoire</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bouton terminer — sticky au bas */}
      {data.status !== "COMPLETED" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] z-40">
          {!allRequiredDone && progress && progress.requiredTotal > 0 && (
            <p className="text-xs text-center text-gray-400 mb-2">
              {progress.requiredTotal - progress.requiredCompleted} tâche
              {progress.requiredTotal - progress.requiredCompleted > 1 ? "s" : ""} obligatoire
              {progress.requiredTotal - progress.requiredCompleted > 1 ? "s" : ""} restante
              {progress.requiredTotal - progress.requiredCompleted > 1 ? "s" : ""}
            </p>
          )}
          <button
            onClick={completeMission}
            disabled={completing || (!allRequiredDone && data.hasChecklist)}
            className={clsx(
              "w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-base transition-all shadow-md",
              allRequiredDone || !data.hasChecklist
                ? "bg-gray-900 text-white active:bg-gray-800"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Flag size={18} />
            {completing ? "Enregistrement..." : "Terminer la mission"}
          </button>
        </div>
      )}

      {data.status === "COMPLETED" && (
        <div className="mx-4 mb-4">
          <div className="bg-green-50 rounded-2xl p-5 flex items-center gap-3">
            <CheckCircle2 size={28} className="text-green-600 shrink-0" />
            <div>
              <p className="font-bold text-green-800">Mission terminée</p>
              <p className="text-sm text-green-600">Toutes les tâches ont été validées</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
