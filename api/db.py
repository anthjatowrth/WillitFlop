"""Shared database connection for all API routers.

Single source of truth for psycopg2 connection parameters.
Uses SSL (sslmode=require) and guards against a missing DB_HOST so that
misconfigured deployments fail fast with a clear 503 instead of a cryptic
psycopg2 OperationalError.
"""

import os

import psycopg2
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()


def get_conn():
    host = os.getenv("DB_HOST")
    if not host:
        raise HTTPException(status_code=503, detail="DB_HOST not configured")
    return psycopg2.connect(
        host=host,
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require",
    )
