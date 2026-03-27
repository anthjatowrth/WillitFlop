-- ============================================================
-- mart: sentiment_by_genre
-- Average sentiment per Steam genre.
-- ============================================================
{{ config(materialized='table') }}

SELECT
    gg.genre_name,
    AVG(r.sentiment_score)                                               AS avg_sentiment,
    COUNT(CASE WHEN r.sentiment_score > 0.05 THEN 1 END)::float
        / NULLIF(COUNT(r.recommendation_id), 0)                          AS positive_ratio,
    COUNT(r.recommendation_id)                                           AS review_count

FROM {{ source('public', 'game_genres') }}  gg
JOIN {{ source('public', 'game_reviews') }} r  ON gg.app_id = r.app_id

WHERE r.language        = 'english'
  AND r.sentiment_score IS NOT NULL

GROUP BY gg.genre_name

ORDER BY avg_sentiment DESC
