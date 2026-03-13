import html
import re
from bs4 import BeautifulSoup


# ── Helpers ───────────────────────────────────────────────────────────────────────

def _html_to_text(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(separator=" ")
    text = html.unescape(text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def _remove_urls(text: str) -> str:
    return re.sub(r'https?://\S+', '', text).strip()


# ── Fonctions publiques ───────────────────────────────────────────────────────────

def clean_short_description(short_description: str | None) -> str:
    """Nettoie la description courte issue de l'API Steam (HTML retiré, URLs retirées)."""
    return _remove_urls(_html_to_text(short_description or ""))


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
