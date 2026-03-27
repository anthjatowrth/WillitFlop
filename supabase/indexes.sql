-- =============================================================================
-- WillitFlop — Index manquants (ÉTAPE 3)
-- =============================================================================
-- Tous les index utilisent IF NOT EXISTS → idempotents, sans risque de conflit.
-- À exécuter une seule fois dans Supabase SQL Editor.
-- =============================================================================


-- ── Tables de jointure (bras chauds des JOINs) ────────────────────────────────
-- game_tags est la table la plus lourde (~1 M lignes, 68 % du temps BDD).
-- Ces index couvrent les deux patterns : JOIN sur app_id ET filtre sur tag_name.

CREATE INDEX IF NOT EXISTS idx_game_tags_app_id
  ON game_tags(app_id);

CREATE INDEX IF NOT EXISTS idx_game_tags_tag_name
  ON game_tags(tag_name);

CREATE INDEX IF NOT EXISTS idx_game_genres_app_id
  ON game_genres(app_id);

CREATE INDEX IF NOT EXISTS idx_game_genres_genre_name
  ON game_genres(genre_name);

CREATE INDEX IF NOT EXISTS idx_game_categories_app_id
  ON game_categories(app_id);

CREATE INDEX IF NOT EXISTS idx_game_categories_category_name
  ON game_categories(category_name);


-- ── Filtres fréquents sur games ────────────────────────────────────────────────
-- Utilisés dans les WHERE des fonctions SQL (ÉTAPE 2) et des endpoints FastAPI.

CREATE INDEX IF NOT EXISTS idx_games_is_successful
  ON games(is_successful);

CREATE INDEX IF NOT EXISTS idx_games_release_date
  ON games(release_date);

CREATE INDEX IF NOT EXISTS idx_games_review_wilson_score
  ON games(review_wilson_score DESC);


-- ── Recherche textuelle ILIKE (useGameDatabase — filtre par nom) ───────────────
-- pg_trgm permet les index GIN sur les patterns ILIKE '%...%' et ILIKE '...%'.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_games_name_trgm
  ON games USING GIN (name gin_trgm_ops);
