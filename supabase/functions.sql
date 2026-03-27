-- =============================================================================
-- WillitFlop — Fonctions SQL d'agrégation (ÉTAPE 2)
-- =============================================================================
-- Toutes les fonctions sont idempotentes (CREATE OR REPLACE) et STABLE
-- (lecture seule, résultat identique pour les mêmes arguments dans une transaction).
--
-- Objectif : déplacer les agrégations depuis Python/JS vers la base de données
-- afin d'éviter les full table scans répétitifs côté applicatif.
--
-- Utilisation depuis FastAPI : cur.execute("SELECT * FROM get_xxx()")
-- Utilisation depuis Supabase RPC : supabase.rpc("get_xxx", {...}).execute()
-- =============================================================================


-- ── 1. Résumé marché (scalaires) ──────────────────────────────────────────────
-- Remplace les 4 COUNT/AVG/PERCENTILE_CONT éparpillés dans get_tendances().
-- Scanne games une seule fois ; sous-requêtes pour les tables de jointure.

CREATE OR REPLACE FUNCTION get_market_summary()
RETURNS TABLE(
    total_games          bigint,
    free_count           bigint,
    paid_count           bigint,
    success_count        bigint,
    fail_count           bigint,
    unique_genres        bigint,
    unique_categories    bigint,
    avg_metacritic       int,
    median_metacritic    int,
    pct_with_metacritic  int,
    avg_price_paid       numeric,
    median_price_paid    numeric
) LANGUAGE sql STABLE AS $$
  SELECT
    (SELECT COUNT(*)                                                            FROM games)::bigint,
    (SELECT COUNT(*) FILTER (WHERE is_free = true)                             FROM games)::bigint,
    (SELECT COUNT(*) FILTER (WHERE is_free = false)                            FROM games)::bigint,
    (SELECT COUNT(*) FILTER (WHERE is_successful = true)                       FROM games)::bigint,
    (SELECT COUNT(*) FILTER (WHERE is_successful = false)                      FROM games)::bigint,
    (SELECT COUNT(DISTINCT genre_name)                                         FROM game_genres)::bigint,
    (SELECT COUNT(DISTINCT category_name)                                      FROM game_categories)::bigint,
    (SELECT ROUND(AVG(metacritic_score))::int                                  FROM games WHERE metacritic_score > 0),
    (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metacritic_score)::int FROM games WHERE metacritic_score > 0),
    (SELECT ROUND(
        100.0 * COUNT(*) FILTER (WHERE metacritic_score > 0)
        / NULLIF(COUNT(*), 0))::int                                            FROM games),
    (SELECT ROUND(AVG(price_eur)::numeric, 2)                                  FROM games WHERE NOT is_free AND price_eur > 0),
    (SELECT ROUND(
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_eur)::numeric, 2)   FROM games WHERE NOT is_free AND price_eur > 0);
$$;


-- ── 2. Distribution des genres ────────────────────────────────────────────────
-- Remplace le full scan sur game_genres dans useTendances (fetch + groupBy JS).

