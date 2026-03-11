import re
import time
import requests
import psycopg2
from datetime import datetime, timezone
from dotenv import load_dotenv
import os

load_dotenv()

# ── Connexion PostgreSQL ────────────────────────────────────────────────────────

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", 5432),
        dbname=os.getenv("DB_NAME", "willitflop"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def init_schema(conn):
    """Crée toutes les tables si elles n'existent pas encore."""
    with open("schema.sql", "r", encoding="utf-8") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print("Schema initialisé.")


# ── Steam Spy ───────────────────────────────────────────────────────────────────

def fetch_steamspy_data(app_id: int) -> dict | None:
    """
    Récupère les estimations commerciales et les tags depuis Steam Spy.
    Retourne None si l'app_id est inconnu ou en cas d'erreur.
    """
    url = "https://steamspy.com/api.php"
    resp = requests.get(url, params={"request": "appdetails", "appid": app_id}, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    if not data or "appid" not in data:
        return None

    def parse_owners(owners_str: str) -> tuple[int | None, int | None]:
        """Parse '200,000 .. 500,000' → (200000, 500000)"""
        if not owners_str:
            return None, None
        parts = owners_str.replace(",", "").split("..")
        try:
            return int(parts[0].strip()), int(parts[1].strip())
        except (IndexError, ValueError):
            return None, None

    owners_min, owners_max = parse_owners(data.get("owners", ""))

    # Tags : dict {"Roguelike": 512, "Pixel Art": 300, ...}
    tags = data.get("tags") or {}

    return {
        "spy_owners_min":      owners_min,
        "spy_owners_max":      owners_max,
        "spy_peak_ccu":        data.get("ccu"),
        "spy_avg_playtime":    data.get("average_forever"),
        "spy_median_playtime": data.get("median_forever"),
        "tags":                tags,
    }


def save_steamspy_data(conn, app_id: int, data: dict):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE games SET
                spy_owners_min      = %s,
                spy_owners_max      = %s,
                spy_peak_ccu        = %s,
                spy_avg_playtime    = %s,
                spy_median_playtime = %s,
                spy_fetched_at      = %s
            WHERE app_id = %s
        """, (
            data["spy_owners_min"],
            data["spy_owners_max"],
            data["spy_peak_ccu"],
            data["spy_avg_playtime"],
            data["spy_median_playtime"],
            datetime.now(timezone.utc),
            app_id,
        ))
    conn.commit()


def save_game_tags(conn, app_id: int, tags: dict):
    """Sauvegarde les tags Steam Spy (nom + votes) pour un jeu."""
    with conn.cursor() as cur:
        cur.execute("DELETE FROM game_tags WHERE app_id = %s", (app_id,))
        for tag_name, votes in tags.items():
            cur.execute("""
                INSERT INTO game_tags (app_id, tag_name, votes)
                VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
            """, (app_id, tag_name, votes))
    conn.commit()


# ── Auth Twitch ─────────────────────────────────────────────────────────────────

def get_twitch_token() -> str:
    resp = requests.post("https://id.twitch.tv/oauth2/token", params={
        "client_id":     os.getenv("TWITCH_CLIENT_ID"),
        "client_secret": os.getenv("TWITCH_CLIENT_SECRET"),
        "grant_type":    "client_credentials",
    }, timeout=10)
    resp.raise_for_status()
    return resp.json()["access_token"]


def fetch_twitch_data(game_name: str, token: str) -> dict:
    """
    Cherche le jeu sur Twitch par nom, puis compte les streams et viewers live.
    """
    headers = {
        "Client-ID":     os.getenv("TWITCH_CLIENT_ID"),
        "Authorization": f"Bearer {token}",
    }

    resp = requests.get("https://api.twitch.tv/helix/games",
                        params={"name": game_name}, headers=headers, timeout=10)
    resp.raise_for_status()
    games = resp.json().get("data", [])

    if not games:
        return {"is_on_twitch": False, "twitch_streams_count": 0, "twitch_viewers_count": 0}

    twitch_game_id = games[0]["id"]

    # Comptage des streams live (pagination, max 5 pages = 500 streams)
    streams_count = 0
    viewers_count = 0
    cursor = None
    for _ in range(5):
        params = {"game_id": twitch_game_id, "first": 100}
        if cursor:
            params["after"] = cursor
        resp = requests.get("https://api.twitch.tv/helix/streams",
                            params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        streams = data.get("data", [])
        if not streams:
            break
        streams_count += len(streams)
        viewers_count += sum(s.get("viewer_count", 0) for s in streams)
        cursor = data.get("pagination", {}).get("cursor")
        if not cursor:
            break

    return {
        "is_on_twitch":         True,
        "twitch_streams_count": streams_count,
        "twitch_viewers_count": viewers_count,
    }


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


# ── Récupération des IDs indie via Store Search ─────────────────────────────────

def fetch_indie_app_ids() -> list[int]:
    """
    Récupère tous les app_id de jeux Indie via le store search Steam.
    """
    url = "https://store.steampowered.com/search/results/"
    app_ids = []
    start = 0
    count = 100

    print("Récupération des IDs jeux Indie...")

    while True:
        params = {
            "genre": "Indie",
            "json": 1,
            "start": start,
            "count": count,
            "sort_by": "_ASC",
        }
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        items = data.get("items", [])
        total = data.get("total_count", 0)

        if not items:
            break

        for item in items:
            logo = item.get("logo", "")
            match = re.search(r"/apps/(\d+)/", logo)
            if match:
                app_ids.append(int(match.group(1)))

        print(f"  {len(app_ids)}/{total} IDs récupérés...")
        start += count

        if start >= total:
            break

        time.sleep(0.5)

    print(f"Total : {len(app_ids)} jeux Indie trouvés.")
    return app_ids


# ── Récupération des détails complets via appdetails ────────────────────────────

def fetch_app_details(app_id: int) -> dict | None:
    url = "https://store.steampowered.com/api/appdetails"
    resp = requests.get(url, params={"appids": app_id, "l": "english"}, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    app_data = data.get(str(app_id), {})
    if app_data.get("success"):
        return app_data["data"]
    return None


# ── Récupération des avis joueurs ───────────────────────────────────────────────

def fetch_app_reviews(app_id: int, language: str, max_reviews: int = 100) -> tuple[list[dict], dict | None]:
    """
    Retourne (liste d'avis, query_summary).
    query_summary contient review_score, review_score_desc, total_positive, total_negative.
    """
    url = f"https://store.steampowered.com/appreviews/{app_id}"
    params = {
        "json": 1,
        "language": language,
        "purchase_type": "all",
        "num_per_page": max_reviews,
        "filter": "helpful",
        "cursor": "*",
    }
    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return data.get("reviews") or [], data.get("query_summary")


def save_reviews(conn, app_id: int, reviews: list[dict]):
    with conn.cursor() as cur:
        for r in reviews:
            author = r.get("author") or {}
            cur.execute("""
                INSERT INTO game_reviews (
                    recommendation_id, app_id, language, review, voted_up,
                    playtime_at_review, weighted_vote_score, votes_up,
                    written_during_early_access, timestamp_created
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, to_timestamp(%s))
                ON CONFLICT (recommendation_id) DO NOTHING
            """, (
                r.get("recommendationid"),
                app_id,
                r.get("language"),
                r.get("review"),
                r.get("voted_up"),
                author.get("playtime_at_review"),
                r.get("weighted_vote_score"),
                r.get("votes_up"),
                r.get("written_during_early_access"),
                r.get("timestamp_created"),
            ))
    conn.commit()


def save_review_score(conn, app_id: int, summary: dict):
    """Sauvegarde le score global des reviews Steam (tiré du query_summary)."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE games SET
                review_score          = %s,
                review_total_positive = %s,
                review_total_negative = %s
            WHERE app_id = %s
        """, (
            summary.get("review_score"),
            summary.get("total_positive"),
            summary.get("total_negative"),
            app_id,
        ))
    conn.commit()


# ── Parsing & insertion complète d'un jeu ───────────────────────────────────────

def save_game_details(conn, app_id: int, d: dict):
    """Parse les données appdetails et insère tout en DB."""

    price = d.get("price_overview") or {}
    metacritic = d.get("metacritic") or {}
    recommendations = d.get("recommendations") or {}
    achievements = d.get("achievements") or {}
    release = d.get("release_date") or {}
    platforms = d.get("platforms") or {}
    has_dlc = bool(d.get("dlc"))
    # Early Access = category_id 70 dans les catégories Steam
    categories = d.get("categories") or []
    is_early_access = any(c.get("id") == 70 for c in categories)

    with conn.cursor() as cur:

        # ── Table principale games ──────────────────────────────────────────────
        cur.execute("""
            INSERT INTO games (
                app_id, name, is_free,
                release_date, has_dlc, is_early_access,
                short_description, detailed_description,
                supported_languages,
                website, header_image, capsule_imagev5, background,
                price_currency, price_initial, price_final, discount_percent,
                platform_windows, platform_mac, platform_linux,
                recommendations_total,
                metacritic_score,
                achievements_total,
                details_fetched, fetched_at
            ) VALUES (
                %s,%s,%s,
                %s,%s,%s,
                %s,%s,
                %s,
                %s,%s,%s,%s,
                %s,%s,%s,%s,
                %s,%s,%s,
                %s,
                %s,
                %s,
                TRUE, %s
            )
            ON CONFLICT (app_id) DO UPDATE SET
                name                 = EXCLUDED.name,
                is_free              = EXCLUDED.is_free,
                release_date         = EXCLUDED.release_date,
                has_dlc              = EXCLUDED.has_dlc,
                is_early_access      = EXCLUDED.is_early_access,
                short_description    = EXCLUDED.short_description,
                detailed_description = EXCLUDED.detailed_description,
                supported_languages  = EXCLUDED.supported_languages,
                website              = EXCLUDED.website,
                header_image         = EXCLUDED.header_image,
                capsule_imagev5      = EXCLUDED.capsule_imagev5,
                background           = EXCLUDED.background,
                price_currency       = EXCLUDED.price_currency,
                price_initial        = EXCLUDED.price_initial,
                price_final          = EXCLUDED.price_final,
                discount_percent     = EXCLUDED.discount_percent,
                platform_windows     = EXCLUDED.platform_windows,
                platform_mac         = EXCLUDED.platform_mac,
                platform_linux       = EXCLUDED.platform_linux,
                recommendations_total = EXCLUDED.recommendations_total,
                metacritic_score     = EXCLUDED.metacritic_score,
                achievements_total   = EXCLUDED.achievements_total,
                details_fetched      = TRUE,
                fetched_at           = EXCLUDED.fetched_at
        """, (
            app_id,
            d.get("name"),
            d.get("is_free"),
            release.get("date"),
            has_dlc,
            is_early_access,
            d.get("short_description"),
            d.get("detailed_description"),
            d.get("supported_languages"),
            d.get("website"),
            d.get("header_image"),
            d.get("capsule_imagev5"),
            d.get("background"),
            price.get("currency"),
            price.get("initial"),
            price.get("final"),
            price.get("discount_percent"),
            platforms.get("windows"),
            platforms.get("mac"),
            platforms.get("linux"),
            recommendations.get("total"),
            metacritic.get("score"),
            achievements.get("total"),
            datetime.now(timezone.utc),
        ))

        # ── Genres ─────────────────────────────────────────────────────────────
        cur.execute("DELETE FROM game_genres WHERE app_id = %s", (app_id,))
        for g in d.get("genres") or []:
            cur.execute("""
                INSERT INTO game_genres (app_id, genre_id, genre_name)
                VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
            """, (app_id, g.get("id"), g.get("description")))

        # ── Catégories ─────────────────────────────────────────────────────────
        cur.execute("DELETE FROM game_categories WHERE app_id = %s", (app_id,))
        for c in categories:
            cur.execute("""
                INSERT INTO game_categories (app_id, category_id, category_name)
                VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
            """, (app_id, c.get("id"), c.get("description")))

    conn.commit()


# ── Récupération des IDs déjà traités ───────────────────────────────────────────

def get_already_fetched(conn) -> set[int]:
    with conn.cursor() as cur:
        cur.execute("SELECT app_id FROM games WHERE details_fetched = TRUE")
        return {row[0] for row in cur.fetchall()}


# ── Pipeline principal ───────────────────────────────────────────────────────────

def run():
    conn = get_connection()
    init_schema(conn)

    twitch_token = get_twitch_token()
    print("Token Twitch obtenu.")

    app_ids = fetch_indie_app_ids()
    app_ids = app_ids[:100]
    already_done = get_already_fetched(conn)

    to_fetch = [aid for aid in app_ids if aid not in already_done]
    print(f"\n{len(to_fetch)} jeux à traiter ({len(already_done)} déjà en DB).\n")

    for i, app_id in enumerate(to_fetch, 1):
        try:
            details = fetch_app_details(app_id)
            time.sleep(1.0)

            if details is None:
                print(f"[{i}/{len(to_fetch)}] app_id={app_id} — ignoré (pas de données)")
                continue

            save_game_details(conn, app_id, details)

            # Avis EN → on récupère aussi le query_summary pour le review score global
            reviews_en, summary = fetch_app_reviews(app_id, "english")
            save_reviews(conn, app_id, reviews_en)
            if summary:
                save_review_score(conn, app_id, summary)
            time.sleep(0.8)

            reviews_fr, _ = fetch_app_reviews(app_id, "french")
            save_reviews(conn, app_id, reviews_fr)
            time.sleep(0.8)

            twitch_data = fetch_twitch_data(details.get("name", ""), twitch_token)
            save_twitch_data(conn, app_id, twitch_data)
            time.sleep(0.5)

            spy_data = fetch_steamspy_data(app_id)
            if spy_data:
                save_steamspy_data(conn, app_id, spy_data)
                if spy_data.get("tags"):
                    save_game_tags(conn, app_id, spy_data["tags"])
            time.sleep(1.0)

            print(f"[{i}/{len(to_fetch)}] {details.get('name')} ({app_id}) — OK")

        except requests.HTTPError as e:
            print(f"[{i}/{len(to_fetch)}] app_id={app_id} — erreur HTTP: {e}")
        except Exception as e:
            print(f"[{i}/{len(to_fetch)}] app_id={app_id} — erreur: {e}")
            conn.rollback()

    conn.close()
    print("\nCollecte terminée.")


if __name__ == "__main__":
    run()
