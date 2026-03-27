"""
Sentiment analysis endpoints.

GET /sentiment/games       → per-game sentiment metrics (from sentiment_analysis mart)
GET /sentiment/by-genre    → per-genre sentiment (from sentiment_by_genre mart)
GET /sentiment/wordcloud   → top-80 words per polarity (Python-side, from game_reviews)
GET /sentiment/timeline    → avg sentiment grouped by month
"""

import re
import time
from collections import Counter

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException, Query

from api.db import get_conn

router = APIRouter(prefix="/sentiment", tags=["sentiment"])

# ── Simple in-memory cache (TTL = 1 hour) ─────────────────────────────────────
_CACHE: dict = {}
_CACHE_TTL = 3600  # seconds

def _cached(key: str, fn):
    """Return cached value or call fn(), cache result, return it."""
    entry = _CACHE.get(key)
    if entry and time.time() - entry["ts"] < _CACHE_TTL:
        return entry["data"]
    result = fn()
    _CACHE[key] = {"data": result, "ts": time.time()}
    return result

# ── Stopwords ─────────────────────────────────────────────────────────────────
_STOPWORDS = {
    # generic English
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
    "them", "his", "her", "its", "their", "what", "which", "who", "whom",
    "this", "that", "these", "those", "am", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "shall", "should", "may", "might", "must", "can", "could",
    "not", "no", "nor", "so", "yet", "both", "either", "neither", "each",
    "few", "more", "most", "other", "some", "such", "than", "too", "very",
    "just", "but", "if", "or", "because", "as", "until", "while", "of",
    "at", "by", "for", "with", "about", "against", "between", "through",
    "during", "before", "after", "above", "below", "from", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both",
    "to", "the", "a", "an", "and",
    # Steam noise
    "game", "play", "playing", "played", "games", "steam", "like", "get",
    "time", "really", "also", "good", "great", "one", "will", "much",
    "even", "make", "well", "way", "lot", "still", "know", "think",
    "little", "dont", "doesnt", "isnt", "cant", "its",
    # quasi-stopwords anglais manquants
    "into", "first", "actually", "something", "nothing", "anything",
    "someone", "anyone", "everyone", "somehow", "somewhere", "anywhere",
    "never", "ever", "always", "every", "only", "just", "now", "back",
    "see", "got", "go", "going", "gone", "went", "put", "run", "set",
    "take", "come", "say", "use", "used", "using", "feel", "need", "give",
    "look", "want", "find", "try", "tried", "quite", "around", "without",
    "within", "since", "though", "many", "last", "next", "long", "high",
    "old", "new", "own", "done", "same", "thing", "things", "felt", "left",
    "far", "off", "bit", "pretty", "kind", "type", "else", "however",
    "maybe", "probably", "almost", "already", "often", "instead", "start",
    "started", "stop", "stopped", "keep", "kept", "add", "added", "found",
    "made", "come", "came", "went", "want", "wanted", "able", "sure",
    "ive", "youre", "theyre", "weve", "thats", "dont", "doesnt", "didnt",
    "wasnt", "werent", "couldnt", "wouldnt", "shouldnt", "havent", "hadnt",
    "let", "say", "end", "point", "imo", "tbh", "etc", "via", "per",
    "don", "doesn", "https", "com", "url", "two"," didn", "isn"
}

_TOKEN_RE = re.compile(r"[a-zA-Z]{3,}")


def _tokenize(text: str) -> list[str]:
    return [
        w.lower()
        for w in _TOKEN_RE.findall(text)
        if w.lower() not in _STOPWORDS
    ]


