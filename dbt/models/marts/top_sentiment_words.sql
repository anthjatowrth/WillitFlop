-- ============================================================
-- mart: top_sentiment_words  (placeholder view)
-- ============================================================
-- NOTE: Word-frequency analysis is handled entirely in Python
-- by the FastAPI endpoint GET /sentiment/wordcloud.
-- That endpoint queries game_reviews directly, splits text,
-- removes stopwords, and returns the top-80 words per polarity.
--
-- This model exists only as a documentation anchor in dbt so
-- the full sentiment lineage is visible in the DAG.
-- ============================================================
{{ config(materialized='view') }}

SELECT
    'See GET /sentiment/wordcloud'                AS handled_by,
    'FastAPI + Python (collections.Counter)'      AS implementation,
    'game_reviews WHERE language = ''english'''   AS source_table
