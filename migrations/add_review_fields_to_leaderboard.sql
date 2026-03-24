-- Migration : ajout des champs review_text et review_source sur leaderboard_entries
-- À exécuter dans l'éditeur SQL de Supabase

ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS review_text   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_source TEXT DEFAULT NULL;
