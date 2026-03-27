"""
Games endpoints.

Centralise les appels Supabase directs depuis :
  - GameDatabasePage.jsx  (count query)
  - useGameDatabase.js    (liste paginée avec filtres)
  - GameDetailPage.jsx    (fiche jeu + relations)

GET /api/games/count         → nombre total de jeux
GET /api/games               → liste paginée avec filtres (genre, année, search…)
GET /api/games/{app_id}      → fiche complète d'un jeu (avec genres, tags, catégories)
"""

import os

import psycopg2
import psycopg2.extras
from cachetools import TTLCache
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query

load_dotenv()

router = APIRouter(prefix="/api/games", tags=["games"])

# TTL 300 s pour les données peu volatiles (count total, fiches jeux).
# TTL 60 s pour les listes paginées (filtres variés, données plus fraîches).
_cache_slow: TTLCache = TTLCache(maxsize=200, ttl=300)
_cache_fast: TTLCache = TTLCache(maxsize=500, ttl=60)


def _get_conn():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


def _serialize(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _serialize_row(row: dict) -> dict:
    return {k: _serialize(v) for k, v in row.items()}


# ── GET /api/games/count ───────────────────────────────────────────────────────

@router.get("/count")
def games_count():
    """
    Remplace supabase.from('games').select('*', { count: 'exact', head: true })
    dans GameDatabasePage.jsx (l.65). Mis en cache 300 s.
    """
    if "count" in _cache_slow:
        return _cache_slow["count"]
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM games")
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    result = {"count": count}
    _cache_slow["count"] = result
    return result


# ── GET /api/games ─────────────────────────────────────────────────────────────

@router.get("")
def list_games(
    page: int = Query(1, ge=1),
    page_size: int = Query(80, ge=1, le=200, alias="pageSize"),
    genre: str = Query(""),
    year: str = Query(""),
    search: str = Query(""),
    play_mode: str = Query("", alias="playMode"),
    letter_filter: str = Query("", alias="letterFilter"),
    sort_by: str = Query("alpha", alias="sortBy"),
):
    """
    Remplace l'appel Supabase de useGameDatabase.js (liste paginée avec filtres).
    Retourne { data: [...games], count: total } — même structure que PostgREST.
    Mis en cache 60 s par combinaison de filtres (clé = tous les paramètres).
    """
    cache_key = f"games:{page}:{page_size}:{genre}:{year}:{search}:{play_mode}:{letter_filter}:{sort_by}"
    if cache_key in _cache_fast:
        return _cache_fast[cache_key]

    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    from_idx = (page - 1) * page_size

    # ── Construction dynamique des JOINs et conditions de filtre ──────────
    joins: list[str] = []
    conditions: list[str] = []
    params: list = []

    if genre:
        # INNER JOIN pour filtrer uniquement les jeux du genre voulu
        joins.append("JOIN game_genres gf ON gf.app_id = g.app_id AND gf.genre_name = %s")
        params.append(genre)

    if play_mode:
        if play_mode == "solo":
            joins.append("JOIN game_categories gcf ON gcf.app_id = g.app_id AND LOWER(gcf.category_name) = 'single-player'")
        elif play_mode == "multi":
            joins.append("JOIN game_categories gcf ON gcf.app_id = g.app_id AND LOWER(gcf.category_name) = 'multi-player'")
        elif play_mode == "coop":
            joins.append("JOIN game_categories gcf ON gcf.app_id = g.app_id AND gcf.category_name ILIKE '%%co-op%%'")

    if year:
        conditions.append("g.release_date BETWEEN %s::date AND %s::date")
        params.extend([f"{year}-01-01", f"{year}-12-31"])

    if search.strip():
        conditions.append("g.name ILIKE %s")
        params.append(f"%{search.strip()}%")

    if letter_filter:
        if letter_filter == "#":
            conditions.append("g.name ~ '^[0-9]'")
        else:
            conditions.append("g.name ILIKE %s")
            params.append(f"{letter_filter}%")

    join_sql  = " ".join(joins)
    where_sql = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    # ── Tri ────────────────────────────────────────────────────────────────
    if sort_by == "owners":
        sort_col, sort_dir = "g.owners_midpoint", "DESC NULLS LAST"
    elif sort_by == "metacritic":
        sort_col, sort_dir = "g.metacritic_score", "DESC NULLS LAST"
    else:
        sort_col, sort_dir = "g.name", "ASC"

    # ── Count total (DISTINCT pour éviter doublons issus des JOINs) ────────
    count_sql = f"SELECT COUNT(DISTINCT g.app_id) AS cnt FROM games g {join_sql} {where_sql}"
    cur.execute(count_sql, params)
    total_count = cur.fetchone()["cnt"]

    # ── app_ids paginés et triés (CTE pour découpler filtre et tri) ────────
    ids_sql = f"""
        SELECT g.app_id
        FROM games g {join_sql} {where_sql}
        GROUP BY g.app_id, {sort_col}
        ORDER BY {sort_col} {sort_dir}
        LIMIT %s OFFSET %s
    """
    cur.execute(ids_sql, params + [page_size, from_idx])
    app_ids = [r["app_id"] for r in cur.fetchall()]

    if not app_ids:
        cur.close()
        conn.close()
        return {"data": [], "count": total_count}

    # ── Données complètes pour les app_ids paginés ─────────────────────────
    # Sous-requêtes corélées pour game_genres et game_categories :
    # retourne des tableaux JSON identiques au format PostgREST.
    data_sql = f"""
        SELECT
            g.app_id, g.name, g.metacritic_score, g.header_image,
            g.release_date, g.fetched_at, g.is_successful,
            (
                SELECT COALESCE(
                    JSON_AGG(JSONB_BUILD_OBJECT('genre_name', gg.genre_name)),
                    '[]'::json
                )
                FROM game_genres gg WHERE gg.app_id = g.app_id
            ) AS game_genres,
            (
                SELECT COALESCE(
                    JSON_AGG(JSONB_BUILD_OBJECT('category_name', gc.category_name)),
                    '[]'::json
                )
                FROM game_categories gc WHERE gc.app_id = g.app_id
            ) AS game_categories
        FROM games g
        WHERE g.app_id = ANY(%s)
        ORDER BY {sort_col} {sort_dir}
    """
    cur.execute(data_sql, (app_ids,))
    rows = cur.fetchall()

    cur.close()
    conn.close()

    data = [_serialize_row(dict(r)) for r in rows]
    result = {"data": data, "count": total_count}
    _cache_fast[cache_key] = result
    return result


# ── GET /api/games/{app_id} ────────────────────────────────────────────────────

@router.get("/{app_id}")
def get_game(app_id: int):
    """
    Remplace l'appel Supabase de GameDetailPage.jsx (fiche jeu avec jointures).
    Retourne la même structure que PostgREST : game_genres, game_tags, game_categories
    sous forme de tableaux imbriqués. Mis en cache 300 s par app_id.
    """
    cache_key = f"game:{app_id}"
    if cache_key in _cache_slow:
        return _cache_slow[cache_key]

    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("SELECT * FROM games WHERE app_id = %s", (app_id,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Game not found")

    game = _serialize_row(dict(row))

    cur.execute("SELECT genre_name FROM game_genres WHERE app_id = %s", (app_id,))
    game["game_genres"] = [{"genre_name": r["genre_name"]} for r in cur.fetchall()]

    cur.execute("SELECT tag_name, votes FROM game_tags WHERE app_id = %s", (app_id,))
    game["game_tags"] = [{"tag_name": r["tag_name"], "votes": r["votes"]} for r in cur.fetchall()]

    cur.execute("SELECT category_name FROM game_categories WHERE app_id = %s", (app_id,))
    game["game_categories"] = [{"category_name": r["category_name"]} for r in cur.fetchall()]

    cur.close()
    conn.close()
    _cache_slow[cache_key] = game
    return game
