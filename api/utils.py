"""Shared serialization utilities for API routers."""


def serialize(value):
    """Convert non-JSON-native types (e.g. date/datetime) to strings."""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def serialize_row(row: dict) -> dict:
    """Apply serialize() to every value in a DB result row dict."""
    return {k: serialize(v) for k, v in row.items()}
