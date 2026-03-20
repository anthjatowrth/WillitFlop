-- ============================================================
-- init_airflow_user.sql — WillItFlop
-- ============================================================
-- Ce script est un GUIDE pour préparer Supabase manuellement
-- AVANT le premier `docker compose up`.
--
-- POURQUOI : Supabase cloud ne permet pas CREATE DATABASE.
-- On crée un SCHEMA dans la base existante "postgres".
--
-- À EXÉCUTER UNE SEULE FOIS dans l'éditeur SQL de Supabase
-- (ou via psql connecté en direct, pas via le pooler) :
-- ============================================================

-- 1. Crée le schéma dédié aux métadonnées Airflow
CREATE SCHEMA IF NOT EXISTS airflow;

-- 2. Donne tous les droits sur ce schéma à l'utilisateur postgres
GRANT ALL PRIVILEGES ON SCHEMA airflow TO postgres;

-- 3. S'assure que les futures tables créées dans ce schéma
--    sont également accessibles à postgres
ALTER DEFAULT PRIVILEGES IN SCHEMA airflow
    GRANT ALL ON TABLES TO postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA airflow
    GRANT ALL ON SEQUENCES TO postgres;
