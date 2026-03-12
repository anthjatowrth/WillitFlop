import os
from pathlib import Path
from datetime import datetime

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
    2. **update_recent_games** — jeux < 1 an : owners + Twitch + reviews
    3. **update_old_games** — jeux > 1 an : owners uniquement
    4. **run_dbt** — reconstruit la table ml_features
    """,
)
def willitflop_monthly():

    @task()
    def collect_new_games():
        from pipeline.run import run_collect_new
        run_collect_new()

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

    collect_new_games() >> update_recent_games() >> update_old_games() >> run_dbt


willitflop_monthly()
