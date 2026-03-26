"""
Leaderboard endpoints.

Centralise les appels Supabase directs depuis frontend/src/api/leaderboard.js.
Les opérations Storage (upload jaquette) restent côté frontend via le SDK Supabase JS
car elles ne passent pas par la base de données relationnelle.

GET  /api/leaderboard/eligible  → vérifie si un jeu se qualifie dans le top 5
GET  /api/leaderboard           → récupère le leaderboard du mois en cours
POST /api/leaderboard           → insère ou remplace une entrée dans le leaderboard
"""

from datetime import date

import psycopg2.extras
from cachetools import TTLCache
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from api.db import get_conn

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])

# TTL 60 s — le leaderboard change peu en cours de journée mais doit rester frais.
# Le cache est invalidé à chaque POST (nouvelle entrée).
_cache: TTLCache = TTLCache(maxsize=10, ttl=60)


def _current_period() -> str:
    """Retourne la période courante au format 'YYYY-MM' (même logique que le JS)."""
    today = date.today()
    return f"{today.year}-{today.month:02d}"


def _entry_to_card(entry: dict, index: int) -> dict:
    """Transforme une ligne DB en format GameRankCard (miroir de entryToCard() en JS)."""
    rank = index + 1
    subtitle_parts = [p for p in [entry.get("genre"), entry.get("universe")] if p]
    tags = [t for t in [entry.get("game_mode"), entry.get("core_mechanic")] if t]
    score = entry.get("metacritic_score") or round((entry.get("proba") or 0) * 100)
    return {
        "rank":          rank,
        "title":         entry["game_name"],
        "subtitle":      " · ".join(subtitle_parts) if subtitle_parts else None,
        "score":         score,
        "image":         entry.get("cover_url"),
        "tags":          tags if tags else None,
        "creator":       entry.get("creator_name"),
        "proba":         entry.get("proba"),
        "pricing":       entry.get("pricing"),
        "verdict":       entry.get("verdict"),
        "genre":         entry.get("genre"),
        "universe":      entry.get("universe"),
        "metacritic":    entry.get("metacritic_score"),
        "review_text":   entry.get("review_text"),
        "review_source": entry.get("review_source"),
    }


# ── GET /api/leaderboard/eligible ─────────────────────────────────────────────

@router.get("/eligible")
def check_eligible(
    verdict: str = Query(...),
    proba: float = Query(...),
):
    """
    Remplace checkLeaderboardEligibility() dans leaderboard.js.
    Vérifie si un jeu se qualifie dans le Top 5 sans rien insérer.
    """
    period = _current_period()
    ascending = verdict == "Top!"
    order = "ASC" if ascending else "DESC"

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, proba FROM leaderboard_entries WHERE period = %s AND verdict = %s ORDER BY proba {order} LIMIT 5",
        (period, verdict),
    )
    existing = cur.fetchall()
    cur.close()
    conn.close()

    if len(existing) < 5:
        return {"eligible": True}

    worst = existing[0]["proba"]
    eligible = proba > worst if verdict == "Top!" else proba < worst
    return {"eligible": eligible}


# ── GET /api/leaderboard ───────────────────────────────────────────────────────

@router.get("")
def fetch_leaderboard():
    """
    Remplace fetchLeaderboard() dans leaderboard.js.
    Retourne { success: [...], flop: [...] } pour le mois en cours.
    Mis en cache 60 s — invalidé automatiquement après chaque POST.
    """
    cache_key = f"leaderboard:{_current_period()}"
    if cache_key in _cache:
        return _cache[cache_key]

    period = _current_period()
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute(
        "SELECT * FROM leaderboard_entries WHERE period = %s AND verdict = 'Top!' ORDER BY proba DESC LIMIT 5",
        (period,),
    )
    success_rows = cur.fetchall()

    cur.execute(
        "SELECT * FROM leaderboard_entries WHERE period = %s AND verdict = 'Flop!' ORDER BY proba ASC LIMIT 5",
        (period,),
    )
    flop_rows = cur.fetchall()

    cur.close()
    conn.close()

    result = {
        "success": [_entry_to_card(dict(r), i) for i, r in enumerate(success_rows)],
        "flop":    [_entry_to_card(dict(r), i) for i, r in enumerate(flop_rows)],
    }
    _cache[cache_key] = result
    return result


# ── POST /api/leaderboard ──────────────────────────────────────────────────────

class LeaderboardEntryIn(BaseModel):
    verdict:          str
    proba:            float
    game_name:        str
    genre:            str | None = None
    universe:         str | None = None
    game_mode:        str | None = None
    core_mechanic:    str | None = None
    pricing:          str | None = None
    metacritic_score: int | None = None
    cover_url:        str | None = None
    creator_name:     str | None = None
    review_text:      str | None = None
    review_source:    str | None = None


@router.post("")
def save_leaderboard(entry: LeaderboardEntryIn):
    """
    Remplace la logique DB de saveToLeaderboard() dans leaderboard.js.
    Le frontend doit avoir uploadé la jaquette au préalable (Supabase Storage)
    et transmettre le cover_url dans le corps de la requête.
    Retourne { saved: true } si l'entrée a été insérée, { saved: false } sinon.
    """
    period = _current_period()
    ascending = entry.verdict == "Top!"
    order = "ASC" if ascending else "DESC"

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Récupère le top 5 existant (trié du "moins bon" au "meilleur")
    cur.execute(
        f"SELECT id, proba FROM leaderboard_entries WHERE period = %s AND verdict = %s ORDER BY proba {order} LIMIT 5",
        (period, entry.verdict),
    )
    existing = cur.fetchall()

    # Vérifie la qualification
    if len(existing) >= 5:
        worst = existing[0]["proba"]
        qualifies = entry.proba > worst if entry.verdict == "Top!" else entry.proba < worst
        if not qualifies:
            cur.close()
            conn.close()
            return {"saved": False}

    row = {
        "period":          period,
        "verdict":         entry.verdict,
        "game_name":       entry.game_name,
        "genre":           entry.genre,
        "universe":        entry.universe,
        "game_mode":       entry.game_mode,
        "core_mechanic":   entry.core_mechanic,
        "pricing":         entry.pricing,
        "proba":           entry.proba,
        "metacritic_score": entry.metacritic_score,
        "cover_url":       entry.cover_url,
        "creator_name":    entry.creator_name,
        "review_text":     entry.review_text,
        "review_source":   entry.review_source,
    }
    cols   = ", ".join(row.keys())
    placeholders = ", ".join(["%s"] * len(row))

    if len(existing) < 5:
        # Moins de 5 entrées → insertion directe
        cur.execute(
            f"INSERT INTO leaderboard_entries ({cols}) VALUES ({placeholders})",
            list(row.values()),
        )
    else:
        # Remplace le pire par le nouveau
        cur.execute("DELETE FROM leaderboard_entries WHERE id = %s", (existing[0]["id"],))
        cur.execute(
            f"INSERT INTO leaderboard_entries ({cols}) VALUES ({placeholders})",
            list(row.values()),
        )

    conn.commit()
    cur.close()
    conn.close()
    # Invalide le cache leaderboard pour que le prochain GET soit frais
    _cache.pop(f"leaderboard:{period}", None)
    return {"saved": True}
