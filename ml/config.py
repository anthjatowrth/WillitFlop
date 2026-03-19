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

# Colonnes texte sentiment (avis joueurs) : TF-IDF indépendants
REVIEW_FEATURES = [
    "top_positive_reviews_text",
    "top_negative_reviews_text",
]

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
# scale_pos_weight compense le déséquilibre : ~83 % négatifs / ~17 % positifs
# Formule : nb_négatifs / nb_positifs ≈ 83 / 17 ≈ 4.9
SCALE_POS_WEIGHT = 4.9

XGBOOST_PARAMS = {
    "n_estimators":     400,
    "max_depth":        6,
    "learning_rate":    0.05,
    "subsample":        0.8,
    "colsample_bytree": 0.8,
    "scale_pos_weight": SCALE_POS_WEIGHT,
    "eval_metric":      "auc",
    "random_state":     RANDOM_STATE,
    "n_jobs":           -1,
}

# Nombre de folds pour la validation croisée stratifiée
CV_FOLDS = 5
