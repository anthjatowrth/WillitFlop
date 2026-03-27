-- Migration : ajout du champ creator_name sur leaderboard_entries
-- À exécuter dans l'éditeur SQL de Supabase

ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS creator_name TEXT DEFAULT NULL;
