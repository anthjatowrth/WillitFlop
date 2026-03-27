"""
Preprocessing pipeline WillitFlop.

ColumnTransformer appliqué au DataFrame issu de loader.py :

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  price_log  │ log(1+x)    │ price_eur → log-transformé                 │
  │  num_bool   │ passthrough │ achievement_count, nb_supported_languages...│
  │  tags       │ MLB x3      │ ["Action","RPG", ...] → colonnes x3 répétées│
  │  genres     │ MLB x2      │ ["RPG","Indie", ...]  → colonnes x2 répétées│
  │  categories │ MLB x2      │ ["Single-player", ...]→ colonnes x2 répétées│
  │  text       │ TF-IDF 100  │ short_description_clean (réduit de 300→100) │
  └─────────────────────────────────────────────────────────────────────────┘

Pondération éditoriale (v2) :
  - Tags x3, genres x2, categories x2 via répétition de colonnes.
  - Prix log-transformé : atténue la sensibilité aux grands écarts absolus.
  - Texte réduit à 100 features TF-IDF (vs 300 avant).

Pourquoi un wrapper MultiLabelEncoder ?
  MultiLabelBinarizer n'implémente pas get_feature_names_out() ni
  l'interface complète attendue par ColumnTransformer. Le wrapper corrige
  ça et garantit une sérialisation pickle correcte pour le déploiement.

Important — sélecteurs de colonnes :
  On passe les colonnes multi-label et texte comme chaînes simples (pas
  des listes), ce qui force ColumnTransformer à transmettre une Series 1D
  — format attendu par MLB et TfidfVectorizer.
"""

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import FunctionTransformer, MultiLabelBinarizer

from ml.config import (
    BOOL_FEATURES,
    CATEGORIES_WEIGHT,
    GENRES_WEIGHT,
    MULTILABEL_FEATURES,
    NUMERIC_FEATURES,
    PRICE_FEATURE,
    TAGS_WEIGHT,
    TEXT_FEATURE,
    TEXT_MAX_FEATURES,
)


class MultiLabelEncoder(BaseEstimator, TransformerMixin):
    """
    Wrapper sklearn-compatible pour MultiLabelBinarizer.

    Utilisé dans ColumnTransformer pour les colonnes contenant des listes
    (tags, genres, categories). Chaque instance apprend son propre
    vocabulaire lors du fit() et est sérialisée dans preprocessor.pkl.

    Input  : Series pandas de listes Python, ex: [["Action","RPG"], ["Indie"], ...]
    Output : numpy array dense (n_samples, n_classes * repeat)

    Paramètre repeat :
      Répète les colonnes binarisées `repeat` fois dans la matrice de sortie.
      Technique standard pour pondérer des features dans les modèles arborescents :
      XGBoost échantillonne les colonnes aléatoirement (colsample_bytree),
      donc répéter les colonnes augmente leur probabilité d'être sélectionnées.
      Note : multiplier les valeurs (0/1) ne changerait pas les splits d'un arbre.
    """

    def __init__(self, repeat: int = 1):
        self.repeat = repeat
        self.mlb_ = None  # instancié dans fit() pour respecter le pattern sklearn

    def fit(self, X, y=None):
        self.mlb_ = MultiLabelBinarizer(sparse_output=False)
        self.mlb_.fit(X)
        return self

    def transform(self, X, y=None):
        result = self.mlb_.transform(X)
        if self.repeat == 1:
            return result
        return np.tile(result, (1, self.repeat))

    def get_feature_names_out(self, input_features=None):
        """Expose les noms de classes pour ColumnTransformer.get_feature_names_out()."""
        classes = np.array(self.mlb_.classes_, dtype=object)
        if self.repeat == 1:
            return classes
        # Suffixe _w0, _w1, _w2 pour distinguer les colonnes dupliquées
        return np.concatenate([
            np.array([f"{c}_w{i}" for c in self.mlb_.classes_], dtype=object)
            for i in range(self.repeat)
        ])


def build_preprocessor() -> ColumnTransformer:
    """
    Construit et retourne un ColumnTransformer non fitté.

    Workflow :
        preprocessor = build_preprocessor()
        preprocessor.fit(X_train)          # apprend vocabulaires + TF-IDF
        X_transformed = preprocessor.transform(X)

    Le preprocessor fitté est sauvegardé dans artifacts/preprocessor.pkl
    et rechargé identiquement en inférence — les classes MLB et le
    vocabulaire TF-IDF sont préservés.

    sparse_threshold=0 : output toujours dense. XGBoost et SHAP
    fonctionnent avec les deux formats, mais le dense évite les cas
    limites lors du calcul des SHAP values sur de petits datasets.
    """
    transformers = [
        # --- Prix : log(1 + price_eur) ----------------------------------------
        # Atténue la sensibilité aux grands écarts de prix absolus.
        # La différence 0€→10€ a plus d'impact gameplay que 50€→60€.
        # FunctionTransformer avec validate=False pour accepter un DataFrame 1-col.
        (
            "price_log",
            FunctionTransformer(np.log1p, validate=False),
            [PRICE_FEATURE],  # liste → DataFrame 2D (1 col) passé au transformer
        ),

        # --- Autres numériques + booléens ------------------------------------
        # XGBoost n'a pas besoin de normalisation : passthrough suffit.
        # Les booléens pandas (True/False) sont traités comme 1/0 nativement.
        (
            "num_bool",
            "passthrough",
            NUMERIC_FEATURES + BOOL_FEATURES,  # liste → DataFrame 2D passé tel quel
        ),

        # --- Multi-label : pondération éditoriale par répétition de colonnes --
        # Chaque MLB apprend son propre vocabulaire (tags ≠ genres ≠ categories).
        # repeat=N → les colonnes binarisées apparaissent N fois dans la matrice,
        # ce qui augmente leur probabilité d'échantillonnage (colsample_bytree).
        # Sélecteur en chaîne simple → Series 1D transmise au fit/transform.
        ("tags",       MultiLabelEncoder(repeat=TAGS_WEIGHT),       MULTILABEL_FEATURES[0]),  # x3
        ("genres",     MultiLabelEncoder(repeat=GENRES_WEIGHT),     MULTILABEL_FEATURES[1]),  # x2
        ("categories", MultiLabelEncoder(repeat=CATEGORIES_WEIGHT), MULTILABEL_FEATURES[2]),  # x2

        # --- Texte : TF-IDF description (réduit) -----------------------------
        # max_features réduit de 300 → 100 : moins d'influence des descriptions
        # marketing, focus sur les features métier (tags/genres/categories).
        # ngram_range=(1,2) : capture "open world", "battle royale", etc.
        # sublinear_tf=True : log(1+tf) atténue les mots très répétés.
        (
            "text",
            TfidfVectorizer(
                max_features=TEXT_MAX_FEATURES,
                ngram_range=(1, 2),
                sublinear_tf=True,
                stop_words="english",
            ),
            TEXT_FEATURE,  # chaîne simple → Series 1D
        ),

    ]

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",    # app_id et target exclus automatiquement
        sparse_threshold=0,  # output dense numpy array
    )
