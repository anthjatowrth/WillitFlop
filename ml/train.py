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

import json
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
import copy
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
    # NaN game_age_days (release_date NULL) → jeu ancien, poids maximal
    sample_weights = (df["game_age_days"] / 365.0).fillna(1.0).clip(lower=0.05, upper=1.0)

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

    # scale_pos_weight dynamique : nb_negatifs / nb_positifs sur le train set
    n_neg = (y_train == 0).sum()
    n_pos = (y_train == 1).sum()
    scale_pos_weight = round(n_neg / n_pos, 2)
    print(f"[train] scale_pos_weight calculé : {scale_pos_weight:.2f} ({n_neg} neg / {n_pos} pos)")
    xgb_params = copy.copy(XGBOOST_PARAMS)
    xgb_params["scale_pos_weight"] = scale_pos_weight

    # ------------------------------------------------------------------
    # 3. Cross-validation 5-fold sur le train set
    #
    # On utilise un Pipeline temporaire (preprocessor + modèle) pour que
    # le preprocessor soit fitté uniquement sur le fold d'entraînement
    # à chaque itération — évite toute fuite du TF-IDF et des MLB.
    # Note : sample_weights non utilisés en CV (estimation des métriques
    # uniquement) — ils sont appliqués uniquement au fit final ci-dessous.
    # ------------------------------------------------------------------
    print(f"\n[train] Cross-validation {CV_FOLDS}-fold en cours...")

    cv_pipeline = Pipeline([
        ("preprocessor", build_preprocessor()),
        ("model", XGBClassifier(**xgb_params, verbosity=0)),
    ])

    cv_results = cross_validate(
        cv_pipeline,
        X_train,
        y_train,
        cv=StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE),
        scoring=["roc_auc", "f1", "precision", "recall"],
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

    model = XGBClassifier(**xgb_params, verbosity=0)
    model.fit(X_train_t, y_train, sample_weight=w_train.values)

    # ------------------------------------------------------------------
    # 5. Sauvegarde des artifacts
    # ------------------------------------------------------------------
    ARTIFACTS_DIR.mkdir(exist_ok=True)

    with open(PREPROCESSOR_PATH, "wb") as f:
        pickle.dump(preprocessor, f)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    # Sauvegarde des résultats CV pour affichage dans evaluate.py
    cv_summary = {
        k: {"mean": float(v.mean()), "std": float(v.std()), "values": v.tolist()}
        for k, v in cv_results.items()
        if k.startswith("test_")
    }
    with open(ARTIFACTS_DIR / "cv_results.json", "w") as f:
        json.dump(cv_summary, f, indent=2)

    # Métriques sur le train set (référence pour détecter l'overfitting dans evaluate.py)
    from sklearn.metrics import roc_auc_score, f1_score
    train_proba = model.predict_proba(X_train_t)[:, 1]
    train_pred  = model.predict(X_train_t)
    train_metrics = {
        "roc_auc": float(roc_auc_score(y_train, train_proba)),
        "f1":      float(f1_score(y_train, train_pred)),
        "n_train": int(len(y_train)),
        "n_pos":   int(y_train.sum()),
    }
    with open(ARTIFACTS_DIR / "train_metrics.json", "w") as f:
        json.dump(train_metrics, f, indent=2)

    elapsed = time.time() - t0
    print(f"\n[train] Artifacts sauvegardés dans {ARTIFACTS_DIR}/")
    print(f"        - {PREPROCESSOR_PATH.name}")
    print(f"        - {MODEL_PATH.name}")
    print(f"[train] Terminé en {elapsed:.1f}s")
    print(f"[train] -> Lancer `python -m ml.evaluate` pour le rapport complet sur le test set")


if __name__ == "__main__":
    run_training()
