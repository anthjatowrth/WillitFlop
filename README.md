# WillItFlop

**Predict whether an indie Steam game will be a commercial hit or a flop — before it launches.**

WillItFlop is a full-stack data project that combines a custom ETL pipeline, machine learning, and an interactive web application to analyze and predict the commercial success of indie games on Steam. Built as a capstone project during a Data Analyst bootcamp at [Wild Code School](https://www.wildcodeschool.com/).

> 🎮 **[Try the live app →](https://willit-flop.vercel.app/)** &nbsp;·&nbsp; 📊 **17,000+ games analyzed** &nbsp;·&nbsp; 🤖 **XGBoost classifier · ROC-AUC 0.83**

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Pipeline (ETL)](#data-pipeline-etl)
- [Machine Learning](#machine-learning)
- [Backend API](#backend-api)
- [Frontend](#frontend)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Design Decisions](#design-decisions)
- [License](#license)

---

## Overview

The Steam store receives thousands of indie game releases each year. Most of them never find an audience. **WillItFlop** helps indie developers and enthusiasts understand *why* some games succeed and others don't, by:

1. **Collecting data** from Steam, SteamSpy, and Twitch via an automated ETL pipeline
2. **Engineering features** with dbt (tags, genres, categories, pricing, review sentiment, playtime…)
3. **Training a classifier** (XGBoost) to predict commercial success (>10k estimated owners)
4. **Serving predictions** through a FastAPI backend with real-time translation (DeepL)
5. **Visualizing insights** in a React dashboard with market analytics, leaderboards, and a game database

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Steam API   │     │  SteamSpy    │     │  Twitch API  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────┬───────┘────────────────────┘
                    ▼
          ┌─────────────────┐
          │  ETL Pipeline   │  Prefect · GitHub Actions
          │  (pipeline/)    │  Weekly schedule (cron)
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │  PostgreSQL     │  Supabase
          │  (schema.sql)   │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │  dbt Models     │  staging → ml features
          │  (dbt/)         │  staging → sentiment marts
          └────────┬────────┘
                   ▼
     ┌─────────────┴──────────────┐
     ▼                            ▼
┌──────────┐             ┌───────────────┐
│ ML Train │  XGBoost    │  FastAPI      │  Render
│ (ml/)    │  CI retrain │  (api/)       │
└──────────┘             └───────┬───────┘
                                 ▼
                        ┌───────────────┐
                        │  React App    │  Vercel
                        │  (frontend/)  │
                        └───────────────┘
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Data Collection** | Python, Steam Web API, SteamSpy API, Twitch API, BeautifulSoup |
| **Orchestration** | Prefect 3, GitHub Actions (CI/CD) |
| **Database** | PostgreSQL (Supabase), PostgREST |
| **Transformation** | dbt (staging models, ML feature tables, sentiment marts) |
| **Machine Learning** | scikit-learn, XGBoost, VADER Sentiment |
| **Backend API** | FastAPI, Pydantic, cachetools (TTL cache), httpx |
| **Frontend** | React 19, Vite, Tailwind CSS 4, Recharts, Framer Motion, shadcn/ui |
| **Deployment** | Vercel (frontend), Render (API), Supabase (DB), Prefect Cloud |

---

## Project Structure

```
WillitFlop/
├── api/                    # FastAPI backend
│   ├── main.py             #   App entrypoint, CORS, routes
│   ├── routers/            #   Route modules (games, analytics, sentiment, leaderboard)
│   ├── schemas.py          #   Pydantic request/response models
│   └── db.py               #   PostgreSQL connection helper
│
├── ml/                     # Machine learning module
│   ├── config.py           #   Feature definitions, hyperparameters, thresholds
│   ├── train.py            #   Training script (cross-validation + fit)
│   ├── predict.py          #   Inference with loaded artifacts
│   ├── preprocessing/      #   sklearn ColumnTransformer pipeline
│   ├── data/               #   Feature loader (SQL → DataFrame)
│   └── artifacts/          #   Serialized model + preprocessor (auto-committed by CI)
│
├── pipeline/               # ETL pipeline
│   ├── flow.py             #   Prefect flow (orchestration DAG)
│   ├── run.py              #   Execution logic (collect, update recent/old games)
│   ├── fetchers/           #   API clients (Steam, SteamSpy, Twitch)
│   ├── transformers/       #   Data cleaning (prices, text, KPIs)
│   ├── loaders/            #   PostgreSQL upsert logic
│   └── enrich_sentiment.py #   VADER sentiment scoring on reviews
│
├── dbt/                    # dbt transformation layer
│   ├── models/
│   │   ├── staging/        #     stg_games (cleaned base table)
│   │   ├── ml/             #     ml_features, ml_tags, ml_genres, ml_categories, ml_reviews
│   │   └── marts/          #     sentiment_analysis, sentiment_by_genre, top_sentiment_words
│   └── dbt_project.yml
│
├── frontend/               # React + Vite SPA
│   └── src/
│       ├── pages/          #   Home, Market, Database, GameDetail, Leaderboard, MiniGame
│       ├── components/     #   UI components (market charts, game cards, leaderboard…)
│       ├── hooks/          #   Custom hooks (useGameDatabase, useTendances, useTagAnalytics)
│       ├── api/            #   Supabase client
│       └── utils/          #   Scoring helpers, Groq AI review, DeepL translation, prompts
│
├── supabase/               # Database extensions
│   ├── functions.sql       #   PostgreSQL RPC functions (aggregation, search)
│   └── indexes.sql         #   Performance indexes (B-tree, GIN trigram)
│
├── migrations/             # Incremental schema changes
├── .github/workflows/      # CI/CD
│   ├── etl.yml             #   ETL pipeline runner (Prefect worker)
│   └── train.yml           #   Model retraining (auto-commit artifacts)
│
├── schema.sql              # Full database schema
├── prefect.yaml            # Prefect Cloud deployment config
├── render.yaml             # Render deploy config (API)
├── requirements.txt        # Dev environment snapshot (documented audit)
├── requirements-api.txt    # API production dependencies (11 packages)
└── requirements-etl.txt    # ETL/CI dependencies
```

---

## Data Pipeline (ETL)

The pipeline runs weekly via **Prefect Cloud** (triggered by GitHub Actions) and follows five steps:

1. **Collect new games** — Fetches qualifying indie games from SteamSpy, enriches with Steam API metadata (descriptions, tags, screenshots, trailers, achievements) and Twitch streaming data
2. **Fix null prices** — Imputes missing `price_eur` values using the median price of paid games
3. **Update recent games** — Refreshes ownership estimates, reviews, Twitch stats, and KPIs for games released in the past two years
4. **Update old games** — Same refresh for older catalog entries
5. **Run dbt** — Rebuilds the `ml_features` table and sentiment analysis marts

Data sources: **Steam Web API** (game metadata, reviews), **SteamSpy** (ownership estimates, playtime), **Twitch API** (streaming presence).

---

## Machine Learning

### Model

**XGBoost binary classifier** predicting whether an indie game will be commercially successful (≈ top 17% by estimated owners).

### Features

| Group | Features | Preprocessing |
|---|---|---|
| Numeric | `price_eur` (log-transformed), `achievement_count`, `nb_supported_languages` | Passthrough |
| Boolean | `is_free`, `is_early_access` | Passthrough |
| Multi-label | `tags`, `genres`, `categories` | MultiLabelBinarizer (weighted repetition) |
| Text | `short_description_clean` | TF-IDF (200 features) |

Feature weighting: tags ×3, genres ×2, categories ×2 — prioritizing the game's identity over marketing descriptions.

### Performance (5-fold stratified CV on 13,600 games)

| Metric | Score |
|---|---|
| **ROC-AUC** | 0.831 ± 0.008 |
| **F1** | 0.529 ± 0.012 |
| **Precision** | 0.452 ± 0.013 |
| **Recall** | 0.638 ± 0.014 |

Sample weighting by game age (newer games have less reliable labels) and dynamic `scale_pos_weight` for class imbalance handling.

### CI/CD

Model retraining is triggered automatically when `ml/config.py`, preprocessing code, or dbt ML models change. The GitHub Actions workflow trains the model and auto-commits the updated artifacts (`model.pkl`, `preprocessor.pkl`, metrics JSON).

---

## Backend API

**FastAPI** application deployed on Render, serving:

| Endpoint | Description |
|---|---|
| `POST /predict` | Run the ML model on user-provided game features |
| `GET /api/games` | Paginated game database with search and filters |
| `GET /api/market/*` | Market analytics (trends, tag analytics) |
| `GET /api/sentiment/*` | Sentiment analysis data |
| `GET /api/leaderboard/*` | Top/flop game rankings |
| `POST /translate` | DeepL translation proxy (EN → FR) |
| `GET /health` | Health check (used by UptimeRobot keep-alive) |

Features: TTL caching with `cachetools`, async HTTP calls, PostgreSQL connection pooling.

---

## Frontend

React 19 SPA with six main pages:

- **Home** — Project overview, prediction demo, how-it-works section
- **Market** — Market analytics dashboard (genre distribution, growth charts, sentiment analysis, tactical alerts)
- **Database** — Searchable game catalog with filters, grid/list views, and skeleton loading
- **Game Detail** — Individual game page with screenshots, trailer, Metacritic-style score, community reviews
- **Leaderboard** — Top successes and biggest flops ranked by composite score
- **Mini-Game** — Interactive games (translation blitz, dev slider, language quiz, slot machine)

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database (or a Supabase project)

### Backend

```bash
# Clone the repository
git clone https://github.com/anthjatowrth/WillitFlop.git
cd WillitFlop

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install API dependencies
pip install -r requirements-api.txt

# Configure environment variables (see below)
cp .env.example .env  # then edit with your values

# Run the API
uvicorn api.main:app --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create frontend/.env with:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
#   VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

### ETL Pipeline (optional)

```bash
pip install -r requirements-etl.txt
PYTHONPATH=. python -m pipeline.flow
```

### Model Training (optional)

```bash
pip install psycopg2-binary pandas scikit-learn xgboost python-dotenv
PYTHONPATH=. python -m ml.train
```

---

## Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | API, Pipeline, ML, dbt | PostgreSQL connection |
| `CORS_ORIGINS` | API | Allowed CORS origins (comma-separated) |
| `DEEPL_API_KEY` | API | DeepL Free API key for translations |
| `STEAM_API_KEY` | Pipeline | Steam Web API key |
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | Pipeline | Twitch API credentials |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase project connection |
| `VITE_API_URL` | Frontend | FastAPI backend URL |
| `PREFECT_API_KEY`, `PREFECT_API_URL` | CI (ETL) | Prefect Cloud credentials |

---

## Deployment

| Component | Platform | Config |
|---|---|---|
| Frontend | **Vercel** | `frontend/vercel.json` — auto-deploy on push |
| API | **Render** | `render.yaml` — Python web service, auto-build |
| Database | **Supabase** | PostgreSQL + PostgREST + Storage |
| ETL | **GitHub Actions** + **Prefect Cloud** | `etl.yml` — scheduled + manual trigger |
| ML Training | **GitHub Actions** | `train.yml` — triggered on config/feature changes |

---

## Design Decisions

- **ML artifacts committed to git**: `model.pkl` and `preprocessor.pkl` are auto-committed by CI after each retraining. This keeps the API deployment self-contained (Render builds directly from the repo) without needing an external artifact store. For a production system at scale, these would live in S3/GCS with versioning.

- **Three requirements files**: `requirements-api.txt` (11 packages, production API), `requirements-etl.txt` (CI pipeline), and `requirements.txt` (full dev snapshot, documented audit of 67 removed packages). This avoids bloating deployments while maintaining reproducibility.

- **Feature weighting via column repetition**: Tags ×3, genres ×2, categories ×2 in the transformed matrix. For tree-based models, repeating columns increases their sampling probability during `colsample_bytree`, effectively up-weighting feature groups without altering split thresholds.

- **Sample weighting by game age**: Games released less than a year ago have unreliable ownership estimates. A linear ramp (`game_age_days / 365`, capped at 1.0) reduces their influence during training.

- **dbt profiles.yml committed**: Normally user-specific, but here it uses `env_var()` exclusively (no hardcoded credentials), making it safe to commit and CI-compatible.

---

## License

This project was built for educational purposes as part of a bootcamp capstone at [Wild Code School](https://www.wildcodeschool.com/). All data is sourced from publicly available APIs (Steam, SteamSpy, Twitch).
