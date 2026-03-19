"""
Configuration centrale du module ML WillitFlop.
Tous les autres fichiers importent leurs constantes depuis ici.
"""
from pathlib import Path

# ---------------------------------------------------------------------------
# Chemins
# ---------------------------------------------------------------------------
ARTIFACTS_DIR     = Path(__file__).parent / "artifacts"
MODEL_PATH        = ARTIFACTS_DIR / "model.pkl"
PREPROCESSOR_PATH = ARTIFACTS_DIR / "preprocessor.pkl"

# ---------------------------------------------------------------------------
# Features — doit correspondre exactement aux colonnes de ml_features (dbt)
# ---------------------------------------------------------------------------

# Colonnes numériques continues : passthrough (XGBoost n'a pas besoin de scaling)
NUMERIC_FEATURES = [
    "price_eur",
    "achievement_count",
    "nb_supported_languages",
]

# Colonnes booléennes (True/False en PG → bool Python) : passthrough
BOOL_FEATURES = [
    "is_free",
    "has_dlc",
    "is_early_access",
]

# Colonnes contenant des listes Python (arrays PG) : MultiLabelBinarizer par colonne
MULTILABEL_FEATURES = [
    "tags",
    "genres",
    "categories",
]

# Colonne texte libre : TF-IDF
TEXT_FEATURE = "short_description_clean"

# Colonne cible
TARGET = "is_successful"

# ---------------------------------------------------------------------------
# Découpage train / test
# ---------------------------------------------------------------------------
TEST_SIZE    = 0.2   # 20 % des données réservés pour l'évaluation finale
RANDOM_STATE = 42    # reproductibilité

# ---------------------------------------------------------------------------
# Hyperparamètres XGBoost (point de départ — tuning ultérieur si besoin)
# ---------------------------------------------------------------------------
XGBOOST_PARAMS = {
    "n_estimators":     400,
    "max_depth":        6,
    "learning_rate":    0.05,
    "subsample":        0.8,
    "colsample_bytree": 0.8,
    # scale_pos_weight est calculé dynamiquement dans train.py depuis y_train
    "eval_metric":      "auc",
    "random_state":     RANDOM_STATE,
    "n_jobs":           -1,
}

# Nombre de folds pour la validation croisée stratifiée
CV_FOLDS = 5

# ---------------------------------------------------------------------------
# Inférence
# ---------------------------------------------------------------------------

# Seuil de décision Top / Flop (F1-optimal sur le test set)
DECISION_THRESHOLD = 0.57

# Mapping probabilité → note Metacritic fictive
# score = METACRITIC_BASE + METACRITIC_RANGE * proba
# proba=0.0 → 40  |  proba=0.57 → 71  |  proba=1.0 → 95
METACRITIC_BASE  = 40
METACRITIC_RANGE = 55
