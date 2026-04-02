select
    -- Identifiant
    g.app_id,

    -- Features numériques
    g.price_eur,
    g.achievement_count,
    g.nb_supported_languages,

    -- Features booléennes
    g.is_free,
    g.is_early_access,

    -- Features multi-label 
    coalesce(t.tags,       array[]::text[]) as tags,
    coalesce(ge.genres,    array[]::text[]) as genres,
    coalesce(c.categories, array[]::text[]) as categories,

    -- Features texte 
    g.short_description_clean,

    -- Features sentiment
    coalesce(r.top_positive_reviews_text, '') as top_positive_reviews_text,
    coalesce(r.top_negative_reviews_text, '') as top_negative_reviews_text,

    -- Date de sortie (pour filtre)
    g.release_date,

    -- Cible ML modèle 1
    g.is_successful,

    -- Cible ML modèle 2 (régression Metacritic)
    nullif(g.metacritic_score, 0)           as target_metacritic

from {{ ref('stg_games') }} g
left join {{ ref('ml_tags') }}       t  using (app_id)
left join {{ ref('ml_genres') }}     ge using (app_id)
left join {{ ref('ml_categories') }} c  using (app_id)
left join {{ ref('ml_reviews') }}    r  using (app_id)
