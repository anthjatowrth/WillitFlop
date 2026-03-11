-- ============================================================
-- Schema Steam Indie Games
-- ============================================================

CREATE TABLE IF NOT EXISTS games (
    app_id                  INTEGER PRIMARY KEY,

    -- ── Identité du jeu ───────────────────────────────────────────────────────
    name                    TEXT NOT NULL,
    is_free                 BOOLEAN,
    release_date            TEXT,
    has_dlc                 BOOLEAN DEFAULT FALSE,
    is_early_access         BOOLEAN DEFAULT FALSE,
    platform_windows        BOOLEAN,

    -- ── Prix (en centimes) ────────────────────────────────────────────────────
    price_currency          TEXT,
    price_initial           INTEGER,

    -- ── Popularité & succès commercial ────────────────────────────────────────
    review_total_positive   INTEGER,
    review_total_negative   INTEGER,
    spy_owners_min          INTEGER,        -- fourchette basse propriétaires (Steam Spy)
    spy_owners_max          INTEGER,        -- fourchette haute propriétaires (Steam Spy)
    spy_peak_ccu            INTEGER,        -- peak joueurs simultanés (Steam Spy)
    spy_fetched_at          TIMESTAMP,
    is_on_twitch            BOOLEAN DEFAULT FALSE,
    twitch_streams_count    INTEGER,
    twitch_viewers_count    INTEGER,
    twitch_fetched_at       TIMESTAMP,

    -- ── Qualité perçue ────────────────────────────────────────────────────────
    metacritic_score        INTEGER,
    spy_median_playtime     INTEGER,        -- temps de jeu médian en minutes (Steam Spy)

    -- ── Textes bruts (NLP) ────────────────────────────────────────────────────
    short_description       TEXT,
    detailed_description    TEXT,
    supported_languages     TEXT,

    -- ── Suivi de collecte ─────────────────────────────────────────────────────
    details_fetched         BOOLEAN DEFAULT FALSE,
    fetched_at              TIMESTAMP
);

-- Genres (ex: Action, Indie, RPG)
CREATE TABLE IF NOT EXISTS game_genres (
    app_id      INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    genre_id    TEXT,
    genre_name  TEXT,
    PRIMARY KEY (app_id, genre_id)
);

-- Catégories Steam (ex: Single-player, Co-op, Steam Achievements)
CREATE TABLE IF NOT EXISTS game_categories (
    app_id          INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    category_id     INTEGER,
    category_name   TEXT,
    PRIMARY KEY (app_id, category_id)
);

-- Tags Steam définis par les joueurs (ex: Roguelike, Pixel Art, Dark Humor)
CREATE TABLE IF NOT EXISTS game_tags (
    app_id      INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    tag_name    TEXT,
    votes       INTEGER,    -- nombre de votes joueurs sur ce tag
    PRIMARY KEY (app_id, tag_name)
);

-- Avis joueurs (top 100 EN + FR)
CREATE TABLE IF NOT EXISTS game_reviews (
    recommendation_id           BIGINT PRIMARY KEY,
    app_id                      INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    language                    TEXT,
    review                      TEXT,
    voted_up                    BOOLEAN,
    weighted_vote_score         FLOAT,
    votes_up                    INTEGER,
    timestamp_created           TIMESTAMP
);

-- ── Index ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_games_fetched          ON games(details_fetched);
CREATE INDEX IF NOT EXISTS idx_games_release_date     ON games(release_date);
CREATE INDEX IF NOT EXISTS idx_games_is_free          ON games(is_free);
CREATE INDEX IF NOT EXISTS idx_games_is_early_access  ON games(is_early_access);
CREATE INDEX IF NOT EXISTS idx_games_spy_owners       ON games(spy_owners_max);
CREATE INDEX IF NOT EXISTS idx_games_metacritic       ON games(metacritic_score);
CREATE INDEX IF NOT EXISTS idx_genres_name            ON game_genres(genre_name);
CREATE INDEX IF NOT EXISTS idx_tags_name              ON game_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_reviews_app_id         ON game_reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_reviews_language       ON game_reviews(language);
CREATE INDEX IF NOT EXISTS idx_reviews_voted_up       ON game_reviews(voted_up);
