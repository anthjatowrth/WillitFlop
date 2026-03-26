from datetime import datetime, timezone
from pipeline.config import CATEGORY_WHITELIST
from pipeline.transformers.text import clean_short_description, clean_supported_languages, clean_release_date
from pipeline.transformers.kpis import compute_kpis
from pipeline.transformers.prices import convert_price_to_eur
from pipeline.utils import compute_sentiment


def save_game_details(conn, app_id: int, d: dict):
    """Parse les données appdetails, nettoie les textes et insère en DB."""
    price       = d.get("price_overview") or {}
    metacritic  = d.get("metacritic") or {}
    release     = d.get("release_date") or {}
    categories  = d.get("categories") or []
    has_dlc         = bool(d.get("dlc"))
    is_early_access = any(c.get("id") == 70 for c in categories)
    short_description_clean = clean_short_description(d.get("short_description"))
    price_eur = convert_price_to_eur(price.get("initial"), price.get("currency"))
    if price_eur is None and d.get("is_free"):
        price_eur = 0.0
    metacritic_score = metacritic.get("score") or 0
    screenshots = d.get("screenshots") or []
    screenshot_urls = [s["path_full"] for s in screenshots[:5] if s.get("path_full")]

    movies = d.get("movies") or []
    trailer_hls_url = None
    if movies:
        m = movies[0]
        trailer_hls_url = m.get("hls_h264") or m.get("dash_h264") or m.get("dash_av1")

    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO games (
                app_id, name, is_free,
                release_date, has_dlc, is_early_access,
                short_description_clean,
                header_image, screenshot_urls, trailer_hls_url,
                supported_languages,
                price_eur,
                metacritic_score,
                details_fetched, fetched_at
            ) VALUES (
                %s,%s,%s,
                %s,%s,%s,
                %s,
                %s,%s,%s,
                %s,
                %s,
                %s,
                TRUE, %s
            )
            ON CONFLICT (app_id) DO UPDATE SET
                name                        = EXCLUDED.name,
                is_free                     = EXCLUDED.is_free,
                release_date                = EXCLUDED.release_date,
                has_dlc                     = EXCLUDED.has_dlc,
                is_early_access             = EXCLUDED.is_early_access,
                short_description_clean     = EXCLUDED.short_description_clean,
                header_image                = EXCLUDED.header_image,
                screenshot_urls             = EXCLUDED.screenshot_urls,
                trailer_hls_url             = EXCLUDED.trailer_hls_url,
                supported_languages         = EXCLUDED.supported_languages,
                price_eur                   = EXCLUDED.price_eur,
                metacritic_score            = EXCLUDED.metacritic_score,
                details_fetched             = TRUE,
                fetched_at                  = EXCLUDED.fetched_at
        """, (
            app_id,
            d.get("name"),
            d.get("is_free"),
            clean_release_date(release.get("date")),
            has_dlc,
            is_early_access,
            short_description_clean,
            d.get("header_image"),
            screenshot_urls,
            trailer_hls_url,
            clean_supported_languages(d.get("supported_languages")),
            price_eur,
            metacritic_score,
            datetime.now(timezone.utc),
        ))

        cur.execute("DELETE FROM game_genres WHERE app_id = %s", (app_id,))
        for g in d.get("genres") or []:
            if g.get("description") == "Indie":
                continue
            cur.execute("""
                INSERT INTO game_genres (app_id, genre_id, genre_name)
                VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
            """, (app_id, g.get("id"), g.get("description")))

        cur.execute("DELETE FROM game_categories WHERE app_id = %s", (app_id,))
        for c in categories:
            if c.get("description") in CATEGORY_WHITELIST:
                cur.execute("""
                    INSERT INTO game_categories (app_id, category_id, category_name)
                    VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
                """, (app_id, c.get("id"), c.get("description")))

    conn.commit()


def save_steamspy_data(conn, app_id: int, data: dict):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE games SET
                spy_owners_min      = %s,
                spy_owners_max      = %s,
                spy_peak_ccu        = %s,
                spy_median_playtime = %s,
                spy_fetched_at      = %s
            WHERE app_id = %s
        """, (
            data["spy_owners_min"],
            data["spy_owners_max"],
            data["spy_peak_ccu"],
            data["spy_median_playtime"],
            datetime.now(timezone.utc),
            app_id,
        ))
    conn.commit()


def save_game_tags(conn, app_id: int, tags: dict):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM game_tags WHERE app_id = %s", (app_id,))
        for tag_name, votes in tags.items():
            cur.execute("""
                INSERT INTO game_tags (app_id, tag_name, votes)
                VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
            """, (app_id, tag_name, votes))
    conn.commit()


def save_reviews(conn, app_id: int, reviews: list[dict]):
    with conn.cursor() as cur:
        for r in reviews:
            language = r.get("language")
            review_text = r.get("review")
            sentiment = compute_sentiment(review_text) if language == "english" else None
            cur.execute("""
                INSERT INTO game_reviews (
                    recommendation_id, app_id, language, review, voted_up,
                    weighted_vote_score, votes_up, timestamp_created, sentiment_score
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, to_timestamp(%s), %s)
                ON CONFLICT (recommendation_id) DO NOTHING
            """, (
                r.get("recommendationid"),
                app_id,
                language,
                review_text,
                r.get("voted_up"),
                r.get("weighted_vote_score"),
                r.get("votes_up"),
                r.get("timestamp_created"),
                sentiment,
            ))
    conn.commit()


def save_review_score(conn, app_id: int, summary: dict):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE games SET
                review_total_positive = %s,
                review_total_negative = %s
            WHERE app_id = %s
        """, (
            summary.get("total_positive"),
            summary.get("total_negative"),
            app_id,
        ))
    conn.commit()


def save_twitch_data(conn, app_id: int, data: dict):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE games SET
                is_on_twitch         = %s,
                twitch_streams_count = %s,
                twitch_viewers_count = %s,
                twitch_fetched_at    = %s
            WHERE app_id = %s
        """, (
            data["is_on_twitch"],
            data["twitch_streams_count"],
            data["twitch_viewers_count"],
            datetime.now(timezone.utc),
            app_id,
        ))
    conn.commit()


def save_achievement_stats(conn, app_id: int, data: dict):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE games SET
                achievement_count              = %s,
                achievement_median_unlock_rate = %s
            WHERE app_id = %s
        """, (
            data["achievement_count"],
            data["achievement_median_unlock_rate"],
            app_id,
        ))
    conn.commit()


def save_kpis(conn, app_id: int):
    """
    Lit les données persistées, calcule les KPIs dérivés via le transformer,
    puis les sauvegarde.
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT review_total_positive, review_total_negative,
                   spy_owners_min, spy_owners_max
            FROM games WHERE app_id = %s
        """, (app_id,))
        row = cur.fetchone()

    if row is None:
        return

    kpis = compute_kpis(*row)

    with conn.cursor() as cur:
        cur.execute("""
            UPDATE games SET
                review_total        = %s,
                review_wilson_score = %s,
                owners_midpoint     = %s,
                is_successful       = %s
            WHERE app_id = %s
        """, (
            kpis["review_total"],
            kpis["review_wilson_score"],
            kpis["owners_midpoint"],
            kpis["is_successful"],
            app_id,
        ))
    conn.commit()
