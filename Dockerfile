FROM apache/airflow:3.0.0

USER airflow
RUN pip install --no-cache-dir \
    CurrencyConverter \
    python-dotenv \
    psycopg2-binary
