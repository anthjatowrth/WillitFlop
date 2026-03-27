select
    app_id,
    name,
    is_free,
    has_dlc,
    is_early_access,
    price_eur,
    achievement_count,
    metacritic_score,
    array_length(supported_languages, 1)    as nb_supported_languages,
    short_description_clean,
    review_total,
    spy_median_playtime,
    achievement_median_unlock_rate,
    release_date,
    is_successful
from {{ source('public', 'games') }}
where details_fetched = true
  and is_successful is not null
