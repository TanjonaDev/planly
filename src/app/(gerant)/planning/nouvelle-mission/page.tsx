"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Site = { id: string; name: string };
type Employee = { id: string; firstName: string; lastName: string };

export default function NouvelleMissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [siteId, setSiteId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(searchParams.get("date") ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("09:00");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/sites").then((r) => r.json()),
      fetch("/api/employes").then((r) => r.json()),
    ]).then(([s, e]) => {
      setSites(Array.isArray(s) ? s.filter((site: Site & { isActive?: boolean }) => site.isActive !== false) : []);
      setEmployees(Array.isArray(e) ? e : []);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!siteId) {
      setError("Veuillez sélectionner un site");
      return;
    }
    if (!date || !startTime || !endTime) {
      setError("Date et horaires obligatoires");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          employeeId: employeeId || undefined,
          date,
          startTime,
          endTime,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Une erreur est survenue");
        return;
      }

      router.push("/planning");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Nouvelle mission</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Site */}
        <div>
          <label className="label">Site *</label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="input appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
          >
            <option value="">Sélectionner un site...</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Employé */}
        <div>
          <label className="label">Employé (optionnel)</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="input appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
          >
            <option value="">Laisser non assignée</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="label">Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>

        {/* Horaires */}
        <div>
          <label className="label">Horaires *</label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input flex-1"
            />
            <span className="text-gray-400 font-medium shrink-0">→</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input flex-1"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions particulières..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-body placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none resize-none"
          />
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-md text-base disabled:opacity-60 transition-opacity"
          style={{ minHeight: 56 }}
        >
          {loading ? "Enregistrement..." : "Créer la mission"}
        </button>
      </form>
    </div>
  );
}
