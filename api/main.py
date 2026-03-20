"""
WillitFlop — Backend FastAPI

Endpoints :
  GET  /health   → vérifie que l'API tourne
  POST /predict  → prédit si un jeu sera un Top ou un Flop

Lancer en dev :
  uvicorn api.main:app --reload

Variables d'environnement :
  CORS_ORIGINS  : origines autorisées, séparées par des virgules
                  (défaut : http://localhost:5173)
"""

import os

import httpx
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import GameInput, PredictResponse, TranslateRequest
from ml.predict import predict

app = FastAPI(title="WillitFlop API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict_game(game: GameInput):
    # Les champs None sont exclus : predict() comble les manquants avec ses défauts
    result = predict(game.model_dump(exclude_none=True))
    return result


DEEPL_KEY = os.getenv("DEEPL_API_KEY", "").strip()
DEEPL_URL = "https://api-free.deepl.com/v2/translate"


@app.post("/translate")
def translate(body: TranslateRequest):
    if not DEEPL_KEY:
        raise HTTPException(status_code=503, detail="DeepL key not configured")

    response = httpx.post(
        DEEPL_URL,
        headers={"Authorization": f"DeepL-Auth-Key {DEEPL_KEY}"},
        json={"text": body.texts, "target_lang": "FR"},
        timeout=10,
    )
    response.raise_for_status()
    return {"translations": [t["text"] for t in response.json()["translations"]]}
