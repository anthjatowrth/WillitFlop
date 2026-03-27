-- Migration: add sentiment_score column to game_reviews
ALTER TABLE game_reviews
    ADD COLUMN IF NOT EXISTS sentiment_score FLOAT;

CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON game_reviews(sentiment_score);
