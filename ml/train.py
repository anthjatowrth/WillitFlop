"""
Entraînement du modèle WillitFlop — XGBoost classifier.

Étapes :
  1. Chargement des features depuis la vue ml_features (Supabase / local)
  2. Split stratifié train / test (80/20, seed fixe)
  3. Cross-validation 5-fold sur le train set → métriques CV
  4. Fit final preprocessor + modèle sur l'ensemble du train set
  5. Sauvegarde dans artifacts/preprocessor.pkl et artifacts/model.pkl

Usage :
    python -m ml.train            (depuis la racine du projet)
    python ml/train.py            (bouton play VSCode — path fix inclus)

Notes :
  - Le split est déterministe (RANDOM_STATE=42) : evaluate.py retrouve
    le même X_test sans qu'on ait besoin de sauvegarder les données.
  - Le preprocessor est fitté séparément du modèle pour permettre à
    evaluate.py d'accéder à la matrice transformée (nécessaire pour SHAP).
"""

# Permet l'exécution directe (VSCode play button) en plus de `python -m ml.train`
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pickle
import time

from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from ml.config import (
    ARTIFACTS_DIR,
    CV_FOLDS,
    MODEL_PATH,
    PREPROCESSOR_PATH,
    RANDOM_STATE,
    TARGET,
    TEST_SIZE,
    XGBOOST_PARAMS,
)
from ml.data.loader import load_features
from ml.preprocessing.pipeline import build_preprocessor


def run_training():
    t0 = time.time()

    # ------------------------------------------------------------------
    # 1. Chargement des données
    # ------------------------------------------------------------------
    df = load_features()

    # Poids proportionnels à l'ancienneté du jeu (ramp linéaire sur 365 jours).
    # Un jeu de 6 mois a un label is_successful peu fiable (pas assez de recul
    # sur les owners), donc on réduit son influence dans le gradient.
    # Cap à 1.0 : au-delà d'un an, le jeu est considéré "mature".
    sample_weights = (df["game_age_days"] / 365.0).clip(lower=0.0, upper=1.0)

    X = df.drop(columns=[TARGET, "app_id", "game_age_days"])
    y = df[TARGET].astype(int)

    # ------------------------------------------------------------------
    # 2. Split stratifié — conserve le ratio 17%/83% dans les deux splits
    # ------------------------------------------------------------------
    X_train, X_test, y_train, y_test, w_train, w_test = train_test_split(
        X, y, sample_weights,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    print(f"[train] Train : {len(X_train)} jeux — Test : {len(X_test)} jeux")
    print(f"[train] Positifs — train : {y_train.mean():.1%}  /  test : {y_test.mean():.1%}")

    # ------------------------------------------------------------------
    # 3. Cross-validation 5-fold sur le train set
    #
    # On utilise un Pipeline temporaire (preprocessor + modèle) pour que
    # le preprocessor soit fitté uniquement sur le fold d'entraînement
    # à chaque itération — évite toute fuite du TF-IDF et des MLB.
    # ------------------------------------------------------------------
    print(f"\n[train] Cross-validation {CV_FOLDS}-fold en cours...")

    cv_pipeline = Pipeline([
        ("preprocessor", build_preprocessor()),
        ("model", XGBClassifier(**XGBOOST_PARAMS, verbosity=0)),
    ])

    cv_results = cross_validate(
        cv_pipeline,
        X_train,
        y_train,
        cv=StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE),
        scoring=["roc_auc", "f1", "precision", "recall"],
        fit_params={"model__sample_weight": w_train.values},
        n_jobs=-1,
    )

    print("\n  Métriques CV (moyenne ± écart-type sur 5 folds) :")
    metrics = {
        "test_roc_auc":  "ROC-AUC",
        "test_f1":       "F1",
        "test_precision": "Precision",
        "test_recall":   "Recall",
    }
    for key, label in metrics.items():
        scores = cv_results[key]
        print(f"    {label:<12}  {scores.mean():.4f}  ±  {scores.std():.4f}")

    # ------------------------------------------------------------------
    # 4. Fit final sur l'ensemble du train set
    #
    # Preprocessor et modèle sont fittés séparément (pas dans un Pipeline)
    # pour pouvoir les sauvegarder indépendamment — evaluate.py a besoin
    # d'accéder à la matrice transformée brute pour calculer les SHAP values.
    # ------------------------------------------------------------------
    print("\n[train] Fit final sur le train set complet...")

    preprocessor = build_preprocessor()
    preprocessor.fit(X_train)
    X_train_t = preprocessor.transform(X_train)

    model = XGBClassifier(**XGBOOST_PARAMS, verbosity=0)
    model.fit(X_train_t, y_train, sample_weight=w_train.values)

    # ------------------------------------------------------------------
    # 5. Sauvegarde des artifacts
    # ------------------------------------------------------------------
    ARTIFACTS_DIR.mkdir(exist_ok=True)

    with open(PREPROCESSOR_PATH, "wb") as f:
        pickle.dump(preprocessor, f)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    elapsed = time.time() - t0
    print(f"\n[train] Artifacts sauvegardés dans {ARTIFACTS_DIR}/")
    print(f"        - {PREPROCESSOR_PATH.name}")
    print(f"        - {MODEL_PATH.name}")
    print(f"[train] Terminé en {elapsed:.1f}s")
    print(f"[train] → Lancer `python -m ml.evaluate` pour le rapport complet sur le test set")


if __name__ == "__main__":
    run_training()
