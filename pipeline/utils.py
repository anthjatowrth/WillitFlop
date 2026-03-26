"""
Shared utilities for the WillitFlop pipeline.
"""
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()


def compute_sentiment(text: str) -> float:
    """
    Compute VADER compound sentiment score for a given text.

    Returns a float in [-1, 1]:
      > 0.05  → positive
      < -0.05 → negative
      else    → neutral
    """
    if not text or not text.strip():
        return 0.0
    return _analyzer.polarity_scores(text)["compound"]
