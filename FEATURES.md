# Planly — Documentation des fonctionnalités

Planly est un SaaS B2B de gestion d'équipes de nettoyage. Interface mobile-first (PWA) conçue pour un gérant non-technicien et ses employés.

---

## Authentification

- **Connexion par SMS** : l'utilisateur entre son numéro de téléphone → reçoit un code à 6 chiffres par SMS (Twilio) → saisit le code → session créée (cookie HttpOnly)
- Deux rôles : `GERANT` et `EMPLOYE` — chaque rôle accède à une interface distincte
- **Mode dev** : page de login avec bouton gérant (connexion directe) + champ numéro de téléphone pour se connecter en tant qu'employé spécifique (cookie `dev-session`)
- Déconnexion via `/api/auth/logout`

---

## Interface Gérant

### Dashboard (`/dashboard`)
- Résumé du jour : nombre de missions terminées ou en cours / total
- Liste des alertes récentes (absences signalées) avec lien direct vers le détail de l'alerte
- Accès rapide au planning de la semaine

### Planning (`/planning`)
- Vue semaine : lundi → dimanche
- Chaque mission affiche : site, horaires, employé assigné
- Couleur selon statut : PLANNED (gris), IN_PROGRESS (bleu), COMPLETED (vert), UNASSIGNED (rouge)
- Filtrage par site ou par employé (à venir)

### Employés (`/employes`)
- Liste des employés de l'entreprise avec nom, téléphone, rôle
- Fiche employé (`/employes/[id]`) : disponibilités par jour, historique missions (à venir)

### Sites (`/sites`)
- Liste des sites de l'entreprise avec adresse et numéro de contact
- Lien cliquable vers l'adresse (Google Maps) et appel direct au numéro du site
- Fiche site (`/sites/[id]`) : détail, checklist template associé

### Alertes (`/alertes`)
- Liste des absences signalées par les employés
- Chaque alerte indique : nom de l'employé absent, site concerné, date/horaire
- Statuts : `REPORTED`, `REPLACEMENT_FOUND`, `UNRESOLVED`

### Détail d'une alerte (`/alertes/[id]`)
- Informations complètes sur l'absence et la mission impactée
- Suggestions de remplaçants générées par l'IA (Claude API) ou fallback pré-calculé
- Action **Contacter** : envoie un SMS de demande de remplacement à l'employé sélectionné
- Action **Marquer sans solution** : passe le statut de l'absence à `UNRESOLVED`

---

## Interface Employé

### Mes missions (`/mes-missions`)
- Liste des missions du jour (et jusqu'à 7 jours selon paramètre `?days=N`)
- Chaque mission affiche : site, adresse, horaires, statut
- Bouton **Commencer la mission** (statut PLANNED → IN_PROGRESS)
- Bouton **Terminer la mission** (statut IN_PROGRESS → COMPLETED)
- **Bannière de demande de remplacement** : si le gérant a contacté cet employé pour remplacer un absent, une carte orange s'affiche en haut avec les infos de la mission et deux boutons **Accepter** / **Refuser**
- **Badge orange** sur l'icône de la nav bar si une demande de remplacement est en attente (polling toutes les 30s)
- Mise à jour en temps réel via SWR

### Signaler une absence (`/absence`)
- Formulaire de signalement d'absence pour le jour en cours
- Génère une alerte visible par le gérant dans l'onglet Alertes

### Mon compte (`/compte`)
- Informations du profil (à enrichir)

---

## Flow de remplacement par SMS

1. L'employé signale son absence depuis l'app
2. Le gérant reçoit une alerte sur son dashboard
3. Le gérant ouvre l'alerte → l'IA suggère des remplaçants disponibles
4. Le gérant sélectionne un remplaçant → SMS envoyé automatiquement : *"Êtes-vous disponible pour remplacer X à [site] le [date] ? Répondez OUI ou NON."*
5. Le remplaçant reçoit la demande **par SMS** et/ou **dans l'app** (bannière orange sur la page Mes missions)
6. Le remplaçant répond **OUI par SMS** ou **Accepter dans l'app** → la mission lui est réassignée (statut PLANNED), l'absence passe à `REPLACEMENT_FOUND`
7. Le gérant reçoit un SMS de confirmation : *"✅ [Nom] a accepté de remplacer..."*
8. Si le remplaçant répond **NON** (SMS ou app) → rien ne change, le gérant peut en contacter un autre

**Implémentation :**
- Webhook Twilio (`/api/sms/webhook`) pour les réponses par SMS
- `GET /api/employe/replacements` + `POST /api/employe/replacements/[absenceId]` pour les réponses in-app
- `VerificationToken` Prisma pour lier la demande à l'employé (identifier = `replacement:{employeeId}`, expire après 2h)

---

## Suggestions IA (Claude API)

- Route `/api/ai/suggest-replacement` : reçoit l'`absenceId`, analyse les disponibilités et compétences des employés, retourne une liste ordonnée de remplaçants avec justification
- Fallback gracieux si la clé API n'est pas configurée : retourne les employés disponibles sans classement IA

---

## Infrastructure

| Composant | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript |
| Style | Tailwind CSS |
| Base de données | PostgreSQL (Supabase) via Prisma |
| Auth | Sessions custom (cookie HttpOnly) |
| SMS | Twilio (envoi + webhook réception) |
| IA | Claude API (Anthropic) |
| PWA | manifest.json + icônes |
| Déploiement | Vercel (à configurer) |

---

## Statuts de mission

| Statut | Signification |
|---|---|
| `PLANNED` | Mission planifiée, pas encore commencée |
| `IN_PROGRESS` | L'employé a cliqué "Commencer la mission" |
| `COMPLETED` | L'employé a cliqué "Terminer la mission" |
| `UNASSIGNED` | Mission sans employé assigné |
| `CANCELLED` | Mission annulée (non affichée à l'employé) |

---

## Statuts d'absence

| Statut | Signification |
|---|---|
| `REPORTED` | Absence signalée, en attente de traitement |
| `REPLACEMENT_FOUND` | Un remplaçant a accepté (par SMS ou via l'app) |
| `UNRESOLVED` | Marquée sans solution par le gérant |
