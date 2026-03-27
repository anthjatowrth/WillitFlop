import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    host = os.getenv("DB_HOST")
    if not host:
        raise EnvironmentError(
            "DB_HOST n'est pas défini. "
            "Vérifiez vos secrets GitHub (ou votre .env en local)."
        )
    return psycopg2.connect(
        host=host,
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require",  # requis pour Supabase
    )


def init_schema(conn):
    """Crée toutes les tables si elles n'existent pas encore."""
    schema_path = os.path.join(os.path.dirname(__file__), "..", "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print("Schema initialisé.")


def get_already_fetched(conn) -> set[int]:
    with conn.cursor() as cur:
        cur.execute("SELECT app_id FROM games WHERE details_fetched = TRUE")
        return {row[0] for row in cur.fetchall()}


def get_games_for_monthly_update(conn) -> dict[str, list[int]]:
    """
    Classifie les jeux déjà en base selon leur ancienneté.

    Retourne :
      - 'recent' : jeux sortis depuis moins d'un an (owners + Twitch + reviews)
      - 'old'    : jeux sortis il y a plus d'un an (owners uniquement)
    """
    import re
    from datetime import datetime

    # "Récent" = sorti cette année ou l'année précédente (approximation à l'année
    # faute de date précise stockée). Un jeu de janvier N-1 peut avoir jusqu'à
    # ~23 mois, mais c'est la meilleure résolution possible avec release_date TEXT.
    current_year = datetime.now().year
    threshold_year = current_year - 1

    with conn.cursor() as cur:
        cur.execute("SELECT app_id, release_date FROM games WHERE details_fetched = TRUE")
        rows = cur.fetchall()

    recent, old = [], []
    for app_id, release_date in rows:
        match = re.search(r'\b(19|20)\d{2}\b', str(release_date) if release_date is not None else "")
        if match and int(match.group()) >= threshold_year:
            recent.append(app_id)
        else:
            old.append(app_id)

    return {"recent": recent, "old": old}
