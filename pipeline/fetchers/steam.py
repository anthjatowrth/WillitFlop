import os
import statistics
import requests
from dotenv import load_dotenv

load_dotenv()


def fetch_indie_app_ids() -> list[int]:
    """Récupère tous les app_id de jeux Indie via SteamSpy."""
    print("Récupération des IDs jeux Indie via Steam Spy...")
    resp = requests.get(
        "https://steamspy.com/api.php",
        params={"request": "genre", "genre": "Indie", "page": 0},
        timeout=15,
    )
    resp.raise_for_status()
    app_ids = [int(k) for k in resp.json().keys()]
    print(f"{len(app_ids)} IDs récupérés.")
    return app_ids


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
    """
    Retourne (top 5 avis positifs + top 5 avis négatifs en anglais, query_summary).
    Fetche 100 avis EN triés par helpful, puis sélectionne les 5 meilleurs
    de chaque polarité par votes_up.
    """
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
        timeout=15,
    )
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
    """
    Récupère les taux de déblocage globaux et calcule le nombre
    d'achievements et le taux médian. Retourne None si aucun achievement.
    """
    resp = requests.get(
        "https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/",
        params={"gameid": app_id, "key": os.getenv("STEAM_API_KEY")},
        timeout=15,
    )
    resp.raise_for_status()
    achievements = resp.json().get("achievementpercentages", {}).get("achievements", [])
    percents = [a["percent"] for a in achievements if "percent" in a]
    if not percents:
        return None
    return {
        "achievement_count":              len(percents),
        "achievement_median_unlock_rate": statistics.median(percents),
    }
