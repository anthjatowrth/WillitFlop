import requests

from pipeline.config import STEAMSPY_API_URL


def fetch_steamspy_data(app_id: int) -> dict | None:
    resp = requests.get(
        STEAMSPY_API_URL,
        params={"request": "appdetails", "appid": app_id},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    if not data or "appid" not in data:
        return None

    owners_min, owners_max = _parse_owners(data.get("owners", ""))

    return {
        "spy_owners_min":      owners_min,
        "spy_owners_max":      owners_max,
        "spy_peak_ccu":        data.get("ccu"),
        "spy_median_playtime": data.get("median_forever"),
        "tags":                data.get("tags") or {},
    }


def _parse_owners(owners_str: str) -> tuple[int | None, int | None]:
    if not owners_str:
        return None, None
    parts = owners_str.replace(",", "").split("..")
    try:
        return int(parts[0].strip()), int(parts[1].strip())
    except (IndexError, ValueError):
        return None, None
