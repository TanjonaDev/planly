"use client";

import { use, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Phone,
  Sparkles,
  Loader2,
  CheckCircle2,
  Star,
} from "lucide-react";
import { clsx } from "clsx";

type AbsenceDetail = {
  id: string;
  status: string;
  reason: string | null;
  reportedAt: string;
  employee: { id: string; name: string; phone: string };
  mission: {
    site: string;
    address: string;
    date: string;
    startTime: string;
    endTime: string;
  };
};

type Suggestion = {
  employeeId: string;
  name: string;
  score: number;
  reason: string;
  isAvailable: boolean;
  reliabilityScore: number;
  siteHistory: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AlerteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useSWR<AbsenceDetail>(`/api/absences/${id}`, fetcher);

  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [contactingId, setContactingId] = useState<string | null>(null);

  async function loadSuggestions() {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/suggest-replacement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ absenceId: id }),
      });
      const result = await res.json();
      setSuggestions(result.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingAI(false);
    }
  }

  async function contactEmployee(employeeId: string) {
    setContactingId(employeeId);
    try {
      await fetch(`/api/absences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "contact", employeeId }),
      });
      setContacted((prev) => new Set([...prev, employeeId]));
    } finally {
      setContactingId(null);
    }
  }

  if (isLoading || !data) {
    return (
      <div>
        <div className="page-header flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-center gap-3">
        <Link href="/alertes" className="p-2 rounded-full hover:bg-gray-100 shrink-0">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-bold">Absence signalée</h1>
          <p className="text-sm text-gray-500">Le {data.reportedAt}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Résumé absence */}
        <div className="card border-l-4 border-l-amber-400 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <span className="font-semibold text-body">{data.employee.name}</span>
          </div>
          <div>
            <p className="font-medium">{data.mission.site}</p>
            <p className="text-sm text-gray-500 capitalize">
              {data.mission.date} · {data.mission.startTime}–{data.mission.endTime}
            </p>
          </div>
          {data.reason && (
            <p className="text-sm text-gray-500 italic border-t pt-2">
              "{data.reason}"
            </p>
          )}
          <a
            href={`tel:${data.employee.phone}`}
            className="flex items-center gap-2 text-brand-600 font-medium text-sm"
          >
            <Phone size={14} />
            Appeler {data.employee.name.split(" ")[0]}
          </a>
        </div>

        {/* Suggestions IA */}
        <div>
          <h2 className="text-h3 font-bold mb-3">Trouver un remplaçant</h2>

          {suggestions === null ? (
            <button
              onClick={loadSuggestions}
              disabled={loadingAI}
              className="btn-primary w-full gap-2 disabled:opacity-70"
            >
              {loadingAI ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyse IA en cours...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Obtenir les suggestions IA
                </>
              )}
            </button>
          ) : suggestions.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              <p>Aucun remplaçant disponible trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s, idx) => (
                <div
                  key={s.employeeId}
                  className={clsx(
                    "card space-y-3",
                    idx === 0 && "ring-2 ring-brand-200"
                  )}
                >
                  {/* Nom + score */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <Star
                          size={16}
                          className="text-brand-600 fill-brand-600 shrink-0"
                        />
                      )}
                      <span className="font-semibold text-body">{s.name}</span>
                    </div>
                    <span className="font-bold text-brand-600">{s.score}/100</span>
                  </div>

                  {/* Explication IA */}
                  <p className="text-sm text-gray-600">{s.reason}</p>

                  {/* Indicateurs */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {s.isAvailable && (
                      <span className="flex items-center gap-1 badge bg-green-100 text-green-700">
                        <CheckCircle2 size={11} />
                        Disponible
                      </span>
                    )}
                    <span className="badge bg-gray-100 text-gray-600">
                      Fiabilité {s.reliabilityScore.toFixed(1)}/10
                    </span>
                    {s.siteHistory > 0 && (
                      <span className="badge bg-brand-50 text-brand-700">
                        {s.siteHistory} mission(s) sur ce site
                      </span>
                    )}
                  </div>

                  {/* Bouton contacter */}
                  <button
                    onClick={() => contactEmployee(s.employeeId)}
                    disabled={contacted.has(s.employeeId) || !!contactingId}
                    className={clsx(
                      "w-full gap-2",
                      contacted.has(s.employeeId) ? "btn-secondary" : "btn-primary"
                    )}
                  >
                    {contactingId === s.employeeId ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Envoi SMS...
                      </>
                    ) : contacted.has(s.employeeId) ? (
                      <>
                        <CheckCircle2 size={16} className="text-green-600" />
                        SMS envoyé — en attente de réponse
                      </>
                    ) : (
                      <>
                        <Phone size={16} />
                        Contacter par SMS
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
