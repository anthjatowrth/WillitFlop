from pydantic import BaseModel


class TranslateRequest(BaseModel):
    texts: list[str]


class GameInput(BaseModel):
    price_eur: float | None = None
    is_free: bool | None = None
    is_early_access: bool | None = None
    achievement_count: int | None = None
    nb_supported_languages: int | None = None
    genres: list[str] | None = None
    categories: list[str] | None = None
    tags: list[str] | None = None
    short_description_clean: str | None = None


class PredictResponse(BaseModel):
    verdict: str
    proba: float
    metacritic_score: float
