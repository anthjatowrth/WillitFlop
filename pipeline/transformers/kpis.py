import math
from pipeline.config import (
    SUCCESS_OWNERS_MIDPOINT,
    SUCCESS_WILSON_SCORE,
    SUCCESS_REVIEW_TOTAL,
    SUCCESS_MEDIAN_PLAYTIME,
    SUCCESS_ACH_UNLOCK_RATE,
    SUCCESS_MIN_SCORE,
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
    playtime: int | None,
    ach_median: float | None,
) -> dict:
    """
    Calcul pur des KPIs dérivés et du label is_successful.
    Aucun accès DB — prend des valeurs brutes, retourne un dict.

    Critères is_successful (SUCCESS_MIN_SCORE requis) :
      1. owners_midpoint >= SUCCESS_OWNERS_MIDPOINT
      2. review_wilson_score >= SUCCESS_WILSON_SCORE
      3. review_total >= SUCCESS_REVIEW_TOTAL
      4. spy_median_playtime >= SUCCESS_MEDIAN_PLAYTIME (min)
      5. achievement_median_unlock_rate >= SUCCESS_ACH_UNLOCK_RATE % (ignoré si NULL)
    """
    total    = (pos or 0) + (neg or 0)
    wilson   = wilson_score(pos or 0, total)
    midpoint = ((owners_min or 0) + (owners_max or 0)) // 2

    score = 0
    score += 1 if midpoint  >= SUCCESS_OWNERS_MIDPOINT else 0
    score += 1 if wilson    >= SUCCESS_WILSON_SCORE    else 0
    score += 1 if total     >= SUCCESS_REVIEW_TOTAL    else 0
    score += 1 if (playtime or 0) >= SUCCESS_MEDIAN_PLAYTIME else 0
    if ach_median is not None:
        score += 1 if ach_median >= SUCCESS_ACH_UNLOCK_RATE else 0

    return {
        "review_total":        total,
        "review_wilson_score": wilson,
        "owners_midpoint":     midpoint,
        "is_successful":       score >= SUCCESS_MIN_SCORE,
    }
