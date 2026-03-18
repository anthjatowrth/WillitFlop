"""
Évaluation du modèle WillitFlop sur le test set.

Produit :
  - Rapport de classification complet (console)
  - artifacts/roc_curve.png
  - artifacts/precision_recall_curve.png
  - artifacts/threshold_analysis.png
  - artifacts/shap_summary.png

Pré-requis : avoir lancé `python -m ml.train` au préalable.

Usage :
    python -m ml.evaluate           # sauvegarde les PNG dans artifacts/
    python -m ml.evaluate --show    # idem + ouvre les fenêtres matplotlib
    python ml/evaluate.py --show    # bouton play VSCode
"""

# Permet l'exécution directe (VSCode play button) en plus de `python -m ml.evaluate`
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import argparse
import pickle

import matplotlib.pyplot as plt
import numpy as np
import shap
from sklearn.metrics import (
    RocCurveDisplay,
    PrecisionRecallDisplay,
    classification_report,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

from ml.config import (
    ARTIFACTS_DIR,
    MODEL_PATH,
    PREPROCESSOR_PATH,
    RANDOM_STATE,
    TARGET,
    TEST_SIZE,
)
from ml.data.loader import load_features


def _load_artifacts():
    """Charge preprocessor + modèle depuis les .pkl."""
    with open(PREPROCESSOR_PATH, "rb") as f:
        preprocessor = pickle.load(f)
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    return preprocessor, model


def _rebuild_test_set():
    """
    Reconstruit X_test / y_test avec le même split que train.py.
    RANDOM_STATE fixe garantit un résultat identique sans sauvegarder les données.
    """
    df = load_features()
    X = df.drop(columns=[TARGET, "app_id"])
    y = df[TARGET].astype(int)
    _, X_test, _, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    return X_test, y_test


def _plot_roc(model, X_test_t, y_test, show: bool = False):
    """Courbe ROC + aire sous la courbe."""
    fig, ax = plt.subplots(figsize=(6, 5))
    RocCurveDisplay.from_estimator(model, X_test_t, y_test, ax=ax)
    ax.plot([0, 1], [0, 1], linestyle="--", color="grey", label="Aléatoire")
    ax.set_title("Courbe ROC — test set")
    ax.legend()
    path = ARTIFACTS_DIR / "roc_curve.png"
    fig.savefig(path, dpi=120, bbox_inches="tight")
    if show:
        plt.show()
    plt.close(fig)
    print(f"  [evaluate] Sauvegardé : {path.name}")


def _plot_precision_recall(model, X_test_t, y_test, show: bool = False):
    """Courbe Precision-Recall — plus informative que ROC sur données déséquilibrées."""
    fig, ax = plt.subplots(figsize=(6, 5))
    PrecisionRecallDisplay.from_estimator(model, X_test_t, y_test, ax=ax)
    # Ligne de référence = ratio de positifs (classifier naïf)
    baseline = y_test.mean()
    ax.axhline(baseline, linestyle="--", color="grey", label=f"Baseline ({baseline:.0%} positifs)")
    ax.set_title("Courbe Precision-Recall — test set")
    ax.legend()
    path = ARTIFACTS_DIR / "precision_recall_curve.png"
    fig.savefig(path, dpi=120, bbox_inches="tight")
    if show:
        plt.show()
    plt.close(fig)
    print(f"  [evaluate] Sauvegardé : {path.name}")


def _plot_threshold_analysis(y_test, y_proba, show: bool = False):
    """
    F1 en fonction du seuil de décision.

    Avec 17% de positifs, le seuil optimal est souvent inférieur à 0.5.
    Ce graphique aide à choisir le seuil à utiliser dans predict.py.
    """
    from sklearn.metrics import f1_score

    thresholds = np.linspace(0.1, 0.9, 80)
    f1_scores = [
        f1_score(y_test, (y_proba >= t).astype(int), zero_division=0)
        for t in thresholds
    ]
    best_t = thresholds[np.argmax(f1_scores)]
    best_f1 = max(f1_scores)

    fig, ax = plt.subplots(figsize=(7, 4))
    ax.plot(thresholds, f1_scores, color="steelblue")
    ax.axvline(best_t, color="red", linestyle="--", label=f"Seuil optimal : {best_t:.2f} (F1={best_f1:.3f})")
    ax.axvline(0.5, color="grey", linestyle=":", label="Seuil par défaut : 0.5")
    ax.set_xlabel("Seuil de décision")
    ax.set_ylabel("F1 score")
    ax.set_title("F1 selon le seuil — test set")
    ax.legend()
    path = ARTIFACTS_DIR / "threshold_analysis.png"
    fig.savefig(path, dpi=120, bbox_inches="tight")
    if show:
        plt.show()
    plt.close(fig)
    print(f"  [evaluate] Sauvegardé : {path.name}")
    print(f"  [evaluate] Seuil optimal (F1 max) : {best_t:.2f}  →  à reporter dans predict.py si besoin")

    return best_t


def _plot_shap(model, X_test_t, feature_names, show: bool = False):
    """
    SHAP summary plot : impact de chaque feature sur la prédiction.

    - TreeExplainer : explainer natif XGBoost, très rapide.
    - On affiche les 20 features les plus importantes.

    Note : shap.summary_plot crée sa propre figure matplotlib en interne.
    On n'instancie pas de fig/ax séparé — on utilise plt.savefig directement
    pour éviter de sauvegarder une figure vide par erreur.
    """
    print("  [evaluate] Calcul des SHAP values (peut prendre ~30s)...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test_t)

    shap.summary_plot(
        shap_values,
        X_test_t,
        feature_names=feature_names,
        max_display=20,
        show=False,
        plot_size=(10, 8),
    )
    plt.title("SHAP — impact des features sur is_successful")
    plt.tight_layout()
    path = ARTIFACTS_DIR / "shap_summary.png"
    plt.savefig(path, dpi=120, bbox_inches="tight")
    if show:
        plt.show()
    plt.close()
    print(f"  [evaluate] Sauvegardé : {path.name}")


def run_evaluation(show: bool = False):
    # ------------------------------------------------------------------
    # Chargement
    # ------------------------------------------------------------------
    preprocessor, model = _load_artifacts()
    X_test, y_test = _rebuild_test_set()

    X_test_t = preprocessor.transform(X_test)
    y_proba  = model.predict_proba(X_test_t)[:, 1]
    y_pred   = model.predict(X_test_t)

    # ------------------------------------------------------------------
    # Rapport console
    # ------------------------------------------------------------------
    auc = roc_auc_score(y_test, y_proba)
    print("\n" + "=" * 55)
    print("  RAPPORT D'ÉVALUATION — test set")
    print("=" * 55)
    print(f"  ROC-AUC : {auc:.4f}\n")
    print(classification_report(y_test, y_pred, target_names=["not_successful", "successful"]))
    print("=" * 55)

    # ------------------------------------------------------------------
    # Graphiques
    # ------------------------------------------------------------------
    print("\n[evaluate] Génération des graphiques...")
    ARTIFACTS_DIR.mkdir(exist_ok=True)

    _plot_roc(model, X_test_t, y_test, show=show)
    _plot_precision_recall(model, X_test_t, y_test, show=show)
    _plot_threshold_analysis(y_test, y_proba, show=show)

    feature_names = preprocessor.get_feature_names_out()
    _plot_shap(model, X_test_t, feature_names, show=show)

    print("\n[evaluate] Terminé. Tous les graphiques sont dans artifacts/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--show",
        action="store_true",
        help="Ouvre les fenêtres matplotlib en plus de sauvegarder les PNG",
    )
    args = parser.parse_args()
    run_evaluation(show=args.show)