# ── GET /sentiment/games ──────────────────────────────────────────────────────
@router.get("/games")
def sentiment_games(
    successful_only: bool = Query(False),
    min_reviews: int = Query(10, ge=1),
):
    """Per-game sentiment metrics from the sentiment_analysis dbt mart."""
    cache_key = f"games:{successful_only}:{min_reviews}"

    def _fetch():
        conn = get_conn()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                query = """
                    SELECT
                        sa.app_id, sa.name, sa.is_successful,
                        sa.review_wilson_score, sa.owners_midpoint,
                        sa.avg_sentiment, sa.positive_sentiment_ratio,
                        sa.negative_sentiment_ratio, sa.review_count,
                        g.header_image
                    FROM sentiment_analysis sa
                    LEFT JOIN games g USING (app_id)
                    WHERE sa.review_count >= %s
                """
                params: list = [min_reviews]
                if successful_only:
                    query += " AND sa.is_successful = TRUE"
                query += " ORDER BY sa.review_count DESC NULLS LAST LIMIT 500"
                cur.execute(query, params)
                rows = cur.fetchall()
            return [dict(r) for r in rows]
        except psycopg2.Error as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e.pgerror or str(e)}")
        finally:
            conn.close()

    return _cached(cache_key, _fetch)


# ── GET /sentiment/by-genre ───────────────────────────────────────────────────
@router.get("/by-genre")
def sentiment_by_genre():
    """Per-genre average sentiment from the sentiment_by_genre dbt mart."""
    def _fetch():
        conn = get_conn()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT genre_name, avg_sentiment, positive_ratio, review_count
                    FROM sentiment_by_genre
                    ORDER BY avg_sentiment DESC
                """)
                rows = cur.fetchall()
            return [dict(r) for r in rows]
        except psycopg2.Error as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e.pgerror or str(e)}")
        finally:
            conn.close()

    return _cached("by-genre", _fetch)


# ── GET /sentiment/wordcloud ──────────────────────────────────────────────────
@router.get("/wordcloud")
def sentiment_wordcloud():
    """
    Top-80 most frequent words for positive (voted_up=true) and negative
    (voted_up=false) English reviews. Stopwords + Steam noise excluded.
    """
    def _fetch():
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                # Limit to 30 000 reviews — sufficient for representative word
                # frequencies and avoids loading the entire table into Python memory.
                cur.execute("""
                    SELECT review, voted_up
                    FROM game_reviews
                    WHERE language = 'english'
                      AND review IS NOT NULL
                      AND review != ''
                    LIMIT 30000
                """)
                rows = cur.fetchall()
        except psycopg2.Error as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e.pgerror or str(e)}")
        finally:
            conn.close()

        pos_counter: Counter = Counter()
        neg_counter: Counter = Counter()
        for review, voted_up in rows:
            tokens = _tokenize(review)
            if voted_up:
                pos_counter.update(tokens)
            else:
                neg_counter.update(tokens)

        def to_list(counter: Counter) -> list[dict]:
            return [{"text": w, "value": c} for w, c in counter.most_common(80)]

        return {"positive": to_list(pos_counter), "negative": to_list(neg_counter)}

    return _cached("wordcloud", _fetch)


# ── GET /sentiment/timeline ───────────────────────────────────────────────────
@router.get("/timeline")
def sentiment_timeline():
    """Average sentiment grouped by month (from timestamp_created)."""
    def _fetch():
        conn = get_conn()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        TO_CHAR(DATE_TRUNC('month', timestamp_created), 'YYYY-MM') AS month,
                        AVG(sentiment_score)                                        AS avg_sentiment,
                        COUNT(*)                                                    AS review_count
                    FROM game_reviews
                    WHERE language        = 'english'
                      AND sentiment_score IS NOT NULL
                      AND timestamp_created IS NOT NULL
                      AND timestamp_created >= NOW() - INTERVAL '10 years'
                    GROUP BY DATE_TRUNC('month', timestamp_created)
                    ORDER BY DATE_TRUNC('month', timestamp_created)
                    LIMIT 120
                """)
                rows = cur.fetchall()
            return [dict(r) for r in rows]
        except psycopg2.Error as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e.pgerror or str(e)}")
        finally:
            conn.close()

    return _cached("timeline", _fetch)
