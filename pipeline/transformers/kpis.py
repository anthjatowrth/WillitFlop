import math
from pipeline.config import (
    SUCCESS_OWNERS_MIDPOINT,
    SUCCESS_WILSON_SCORE,
)


def wilson_score(positive: int, total: int, z: float = 1.96) -> float:
    """Borne basse de l'intervalle de confiance Wilson à 95%."""
    if total == 0:
        return 0.0
    p = positive / total
    return (
        p + z**2 / (2 * total)
        - z * math.sqrt((p * (1 - p) + z**2 / (4 * total)) / total)
    ) / (1 + z**2 / total)


def compute_kpis(
    pos: int | None,
    neg: int | None,
    owners_min: int | None,
    owners_max: int | None,
) -> dict:
    """
    Calcul pur des KPIs dérivés et du label is_successful.
    Aucun accès DB — prend des valeurs brutes, retourne un dict.

    Critères is_successful (les deux conditions requises) :
      1. owners_midpoint >= SUCCESS_OWNERS_MIDPOINT
      2. review_wilson_score >= SUCCESS_WILSON_SCORE
    """
    total    = (pos or 0) + (neg or 0)
    wilson   = wilson_score(pos or 0, total)
    midpoint = ((owners_min or 0) + (owners_max or 0)) // 2

    return {
        "review_total":        total,
        "review_wilson_score": wilson,
        "owners_midpoint":     midpoint,
        "is_successful":       midpoint >= SUCCESS_OWNERS_MIDPOINT and wilson >= SUCCESS_WILSON_SCORE,
    }
