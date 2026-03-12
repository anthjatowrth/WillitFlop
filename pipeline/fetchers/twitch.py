import os
import requests
from dotenv import load_dotenv

load_dotenv()


def get_twitch_token() -> str:
    resp = requests.post(
        "https://id.twitch.tv/oauth2/token",
        params={
            "client_id":     os.getenv("TWITCH_CLIENT_ID"),
            "client_secret": os.getenv("TWITCH_CLIENT_SECRET"),
            "grant_type":    "client_credentials",
        },
        timeout=10,
    )
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

    resp = requests.get(
        "https://api.twitch.tv/helix/games",
        params={"name": game_name},
        headers=headers,
        timeout=10,
    )
    resp.raise_for_status()
    games = resp.json().get("data", [])

    if not games:
        return {"is_on_twitch": False, "twitch_streams_count": 0, "twitch_viewers_count": 0}

    twitch_game_id = games[0]["id"]
    streams_count  = 0
    viewers_count  = 0
    cursor         = None

    for _ in range(5):  # max 5 pages = 500 streams
        params = {"game_id": twitch_game_id, "first": 100}
        if cursor:
            params["after"] = cursor
        resp = requests.get(
            "https://api.twitch.tv/helix/streams",
            params=params,
            headers=headers,
            timeout=10,
        )
        resp.raise_for_status()
        data    = resp.json()
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
