#!/usr/bin/env python3
"""
Backfill script: compute VADER sentiment scores for all English reviews
where sentiment_score IS NULL.

Usage:
    python -m pipeline.enrich_sentiment
"""

from tqdm import tqdm
from pipeline.db import get_connection
from pipeline.utils import compute_sentiment

BATCH_SIZE = 500


def run():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT recommendation_id, review
                FROM game_reviews
                WHERE language = 'english'
                  AND sentiment_score IS NULL
            """)
            rows = cur.fetchall()

        if not rows:
            print("No reviews to enrich — all English reviews already have a sentiment score.")
            return

        print(f"Enriching {len(rows):,} reviews with VADER sentiment…")

        batch: list[tuple[float, int]] = []
        for rec_id, review in tqdm(rows, unit="review"):
            score = compute_sentiment(review or "")
            batch.append((score, rec_id))

            if len(batch) >= BATCH_SIZE:
                with conn.cursor() as cur:
                    cur.executemany(
                        "UPDATE game_reviews SET sentiment_score = %s WHERE recommendation_id = %s",
                        batch,
                    )
                conn.commit()
                batch = []

        # Flush remaining rows
        if batch:
            with conn.cursor() as cur:
                cur.executemany(
                    "UPDATE game_reviews SET sentiment_score = %s WHERE recommendation_id = %s",
                    batch,
                )
            conn.commit()

        print(f"Done — {len(rows):,} reviews enriched.")
    finally:
        conn.close()


if __name__ == "__main__":
    run()
