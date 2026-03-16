import html
import re
import csv
import io
from datetime import datetime
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

def clean_release_date(raw: str | None):
    """
    Convertit une date Steam en objet date Python.

    Formats gérés :
    - "1 Apr, 2005"  → DD Mon, YYYY
    - "May 8, 2014"  → Mon DD, YYYY
    """
    if not raw or not raw.strip():
        return None

    raw = raw.strip()

    for fmt in ("%d %b, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue

    return None


def clean_short_description(short_description: str | None) -> str:
    """Nettoie la description courte issue de l'API Steam (HTML retiré, URLs retirées)."""
    return _remove_urls(_html_to_text(short_description or ""))


def clean_supported_languages(raw: str | None) -> list[str]:
    """
    Transforme la chaîne HTML Steam des langues supportées en liste propre.

    Ex. entrée : 'English<strong>*</strong>, French<br><strong>*</strong>languages with full audio support'
    Ex. sortie : ['English', 'French']
    
    Gère les deux formats Steam :
    - Langues simples  : "English, French, German"
    - Langues quotées  : '"Spanish - Spain", "Portuguese - Brazil"'
    """
    if not raw:
        return []

    # Nettoyage HTML
    text = BeautifulSoup(raw, "html.parser").get_text(separator=", ")
    
    # Supprime la note de bas de page "* languages with full audio support"
    text = re.split(r'languages?\s+with\b', text, flags=re.IGNORECASE)[0]
    
    # Retire les marqueurs de note (* #) et espaces superflus
    text = re.sub(r'[*#]', '', text).strip()

    # csv.reader gère les guillemets : "Spanish - Spain" reste un seul token
    reader = csv.reader(io.StringIO(text), skipinitialspace=True)
    languages = next(reader, [])

    return [lang.strip() for lang in languages if lang.strip()]