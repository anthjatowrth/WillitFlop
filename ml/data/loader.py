"""
Chargement des features ML depuis la vue dbt `ml_features`.

PostgreSQL retourne les colonnes array[] (tags, genres, categories) comme
des listes Python via psycopg2 — pas de transformation nécessaire ici,
le MultiLabelBinarizer les consomme directement.
"""
import os

import pandas as pd
import psycopg2
from dotenv import load_dotenv

from ml.config import (
    BOOL_FEATURES,
    MULTILABEL_FEATURES,
    NUMERIC_FEATURES,
    PRICE_FEATURE,
    TARGET,
    TEXT_FEATURE,
)

load_dotenv()

# Colonnes à sélectionner — identifiant inclus pour le debug/tracing
_COLUMNS = (
    ["app_id"]
    + [PRICE_FEATURE]
    + NUMERIC_FEATURES
    + BOOL_FEATURES
    + MULTILABEL_FEATURES
    + [TEXT_FEATURE]
    + [TARGET]
)


def _get_connection():
    """Connexion PostgreSQL via les variables d'environnement (.env ou Render)."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", 5432),
        dbname=os.getenv("DB_NAME", "willitflop"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def load_features() -> pd.DataFrame:
    """
    Charge la vue ml_features et retourne un DataFrame prêt pour le preprocessing.

    - Les arrays PG (tags, genres, categories) arrivent comme des listes Python.
    - Les lignes avec target NULL sont exclues (filtrées déjà dans stg_games,
      mais on double-vérifie pour sécurité).
    - app_id est conservé comme colonne (pas d'index) pour faciliter le debug.

    Returns:
        pd.DataFrame avec toutes les colonnes définies dans config.py
    """
    query = f"""
        SELECT {', '.join(_COLUMNS)},
               (CURRENT_DATE - release_date)::int AS game_age_days
        FROM   ml_features
        WHERE  {TARGET} IS NOT NULL
    """

    conn = _get_connection()
    try:
        df = pd.read_sql(query, conn)
    finally:
        conn.close()

    # Remplace les arrays NULL (LEFT JOIN sans correspondance) par des listes vides
    for col in MULTILABEL_FEATURES:
        df[col] = df[col].apply(lambda x: x if isinstance(x, list) else [])

    # Remplace le texte NULL par chaîne vide (TF-IDF l'accepte)
    df[TEXT_FEATURE] = df[TEXT_FEATURE].fillna("")

    # Les booléens peuvent arriver comme object en cas de NULL — on force bool
    for col in BOOL_FEATURES:
        df[col] = df[col].fillna(False).astype(bool)

    print(f"[loader] {len(df)} jeux chargés — {df[TARGET].sum()} positifs "
          f"({df[TARGET].mean():.1%})")

    return df
