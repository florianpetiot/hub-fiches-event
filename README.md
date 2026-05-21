# 🎓 Hub Fiches Event

> Plateforme interne de gestion des fiches événementielles associatives pour **Polytech Nantes**.  
> Les clubs déposent leurs demandes d'événements et les différents services administratifs les valident via un workflow de signatures configurable.

---

## Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Architecture du projet](#-architecture-du-projet)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Variables d'environnement](#-variables-denvironnement)
- [Base de données](#-base-de-données)
- [Lancer le projet](#-lancer-le-projet)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Schéma de la base de données](#-schéma-de-la-base-de-données)
- [Rôles & permissions](#-rôles--permissions)
- [Workflow de validation](#-workflow-de-validation)
- [Structure des routes](#-structure-des-routes)
- [Conventions de code](#-conventions-de-code)
- [Captures d'écran](#-captures-décran)

---

## 🚀 Fonctionnalités

### Pour les clubs (associations étudiantes)

| Fonctionnalité | Description |
|---|---|
| **Création de fiche** | Formulaire complet avec infos générales, matériel, communication, alimentation, alcool, sécurité, accès SSI, agents de sécurité |
| **Brouillon & soumission** | Sauvegarde automatique en brouillon, soumission avec validation des champs obligatoires |
| **Duplication** | Copier une fiche existante pour créer un événement similaire |
| **Édition en révision** | Modifier une fiche renvoyée par un admin pour correction |
| **Messagerie** | Chat contextuel par fiche entre le club et les administrateurs, avec indicateur de messages non lus |
| **Calendrier** | Vue calendrier mensuel + liste des événements, filtrage par jour/mois |
| **Upload de fichiers** | Upload de PDF (autorisations alcool, devis sécurité, plan d'implantation...) vers Supabase Storage |

### Pour les administrateurs (services, direction)

| Fonctionnalité | Description |
|---|---|
| **Dashboard** | Vue d'ensemble avec section « À vous de signer » pour les fiches en attente |
| **Résumé de fiche** | Consultation complète en lecture seule avec suivi des signatures |
| **Signature & validation** | Signer, refuser, ou demander une révision sur une fiche soumise |
| **Messagerie** | Communiquer avec le club sur chaque fiche |
| **Calendrier global** | Voir tous les événements de tous les clubs |

### Pour la direction (super-admin)

| Fonctionnalité | Description |
|---|---|
| **Gestion des clubs** | Créer / supprimer des comptes club (invitation par email) |
| **Gestion des admins** | Créer / supprimer / changer le rôle des comptes administrateurs |
| **Gestion des rôles** | Créer / supprimer des rôles personnalisés (ex: « Service Prévention ») |
| **Workflow de signatures** | Ajouter / supprimer / réordonner les étapes du workflow de validation |
| **Paramétrage événementiel** | Configurer le matériel disponible, les canaux de communication, les catégories d'événement, les clés d'accès, les dispositifs de prévention, les règles imposants les agents de sécurité / salle SSI, les documents d'aide |

### Transversal

| Fonctionnalité | Description |
|---|---|
| **Authentification** | Login par email/mot de passe via Supabase Auth |
| **Mot de passe oublié** | Réinitialisation par email avec lien sécurisé |
| **Dark/Light mode** | Thème sombre et clair avec variables CSS personnalisées |
| **Responsive** | Interface adaptée mobile / tablette / desktop avec sidebar rétractable |
| **Service Worker** | Page offline de secours en cas de perte de connexion |
| **Row Level Security** | Sécurité au niveau de la base de données (RLS Supabase) |

---

## 🛠 Stack technique

| Couche | Technologie |
|---|---|
| **Framework** | [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, runes) |
| **Langage** | TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + `@tailwindcss/forms` |
| **Base de données** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Auth** | Supabase Auth (SSR via `@supabase/ssr`) |
| **Storage** | Supabase Storage (upload PDF) |
| **Tests** | [Vitest](https://vitest.dev/) — projets `client` (Playwright browser) + `server` (Node) |
| **Linting** | ESLint + Prettier + eslint-plugin-svelte |
| **Déploiement** | [Vercel](https://vercel.com/) (`@sveltejs/adapter-vercel`) (temporaire) |
| **Package manager** | pnpm |

---

## 🏗 Architecture du projet

```
hub-fiches-event/
├── src/
│   ├── app.css                    # Thème global (design tokens, dark/light mode)
│   ├── app.d.ts                   # Types globaux App.Locals (Supabase, getUser)
│   ├── app.html                   # Template HTML principal
│   ├── hooks.server.ts            # Hook SSR : client Supabase + memoisation auth
│   ├── service-worker.ts          # SW : cache offline.html fallback
│   ├── lib/
│   │   ├── components/            # Composants réutilisables
│   │   │   ├── EventCard.svelte   #   → Carte événement (dashboard)
│   │   │   ├── MainSidebar.svelte #   → Sidebar navigation principale
│   │   │   ├── FileUpload.svelte  #   → Upload de fichiers vers Supabase Storage
│   │   │   ├── PdfViewer.svelte   #   → Visualisation de PDF
│   │   │   ├── ConfirmModal.svelte#   → Modal de confirmation
│   │   │   ├── MessageModal.svelte#   → Modal de confirmation avec message
│   │   │   ├── Switch.svelte      #   → Toggle switch
│   │   │   ├── Row.svelte         #   → Ligne de formulaire
│   │   │   └── settings/          #   → Composants de la page Paramètres
│   │   │       ├── AdminsSettings.svelte
│   │   │       ├── ClubsSettings.svelte
│   │   │       └── EventSettings.svelte
│   │   ├── types/
│   │   │   ├── app.types.ts       # Types métier (EventFormTyped, DashboardForm...)
│   │   │   └── database.types.ts  # Types auto-générés par Supabase CLI
│   │   ├── validateFiche.ts       # Validation complète d'une fiche avant soumission
│   │   ├── supabase-admin.ts      # Client Supabase admin (service_role_key)
│   │   ├── date.ts                # Utilitaire de formatage de dates (fr-FR)
│   │   └── eventStore.ts          # Store Svelte pour titre/date de l'événement courant
│   └── routes/
│       ├── +layout.server.ts      # Auth guard + chargement profil utilisateur
│       ├── +layout.svelte         # Layout racine (CSS, favicon, Service Worker)
│       ├── +error.svelte          # Page d'erreur (404, 403, etc.)
│       ├── login/                 # Page de connexion
│       ├── auth/                  # Callbacks auth (callback, reset-password, session)
│       ├── dashboard/             # Dashboard principal
│       ├── calendrier/            # Vue calendrier mensuel
│       ├── fiche-event/[id]/      # Fiche événement (layout avec sidebar dédiée)
│       │   ├── edition/           #   → Formulaire d'édition
│       │   ├── resume/            #   → Vue résumé + signatures
│       │   └── messagerie/        #   → Chat contextuel
│       ├── parametres/            # Page de paramétrage
│       ├── mentions-legales/      # Pages légales
│       ├── politique-de-confidentialite/
│       └── conditions-d-utilisation/
├── supabase/
│   ├── config.toml                # Configuration Supabase locale
│   ├── migrations/                # Migrations SQL
│   └── seed.sql                   # Données de seed (rôles, settings, comptes de test...)
├── static/
│   ├── offline.html               # Page offline (service worker)
│   └── robots.txt
├── package.json
├── svelte.config.js               # Config SvelteKit (adapter-vercel)
├── vite.config.ts                 # Config Vite + projets de test Vitest
├── tsconfig.json
├── eslint.config.js
└── .prettierrc
```

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir installé :

| Outil | Version minimale | Installation |
|---|---|---|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **pnpm** | v8+ | `npm install -g pnpm` |
| **Docker** | — | [docker.com](https://www.docker.com/) (nécessaire pour Supabase local) |
| **Supabase CLI** | v2+ | Inclus dans les devDependencies (`npx supabase`) |

---

## 📦 Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd hub-fiches-event
```

### 2. Installer les dépendances

```bash
pnpm install
```

> **Note :** Le fichier `.npmrc` contient `engine-strict=true` — une version incompatible de Node déclenchera une erreur.

---

## 🔑 Variables d'environnement

Copiez le fichier d'exemple et renseignez les valeurs :

```bash
cp .env.example .env
```

### Variables requises

| Variable | Description | Exemple |
|---|---|---|
| `PUBLIC_SITE_URL` | URL publique du site (utilisée pour les redirections auth, emails d'invitation) | `http://localhost:5173` |
| `PUBLIC_SUPABASE_URL` | URL de l'instance Supabase | `http://127.0.0.1:54321` (local) |
| `PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase (accessible côté client) | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role (côté serveur uniquement, pour les opérations admin) | `eyJhbGci...` |
| `SUPABASE_DB_PASSWORD` | Mot de passe de la base de données PostgreSQL | — |

> **⚠️ Important :** La `SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être exposée côté client. Elle est utilisée uniquement dans `src/lib/supabase-admin.ts` pour les opérations d'administration (création/suppression de comptes).

### Pour le développement local avec Supabase

Après avoir lancé `supabase start` (voir section suivante), les clés sont affichées dans le terminal. Copiez-les dans votre `.env`.

---

## 🗄 Base de données

Le projet utilise **Supabase** (PostgreSQL). Deux modes de fonctionnement :

### Option A — Base locale (recommandé pour le dev)

> Nécessite Docker.

```bash
# Démarrer l'instance Supabase locale (PostgreSQL, Auth, Storage, Studio...)
npx supabase start
```

Cela va :
1. Démarrer tous les services Supabase via Docker
2. Appliquer les **migrations** depuis `supabase/migrations/`
3. Exécuter le **seed** (`supabase/seed.sql`) qui contient les rôles par défaut, les settings, et des comptes de test

Les informations de connexion seront affichées dans le terminal :
```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
anon key: eyJhbGci...
service_role key: eyJhbGci...
```

**Supabase Studio** est disponible sur `http://127.0.0.1:54323` pour explorer la base visuellement.

#### Commandes utiles

```bash
# Voir le statut des services
npx supabase status

# Reset complet (re-run migrations + seed)
npx supabase db reset

# Arrêter les services
npx supabase stop

# Appliquer une nouvelle migration
npx supabase migration new <nom_migration>

# Générer les types TypeScript depuis le schéma
npx supabase gen types typescript --local > src/lib/types/database.types.ts
```

### Option B — Base distante (staging/production)

Si vous travaillez avec une instance Supabase hébergée :

1. Récupérez l'URL et les clés depuis le [dashboard Supabase](https://supabase.com/dashboard)
2. Renseignez-les dans votre `.env`
3. Pour synchroniser le schéma distant → local :
   ```bash
   npx supabase db pull
   ```
4. Pour pousser les migrations locales → distant :
   ```bash
   npx supabase db push
   ```

---

## ▶️ Lancer le projet

### Serveur de développement

```bash
pnpm dev
```

L'application est disponible sur **http://localhost:5173**.

### Mode réseau (accessible depuis d'autres appareils)

```bash
pnpm host
```

### Build de production

```bash
pnpm build
```

### Prévisualisation du build

```bash
pnpm preview
```

---

## 🧪 Tests

Le projet utilise **Vitest** avec deux projets de test configurés :

| Projet | Environnement | Fichiers | Description | Statut |
|---|---|---|---|---|
| `client` | Playwright (Chromium headless) | `src/**/*.svelte.{test,spec}.ts` | Tests de composants Svelte dans un vrai navigateur | ⚠️ **Non implémenté** — l'infrastructure est en place mais aucun test n'a encore été écrit |
| `server` | Node.js | `src/**/*.{test,spec}.ts` (hors `.svelte.*`) | Tests unitaires côté serveur | ✅ Actif |

### Lancer les tests

```bash
# Mode watch (relance automatique)
pnpm test:unit

# Exécution unique (CI)
pnpm test
```

> **Note :** Les tests client (Playwright) ne sont pas encore implémentés. La configuration est prête dans `vite.config.ts` — il suffit de créer des fichiers `*.svelte.test.ts` pour les activer. Playwright sera installé automatiquement via `@vitest/browser-playwright`.

### Configuration

- **`requireAssertions: true`** — chaque test doit contenir au moins une assertion
- Les tests serveur excluent automatiquement `src/lib/server/**`

### Lint & format

```bash
# Vérifier le formatage et le lint
pnpm lint

# Formater automatiquement
pnpm format

# Vérification de types TypeScript
pnpm check
```

---

## 🚢 Déploiement

Bien que l'objectif final est d'auto-héberger le projet, ce dernier est actuellement configuré pour **Vercel** via `@sveltejs/adapter-vercel`.

1. Connectez le dépôt à Vercel
2. Configurez les variables d'environnement dans les settings Vercel
3. Chaque push sur `main` déclenche un déploiement automatique

---

## 📊 Schéma de la base de données

```mermaid
erDiagram
    roles {
        uuid id PK
        text name UK
        text label
        boolean is_system
        timestamptz created_at
    }

    profiles {
        uuid id PK,FK
        text name
        text email
        timestamptz created_at
        uuid role_id FK
    }

    event_forms {
        uuid id PK
        uuid profile_id FK
        event_status status
        integer version
        uuid signed_by FK
        timestamptz signed_at
        text title
        date event_date
        date event_end_date
        time event_start_time
        time event_end_time
        text location
        text category
        text description
        numeric budget
        integer estimated_attendees
        bool has_external_people
        date deadline
        bool needs_equipment
        bool needs_communication
        bool has_food
        text site_plan_path
        bool need_bulle_ssi
        bool needs_agent_secu
        timestamptz created_at
        timestamptz updated_at
        timestamptz submitted_at
        jsonb equipment
        jsonb communication
        jsonb food
        jsonb responsible_prevention
        jsonb responsible_security
        jsonb responsible_organisation
        jsonb alcohol
        jsonb security
        jsonb agent_secu
    }

    workflow_etapes {
        uuid id PK
        uuid role_id FK
        integer ordre UK
        timestamptz created_at
    }

    signatures {
        uuid id PK
        uuid form_id FK
        uuid workflow_etape_id FK
        uuid signed_by FK
        timestamptz signed_at
        text status
        timestamptz created_at
        text role_label
    }

    messages {
        uuid id PK
        uuid form_id FK
        uuid sender_id FK
        text content
        integer form_version
        timestamptz created_at
        boolean is_system
    }

    message_reads {
        uuid message_id PK,FK
        uuid profile_id PK,FK
        timestamptz read_at
    }

    settings {
        text key PK
        jsonb value
        text description
        timestamptz updated_at
        uuid updated_by FK
    }

    notifications {
        uuid id PK
        uuid profile_id FK
        uuid form_id FK
        notification_type type
        boolean is_sent
        timestamptz send_after
        timestamptz created_at
    }

    roles ||--o{ profiles : "détiennent"
    roles ||--o{ workflow_etapes : "associe"
    profiles ||--o{ event_forms : "crée"
    event_forms ||--o{ signatures : "requiert"
    event_forms ||--o{ messages : "contient"
    event_forms ||--o{ notifications : "déclenche"
    workflow_etapes ||--o{ signatures : "définit"
    messages ||--o{ message_reads : "possède"
    profiles ||--o{ message_reads : "effectue"
    profiles ||--o{ notifications : "reçoit"
    profiles ||--o{ signatures : "appose"
    profiles ||--o{ settings : "met à jour"
```

### Enums

| Enum | Valeurs |
|---|---|
| `event_status` | `brouillon`, `soumise`, `en_revision`, `validee`, `refusee` |
| `notification_type` | `nouveau_message`, `statut_change`, `deadline_proche` |

> [!NOTE]
> **Table `notifications` :** Cette table n'est pas encore activement exploitée par l'application. Elle est prévue pour regrouper les notifications destinées aux utilisateurs afin de pouvoir les envoyer de manière groupée par email à intervalles réguliers (via un job cron ou tâche planifiée), évitant ainsi l'envoi d'emails instantanés trop fréquents.

### Triggers

| Trigger | Description |
|---|---|
| `handle_new_user` | À la création d'un utilisateur auth, crée automatiquement un profil avec le rôle par défaut (`club`) |
| `handle_fiche_soumise` | Quand une fiche passe de `brouillon` à `soumise`, crée les signatures correspondant aux étapes du workflow |

---

## 👥 Rôles & permissions

| Rôle | Droits |
|---|---|
| **`club`** | Créer/éditer ses propres fiches, soumettre, voir le calendrier (ses propres fiches + titres des autres), messagerie |
| **`direction`** | Super-admin : tout voir, signer, gérer les clubs/admins/rôles/workflow/settings |
| **Rôles personnalisés** (ex: `prevention`, `securite`) | Voir toutes les fiches soumises, signer selon le workflow, messagerie |

Les permissions sont appliquées à deux niveaux :
1. **Row Level Security (RLS)** côté PostgreSQL — les clubs ne peuvent voir que leurs propres fiches (sauf la vue publique `event_forms_public`)
2. **Vérifications côté serveur** (dans les `+page.server.ts`) — validation du rôle avant chaque action admin

---

## 🔄 Workflow de validation

Le workflow est **entièrement configurable** par la direction depuis la page Paramètres.

```mermaid
flowchart LR
    A["Club rédige<br/>(brouillon)"] --> B["Club soumet<br/>(soumise)"]
    B --> C["Étape 1 signe"]
    C --> D["Étape 2 signe"]
    D --> E["..."]
    E --> F["Direction signe<br/>(dernière étape)"]
    F --> G["✅ Validée"]

    B --> H["❌ Refusée"]
    B --> I["🔄 En révision"]
    I --> A
```

- Chaque étape est associée à un **rôle** (ex: Prévention → Service Prévention)
- Les étapes sont **séquentielles** : l'étape N ne peut signer que si toutes les étapes précédentes ont signé
- La **Direction** est toujours la dernière étape (non supprimable)
- Un refus ou une demande de révision peut intervenir à n'importe quelle étape

---

## 🗺 Structure des routes

| Route | Accès | Description |
|---|---|---|
| `/login` | Public | Page de connexion |
| `/auth/callback` | Public | Callback OAuth / magic link |
| `/auth/reset-password` | Public | Réinitialisation de mot de passe |
| `/auth/session` | Public | Endpoint API pour sync session (POST/DELETE) |
| `/dashboard` | Authentifié | Dashboard principal |
| `/calendrier` | Authentifié | Vue calendrier mensuel |
| `/fiche-event/[id]/edition` | Club (propriétaire, brouillon/en_revision) | Formulaire d'édition |
| `/fiche-event/[id]/resume` | Authentifié | Vue résumé de la fiche |
| `/fiche-event/[id]/messagerie` | Authentifié | Chat contextuel |
| `/parametres` | Authentifié | Page de paramétrage complet |
| `/mentions-legales` | Authentifié | Mentions légales |
| `/politique-de-confidentialite` | Authentifié | Politique de confidentialité |
| `/conditions-d-utilisation` | Authentifié | Conditions d'utilisation |

---

## 📝 Conventions de code

### Structure

- **Un composant = un fichier** dans `src/lib/components/`
- **Types partagés** dans `src/lib/types/app.types.ts` (ne pas modifier `database.types.ts` à la main — il est auto-généré)
- **Logique serveur** dans les fichiers `+page.server.ts` (form actions SvelteKit)
- **Pas de routes API séparées** — tout passe par les form actions et les `load` functions

### Svelte 5

- Utilise les **runes** (`$state`, `$derived`, `$effect`, `$props`) dans les composants récents
- Certains composants plus anciens utilisent encore les **stores** (`export let data`, `$:` reactive)

### Style

- **Tailwind CSS v4** avec la directive `@theme` pour définir les design tokens
- Variables CSS personnalisées pour le dark/light mode (`:root` et `:root.dark`)
- Couleurs nommées : `dark-primary`, `dark-secondary`, `dark-terciary`, `text-main`, `text-muted`, `blue-link`, etc.

### Formatage

```bash
pnpm format    # Prettier
pnpm lint      # Prettier + ESLint
```

---

## 📸 Captures d'écran

| | |
|---|---|
| **Page de connexion** ![Login](./docs/screenshots/login.png) | **Dashboard club** ![Dashboard Club](./docs/screenshots/dashboard-club.png) |
| **Dashboard admin** ![Dashboard Admin](./docs/screenshots/dashboard-admin.png) | **Formulaire d'édition** ![Edition](./docs/screenshots/edition.png) |
| **Résumé de fiche** ![Résumé](./docs/screenshots/resume.png) | **Messagerie** ![Messagerie](./docs/screenshots/messagerie.png) |
| **Calendrier** ![Calendrier](./docs/screenshots/calendrier.png) | **Page paramètres** ![Paramètres](./docs/screenshots/parametres.png) |

---

## ❓ FAQ

<details>
<summary><strong>Comment régénérer les types TypeScript de la base de données ?</strong></summary>

```bash
npx supabase gen types typescript --local > src/lib/types/database.types.ts
```

À faire après chaque modification du schéma (migration).
</details>

<details>
<summary><strong>Comment créer un compte de test en local ?</strong></summary>

Le fichier `supabase/seed.sql` crée des comptes de test lors du `supabase db reset`. Vous pouvez aussi créer des comptes manuellement via **Supabase Studio** (`http://127.0.0.1:54323` → Authentication → Users).
</details>

<details>
<summary><strong>Quel type de compte dois-je obligatoirement avoir pour le bon fonctionnement du service ?</strong></summary>

Pour le bon fonctionnement du service vous devez avoir dans votre base de données au moins un compte avec le rôle `direction` (super-admin). En effet, c'est ce compte qui permet de configurer le workflow et de gérer les autres utilisateurs.
De plus, un compte `club` vous permettra de constituer le workflow minimal (validation + direction). Sans ce compte il sera impossible de créer ou modifier des fiches event.
</details>

<details>
<summary><strong>J'ai une erreur « Invalid Refresh Token » ou « JWT expired »</strong></summary>

En dev local, cela arrive quand le container Supabase est redémarré. Solution :
1. Vide les cookies du navigateur sur `localhost:5173`
2. Se reconnecter
</details>

<details>
<summary><strong>Comment ajouter un nouveau rôle dans le workflow ?</strong></summary>

1. Connectez-vous en tant que **direction**
2. Allez dans **Paramètres** → onglet **Admins & Rôles**
3. Créez le rôle
4. Créez un compte admin avec ce rôle
5. Ajoutez l'étape dans le workflow
</details>

<details>
<summary><strong>Pourquoi le Service Worker est-il désactivé dans svelte.config.js ?</strong></summary>

Le `register: false` empêche SvelteKit d'enregistrer automatiquement le SW. L'enregistrement est fait manuellement dans `+layout.svelte` pour un contrôle plus fin (module ES, fallback offline uniquement).
</details>

---

## 📄 Licence

Projet interne — usage réservé à Polytech Nantes.

Développé par [Florian Petiot](https://github.com/florianpetiot)