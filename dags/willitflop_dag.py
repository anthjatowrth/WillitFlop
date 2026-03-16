import os
from pathlib import Path
from datetime import datetime

import psycopg2  # ← ajout pour la connexion PostgreSQL
from airflow.decorators import dag, task
from airflow.operators.bash import BashOperator

PROJECT_ROOT = str(Path(__file__).parent.parent)
DBT_DIR      = os.path.join(PROJECT_ROOT, "dbt")


@dag(
    dag_id="willitflop_monthly",
    schedule="@monthly",
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["willitflop"],
    doc_md="""
    ## Pipeline mensuelle WillitFlop

    1. **collect_new_games** — nouveaux jeux qualifiants (collecte complète)
    2. **fix_null_prices** — remplace les price_eur NULL par la médiane des jeux payants
    3. **update_recent_games** — jeux < 1 an : owners + Twitch + reviews
    4. **update_old_games** — jeux > 1 an : owners uniquement
    5. **run_dbt** — reconstruit la table ml_features
    """,
)
def willitflop_monthly():

    @task()
    def collect_new_games():
        from pipeline.run import run_collect_new
        run_collect_new()

    @task()
    def fix_null_prices():
        """
        Remplace les price_eur NULL (jeux dépubliés ou sans prix renseigné)
        par la médiane calculée sur les jeux payants actifs.
        On exclut les jeux gratuits (is_free = TRUE) pour ne pas
        leur attribuer un prix erroné.
        """
        # Récupération des variables d'environnement
        # (les mêmes que dans ton .env)
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", 5432),
            dbname=os.getenv("DB_NAME", "willitflop"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD"),
        )

        try:
            with conn:  # with conn gère automatiquement le COMMIT/ROLLBACK
                with conn.cursor() as cur:

                    # Étape 1 : on vérifie combien de lignes sont concernées
                    # (utile pour les logs Airflow)
                    cur.execute("""
                        SELECT COUNT(*) FROM games
                        WHERE price_eur IS NULL
                          AND (is_free = FALSE OR is_free IS NULL)
                    """)
                    nb_null = cur.fetchone()[0]
                    print(f"[fix_null_prices] {nb_null} jeux avec price_eur NULL détectés")

                    if nb_null == 0:
                        # Rien à faire, on sort proprement
                        print("[fix_null_prices] Aucune correction nécessaire, on passe.")
                        return

                    # Étape 2 : calcul de la médiane + UPDATE en une seule requête
                    cur.execute("""
                        WITH mediane_prix AS (
                            SELECT PERCENTILE_CONT(0.5)
                                   WITHIN GROUP (ORDER BY price_eur) AS mediane
                            FROM games
                            WHERE price_eur IS NOT NULL
                              AND price_eur > 0
                              AND (is_free = FALSE OR is_free IS NULL)
                        )
                        UPDATE games
                        SET price_eur = ROUND(
                            (SELECT mediane FROM mediane_prix)::NUMERIC, 2
                        )
                        WHERE price_eur IS NULL
                          AND (is_free = FALSE OR is_free IS NULL)
                    """)

                    print(f"[fix_null_prices] {nb_null} prix NULL corrigés avec la médiane ✓")

        finally:
            # On ferme toujours la connexion, même en cas d'erreur
            conn.close()

    @task()
    def update_recent_games():
        from pipeline.run import run_update_recent
        run_update_recent()

    @task()
    def update_old_games():
        from pipeline.run import run_update_old
        run_update_old()

    run_dbt = BashOperator(
        task_id="run_dbt",
        bash_command=f"cd {DBT_DIR} && dbt run",
    )

    # ── Orchestration ──────────────────────────────────────────────────────────
    collect_new_games() >> fix_null_prices() >> update_recent_games() >> update_old_games() >> run_dbt


willitflop_monthly()