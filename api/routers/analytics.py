"""
Market analytics endpoints.

Centralise les appels Supabase directs depuis useTendances.js et useTagAnalytics.js.
ÉTAPE 2 : agrégations effectuées côté base de données via des fonctions SQL
          (supabase/functions.sql) — seuls les résultats agrégés transitent sur le réseau.
ÉTAPE 4 : cache TTL 300 s pour les agrégats quasi-statiques.
ÉTAPE 6 : appels DB parallélisés avec asyncio.gather + asyncio.to_thread.
          Les 15 appels séquentiels de get_tendances sont regroupés en 5 connexions
          concurrentes (3 requêtes/connexion) pour limiter la charge sur le pool Supabase.

GET /api/market/tendances      → toutes les statistiques marché (genres, tags, prix…)
GET /api/market/tag-analytics  → taux de succès par ambiance / gameplay / visuel / caméra
"""

import asyncio

import psycopg2.extras
from cachetools import TTLCache
from fastapi import APIRouter

from api.db import get_conn
from api.utils import serialize_row

# Cache TTL 300 s — données mises à jour quotidiennement par les pipelines dbt/ETL.
_cache: TTLCache = TTLCache(maxsize=10, ttl=300)

router = APIRouter(prefix="/api/market", tags=["market"])

MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]

# Tags suivis dans useTagAnalytics.js (transmis en paramètre à get_tag_success_rates)
_AMBIANCE = [
    "Dark", "Mature", "Cozy", "Wholesome", "Sci-fi", "Futuristic",
    "Fantasy", "Medieval", "Cyberpunk", "Steampunk", "Post-apocalyptic",
    "Comedy", "Parody", "Horror", "Psychological", "Historical", "Anime",
]
_GAMEPLAY = [
    "Rogue-like", "Rogue-lite", "Open World", "Story Rich", "Narrative",
    "Crafting", "Survival", "Turn-Based", "Turn-Based Strategy",
    "Fast-Paced", "Puzzle", "Deckbuilding", "Card Game",
    "Souls-like", "Difficult", "Sandbox", "Tower Defense", "Metroidvania",
    "Resource Management", "Action RPG", "Logic",
]
_VISUAL = [
    "Pixel Graphics", "2D", "3D", "Retro", "Colorful",
    "Cartoon", "Realistic", "Low-poly", "Hand-drawn", "Minimalist",
]
_CAMERA = [
    "First-Person", "FPS", "Third-Person", "Isometric",
    "Side Scroller", "2D Platformer", "Top-Down", "Point & Click",
]
_ALL_TRACKED = list(set(_AMBIANCE + _GAMEPLAY + _VISUAL + _CAMERA))


def _truncate(name: str, max_len: int = 18) -> str:
    return name[:max_len] + "…" if len(name) > max_len else name


def _truncate22(name: str) -> str:
    return name[:22] + "…" if len(name) > 22 else name


# ── Fonctions synchrones de fetch groupé (une connexion par groupe) ────────────
# Chaque groupe ouvre sa propre connexion psycopg2 et exécute 3–4 requêtes
# séquentielles. Les groupes s'exécutent en parallèle via asyncio.to_thread.

def _sync_group1():
    """Scalaires marché + jeux par année + saisonnalité."""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM get_market_summary()")
        summary = dict(cur.fetchone())
        cur.execute("SELECT * FROM get_games_per_year()")
        games_per_year = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_release_by_month()")
        release = [dict(r) for r in cur.fetchall()]
        cur.close()
    finally:
        conn.close()
    return summary, games_per_year, release


def _sync_group2():
    """Distribution et taux de succès des genres + catégories."""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM get_genre_distribution()")
        genre_dist = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_genre_success_rates(5)")
        genre_success = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_category_distribution(15)")
        cat_dist = [dict(r) for r in cur.fetchall()]
        cur.close()
    finally:
        conn.close()
    return genre_dist, genre_success, cat_dist


def _sync_group3():
    """Top tags + distributions prix."""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM get_top_tags(30)")
        tag_dist = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_price_distribution()")
        price_dist = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_price_success_rates()")
        price_success = [dict(r) for r in cur.fetchall()]
        cur.close()
    finally:
        conn.close()
    return tag_dist, price_dist, price_success


def _sync_group4():
    """Distributions Metacritic + stats Twitch."""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM get_metacritic_distribution()")
        meta_dist = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_metacritic_success_rates()")
        meta_success = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_twitch_summary()")
        twitch = dict(cur.fetchone())
        cur.execute("SELECT * FROM get_twitch_by_genre(10)")
        twitch_genre = [dict(r) for r in cur.fetchall()]
        cur.close()
    finally:
        conn.close()
    return meta_dist, meta_success, twitch, twitch_genre


