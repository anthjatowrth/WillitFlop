import os
import statistics
import time
import requests
from dotenv import load_dotenv

load_dotenv()


def fetch_indie_app_ids() -> list[int]:
    print("Récupération des IDs jeux Indie via SteamSpy...")
    all_ids_set: set[int] = set()
    page = 0
    while True:
        resp = requests.get(
            "https://steamspy.com/api.php",
            params={"request": "genre", "genre": "Indie", "page": page},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        ids = [int(k) for k in data.keys()]
        new_ids = [i for i in ids if i not in all_ids_set]
        if not new_ids:
            break  # plus aucun nouvel ID = API a renvoyé les mêmes données
        all_ids_set.update(ids)
        print(f"  Page {page} : {len(ids)} IDs ({len(new_ids)} nouveaux, total : {len(all_ids_set)})")
        if len(ids) < 1000:  # SteamSpy retourne au plus 1000 entrées par page
            break
        page += 1
        time.sleep(1.5)  # respecter le rate limit SteamSpy
    print(f"{len(all_ids_set)} IDs récupérés au total.")
    return list(all_ids_set)


def fetch_app_details(app_id: int) -> dict | None:
    """Récupère les détails complets d'un jeu via l'API Steam."""
    resp = requests.get(
        "https://store.steampowered.com/api/appdetails",
        params={"appids": app_id, "l": "english"},
        timeout=15,
    )
    resp.raise_for_status()
    app_data = resp.json().get(str(app_id), {})
    if app_data.get("success"):
        return app_data["data"]
    return None


def fetch_app_reviews(app_id: int) -> tuple[list[dict], dict | None]:
    resp = requests.get(
        f"https://store.steampowered.com/appreviews/{app_id}",
        params={
            "json": 1,
            "language": "english",
            "purchase_type": "all",
            "num_per_page": 100,
            "filter": "helpful",
            "cursor": "*",
        },
        timeout=15)
    resp.raise_for_status()
    data = resp.json()
    reviews = data.get("reviews") or []

    positive = sorted(
        [r for r in reviews if r.get("voted_up")],
        key=lambda r: r.get("votes_up", 0),
        reverse=True,
    )[:5]
    negative = sorted(
        [r for r in reviews if not r.get("voted_up")],
        key=lambda r: r.get("votes_up", 0),
        reverse=True,
    )[:5]

    return positive + negative, data.get("query_summary")


def fetch_achievement_stats(app_id: int) -> dict | None:
    resp = requests.get(
        "https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/",
        params={"gameid": app_id, "key": os.getenv("STEAM_API_KEY")},
        timeout=15)
    if resp.status_code == 403:
        return None
    resp.raise_for_status()
    achievements = resp.json().get("achievementpercentages", {}).get("achievements", [])
    percents = [float(a["percent"]) for a in achievements if "percent" in a]
    if not percents:
        return None
    return {
        "achievement_count":              len(percents),
        "achievement_median_unlock_rate": round(statistics.median(percents), 2)}
