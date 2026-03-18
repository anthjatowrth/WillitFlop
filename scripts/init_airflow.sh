#!/bin/bash
# ============================================================
# scripts/init_airflow.sh
# Exécuté par le service airflow-init au premier démarrage.
# PostgreSQL local gère la DB Airflow — aucune manipulation
# de schéma nécessaire, on lance directement les migrations.
# ============================================================
set -e

echo "=== Etape 1 : migration de la base Airflow ==="
airflow db migrate

echo "=== Etape 2 : creation de l'utilisateur admin ==="
# || true : pas d'erreur si l'utilisateur existe déjà
airflow users create \
    --username admin \
    --password admin \
    --firstname Pierre \
    --lastname Admin \
    --role Admin \
    --email admin@willitflop.com || true

echo "=== Initialisation terminee ==="
