# CLAUDE.md — Instructions pour Claude Code

## Projet

**Planly** — SaaS B2B de gestion d'équipes de nettoyage. Mobile-first (PWA). L'utilisateur principal est un gérant de 62 ans qui utilise uniquement son smartphone et ne sait pas utiliser un ordinateur.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL (Supabase)
- NextAuth (auth SMS magic link)
- Twilio (SMS)
- Claude API (IA copilot — suggestions remplacement, rapports)
- PWA (installable sur écran d'accueil)

## Conventions

- **Langue UI** : français uniquement
- **Fichiers** : kebab-case pour les fichiers, PascalCase pour les composants
- **Imports** : utiliser `@/` alias (src/)
- **State** : React state + SWR pour data fetching. Pas de Redux ni Zustand.
- **Validation** : Zod pour les API routes
- **CSS** : Tailwind uniquement, pas de CSS modules

## Design System (CleanPro — référence : /figma)

### Couleurs
- **Background** : `#F5F5F5` (body)
- **Cards** : `bg-white` + `shadow-sm` (pas de border)
- **Brand** : `brand-600` (#1B30F5) pour actions primaires
- **Texte principal** : `text-gray-900`
- **Texte secondaire** : `text-gray-500`
- **Status** : `bg-green-100 text-green-700` / `bg-yellow-100 text-yellow-700` / `bg-red-100 text-red-700`

### Layout
- **Bottom nav** : pill flottante noire `bg-gray-900 rounded-full`, positionnée `bottom-6` avec `px-5`
- **Active nav item** : `bg-white text-gray-900` (cercle blanc dans la pill)
- **Page** : `pb-32` pour éviter le chevauchement avec la nav flottante

### Header de page
- Fond blanc `bg-white`, `px-6 pt-8 pb-4`
- Titre `text-xl font-bold text-gray-900` + sous-titre `text-sm text-gray-500`
- Avatar du gérant : `w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400`

### Hero Banner (Dashboard uniquement)
- Gradient `from-purple-400 via-purple-300 to-pink-200` (tout va bien) ou `from-orange-300 via-amber-200 to-yellow-100` (problème)
- `rounded-3xl p-6 shadow-md`
- Icône dans `w-10 h-10 rounded-xl bg-white/90`

### Cartes et listes
- **Cards** : `bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow`
- **Bordure gauche colorée** : `absolute left-0 top-0 bottom-0 w-1.5` (missions, alertes, sites)
- **Palette de couleurs bordures** : blue-500, purple-500, pink-500, orange-500, teal-500, indigo-500

### Avatars employés
- Taille : `w-12 h-12 rounded-full`
- Couleur : fonction hash sur le prénom → bg-blue/cyan/purple/green/orange/pink-100

### Boutons
- **Primaire** : `bg-brand-600 text-white shadow-md`
- **Ajouter (pleine largeur)** : `w-full bg-gray-900 text-white rounded-2xl py-3.5 shadow-md`
- **Taille min** : `min-height: 56px`

### Stat Cards (Dashboard)
- Gradient doux : `from-yellow-100 to-orange-100` / `from-blue-100 to-cyan-100` / `from-pink-100 to-rose-100`
- Icône dans `w-8 h-8 rounded-lg bg-white/90`
- Chiffre : `text-3xl font-bold text-gray-900`

### Sélecteur de jours (Planning)
- `rounded-full`, `min-w-[56px] h-16`
- Actif : `bg-gray-900 text-white shadow-md`
- Aujourd'hui : `ring-2 ring-gray-200`

## Principes UX critiques

1. **Boutons minimum 56px de hauteur** — doigts d'un homme de 62 ans
2. **Texte minimum 16px** — lisibilité sans lunettes
3. **Maximum 2 taps pour toute action** — voir planning, voir alerte, contacter remplaçant
4. **Zéro jargon technique** — "Accueil" pas "Dashboard", couleurs pas "status"
5. **SMS en priorité** sur push notifications — c'est ce qu'il lit à coup sûr
6. **Offline-first pour les checklists** — employés dans des sous-sols

## Structure

```
src/app/(auth)/      → Login SMS
src/app/(gerant)/    → Pages gérant (dashboard, planning, employés, sites, alertes)
src/app/(employe)/   → Pages employé (mes missions, checklist, absence)
src/app/api/         → API routes
src/lib/             → Helpers (prisma, ai, sms, utils)
src/components/      → Composants réutilisables
```

## Base de données

Le schéma Prisma est dans `prisma/schema.prisma`. Les modèles principaux :
- User (gérant ou employé)
- Company, Employee, Site
- Mission (instance planifiée d'un employé sur un site)
- ChecklistTemplate, ChecklistItem (config par site)
- ChecklistResult, MissionPhoto (résultats par mission)
- Absence (signalement + status remplacement)
- Availability (disponibilités récurrentes par jour)

## Commandes

```bash
npm run dev          # Dev server
npm run db:push      # Push schema to DB
npm run db:seed      # Seed with test data
npm run db:studio    # Prisma Studio (DB viewer)
npm run db:generate  # Regenerate Prisma client
```

## Spec complète

Voir `SPEC.md` à la racine du projet pour la spec fonctionnelle détaillée (routes, API, flows utilisateur, algorithme IA).
