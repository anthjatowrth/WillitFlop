"""
Preprocessing pipeline WillitFlop.

ColumnTransformer appliqué au DataFrame issu de loader.py :

  ┌─────────────────────────────────────────────────────────────────┐
  │  num_bool   │ passthrough │ price_eur, achievement_count, ...   │
  │  tags       │ MLB wrapper │ ["Action","RPG", ...] → 0/1 columns │
  │  genres     │ MLB wrapper │ ["RPG","Indie", ...]  → 0/1 columns │
  │  categories │ MLB wrapper │ ["Single-player", ...]→ 0/1 columns │
  │  text       │ TF-IDF      │ short_description_clean             │
  └─────────────────────────────────────────────────────────────────┘

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
from sklearn.preprocessing import MultiLabelBinarizer

from ml.config import BOOL_FEATURES, MULTILABEL_FEATURES, NUMERIC_FEATURES, REVIEW_FEATURES, TEXT_FEATURE


class MultiLabelEncoder(BaseEstimator, TransformerMixin):
    """
    Wrapper sklearn-compatible pour MultiLabelBinarizer.

    Utilisé dans ColumnTransformer pour les colonnes contenant des listes
    (tags, genres, categories). Chaque instance apprend son propre
    vocabulaire lors du fit() et est sérialisée dans preprocessor.pkl.

    Input  : Series pandas de listes Python, ex: [["Action","RPG"], ["Indie"], ...]
    Output : numpy array dense (n_samples, n_classes)
    """

    def __init__(self):
        self.mlb_ = None  # instancié dans fit() pour respecter le pattern sklearn

    def fit(self, X, y=None):
        self.mlb_ = MultiLabelBinarizer(sparse_output=False)
        self.mlb_.fit(X)
        return self

    def transform(self, X, y=None):
        return self.mlb_.transform(X)

    def get_feature_names_out(self, input_features=None):
        """Expose les noms de classes pour ColumnTransformer.get_feature_names_out()."""
        return np.array(self.mlb_.classes_, dtype=object)


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
        # --- Numériques + booléens ----------------------------------------
        # XGBoost n'a pas besoin de normalisation : passthrough suffit.
        # Les booléens pandas (True/False) sont traités comme 1/0 nativement.
        (
            "num_bool",
            "passthrough",
            NUMERIC_FEATURES + BOOL_FEATURES,  # liste → DataFrame 2D passé tel quel
        ),

        # --- Multi-label : un encoder indépendant par colonne ---------------
        # Chaque MLB apprend son propre vocabulaire (tags ≠ genres ≠ categories).
        # Sélecteur en chaîne simple → Series 1D transmise au fit/transform.
        ("tags",       MultiLabelEncoder(), MULTILABEL_FEATURES[0]),  # "tags"
        ("genres",     MultiLabelEncoder(), MULTILABEL_FEATURES[1]),  # "genres"
        ("categories", MultiLabelEncoder(), MULTILABEL_FEATURES[2]),  # "categories"

        # --- Texte : TF-IDF description --------------------------------------
        # max_features=300 : on garde les 300 uni/bigrammes les plus discriminants.
        # ngram_range=(1,2) : capture les expressions clés ("open world",
        #   "early access", "battle royale") en plus des mots isolés.
        # sublinear_tf=True : remplace tf par log(1+tf), ce qui atténue
        #   l'impact des mots très répétés dans les longues descriptions.
        (
            "text",
            TfidfVectorizer(
                max_features=300,
                ngram_range=(1, 2),
                sublinear_tf=True,
            ),
            TEXT_FEATURE,  # chaîne simple → Series 1D
        ),

        # --- Texte : TF-IDF avis positifs ------------------------------------
        # max_features=100 : les avis sont plus bruités, vocabulaire réduit.
        # Les jeux sans avis ont une chaîne vide → vecteur zéro, pas d'erreur.
        (
            "positive_reviews",
            TfidfVectorizer(
                max_features=100,
                ngram_range=(1, 2),
                sublinear_tf=True,
            ),
            REVIEW_FEATURES[0],  # "top_positive_reviews_text"
        ),

        # --- Texte : TF-IDF avis négatifs ------------------------------------
        (
            "negative_reviews",
            TfidfVectorizer(
                max_features=100,
                ngram_range=(1, 2),
                sublinear_tf=True,
            ),
            REVIEW_FEATURES[1],  # "top_negative_reviews_text"
        ),
    ]

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",    # app_id et target exclus automatiquement
        sparse_threshold=0,  # output dense numpy array
    )