def _sync_group5():
    """Top jeux + distributions playtime et achievements."""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM get_top_games(25)")
        top_games = [serialize_row(dict(r)) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_playtime_distribution()")
        playtime = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_achievement_distribution()")
        achievement = [dict(r) for r in cur.fetchall()]
        cur.close()
    finally:
        conn.close()
    return top_games, playtime, achievement


# ── /api/market/tendances ──────────────────────────────────────────────────────

@router.get("/tendances")
async def get_tendances():
    """
    Remplace les 5 appels Supabase full-scan (useTendances.js).
    ÉTAPE 6 : 15 appels SQL regroupés en 5 connexions parallèles via asyncio.gather.
    Résultat mis en cache 300 s.
    """
    if "tendances" in _cache:
        return _cache["tendances"]

    # Exécution parallèle des 5 groupes — chacun dans son propre thread/connexion
    (s, games_per_year_raw, release_raw), \
    (genre_dist_raw, genre_success_raw, cat_dist_raw), \
    (tag_dist_raw, price_dist_raw, price_success_raw), \
    (meta_dist_raw, meta_success_raw, tw, twitch_genre_raw), \
    (top_games_raw, playtime_raw, achievement_raw) = await asyncio.gather(
        asyncio.to_thread(_sync_group1),
        asyncio.to_thread(_sync_group2),
        asyncio.to_thread(_sync_group3),
        asyncio.to_thread(_sync_group4),
        asyncio.to_thread(_sync_group5),
    )

    # ── Formatage vers la structure attendue par le frontend ───────────────
    genre_distribution = [{"name": r["genre_name"], "value": r["game_count"]} for r in genre_dist_raw]

    genre_success_rate = [
        {
            "name":        _truncate(r["genre_name"]),
            "fullName":    r["genre_name"],
            "successRate": r["success_rate"],
            "total":       r["game_count"],
        }
        for r in genre_success_raw
    ][:12]

    category_distribution = [{"name": r["category_name"], "value": r["game_count"]} for r in cat_dist_raw]
    tag_distribution      = [{"name": r["tag_name"],      "value": r["total_votes"]} for r in tag_dist_raw]

    games_per_year = [
        {"year": r["year"], "count": r["game_count"], "successRate": r["success_rate"]}
        for r in games_per_year_raw
    ]

    month_map = {r["month_idx"]: r for r in release_raw}
    release_by_month = [
        {
            "month":       MONTH_LABELS[i],
            "count":       month_map.get(i, {}).get("game_count", 0),
            "successRate": month_map.get(i, {}).get("success_rate", None),
        }
        for i in range(12)
    ]

    price_distribution      = [{"name": r["bucket"], "value": r["game_count"]}                                      for r in price_dist_raw]
    price_success_rate      = [{"name": r["bucket"], "successRate": r["success_rate"], "total": r["total_count"]}   for r in price_success_raw]
    metacritic_distribution = [{"name": r["bucket"], "value": r["game_count"]}                                      for r in meta_dist_raw]
    meta_success_rate       = [{"name": r["bucket"], "successRate": r["success_rate"], "total": r["total_count"]}   for r in meta_success_raw]

    twitch_by_genre = [
        {"name": r["genre_name"], "viewers": r["total_viewers"], "games": r["game_count"]}
        for r in twitch_genre_raw
    ]

    playtime_distribution    = [{"name": r["bucket"], "count": r["game_count"], "successRate": r["success_rate"]} for r in playtime_raw]
    achievement_distribution = [{"name": r["bucket"], "count": r["game_count"], "successRate": r["success_rate"]} for r in achievement_raw]

    free_paid = [
        {"name": "Gratuits", "value": s["free_count"]},
        {"name": "Payants",  "value": s["paid_count"]},
    ]
    success_distribution = [
        {"name": "Réussis", "value": s["success_count"], "color": "#007A4C"},
        {"name": "Échecs",  "value": s["fail_count"],    "color": "#E8005A"},
    ]

    result = {
        "totalGames":             s["total_games"],
        "genreDistribution":      genre_distribution[:20],
        "genreTreemap":           [{"name": g["name"], "size": g["value"]} for g in genre_distribution[:25]],
        "categoryDistribution":   category_distribution,
        "tagDistribution":        tag_distribution,
        "gamesPerYear":           games_per_year,
        "freePaid":               free_paid,
        "successDistribution":    success_distribution,
        "successCount":           s["success_count"],
        "failCount":              s["fail_count"],
        "avgMetacritic":          s["avg_metacritic"],
        "genreSuccessRate":       genre_success_rate,
        "topGames":               top_games_raw,
        "priceDistribution":      price_distribution,
        "metacriticDistribution": metacritic_distribution,
        "priceSuccessRate":       price_success_rate,
        "metacSuccessRate":       meta_success_rate,
        "sampleSize":             s["total_games"],
        "uniqueGenres":           s["unique_genres"],
        "uniqueCategories":       s["unique_categories"],
        "medianMetacritic":       s["median_metacritic"],
        "pctWithMetacritic":      s["pct_with_metacritic"],
        "avgPricePaid":           float(s["avg_price_paid"])    if s["avg_price_paid"]    else 0,
        "medianPricePaid":        float(s["median_price_paid"]) if s["median_price_paid"] else 0,
        "releaseByMonth":         release_by_month,
        "twitchCoverage":         round(tw["twitch_count"] / s["total_games"] * 100) if s["total_games"] else 0,
        "twitchTotalViewers":     tw["total_viewers"],
        "twitchTotalStreams":      tw["total_streams"],
        "twitchSuccessRate":      tw["twitch_success_rate"],
        "nonTwitchSuccessRate":   tw["non_twitch_success_rate"],
        "twitchByGenre":          twitch_by_genre,
        "twitchFetchedAt":        tw["latest_fetched_at"],
        "twitchCount":            tw["twitch_count"],
        "playtimeDistribution":   playtime_distribution,
        "achievementDistribution": achievement_distribution,
    }
    _cache["tendances"] = result
    return result


# ── Fonctions synchrones pour tag-analytics ────────────────────────────────────

def _sync_tag_counts(all_tracked: list) -> tuple:
    """Compte total jeux + taux de succès par tag."""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT COUNT(*) AS n FROM games")
        sample_size = cur.fetchone()["n"]
        cur.execute("SELECT * FROM get_tag_success_rates(%s, 20)", (all_tracked,))
        tags = {r["tag_name"]: r for r in cur.fetchall()}
        cur.close()
    finally:
        conn.close()
    return sample_size, tags


def _sync_genre_cats() -> tuple:
    """Taux de succès par genre et par catégorie."""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM get_genre_success_rates(20)")
        genres = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM get_category_success_rates(20)")
        cats = [dict(r) for r in cur.fetchall()]
        cur.close()
    finally:
        conn.close()
    return genres, cats


# ── /api/market/tag-analytics ──────────────────────────────────────────────────

@router.get("/tag-analytics")
async def get_tag_analytics():
    """
    Remplace les 4 appels Supabase full-scan (useTagAnalytics.js).
    ÉTAPE 6 : 4 appels SQL regroupés en 2 connexions parallèles via asyncio.gather.
    Résultat mis en cache 300 s.
    """
    if "tag_analytics" in _cache:
        return _cache["tag_analytics"]

    (sample_size, tags_raw), (genres_raw, cats_raw) = await asyncio.gather(
        asyncio.to_thread(_sync_tag_counts, _ALL_TRACKED),
        asyncio.to_thread(_sync_genre_cats),
    )

    ambiance_set = set(_AMBIANCE)
    gameplay_set = set(_GAMEPLAY)
    visual_set   = set(_VISUAL)
    camera_set   = set(_CAMERA)

    def _fmt_tags(tag_set: set, limit: int) -> list[dict]:
        return [
            {
                "name":        _truncate22(tn),
                "fullName":    tn,
                "count":       tags_raw[tn]["game_count"],
                "successRate": tags_raw[tn]["success_rate"],
            }
            for tn in tag_set if tn in tags_raw
        ][:limit]

    def _fmt_genre(limit: int) -> list[dict]:
        return [
            {
                "name":        _truncate22(r["genre_name"]),
                "fullName":    r["genre_name"],
                "count":       r["game_count"],
                "successRate": r["success_rate"],
            }
            for r in genres_raw
        ][:limit]

    def _fmt_cats(limit: int) -> list[dict]:
        return [
            {
                "name":        _truncate22(r["category_name"]),
                "fullName":    r["category_name"],
                "count":       r["game_count"],
                "successRate": r["success_rate"],
            }
            for r in cats_raw
        ][:limit]

    result = {
        "sampleSize": sample_size,
        "genre":    _fmt_genre(12),
        "ambiance": _fmt_tags(ambiance_set, 14),
        "gameplay": _fmt_tags(gameplay_set, 14),
        "visual":   _fmt_tags(visual_set,   10),
        "camera":   _fmt_tags(camera_set,    8),
        "playmode": _fmt_cats(10),
    }
    _cache["tag_analytics"] = result
    return result
