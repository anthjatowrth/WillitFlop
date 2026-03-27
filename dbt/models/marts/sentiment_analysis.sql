-- ============================================================
-- mart: sentiment_analysis
-- Per-game sentiment aggregates for English reviews.
-- Requires: sentiment_score column populated in game_reviews.
-- ============================================================
{{ config(materialized='table') }}

SELECT
    g.app_id,
    g.name,
    g.is_successful,
    g.review_wilson_score,
    g.owners_midpoint,

    AVG(r.sentiment_score)                                                         AS avg_sentiment,

    COUNT(CASE WHEN r.sentiment_score >  0.05 THEN 1 END)::float
        / NULLIF(COUNT(r.recommendation_id), 0)                                    AS positive_sentiment_ratio,

    COUNT(CASE WHEN r.sentiment_score < -0.05 THEN 1 END)::float
        / NULLIF(COUNT(r.recommendation_id), 0)                                    AS negative_sentiment_ratio,

    COUNT(r.recommendation_id)                                                     AS review_count

FROM {{ source('public', 'games') }}        g
JOIN {{ source('public', 'game_reviews') }} r ON g.app_id = r.app_id

WHERE r.language        = 'english'
  AND r.sentiment_score IS NOT NULL

GROUP BY
    g.app_id, g.name, g.is_successful, g.review_wilson_score, g.owners_midpoint

HAVING COUNT(r.recommendation_id) >= 2
