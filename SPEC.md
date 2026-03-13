# Planly — Spec Technique MVP

> **Stack** : Next.js 15 / TypeScript / PostgreSQL / Prisma / PWA  
> **Cible** : Gérant de société de nettoyage (62 ans, smartphone uniquement, zéro compétence tech)  
> **Objectif** : Remplacer papier + appels par un outil simple avec IA copilot

---

## Contexte métier

Mon beau-père gère une entreprise de nettoyage avec des contrats B2B (Optical Center, etc.). Aujourd'hui il gère tout avec du papier et son téléphone. Les problèmes :

- **Planning papier** : qui va où, quand, aucune visibilité
- **Absences** : un employé appelle malade → il passe 30 min à appeler des remplaçants
- **Qualité** : les clients (Optical Center) se plaignent de tâches oubliées, aucune preuve
- **Heures** : tracking manuel, pas fiable
- **Capacité** : il sous-traite à d'autres sociétés faute de pouvoir gérer plus d'employés

Il paie déjà quelqu'un ~1500€/mois juste pour gérer les employés. Un SaaS à 150-300€/mois est une évidence.

---

## Rôles utilisateurs (MVP)

| Rôle | Accès | Device |
|---|---|---|
| **Gérant** | Planning, employés, sites, alertes, rapports | Smartphone (PWA) |
| **Employé** | Ses missions du jour, checklist, signaler absence | Smartphone (PWA) |

> Le portail client (Optical Center voit les rapports) = Phase 2.

---

## Stack technique

```
Frontend      : Next.js 15 (App Router) + TypeScript + Tailwind CSS
State         : React state + SWR (simple data fetching)
Backend       : Next.js Route Handlers
ORM           : Prisma
Database      : PostgreSQL (Supabase)
Auth          : NextAuth.js — magic link SMS (pas de mot de passe)
SMS           : Twilio
IA            : API Claude (Anthropic) — suggestions remplacement + rapports
Photos        : Supabase Storage
Deploy        : Vercel
PWA           : next-pwa — installable sur écran d'accueil
```

### Pourquoi PWA et pas app native ?

- Un seul codebase
- Installation en 1 tap (pas d'App Store)
- Fonctionne offline (service worker pour les checklists)
- Push notifications supportées
- Le beau-père ajoute à son écran d'accueil, ça ressemble à une app

---

## Modèle de données (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  GERANT
  EMPLOYE
}