CREATE OR REPLACE FUNCTION get_genre_distribution()
RETURNS TABLE(genre_name text, game_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT genre_name, COUNT(*) AS game_count
  FROM game_genres
  GROUP BY genre_name
  ORDER BY game_count DESC;
$$;


-- ── 3. Taux de succès par genre ────────────────────────────────────────────────
-- Remplace le double-scan game_genres × games dans useTendances/useTagAnalytics.
-- min_total : seuil minimum de jeux pour inclure un genre (5 pour marché, 20 pour analytics).

CREATE OR REPLACE FUNCTION get_genre_success_rates(min_total int DEFAULT 5)
RETURNS TABLE(genre_name text, game_count bigint, success_rate int)
LANGUAGE sql STABLE AS $$
  SELECT
    gg.genre_name,
    COUNT(*) AS game_count,
    ROUND(100.0 * SUM(CASE WHEN g.is_successful THEN 1 ELSE 0 END) / COUNT(*))::int AS success_rate
  FROM game_genres gg
  JOIN games g ON g.app_id = gg.app_id AND g.is_successful IS NOT NULL
  GROUP BY gg.genre_name
  HAVING COUNT(*) >= min_total
  ORDER BY success_rate DESC;
$$;


-- ── 4. Distribution des catégories ────────────────────────────────────────────
-- Remplace le full scan sur game_categories dans useTendances.

CREATE OR REPLACE FUNCTION get_category_distribution(limit_n int DEFAULT 15)
RETURNS TABLE(category_name text, game_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT category_name, COUNT(*) AS game_count
  FROM game_categories
  GROUP BY category_name
  ORDER BY game_count DESC
  LIMIT limit_n;
$$;


-- ── 5. Top tags (votes cumulés) ────────────────────────────────────────────────
-- Remplace le full scan sur game_tags (37,7 % du temps BDD, 31 756 appels).
-- Agrège les votes par tag plutôt que de transférer ~1 M de lignes vers Python.

CREATE OR REPLACE FUNCTION get_top_tags(limit_n int DEFAULT 30)
RETURNS TABLE(tag_name text, total_votes bigint)
LANGUAGE sql STABLE AS $$
  SELECT tag_name, SUM(votes) AS total_votes
  FROM game_tags
  GROUP BY tag_name
  ORDER BY total_votes DESC
  LIMIT limit_n;
$$;


-- ── 6. Jeux par année (2010–2025) + taux de succès ────────────────────────────
-- Remplace le groupBy JS sur ~100K lignes games.

CREATE OR REPLACE FUNCTION get_games_per_year()
RETURNS TABLE(year text, game_count bigint, success_rate int)
LANGUAGE sql STABLE AS $$
  SELECT
    EXTRACT(YEAR FROM release_date)::text AS year,
    COUNT(*) AS game_count,
    CASE
      WHEN SUM(CASE WHEN is_successful IS NOT NULL THEN 1 ELSE 0 END) >= 10
      THEN ROUND(
        100.0 * SUM(CASE WHEN is_successful = true  THEN 1 ELSE 0 END)
              / NULLIF(SUM(CASE WHEN is_successful IS NOT NULL THEN 1 ELSE 0 END), 0)
      )::int
      ELSE NULL
    END AS success_rate
  FROM games
  WHERE release_date IS NOT NULL
    AND EXTRACT(YEAR FROM release_date) BETWEEN 2010 AND 2025
  GROUP BY EXTRACT(YEAR FROM release_date)
  ORDER BY year;
$$;


-- ── 7. Saisonnalité — publications & succès par mois (Jan–Déc) ────────────────
-- month_idx : 0 = janvier … 11 = décembre (même convention que JS Date.getMonth()).

CREATE OR REPLACE FUNCTION get_release_by_month()
RETURNS TABLE(month_idx int, game_count bigint, success_rate int)
LANGUAGE sql STABLE AS $$
  SELECT
    (EXTRACT(MONTH FROM release_date) - 1)::int AS month_idx,
    COUNT(*) AS game_count,
    CASE
      WHEN SUM(CASE WHEN is_successful IS NOT NULL THEN 1 ELSE 0 END) >= 20
      THEN ROUND(
        100.0 * SUM(CASE WHEN is_successful = true  THEN 1 ELSE 0 END)
              / NULLIF(SUM(CASE WHEN is_successful IS NOT NULL THEN 1 ELSE 0 END), 0)
      )::int
      ELSE NULL
    END AS success_rate
  FROM games
  WHERE release_date IS NOT NULL
    AND EXTRACT(YEAR FROM release_date) BETWEEN 2010 AND 2025
  GROUP BY month_idx
  ORDER BY month_idx;
$$;


-- ── 8. Distribution des prix ───────────────────────────────────────────────────
-- Tranches identiques à celles du hook React : Gratuit / <5€ / 5–10€ / 10–20€ / >20€.

CREATE OR REPLACE FUNCTION get_price_distribution()
RETURNS TABLE(bucket text, game_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT bucket, COUNT(*) AS game_count
  FROM (
    SELECT
      CASE
        WHEN is_free OR price_eur IS NULL OR price_eur = 0 THEN 'Gratuit'
        WHEN price_eur < 5   THEN '< 5€'
        WHEN price_eur < 10  THEN '5–10€'
        WHEN price_eur < 20  THEN '10–20€'
        ELSE '> 20€'
      END AS bucket
    FROM games
  ) t
  GROUP BY bucket
  ORDER BY CASE bucket
    WHEN 'Gratuit' THEN 1 WHEN '< 5€' THEN 2
    WHEN '5–10€'   THEN 3 WHEN '10–20€' THEN 4 WHEN '> 20€' THEN 5
  END;
$$;


-- ── 9. Taux de succès par tranche de prix ─────────────────────────────────────

CREATE OR REPLACE FUNCTION get_price_success_rates()
RETURNS TABLE(bucket text, total_count bigint, success_rate int)
LANGUAGE sql STABLE AS $$
  SELECT
    bucket,
    COUNT(*) AS total_count,
    ROUND(100.0 * SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) / COUNT(*))::int AS success_rate
  FROM (
    SELECT
      is_successful,
      CASE
        WHEN is_free OR price_eur IS NULL OR price_eur = 0 THEN 'Gratuit'
        WHEN price_eur < 5   THEN '< 5€'
        WHEN price_eur < 10  THEN '5–10€'
        WHEN price_eur < 20  THEN '10–20€'
        ELSE '> 20€'
      END AS bucket
    FROM games
    WHERE is_successful IS NOT NULL
  ) t
  GROUP BY bucket
  ORDER BY CASE bucket
    WHEN 'Gratuit' THEN 1 WHEN '< 5€' THEN 2
    WHEN '5–10€'   THEN 3 WHEN '10–20€' THEN 4 WHEN '> 20€' THEN 5
  END;
$$;


-- ── 10. Distribution des scores Metacritic ────────────────────────────────────

CREATE OR REPLACE FUNCTION get_metacritic_distribution()
RETURNS TABLE(bucket text, game_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT bucket, COUNT(*) AS game_count
  FROM (
    SELECT
      CASE
        WHEN metacritic_score < 50 THEN '< 50'
        WHEN metacritic_score < 60 THEN '50–59'
        WHEN metacritic_score < 70 THEN '60–69'
        WHEN metacritic_score < 80 THEN '70–79'
        WHEN metacritic_score < 90 THEN '80–89'
        ELSE '90+'
      END AS bucket
    FROM games
    WHERE metacritic_score > 0
  ) t
  GROUP BY bucket
  ORDER BY CASE bucket
    WHEN '< 50' THEN 1 WHEN '50–59' THEN 2 WHEN '60–69' THEN 3
    WHEN '70–79' THEN 4 WHEN '80–89' THEN 5 WHEN '90+' THEN 6
  END;
$$;


-- ── 11. Taux de succès par score Metacritic ───────────────────────────────────

CREATE OR REPLACE FUNCTION get_metacritic_success_rates()
RETURNS TABLE(bucket text, total_count bigint, success_rate int)
LANGUAGE sql STABLE AS $$
  SELECT
    bucket,
    COUNT(*) AS total_count,
    ROUND(100.0 * SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) / COUNT(*))::int AS success_rate
  FROM (
    SELECT
      is_successful,
      CASE
        WHEN metacritic_score < 50 THEN '< 50'
        WHEN metacritic_score < 60 THEN '50–59'
        WHEN metacritic_score < 70 THEN '60–69'
        WHEN metacritic_score < 80 THEN '70–79'
        WHEN metacritic_score < 90 THEN '80–89'
        ELSE '90+'
      END AS bucket
    FROM games
    WHERE metacritic_score > 0 AND is_successful IS NOT NULL
  ) t
  GROUP BY bucket
  ORDER BY CASE bucket
    WHEN '< 50' THEN 1 WHEN '50–59' THEN 2 WHEN '60–69' THEN 3
    WHEN '70–79' THEN 4 WHEN '80–89' THEN 5 WHEN '90+' THEN 6
  END;
$$;


-- ── 12. Statistiques Twitch (scalaires) ───────────────────────────────────────
-- Retourne une seule ligne avec toutes les métriques Twitch.

CREATE OR REPLACE FUNCTION get_twitch_summary()
RETURNS TABLE(
    twitch_count            bigint,
    total_viewers           bigint,
    total_streams           bigint,
    twitch_success_rate     int,
    non_twitch_success_rate int,
    latest_fetched_at       text
) LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*) FILTER (WHERE is_on_twitch = true)::bigint,
    COALESCE(SUM(twitch_viewers_count) FILTER (WHERE is_on_twitch = true), 0)::bigint,
    COALESCE(SUM(twitch_streams_count) FILTER (WHERE is_on_twitch = true), 0)::bigint,
    ROUND(
      100.0 * SUM(CASE WHEN is_on_twitch = true  AND is_successful = true  THEN 1 ELSE 0 END)
            / NULLIF(SUM(CASE WHEN is_on_twitch = true  AND is_successful IS NOT NULL THEN 1 ELSE 0 END), 0)
    )::int,
    ROUND(
      100.0 * SUM(CASE WHEN is_on_twitch = false AND is_successful = true  THEN 1 ELSE 0 END)
            / NULLIF(SUM(CASE WHEN is_on_twitch = false AND is_successful IS NOT NULL THEN 1 ELSE 0 END), 0)
    )::int,
    TO_CHAR(MAX(twitch_fetched_at) FILTER (WHERE is_on_twitch = true), 'DD/MM/YYYY')
  FROM games;
$$;


-- ── 13. Top genres par audience Twitch ────────────────────────────────────────
-- Remplace le join JS game_genres × viewer_map dans useTendances.

CREATE OR REPLACE FUNCTION get_twitch_by_genre(limit_n int DEFAULT 10)
RETURNS TABLE(genre_name text, total_viewers bigint, game_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    gg.genre_name,
    SUM(g.twitch_viewers_count)::bigint AS total_viewers,
    COUNT(*)::bigint                    AS game_count
  FROM game_genres gg
  JOIN games g ON g.app_id = gg.app_id
    AND g.is_on_twitch = true
    AND g.twitch_viewers_count > 0
  GROUP BY gg.genre_name
  ORDER BY total_viewers DESC
  LIMIT limit_n;
$$;


-- ── 14. Top jeux (score Wilson) ───────────────────────────────────────────────
-- Remplace le sort JS sur ~100K lignes.

CREATE OR REPLACE FUNCTION get_top_games(limit_n int DEFAULT 25)
RETURNS TABLE(
    app_id               int,
    name                 text,
    header_image         text,
    release_date         date,
    review_wilson_score  float,
    metacritic_score     int,
    is_successful        boolean,
    price_eur            numeric,
    is_free              boolean,
    owners_midpoint      bigint,
    review_total         int,
    review_total_positive int
) LANGUAGE sql STABLE AS $$
  SELECT
    app_id, name, header_image, release_date, review_wilson_score,
    metacritic_score, is_successful, price_eur, is_free, owners_midpoint,
    review_total, review_total_positive
  FROM games
  WHERE review_wilson_score > 0 AND name IS NOT NULL
  ORDER BY review_wilson_score DESC
  LIMIT limit_n;
$$;


-- ── 15. Distribution playtime × taux de succès ────────────────────────────────
-- spy_median_playtime est en minutes.

CREATE OR REPLACE FUNCTION get_playtime_distribution()
RETURNS TABLE(bucket text, game_count bigint, success_rate int)
LANGUAGE sql STABLE AS $$
  SELECT
    bucket,
    COUNT(*) AS game_count,
    CASE WHEN COUNT(*) >= 5
      THEN ROUND(100.0 * SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) / COUNT(*))::int
      ELSE NULL
    END AS success_rate
  FROM (
    SELECT
      is_successful,
      CASE
        WHEN spy_median_playtime < 120   THEN '< 2h'
        WHEN spy_median_playtime < 300   THEN '2–5h'
        WHEN spy_median_playtime < 600   THEN '5–10h'
        WHEN spy_median_playtime < 1200  THEN '10–20h'
        WHEN spy_median_playtime < 3000  THEN '20–50h'
        ELSE '50h+'
      END AS bucket
    FROM games
    WHERE spy_median_playtime IS NOT NULL AND spy_median_playtime > 0
  ) t
  GROUP BY bucket
  ORDER BY CASE bucket
    WHEN '< 2h' THEN 1 WHEN '2–5h' THEN 2 WHEN '5–10h'  THEN 3
    WHEN '10–20h' THEN 4 WHEN '20–50h' THEN 5 WHEN '50h+' THEN 6
  END;
$$;


-- ── 16. Distribution achievement unlock rate × taux de succès ─────────────────
-- achievement_median_unlock_rate peut être en 0–1 ou 0–100 selon la source ;
-- on normalise : si la valeur > 1, déjà un pourcentage, sinon on multiplie par 100.

CREATE OR REPLACE FUNCTION get_achievement_distribution()
RETURNS TABLE(bucket text, game_count bigint, success_rate int)
LANGUAGE sql STABLE AS $$
  SELECT
    bucket,
    COUNT(*) AS game_count,
    CASE WHEN COUNT(*) >= 5
      THEN ROUND(100.0 * SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) / COUNT(*))::int
      ELSE NULL
    END AS success_rate
  FROM (
    SELECT
      is_successful,
      CASE
        WHEN (CASE WHEN achievement_median_unlock_rate > 1
                   THEN achievement_median_unlock_rate
                   ELSE achievement_median_unlock_rate * 100 END) < 10  THEN '< 10%'
        WHEN (CASE WHEN achievement_median_unlock_rate > 1
                   THEN achievement_median_unlock_rate
                   ELSE achievement_median_unlock_rate * 100 END) < 25  THEN '10–25%'
        WHEN (CASE WHEN achievement_median_unlock_rate > 1
                   THEN achievement_median_unlock_rate
                   ELSE achievement_median_unlock_rate * 100 END) < 50  THEN '25–50%'
        WHEN (CASE WHEN achievement_median_unlock_rate > 1
                   THEN achievement_median_unlock_rate
                   ELSE achievement_median_unlock_rate * 100 END) < 75  THEN '50–75%'
        ELSE '75%+'
      END AS bucket
    FROM games
    WHERE achievement_median_unlock_rate IS NOT NULL
  ) t
  GROUP BY bucket
  ORDER BY CASE bucket
    WHEN '< 10%' THEN 1 WHEN '10–25%' THEN 2 WHEN '25–50%' THEN 3
    WHEN '50–75%' THEN 4 WHEN '75%+' THEN 5
  END;
