import html
import re
from bs4 import BeautifulSoup

# ── Constantes ───────────────────────────────────────────────────────────────────

_MEDIA_OUTLETS = re.compile(
    r"\b(IGN|Kotaku|Destructoid|Rock Paper Shotgun|RPS|Eurogamer|GameSpot|Polygon|"
    r"PC Gamer|GameInformer|Game Informer|Gamasutra|GamesRadar|Metacritic|"
    r"IndieDB|TouchArcade|Pocket Gamer|Hardcore Gamer|Gamezebo|Dpad Joy)\b",
    re.IGNORECASE,
)

_SCORE_PATTERN = re.compile(
    r"\b\d{1,3}(?:[.,]\d{1,2})?\s*/\s*\d{1,3}\b"
    r"|"
    r"\b[A-F][+-]?\b"
    r"|"
    r"\b(?:Gold|Silver|Bronze)\s+Award\b",
    re.IGNORECASE,
)

_IMAGE_URL = re.compile(
    r'https?://[^\s\'"<>]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s\'"<>]*)?'
    r'|'
    r'https?://(?:cdn\.akamai\.steamstatic\.com|steamcdn-a\.akamaihd\.net|'
    r'cdn\.cloudflare\.steamstatic\.com|store\.akamai\.steamstatic\.com|'
    r'shared\.akamai\.steamstatic\.com)[^\s\'"<>]*',
    re.IGNORECASE,
)

_ALL_URLS = re.compile(r'https?://[^\s\'"<>]+', re.IGNORECASE)


# ── Helpers ───────────────────────────────────────────────────────────────────────

def _collect_image_urls(raw_html: str) -> list[str]:
    return list(dict.fromkeys(_IMAGE_URL.findall(raw_html)))


def _html_to_text(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(separator=" ")
    text = html.unescape(text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def _remove_urls(text: str) -> str:
    return re.sub(r'https?://\S+', '', text).strip()


def _extract_press_quotes(raw_html: str) -> list[str]:
    soup = BeautifulSoup(raw_html, "html.parser")
    candidates = []

    for tag in soup.find_all(["blockquote", "q"]):
        candidates.append(tag.get_text(separator=" ").strip())

    plain_text = soup.get_text(separator=" ")
    for match in re.finditer(r'[""«]([^""»\n]{15,300})[""»]', plain_text):
        candidates.append(match.group(0).strip())

    quotes = []
    seen = set()
    for candidate in candidates:
        normalized = re.sub(r'\s+', ' ', candidate)
        if normalized in seen:
            continue
        if _SCORE_PATTERN.search(normalized) or _MEDIA_OUTLETS.search(normalized):
            seen.add(normalized)
            quotes.append(normalized)

    return quotes


def _remove_press_quotes(text: str, quotes: list[str]) -> str:
    for quote in quotes:
        clean_quote = re.sub(r'\s+', ' ', html.unescape(
            BeautifulSoup(quote, "html.parser").get_text(separator=" ")
        )).strip()
        if clean_quote:
            text = text.replace(clean_quote, '')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# ── Fonctions publiques ───────────────────────────────────────────────────────────

def clean_game_text(
    short_description: str | None,
    detailed_description: str | None,
) -> dict:
    """
    Nettoie les champs texte issus de l'API Steam.

    Retourne un dict avec :
      - short_description_clean       : str
      - detailed_description_clean    : str
      - press_quotes                  : list[str]
      - image_urls                    : list[str]
    """
    short_raw    = short_description    or ""
    detailed_raw = detailed_description or ""

    image_urls = list(dict.fromkeys(
        _collect_image_urls(short_raw) + _collect_image_urls(detailed_raw)
    ))

    short_clean    = _remove_urls(_html_to_text(short_raw))
    press_quotes   = _extract_press_quotes(detailed_raw)
    detailed_clean = _remove_press_quotes(_remove_urls(_html_to_text(detailed_raw)), press_quotes)

    return {
        "short_description_clean":    short_clean,
        "detailed_description_clean": detailed_clean,
        "press_quotes":               press_quotes,
        "image_urls":                 image_urls,
    }


def clean_supported_languages(raw: str | None) -> list[str]:
    """
    Transforme la chaîne HTML Steam des langues supportées en liste propre.

    Ex. entrée : 'English<strong>*</strong>, French<br><strong>*</strong>languages with full audio support'
    Ex. sortie : ['English', 'French']
    """
    if not raw:
        return []

    text = BeautifulSoup(raw, "html.parser").get_text(separator=",")
    text = re.split(r'\*\s*languages?\s+with\b', text, flags=re.IGNORECASE)[0]

    languages = [
        re.sub(r'[*#]', '', lang).strip()
        for lang in text.split(",")
    ]
    return [lang for lang in languages if lang]