model User {
  id        String   @id @default(cuid())
  phone     String   @unique
  firstName String
  lastName  String
  role      UserRole
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company   Company? @relation("CompanyOwner")
  employee  Employee?
  sessions  Session[]
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Company {
  id        String     @id @default(cuid())
  name      String
  ownerId   String     @unique
  createdAt DateTime   @default(now())
  owner     User       @relation("CompanyOwner", fields: [ownerId], references: [id])
  employees Employee[]
  sites     Site[]
}

model Employee {
  id               String         @id @default(cuid())
  userId           String         @unique
  companyId        String
  zones            String[]       @default([])
  skills           String[]       @default([])
  reliabilityScore Float          @default(5.0)
  notes            String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  user             User           @relation(fields: [userId], references: [id])
  company          Company        @relation(fields: [companyId], references: [id])
  availabilities   Availability[]
  missions         Mission[]
  absences         Absence[]
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

model Availability {
  id         String    @id @default(cuid())
  employeeId String
  dayOfWeek  DayOfWeek
  startTime  String
  endTime    String
  employee   Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  @@unique([employeeId, dayOfWeek, startTime])
}

model Site {
  id           String              @id @default(cuid())
  companyId    String
  name         String
  address      String
  contactName  String?
  contactPhone String?
  isActive     Boolean             @default(true)
  createdAt    DateTime            @default(now())
  company      Company             @relation(fields: [companyId], references: [id])
  checklists   ChecklistTemplate[]
  missions     Mission[]
}

model ChecklistTemplate {
  id       String          @id @default(cuid())
  siteId   String
  name     String
  site     Site            @relation(fields: [siteId], references: [id], onDelete: Cascade)
  items    ChecklistItem[]
}

model ChecklistItem {
  id            String            @id @default(cuid())
  templateId    String
  label         String
  category      String?
  order         Int
  isRequired    Boolean           @default(true)
  photoRequired Boolean           @default(false)
  template      ChecklistTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
}

enum MissionStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  UNASSIGNED
}

model Mission {
  id          String        @id @default(cuid())
  siteId      String
  employeeId  String?
  date        DateTime
  startTime   String
  endTime     String
  status      MissionStatus @default(PLANNED)
  actualStart DateTime?
  actualEnd   DateTime?
  notes       String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  site        Site               @relation(fields: [siteId], references: [id])
  employee    Employee?          @relation(fields: [employeeId], references: [id])
  results     ChecklistResult[]
  photos      MissionPhoto[]
  absence     Absence?
}

model ChecklistResult {
  id          String    @id @default(cuid())
  missionId   String
  itemLabel   String
  category    String?
  isCompleted Boolean   @default(false)
  completedAt DateTime?
  photoUrl    String?
  mission     Mission   @relation(fields: [missionId], references: [id], onDelete: Cascade)
}

enum PhotoType {
  BEFORE
  AFTER
  ISSUE
}

model MissionPhoto {
  id        String    @id @default(cuid())
  missionId String
  url       String
  type      PhotoType
  caption   String?
  createdAt DateTime  @default(now())
  mission   Mission   @relation(fields: [missionId], references: [id], onDelete: Cascade)
}

enum AbsenceStatus {
  REPORTED
  REPLACEMENT_FOUND
  UNRESOLVED
}

model Absence {
  id            String        @id @default(cuid())
  employeeId    String
  missionId     String        @unique
  reason        String?
  reportedAt    DateTime      @default(now())
  status        AbsenceStatus @default(REPORTED)

  employee      Employee      @relation(fields: [employeeId], references: [id])
  mission       Mission       @relation(fields: [missionId], references: [id])
}
```

---

## Fonctionnalités MVP

### 1. Auth — Connexion par code SMS

- L'utilisateur entre son numéro de téléphone
- Reçoit un code 6 chiffres par SMS (Twilio)
- Tape le code → connecté
- Pas de mot de passe, pas d'email
- Le code expire après 5 minutes

### 2. Dashboard Gérant

Le gérant ouvre l'app et voit l'essentiel :

- Alertes du jour (absences non résolues, missions non assignées)
- Liste des missions du jour avec status
- Stats semaine (missions, absences, taux checklist)
- Navigation bottom : Accueil / Planning / Équipe / Plus

### 3. Planning

- Vue semaine scrollable horizontalement
- Chaque jour affiche les missions (carte : horaire + site + employé)
- Code couleur : vert (ok), orange (en cours), rouge (non assigné)
- Tap sur une carte → détail
- Bouton "+" → créer une mission (sélection site + employé + horaire)

### 4. Gestion employés

- Liste des employés avec statut (actif/inactif)
- Fiche employé : nom, téléphone, zones, compétences, disponibilités
- Disponibilités : par jour de la semaine (lundi 6h-14h, etc.)
- Score de fiabilité (calculé automatiquement sur historique)

### 5. Gestion sites

- Liste des sites/contrats
- Fiche site : nom, adresse, contact, checklist template
- Configuration checklist : liste de tâches par catégorie (sanitaires, bureaux, etc.)
- Chaque tâche : label + obligatoire ou pas + photo requise ou pas

### 6. Absences + Suggestions IA

**Flow employé :**
1. Ouvre l'app → "Signaler absence"
2. Sélectionne missions concernées + raison
3. Confirme → SMS envoyé au gérant

**Flow gérant :**
1. Reçoit SMS + notification dans l'app
2. Voit 3 suggestions de remplaçants classées par pertinence
3. Critères de scoring IA :
   - Disponibilité sur le créneau (30%)
   - Historique sur ce site (25%)
   - Distance/zone géographique (20%)
   - Fiabilité historique (15%)
   - Équilibrage charge de travail (10%)
4. Tap "Contacter" → SMS automatique au remplaçant
5. Le remplaçant répond OUI/NON par SMS
6. Si OUI → mission réassignée automatiquement

### 7. Checklist mission (côté employé)

1. L'employé voit ses missions du jour
2. Tap sur une mission → checklist du site
3. Coche chaque tâche effectuée
4. Prend photo si requis (avant/après)
5. Valide → mission terminée
6. Le gérant voit le rapport en temps réel

---

## Pages et routes

```
/ → redirect vers /login ou /dashboard

(auth)
  /login                    → Saisie numéro + code SMS

(gerant)
  /dashboard                → Vue d'ensemble du jour
  /planning                 → Planning semaine
  /employes                 → Liste employés
  /employes/[id]            → Fiche employé
  /employes/nouveau         → Ajouter un employé
  /sites                    → Liste sites
  /sites/[id]               → Fiche site + config checklist
  /sites/nouveau            → Ajouter un site
  /alertes                  → Centre de notifications/absences

(employe)
  /mes-missions             → Missions du jour
  /mission/[id]             → Mission en cours (checklist + photos)
  /absence                  → Signaler une absence
```

---

## API Routes

```
POST   /api/auth/send-code          → Envoie le code SMS
POST   /api/auth/verify-code        → Vérifie le code, crée la session

GET    /api/planning?week=2026-W09  → Missions de la semaine
POST   /api/missions                → Créer une mission
PATCH  /api/missions/[id]           → Modifier une mission
PATCH  /api/missions/[id]/status    → Changer le status

GET    /api/employes                → Liste employés
POST   /api/employes                → Ajouter un employé
PATCH  /api/employes/[id]           → Modifier fiche employé

GET    /api/sites                   → Liste sites
POST   /api/sites                   → Ajouter un site
PATCH  /api/sites/[id]              → Modifier site

POST   /api/absences                → Signaler une absence
PATCH  /api/absences/[id]           → Mettre à jour status absence

POST   /api/ai/suggest-replacement  → IA : suggestions de remplaçants
POST   /api/ai/generate-report      → IA : rapport qualité

POST   /api/missions/[id]/checklist → Soumettre résultats checklist
POST   /api/upload                  → Upload photo

POST   /api/sms/send                → Envoyer SMS (interne)
POST   /api/sms/webhook             → Recevoir réponse SMS (Twilio webhook)
```

---

## Principes UX

1. **Gros boutons, gros textes** — minimum 16px, boutons tactiles 48px minimum
2. **Maximum 2 taps pour toute action courante** — voir planning, voir alerte, contacter remplaçant
3. **Zéro jargon technique** — pas de "dashboard", mais "Accueil". Pas de "status", mais des couleurs.
4. **Notifications SMS en priorité** — les push c'est bien, mais le SMS c'est ce qu'il lit à coup sûr
5. **Mode offline pour les checklists** — l'employé dans un sous-sol doit pouvoir cocher sa liste
6. **Langue : français uniquement** pour le MVP

---

## Variables d'environnement (.env.local)

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

ANTHROPIC_API_KEY=...

SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Roadmap

**Mois 1-2 : MVP fonctionnel**
- Auth SMS
- CRUD employés / sites / planning
- Alertes absence + suggestions IA
- Checklist basique

**Mois 3-4 : Itération terrain**
- Photos avant/après dans checklist
- SMS automatiques remplaçants (flow complet OUI/NON)
- Pointage heures
- Historique des missions

**Mois 5-6 : IA renforcée**
- Rapports qualité auto-générés
- Scoring fiabilité employés
- Détection patterns d'absence
- Portail client (Phase 2)
