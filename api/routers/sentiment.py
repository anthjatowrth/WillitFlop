"""
Sentiment analysis endpoints.

GET /sentiment/games       → per-game sentiment metrics (from sentiment_analysis mart)
GET /sentiment/by-genre    → per-genre sentiment (from sentiment_by_genre mart)
GET /sentiment/wordcloud   → top-80 words per polarity (Python-side, from game_reviews)
GET /sentiment/timeline    → avg sentiment grouped by month
"""

import os
import re
from collections import Counter

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query

load_dotenv()

router = APIRouter(prefix="/sentiment", tags=["sentiment"])

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
}

_TOKEN_RE = re.compile(r"[a-zA-Z]{3,}")


def _tokenize(text: str) -> list[str]:
    return [
        w.lower()
        for w in _TOKEN_RE.findall(text)
        if w.lower() not in _STOPWORDS
    ]


# ── DB helper ─────────────────────────────────────────────────────────────────
def _get_conn():
    host = os.getenv("DB_HOST")
    if not host:
        raise HTTPException(status_code=503, detail="DB_HOST not configured")
    return psycopg2.connect(
        host=host,
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require",
    )


# ── GET /sentiment/games ──────────────────────────────────────────────────────
@router.get("/games")
def sentiment_games(
    successful_only: bool = Query(False),
    min_reviews: int = Query(2, ge=1),
):
    """Per-game sentiment metrics from the sentiment_analysis dbt mart."""
    conn = _get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            query = """
                SELECT
                    app_id, name, is_successful,
                    review_wilson_score, owners_midpoint,
                    avg_sentiment, positive_sentiment_ratio,
                    negative_sentiment_ratio, review_count
                FROM sentiment_analysis
                WHERE review_count >= %s
            """
            params: list = [min_reviews]
            if successful_only:
                query += " AND is_successful = TRUE"
            query += " ORDER BY avg_sentiment DESC"
            cur.execute(query, params)
            rows = cur.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


# ── GET /sentiment/by-genre ───────────────────────────────────────────────────
@router.get("/by-genre")
def sentiment_by_genre():
    """Per-genre average sentiment from the sentiment_by_genre dbt mart."""
    conn = _get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT genre_name, avg_sentiment, positive_ratio, review_count
                FROM sentiment_by_genre
                ORDER BY avg_sentiment DESC
            """)
            rows = cur.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


# ── GET /sentiment/wordcloud ──────────────────────────────────────────────────
@router.get("/wordcloud")
def sentiment_wordcloud():
    """
    Top-80 most frequent words for positive (voted_up=true) and negative
    (voted_up=false) English reviews. Stopwords + Steam noise excluded.
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT review, voted_up
                FROM game_reviews
                WHERE language = 'english'
                  AND review IS NOT NULL
                  AND review != ''
            """)
            rows = cur.fetchall()
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


# ── GET /sentiment/timeline ───────────────────────────────────────────────────
@router.get("/timeline")
def sentiment_timeline():
    """Average sentiment grouped by month (from timestamp_created)."""
    conn = _get_conn()
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
                GROUP BY DATE_TRUNC('month', timestamp_created)
                ORDER BY DATE_TRUNC('month', timestamp_created)
            """)
            rows = cur.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
