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

# Seuils pour is_successful (les deux conditions doivent être réunies)
SUCCESS_OWNERS_MIDPOINT   = 100_000
SUCCESS_WILSON_SCORE      = 0.75
