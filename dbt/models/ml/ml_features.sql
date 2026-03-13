-- Table ML finale : une ligne par jeu, toutes les features prêtes
select
    -- Identifiant
    g.app_id,

    -- Features numériques
    g.price_eur,
    g.achievement_count,
    g.metacritic_score,
    g.nb_supported_languages,
    g.review_total,
    g.spy_median_playtime,
    g.achievement_median_unlock_rate,

    -- Features booléennes
    g.is_free,
    g.has_dlc,
    g.is_early_access,

    -- Features multi-label (MultiLabelBinarizer côté sklearn)
    coalesce(t.tags,       array[]::text[]) as tags,
    coalesce(ge.genres,    array[]::text[]) as genres,
    coalesce(c.categories, array[]::text[]) as categories,

    -- Features texte (TF-IDF côté sklearn)
    g.short_description_clean,
    g.detailed_description_clean,
    r.top_positive_reviews_text,
    r.top_negative_reviews_text,

    -- Cible ML modèle 1
    g.is_successful,

    -- Cible ML modèle 2 (régression Metacritic, sous-ensemble non NULL)
    g.metacritic_score      as target_metacritic

from {{ ref('stg_games') }} g
left join {{ ref('ml_tags') }}       t  using (app_id)
left join {{ ref('ml_genres') }}     ge using (app_id)
left join {{ ref('ml_categories') }} c  using (app_id)
left join {{ ref('ml_reviews') }}    r  using (app_id)
