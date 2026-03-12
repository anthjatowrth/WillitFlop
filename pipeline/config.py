TARGET     = 500       # nombre de jeux à collecter
MIN_OWNERS = 20_000    # seuil minimum spy_owners_min pour filtrer les jeux obscurs

CATEGORY_WHITELIST = {
    "Single-player",
    "Multi-player",
    "Co-op",
    "Online Co-op",
    "Local Co-op",
    "PvP",
    "Online PvP",
    "Local Multi-Player",
    "Steam Achievements",
    "Full controller support",
    "Partial Controller Support",
    "Steam Workshop",
}

# Seuils pour le scoring is_successful (3 critères sur 5 requis)
SUCCESS_OWNERS_MIDPOINT   = 100_000
SUCCESS_WILSON_SCORE      = 0.75
SUCCESS_REVIEW_TOTAL      = 500
SUCCESS_MEDIAN_PLAYTIME   = 180     # minutes
SUCCESS_ACH_UNLOCK_RATE   = 20.0    # %
SUCCESS_MIN_SCORE         = 3
