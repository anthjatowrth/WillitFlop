import random
import time

import requests

from pipeline.config import MIN_OWNERS
from pipeline.db import get_connection, get_already_fetched, get_games_for_monthly_update
from pipeline.fetchers.steam import (
    fetch_indie_app_ids,
    fetch_app_details,
    fetch_app_reviews,
    fetch_achievement_stats,
)
from pipeline.fetchers.steamspy import fetch_steamspy_data
from pipeline.fetchers.twitch import get_twitch_token, fetch_twitch_data
from pipeline.loaders.games import (
    save_game_details,
    save_steamspy_data,
    save_game_tags,
    save_reviews,
    save_review_score,
    save_twitch_data,
    save_achievement_stats,
    save_kpis,
)


def run_collect_new():
    """
    Collecte mensuelle des nouveaux jeux qualifiants (sans TARGET).
    Ignore les app_ids déjà en base.
    """
    conn = get_connection()
    twitch_token = get_twitch_token()

    app_ids    = fetch_indie_app_ids()
    already_done = get_already_fetched(conn)
    to_fetch   = [aid for aid in app_ids if aid not in already_done]
    random.shuffle(to_fetch)
    new_count  = 0
    print(f"\n{len(already_done)} jeux en DB — {len(to_fetch)} nouveaux candidats à vérifier.\n")

    for app_id in to_fetch:
        try:
            spy_data = fetch_steamspy_data(app_id)
            time.sleep(1.0)
            if not spy_data or (spy_data["spy_owners_min"] or 0) < MIN_OWNERS:
                continue

            details = fetch_app_details(app_id)
            time.sleep(0.5)
            if details is None or details.get("type") != "game":
                continue
            if details.get("fullgame"):
                continue
            categories = details.get("categories") or []
            if any("VR" in (c.get("description") or "") for c in categories):
                continue

            save_game_details(conn, app_id, details)
            save_steamspy_data(conn, app_id, spy_data)
            if spy_data.get("tags"):
                save_game_tags(conn, app_id, spy_data["tags"])

            try:
                reviews, summary = fetch_app_reviews(app_id)
                save_reviews(conn, app_id, reviews)
                if summary:
                    save_review_score(conn, app_id, summary)
            except Exception as e:
                print(f"[ERREUR] {app_id} — reviews ignorées: {e}")
            time.sleep(0.5)

            try:
                twitch_data = fetch_twitch_data(details.get("name", ""), twitch_token)
                save_twitch_data(conn, app_id, twitch_data)
            except Exception as e:
                print(f"[ERREUR] {app_id} — twitch ignoré: {e}")
            time.sleep(0.3)

            try:
                achievement_stats = fetch_achievement_stats(app_id) or {"achievement_count": 0, "achievement_median_unlock_rate": 0.0}
                save_achievement_stats(conn, app_id, achievement_stats)
            except Exception as e:
                print(f"[ERREUR] {app_id} — achievements ignorés: {e}")
            time.sleep(0.5)

            save_kpis(conn, app_id)
            new_count += 1
            print(f"[+{new_count}] {details.get('name')} ({app_id}) — ajouté")

        except requests.HTTPError as e:
            print(f"[ERREUR HTTP] {app_id} — {e}")
        except Exception as e:
            print(f"[ERREUR] {app_id} — {e}")
            conn.rollback()

    conn.close()
    print(f"\nCollecte nouveaux jeux terminée — {new_count} ajoutés.")


def run_update_recent():
    """
    Mise à jour mensuelle des jeux récents (cette année ou l'an dernier) :
    owners SteamSpy + Twitch + nouvelles reviews + recalc KPIs.
    """
    conn = get_connection()
    twitch_token = get_twitch_token()
    games        = get_games_for_monthly_update(conn)
    app_ids      = games["recent"]
    print(f"\nMise à jour {len(app_ids)} jeux récents (< 1 an).\n")

    for app_id in app_ids:
        try:
            spy_data = fetch_steamspy_data(app_id)
            time.sleep(1.0)
            if spy_data:
                save_steamspy_data(conn, app_id, spy_data)

            with conn.cursor() as cur:
                cur.execute("SELECT name FROM games WHERE app_id = %s", (app_id,))
                row = cur.fetchone()
            name = row[0] if row else ""

            twitch_data = fetch_twitch_data(name, twitch_token)
            save_twitch_data(conn, app_id, twitch_data)
            time.sleep(0.3)

            reviews, summary = fetch_app_reviews(app_id)
            save_reviews(conn, app_id, reviews)
            if summary:
                save_review_score(conn, app_id, summary)
            time.sleep(0.5)

            save_kpis(conn, app_id)
            print(f"[MAJ récent] {app_id} — OK")

        except requests.HTTPError as e:
            print(f"[ERREUR HTTP] {app_id} — {e}")
        except Exception as e:
            print(f"[ERREUR] {app_id} — {e}")
            conn.rollback()

    conn.close()
    print("\nMise à jour jeux récents terminée.")


def run_update_old():
    """
    Mise à jour mensuelle des jeux anciens (> 2 ans) :
    owners SteamSpy + Twitch + reviews + recalc KPIs.
    """
    conn         = get_connection()
    twitch_token = get_twitch_token()
    games        = get_games_for_monthly_update(conn)
    app_ids      = games["old"]
    print(f"\nMise à jour {len(app_ids)} jeux anciens (> 1 an).\n")

    for app_id in app_ids:
        try:
            spy_data = fetch_steamspy_data(app_id)
            time.sleep(1.0)
            if spy_data:
                save_steamspy_data(conn, app_id, spy_data)

            with conn.cursor() as cur:
                cur.execute("SELECT name FROM games WHERE app_id = %s", (app_id,))
                row = cur.fetchone()
            name = row[0] if row else ""

            twitch_data = fetch_twitch_data(name, twitch_token)
            save_twitch_data(conn, app_id, twitch_data)
            time.sleep(0.3)

            reviews, summary = fetch_app_reviews(app_id)
            save_reviews(conn, app_id, reviews)
            if summary:
                save_review_score(conn, app_id, summary)
            time.sleep(0.5)

            save_kpis(conn, app_id)
            print(f"[MAJ ancien] {app_id} — OK")

        except requests.HTTPError as e:
            print(f"[ERREUR HTTP] {app_id} — {e}")
        except Exception as e:
            print(f"[ERREUR] {app_id} — {e}")
            conn.rollback()

    conn.close()
    print("\nMise à jour jeux anciens terminée.")


