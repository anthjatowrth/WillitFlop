"""
Inférence WillitFlop — prédit si un jeu sera un succès ou un flop.

Retourne :
  - verdict         : "Top!" ou "Flop!"
  - proba           : probabilité de succès (float 0–1)
  - metacritic_score: note Metacritic fictive estimée (int, 40–95)

La note Metacritic est une estimation fictive calculée depuis la probabilité
de succès — elle n'est pas issue d'un modèle de régression entraîné sur des
données Metacritic réelles. Elle est affichée à titre indicatif/ludique.

Usage (library) :
    from ml.predict import predict

    result = predict({
        "price_eur": 14.99,
        "is_free": False,
        "has_dlc": False,
        "is_early_access": False,
        "achievement_count": 20,
        "nb_supported_languages": 5,
        "genres":     ["Action", "Indie"],
        "categories": ["Single-player", "Steam Achievements"],
        "tags":       ["Action", "Indie", "Platformer"],
        "short_description_clean": "A challenging platformer with pixel art graphics.",
    })
    # → {"verdict": "Top!", "proba": 0.72, "metacritic_score": 80}

Usage (CLI) :
    python -m ml.predict                         # exemple intégré
    python ml/predict.py                         # bouton play VSCode
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pickle
import random

import pandas as pd

from ml.config import (
    ARTIFACTS_DIR,
    BOOL_FEATURES,
    DECISION_THRESHOLD,
    METACRITIC_BASE,
    METACRITIC_RANGE,
    MODEL_PATH,
    MULTILABEL_FEATURES,
    NUMERIC_FEATURES,
    PREPROCESSOR_PATH,
    TEXT_FEATURE,
)

# ---------------------------------------------------------------------------
# Chargement des artifacts (lazy — chargés une seule fois au premier appel)
# ---------------------------------------------------------------------------

_preprocessor = None
_model = None


def _load_artifacts():
    global _preprocessor, _model
    if _preprocessor is None:
        with open(PREPROCESSOR_PATH, "rb") as f:
            _preprocessor = pickle.load(f)
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)


# ---------------------------------------------------------------------------
# Fonction principale
# ---------------------------------------------------------------------------

def predict(game: dict) -> dict:
    """
    Prédit si un jeu sera un succès (Top!) ou un flop (Flop!).

    Parameters
    ----------
    game : dict
        Caractéristiques du jeu. Toutes les clés sont optionnelles —
        les valeurs manquantes sont remplacées par des défauts neutres.

        Clés reconnues :
          price_eur              (float)  : prix en euros, ex: 14.99
          is_free                (bool)   : True si le jeu est gratuit
          has_dlc                (bool)   : True si des DLC sont prévus
          is_early_access        (bool)   : True si early access
          achievement_count      (int)    : nombre de succès Steam
          nb_supported_languages (int)    : nombre de langues supportées
          genres                 (list)   : ex: ["Action", "Indie"]
          categories             (list)   : ex: ["Single-player", "Co-op"]
          tags                   (list)   : ex: ["Roguelike", "Pixel Graphics"]
          short_description_clean(str)    : description courte du jeu

    Returns
    -------
    dict avec les clés :
      verdict          (str)   : "Top!" ou "Flop!"
      proba            (float) : probabilité de succès, arrondie à 2 décimales
      metacritic_score (float) : note fictive estimée (40–95), avec variation aléatoire ±2
    """
    _load_artifacts()

    # Valeurs par défaut neutres pour les champs manquants
    defaults = {
        "price_eur":               9.99,
        "is_free":                 False,
        "has_dlc":                 False,
        "is_early_access":         False,
        "achievement_count":       0,
        "nb_supported_languages":  1,
        "genres":                  [],
        "categories":              [],
        "tags":                    [],
        "short_description_clean": "",
    }
    merged = {**defaults, **game}

    # Conversion en DataFrame (le preprocessor attend un DataFrame pandas)
    row = {
        **{col: merged[col] for col in NUMERIC_FEATURES},
        **{col: merged[col] for col in BOOL_FEATURES},
        **{col: merged[col] for col in MULTILABEL_FEATURES},
        TEXT_FEATURE: merged[TEXT_FEATURE],
    }
    df = pd.DataFrame([row])

    # Transformation + prédiction
    X_t   = _preprocessor.transform(df)
    proba = float(_model.predict_proba(X_t)[0, 1])

    # Verdict binaire
    verdict = "Top!" if proba >= DECISION_THRESHOLD else "Flop!"

    # Note Metacritic fictive : mapping linéaire proba → [40, 95] + variation aléatoire ±2
    base_score = METACRITIC_BASE + METACRITIC_RANGE * proba
    noise = random.uniform(-2.0, 2.0)
    metacritic_score = round(max(40, min(95, base_score + noise)), 2)

    return {
        "verdict":          verdict,
        "proba":            round(proba, 2),
        "metacritic_score": metacritic_score,
    }


# ---------------------------------------------------------------------------
# Exemple CLI — pour tester rapidement
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    examples = [
        {
            "name": "Jeu AAA solo bien fini",
            "game": {
                "price_eur": 59.99,
                "is_free": False,
                "has_dlc": True,
                "is_early_access": False,
                "achievement_count": 50,
                "nb_supported_languages": 12,
                "genres": ["Action", "Adventure"],
                "categories": ["Single-player", "Full controller support", "Steam Achievements"],
                "tags": ["Action", "Adventure", "Story Rich", "Great Soundtrack", "Singleplayer"],
                "short_description_clean": (
                    "An epic action adventure with a rich story, stunning visuals, "
                    "and a deep combat system set in an open world."
                ),
            },
        },
        {
            "name": "Petit jeu indé gratuit",
            "game": {
                "price_eur": 0.0,
                "is_free": True,
                "has_dlc": False,
                "is_early_access": False,
                "achievement_count": 5,
                "nb_supported_languages": 2,
                "genres": ["Indie", "Casual"],
                "categories": ["Single-player"],
                "tags": ["Indie", "Casual", "Cute", "2D"],
                "short_description_clean": "A cute casual puzzle game for everyone.",
            },
        },
        {
            "name": "Early Access survival multijoueur",
            "game": {
                "price_eur": 19.99,
                "is_free": False,
                "has_dlc": False,
                "is_early_access": True,
                "achievement_count": 0,
                "nb_supported_languages": 4,
                "genres": ["Action", "Survival"],
                "categories": ["Multi-player", "Online Co-op", "PvP"],
                "tags": ["Survival", "Multiplayer", "Open World", "Early Access", "Co-op"],
                "short_description_clean": (
                    "A brutal multiplayer survival game. Gather resources, "
                    "build shelters, and fight other players to stay alive."
                ),
            },
        },
    ]

    print("=" * 55)
    print("  WillitFlop — Exemples de prediction")
    print(f"  Seuil Top/Flop : {DECISION_THRESHOLD}")
    print("=" * 55)

    for ex in examples:
        result = predict(ex["game"])
        print(f"\n  {ex['name']}")
        print(f"    Verdict          : {result['verdict']}")
        print(f"    Proba succes     : {result['proba']:.0%}")
        print(f"    Metacritic fictif: {result['metacritic_score']}/100")
