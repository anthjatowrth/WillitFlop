# WillItFlop 🎮

> **Game Viability Intelligence Platform**
> Bootcamp Data Analyst 2026 — Anthony & Pierre

---

## Concept

WillItFlop répond à une question simple : *« Si ce jeu vidéo existait, aurait-il des chances de réussir commercialement ? »*

L'utilisateur décrit un jeu vidéo fictif. La plateforme analyse les données réelles du marché Steam, croise les caractéristiques du jeu avec des milliers de titres existants, et produit un **score de viabilité commerciale** accompagné d'une image et d'un synopsis générés par IA.

---

## Structure du projet

```
WillitFlop/
├── pipeline/               # Pipeline de collecte de données Python
│   ├── fetchers/           # Appels APIs (Steam, SteamSpy, Twitch)
│   ├── transformers/       # Nettoyage texte, calcul KPIs, conversion prix
│   └── loaders/            # Insertion / mise à jour PostgreSQL
│
├── dags/                   # DAG Apache Airflow (orchestration mensuelle)
│
├── dbt/                    # Modèles de transformation SQL
│   └── models/
│       ├── staging/        # Vue de staging (stg_games)
│       └── ml/             # Tables features ML
│
├── frontend/               # Application React + Vite
│   └── src/
│
├── index.html              # Page de présentation du projet
├── explorer.html           # Explorateur de données interactif
├── indie-world.html        # Dashboard — étude complète du marché
│
├── schema.sql              # Schéma PostgreSQL
└── requirements.txt        # Dépendances Python
```

---

## Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| **Collecte** | Python (requests) | APIs Steam, SteamSpy, Twitch |
| **Orchestration** | Apache Airflow | Pipeline mensuel automatisé |
| **Transformation** | dbt | Modélisation SQL, features ML |
| **Base de données** | PostgreSQL (Supabase) | Stockage central |
| **Backend** | Flask / FastAPI | API REST (déployé sur Render) |
| **Frontend** | React 19 + Vite | Interface utilisateur |
| **Graphiques** | Chart.js | Visualisations interactives |
| **Animations** | Framer Motion | Transitions UI |
| **ML** | scikit-learn, XGBoost | Scoring de viabilité |
| **Qualité** | SonarQube, OWASP | Sécurité et dette technique |

---

## Base de données

5 tables PostgreSQL :

| Table | Contenu |
|---|---|
| `games` | Métadonnées principales (prix, reviews, owners, KPIs) |
| `game_genres` | Genres associés à chaque jeu |
| `game_categories` | Catégories Steam (solo, multi, co-op…) |
| `game_tags` | Tags SteamSpy avec votes |
| `game_reviews` | Avis utilisateurs (top 100 EN/FR) |

**Critère de succès :** `owners_midpoint ≥ 100 000` ET `wilson_score ≥ 0.75`

---

## Pipeline de données

Le pipeline tourne mensuellement via Airflow :

```
SteamSpy (IDs indés)
    → Steam API (détails jeux, reviews, achievements)
    → SteamSpy API (owners, tags, playtime)
    → Twitch API (streams, viewers)
    → Calcul KPIs (Wilson score, is_successful)
    → PostgreSQL (insert / update)
    → dbt run (staging + features ML)
```

Filtres appliqués : owners ≥ 20 000 · pas de DLC · pas de VR · catégories whitelistées

---

## Installation

### Python

```bash
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
```

Créer un fichier `.env` à la racine :

```env
DB_HOST=...
DB_PORT=5432
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
STEAM_API_KEY=...
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
```

Initialiser la base :

```bash
python -c "from pipeline.db import init_schema; init_schema()"
```

Lancer le pipeline manuellement :

```bash
python -m pipeline.run
```

### Frontend (React)

```bash
cd frontend
npm install       # installe les dépendances (node_modules/)
npm run dev       # dev server → http://localhost:5173
npm run build     # build de production
```

### dbt

```bash
cd dbt
dbt run           # exécute les modèles staging + ml
dbt test          # lance les tests de qualité
```

---

## Pages web

| Page | Description |
|---|---|
| `index.html` | Présentation du projet (fiche bootcamp) |
| `explorer.html` | Explorateur interactif drill-down (Genres / Prix / Années / Facteurs) |
| `indie-world.html` | Dashboard complet — étude globale du marché indie |

---

## Déploiement cible

| Service | Usage |
|---|---|
| **Supabase** | Base PostgreSQL hébergée |
| **Render** | Backend Flask/FastAPI + pipeline Airflow |
| **Vercel / Netlify** | Frontend React (build statique) |

---

## Équipe

| Membre | Rôle |
|---|---|
| **Anthony** | Pipeline, BDD, frontend, intégration IA |
| **Pierre** | Pipeline, BDD, modèles ML, visualisations |

---

*Bootcamp Data Analyst 2026*
