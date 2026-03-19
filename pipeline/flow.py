"""
Pipeline ETL WillitFlop — orchestrée avec Prefect.

Étapes :
  1. collect_new_games   — nouveaux jeux qualifiants (Steam + SteamSpy)
  2. fix_null_prices     — remplace les price_eur NULL par la médiane des payants
  3. update_recent_games — jeux récents (cette année ou l'an dernier) : owners + Twitch + reviews + KPIs
  4. update_old_games    — jeux anciens (> 2 ans) : owners + Twitch + reviews + KPIs
  5. run_dbt             — reconstruit la table ml_features
"""

import subprocess
from pathlib import Path

from dotenv import load_dotenv
from prefect import flow, task

from pipeline.db import get_connection
from pipeline.run import run_collect_new, run_update_recent, run_update_old

load_dotenv()

DBT_DIR = Path(__file__).parent.parent / "dbt"


# ── Tasks ──────────────────────────────────────────────────────────────────────

@task(retries=3, log_prints=True)
def collect_new_games():
    """Collecte les nouveaux jeux qualifiants depuis SteamSpy/Steam."""
    run_collect_new()


@task(retries=3, log_prints=True)
def fix_null_prices():
    """Remplace les price_eur NULL par la médiane des jeux payants actifs."""
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT COUNT(*) FROM games
                    WHERE price_eur IS NULL
                      AND (is_free = FALSE OR is_free IS NULL)
                """)
                nb_null = cur.fetchone()[0]
                print(f"[fix_null_prices] {nb_null} jeux avec price_eur NULL détectés")

                if nb_null == 0:
                    print("[fix_null_prices] Aucune correction nécessaire.")
                    return

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
                print(f"[fix_null_prices] {nb_null} prix NULL corrigés avec la médiane.")
    finally:
        conn.close()


@task(retries=3, log_prints=True)
def update_recent_games():
    """Mise à jour des jeux récents (cette année ou l'an dernier) : owners + Twitch + reviews + KPIs."""
    run_update_recent()


@task(retries=3, log_prints=True)
def update_old_games():
    """Mise à jour des jeux anciens (> 2 ans) : owners + Twitch + reviews + KPIs."""
    run_update_old()


@task(retries=1, log_prints=True)
def run_dbt():
    """Reconstruit la table ml_features via dbt run."""
    result = subprocess.run(
        ["dbt", "run", "--profiles-dir", str(DBT_DIR)],
        cwd=DBT_DIR,
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.returncode != 0:
        raise RuntimeError(f"dbt run a échoué :\n{result.stderr}")


# ── Flow principal ─────────────────────────────────────────────────────────────

@flow(name="willitflop-etl", log_prints=True)
def willitflop_etl():
    """Pipeline ETL mensuelle WillitFlop."""
    collect = collect_new_games()
    fix = fix_null_prices(wait_for=[collect])
    recent = update_recent_games(wait_for=[fix])
    old = update_old_games(wait_for=[fix])
    run_dbt(wait_for=[recent, old])


if __name__ == "__main__":
    willitflop_etl()
