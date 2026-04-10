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

# Prix séparé pour appliquer une transformation log(1+x) avant passthrough.
# Réduit la sensibilité aux écarts absolus (diff 0€→10€ ≠ diff 50€→60€).
PRICE_FEATURE = "price_eur"

# Colonnes numériques continues : passthrough (XGBoost n'a pas besoin de scaling)
NUMERIC_FEATURES = [
    "achievement_count",
    "nb_supported_languages",
]

# Colonnes booléennes (True/False en PG → bool Python) : passthrough
BOOL_FEATURES = [
    "is_free",
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

# ---------------------------------------------------------------------------
# Pondération éditoriale des feature groups
# ---------------------------------------------------------------------------
# Technique : répétition de colonnes dans la matrice transformée.
# Pour les modèles arborescents (XGBoost), multiplier les valeurs ne change
# pas les splits — seule la répétition de colonnes augmente la probabilité
# d'échantillonnage lors de colsample_bytree.
#
# Tags x5, genres x3 : les choix gameplay/esthétiques dominent le signal.
# Texte réduit à 50 features : la description marketing dilue le signal tags.
TAGS_WEIGHT       = 5
GENRES_WEIGHT     = 3
CATEGORIES_WEIGHT = 2
TEXT_MAX_FEATURES = 50

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
    "n_estimators":     300,
    "max_depth":        4,     # réduit (6→4) : freine l'overfitting
    "learning_rate":    0.05,
    "subsample":        0.8,
    "colsample_bytree": 0.7,   # réduit (0.8→0.7) : plus de diversité par arbre
    "reg_alpha":        0.1,   # L1 : pousse les petits poids à 0 (sélection de features)
    "reg_lambda":       2.0,   # L2 : freine les poids extrêmes
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
