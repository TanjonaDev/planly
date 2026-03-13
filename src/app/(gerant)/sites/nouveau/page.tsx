"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function NouveauSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !address.trim()) {
      setError("Le nom et l'adresse sont obligatoires");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, contactName, contactPhone }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Une erreur est survenue");
        return;
      }

      router.push("/sites");
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
          <h1 className="text-xl font-bold text-gray-900">Nouveau site</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Nom du site */}
        <div>
          <label className="label">Nom du site *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex : Optical Center Créteil"
            className="input"
          />
        </div>

        {/* Adresse */}
        <div>
          <label className="label">Adresse *</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ex : Centre Commercial Belle Épine, Thiais"
            className="input"
          />
        </div>

        {/* Séparateur */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Contact sur site (optionnel)
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Nom du contact</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="ex : Mme Martin"
                className="input"
              />
            </div>

            <div>
              <label className="label">Téléphone du contact</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="ex : 0612345678"
                className="input"
                autoComplete="tel"
              />
            </div>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Info checklist */}
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-500">
            💡 La checklist du site peut être configurée depuis la fiche du site après création.
          </p>
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-md text-base disabled:opacity-60 transition-opacity"
          style={{ minHeight: 56 }}
        >
          {loading ? "Enregistrement..." : "Créer le site"}
        </button>
      </form>
    </div>
  );
}
