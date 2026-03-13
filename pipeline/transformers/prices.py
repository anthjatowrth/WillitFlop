from currency_converter import CurrencyConverter

_cc = CurrencyConverter()


def convert_price_to_eur(amount_cents: int | None, currency: str | None) -> float | None:
    """
    Convertit un prix en centimes (devise quelconque) vers des euros.

    Ex. : convert_price_to_eur(1999, 'USD') → ~1.84
          convert_price_to_eur(1499, 'EUR') → 14.99
          convert_price_to_eur(None, None)  → None  (jeu gratuit)
    """
    if amount_cents is None or currency is None:
        return None
    amount = int(amount_cents) / 100
    if currency == "EUR":
        return round(amount, 2)
    try:
        return round(_cc.convert(amount, currency, "EUR"), 2)
    except Exception:
        return None
