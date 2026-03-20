-- ============================================================
-- Table : leaderboard_entries
-- Stocke les jeux qualifiés (top 5 succès / top 5 flop)
-- Reset mensuel implicite via le champ "period" (YYYY-MM)
-- ============================================================

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now(),
  period           text        NOT NULL,           -- ex: '2026-03'
  verdict          text        NOT NULL CHECK (verdict IN ('Top!', 'Flop!')),
  game_name        text        NOT NULL,
  genre            text,
  universe         text,
  game_mode        text,
  core_mechanic    text,
  visual_style     text,
  playtime         text,
  platforms        text[],
  pricing          text,
  proba            real        NOT NULL,           -- 0.0 → 1.0
  metacritic_score integer,
  cover_url        text                            -- URL publique Supabase Storage
);

-- Index pour les requêtes de classement (très rapide)
CREATE INDEX IF NOT EXISTS idx_leaderboard_period_verdict_proba
  ON leaderboard_entries (period, verdict, proba);

-- ── Supabase Storage : bucket pour les jaquettes ─────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-covers', 'game-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Politique : tout le monde peut uploader une image
CREATE POLICY "game_covers_insert_public"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'game-covers');

-- Politique : lecture publique des images
CREATE POLICY "game_covers_select_public"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'game-covers');

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Lecture publique (affichage du leaderboard)
CREATE POLICY "leaderboard_read_public"
  ON leaderboard_entries FOR SELECT
  TO anon USING (true);

-- Insertion publique (les visiteurs soumettent leurs jeux)
CREATE POLICY "leaderboard_insert_public"
  ON leaderboard_entries FOR INSERT
  TO anon WITH CHECK (true);

-- Suppression publique (on remplace le moins bon quand un meilleur arrive)
CREATE POLICY "leaderboard_delete_public"
  ON leaderboard_entries FOR DELETE
  TO anon USING (true);
