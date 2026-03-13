"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { CheckSquare, Square, Send, AlertTriangle, Clock } from "lucide-react";
import { clsx } from "clsx";

type Mission = {
  id: string;
  site: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AbsencePage() {
  const router = useRouter();
  const { data, isLoading } = useSWR<Mission[]>(
    "/api/employe/missions?days=3",
    fetcher
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) return;

    setLoading(true);
    setError("");

    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((missionId) =>
          fetch("/api/absences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ missionId, reason: reason || undefined }),
          }).then((r) => r.json())
        )
      );

      const err = results.find((r) => r.error);
      if (err) throw new Error(err.error);

      router.push("/mes-missions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const eligible = Array.isArray(data)
    ? data.filter((m) => m.status !== "COMPLETED" && m.status !== "CANCELLED")
    : [];

  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-8 pb-5 bg-white" style={{ boxShadow: "0 1px 0 #E5E7EB" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Signaler une absence</h1>
            <p className="text-sm text-gray-500 mt-0.5">Votre gérant sera prévenu par SMS</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Sélection des missions */}
        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
            Missions concernées
          </p>

          {isLoading ? (
            [1, 2].map((i) => (
              <div key={i} className="h-16 bg-white rounded-2xl shadow-sm animate-pulse mb-2" />
            ))
          ) : eligible.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <p className="text-sm text-gray-400">Aucune mission à venir</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligible.map((mission) => {
                const isSelected = selectedIds.has(mission.id);
                return (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => toggle(mission.id)}
                    className={clsx(
                      "w-full bg-white rounded-2xl shadow-sm text-left flex items-center gap-3 px-4 py-3.5 transition-all",
                      isSelected && "ring-2 ring-gray-900"
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare size={22} className="text-gray-900 shrink-0" />
                    ) : (
                      <Square size={22} className="text-gray-300 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{mission.site}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={13} className="text-gray-400 shrink-0" />
                        <p className="text-sm text-gray-500 capitalize">
                          {mission.date} · {mission.startTime}–{mission.endTime}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Raison */}
        <div>
          <label htmlFor="reason" className="text-sm font-bold text-gray-500 uppercase tracking-widest block mb-3">
            Raison (optionnel)
          </label>
          <textarea
            id="reason"
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-base placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 focus:outline-none resize-none"
            placeholder="Maladie, urgence personnelle..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || selectedIds.size === 0}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          style={{ minHeight: 56 }}
        >
          <Send size={18} />
          {loading ? "Envoi en cours..." : "Signaler mon absence"}
        </button>
      </form>
    </div>
  );
}