$$;


-- ── 17. Taux de succès par tag (useTagAnalytics) ──────────────────────────────
-- Remplace le full scan + join JS sur game_tags × games.
-- tag_names : liste des 49 tags suivis (passés en paramètre pour éviter le hard-coding SQL).
-- min_total  : seuil minimum de jeux pour inclure un tag.

CREATE OR REPLACE FUNCTION get_tag_success_rates(
    tag_names  text[],
    min_total  int DEFAULT 20
)
RETURNS TABLE(tag_name text, game_count bigint, success_rate int)
LANGUAGE sql STABLE AS $$
  SELECT
    gt.tag_name,
    COUNT(*) AS game_count,
    ROUND(100.0 * SUM(CASE WHEN g.is_successful THEN 1 ELSE 0 END) / COUNT(*))::int AS success_rate
  FROM game_tags gt
  JOIN games g ON g.app_id = gt.app_id AND g.is_successful IS NOT NULL
  WHERE gt.tag_name = ANY(tag_names)
  GROUP BY gt.tag_name
  HAVING COUNT(*) >= min_total
  ORDER BY game_count DESC;
$$;


-- ── 18. Taux de succès par catégorie (useTagAnalytics) ────────────────────────
-- Remplace le full scan sur game_categories × games pour le mode de jeu.

CREATE OR REPLACE FUNCTION get_category_success_rates(min_total int DEFAULT 20)
RETURNS TABLE(category_name text, game_count bigint, success_rate int)
LANGUAGE sql STABLE AS $$
  SELECT
    gc.category_name,
    COUNT(*) AS game_count,
    ROUND(100.0 * SUM(CASE WHEN g.is_successful THEN 1 ELSE 0 END) / COUNT(*))::int AS success_rate
  FROM game_categories gc
  JOIN games g ON g.app_id = gc.app_id AND g.is_successful IS NOT NULL
  GROUP BY gc.category_name
  HAVING COUNT(*) >= min_total
  ORDER BY game_count DESC;
$$;
