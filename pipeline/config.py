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

# External API base URLs (collected here so changes propagate everywhere)
STEAMSPY_API_URL           = "https://steamspy.com/api.php"
STEAM_APPDETAILS_URL       = "https://store.steampowered.com/api/appdetails"
STEAM_APPREVIEWS_URL       = "https://store.steampowered.com/appreviews/{app_id}"
STEAM_ACHIEVEMENTS_URL     = "https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/"
TWITCH_OAUTH_URL           = "https://id.twitch.tv/oauth2/token"
TWITCH_HELIX_GAMES_URL     = "https://api.twitch.tv/helix/games"
TWITCH_HELIX_STREAMS_URL   = "https://api.twitch.tv/helix/streams"
