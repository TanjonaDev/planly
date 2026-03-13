"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";

export default function NouvelEmployePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [zoneInput, setZoneInput] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  function addZone() {
    const z = zoneInput.trim();
    if (z && !zones.includes(z)) {
      setZones((prev) => [...prev, z]);
    }
    setZoneInput("");
  }

  function removeZone(zone: string) {
    setZones((prev) => prev.filter((z) => z !== zone));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError("Prénom, nom et téléphone sont obligatoires");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/employes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, zones, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Une erreur est survenue");
        return;
      }

      router.push("/employes");
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
          <h1 className="text-xl font-bold text-gray-900">Nouvel employé</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Prénom */}
        <div>
          <label className="label">Prénom *</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="ex : Khadija"
            className="input"
            autoComplete="given-name"
          />
        </div>

        {/* Nom */}
        <div>
          <label className="label">Nom *</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="ex : Larbi"
            className="input"
            autoComplete="family-name"
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="label">Téléphone *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="ex : 0612345678"
            className="input"
            autoComplete="tel"
          />
        </div>

        {/* Zones */}
        <div>
          <label className="label">Zones d'intervention</label>
          {zones.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {zones.map((zone) => (
                <span
                  key={zone}
                  className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium px-3 py-1.5 rounded-full"
                >
                  {zone}
                  <button
                    type="button"
                    onClick={() => removeZone(zone)}
                    className="hover:text-gray-300 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={zoneInput}
              onChange={(e) => setZoneInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addZone())}
              placeholder="ex : Créteil, Thiais..."
              className="input flex-1"
            />
            <button
              type="button"
              onClick={addZone}
              disabled={!zoneInput.trim()}
              className="w-14 h-14 bg-gray-900 text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informations complémentaires..."
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
          {loading ? "Enregistrement..." : "Ajouter l'employé"}
        </button>
      </form>
    </div>
  );
}
