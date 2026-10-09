"""
AegisRisk AI — Core AI/NLP Risk Engine
Transforms unstructured financial text into structured RiskSignal objects:
- Entity extraction & Ticker resolution (15 core benchmark equities + Macro)
- Financial Sentiment Scoring (-1.0 to +1.0)
- 7-Taxonomy Financial Event Classification
- Impact Severity Scoring (1.0 to 10.0)
- Explainability Rationale generation
"""

import re
import uuid
from typing import Dict, List, Optional, Tuple

from schemas import EventCategory, RawTextItem, RiskSignal


# 15 Core Benchmark Equities + Aliases
TICKER_MAP: Dict[str, Dict[str, any]] = {
    "AAPL": {"name": "Apple Inc.", "aliases": ["apple", "iphone", "tim cook", "$aapl", "ipad", "ios", "macbook"], "sector": "Technology"},
    "MSFT": {"name": "Microsoft Corp.", "aliases": ["microsoft", "azure", "satya nadella", "$msft", "windows", "copilot"], "sector": "Technology"},
    "NVDA": {"name": "NVIDIA Corp.", "aliases": ["nvidia", "jensen huang", "$nvda", "geforce", "blackwell", "rubin", "cuda"], "sector": "Technology"},
    "GOOGL": {"name": "Alphabet Inc.", "aliases": ["google", "alphabet", "sundar pichai", "$googl", "$goog", "youtube", "gemini", "waymo"], "sector": "Communication Services"},
    "AMZN": {"name": "Amazon.com Inc.", "aliases": ["amazon", "aws", "andy jassy", "$amzn", "prime", "trainium"], "sector": "Consumer Discretionary"},
    "META": {"name": "Meta Platforms Inc.", "aliases": ["meta", "facebook", "mark zuckerberg", "$meta", "instagram", "llama", "whatsapp"], "sector": "Communication Services"},
    "TSLA": {"name": "Tesla Inc.", "aliases": ["tesla", "elon musk", "$tsla", "cybertruck", "model y", "model 3", "gigafactory"], "sector": "Consumer Discretionary"},
    "JPM": {"name": "JPMorgan Chase & Co.", "aliases": ["jpmorgan", "chase", "jamie dimon", "$jpm"], "sector": "Financials"},
    "BAC": {"name": "Bank of America Corp.", "aliases": ["bank of america", "bofa", "brian moynihan", "$bac"], "sector": "Financials"},
    "GS": {"name": "Goldman Sachs Group Inc.", "aliases": ["goldman sachs", "goldman", "david solomon", "$gs"], "sector": "Financials"},
    "XOM": {"name": "Exxon Mobil Corp.", "aliases": ["exxon", "exxonmobil", "darren woods", "$xom"], "sector": "Energy"},
    "CVX": {"name": "Chevron Corp.", "aliases": ["chevron", "mike wirth", "$cvx"], "sector": "Energy"},
    "JNJ": {"name": "Johnson & Johnson", "aliases": ["johnson & johnson", "j&j", "$jnj"], "sector": "Healthcare"},
    "PFE": {"name": "Pfizer Inc.", "aliases": ["pfizer", "albert bourla", "$pfe"], "sector": "Healthcare"},
    "UNH": {"name": "UnitedHealth Group Inc.", "aliases": ["unitedhealth", "optum", "$unh"], "sector": "Healthcare"},
}

# Domain Lexicons calibrated for Financial Text
# Domain Lexicons calibrated for Financial Text & Sentiment Analysis
BULLISH_KEYWORDS = {
    "beat": 0.7, "beats": 0.7, "beating": 0.7,
    "surge": 0.8, "surges": 0.8, "surged": 0.8, "surging": 0.8,
    "soar": 0.85, "soars": 0.85, "soared": 0.85, "soaring": 0.85,
    "crush": 0.8, "crushes": 0.8, "crushed": 0.8, "crushing": 0.85,
    "record": 0.7, "breakthrough": 0.85, "breakthroughs": 0.85,
    "growth": 0.5, "grow": 0.5, "grows": 0.5, "growing": 0.5,
    "upgrade": 0.75, "upgraded": 0.75, "upgrades": 0.75, "upgrading": 0.75,
    "outperform": 0.7, "outperformed": 0.7, "outperforms": 0.7,
    "profit": 0.5, "profits": 0.5, "profitable": 0.6, "profitability": 0.6,
    "rally": 0.65, "rallies": 0.65, "rallied": 0.65, "rallying": 0.65,
    "boost": 0.6, "boosts": 0.6, "boosted": 0.6, "boosting": 0.6,
    "expansion": 0.5, "expand": 0.5, "expands": 0.5, "expanding": 0.5,
    "strong buy": 0.9, "buy rating": 0.8, "partnership": 0.55, "partners": 0.5,
    "success": 0.6, "successful": 0.6, "dividend": 0.45,
    "exceed": 0.65, "exceeds": 0.65, "exceeded": 0.65, "exceeding": 0.65,
    "gain": 0.5, "gains": 0.5, "gained": 0.5, "gaining": 0.5,
    "inflection": 0.6, "bullish": 0.75, "optimistic": 0.6, "top pick": 0.85,
    "unveil": 0.55, "unveils": 0.55, "unveiled": 0.55, "innovative": 0.65,
    "efficiency": 0.5, "accelerat": 0.6, "strong demand": 0.75, "windfall": 0.85,
}

BEARISH_KEYWORDS = {
    "miss": -0.65, "misses": -0.65, "missed": -0.65, "missing": -0.65,
    "fall": -0.5, "falls": -0.5, "falling": -0.5, "fell": -0.55,
    "plunge": -0.85, "plunges": -0.85, "plunged": -0.85, "plunging": -0.85,
    "tumble": -0.8, "tumbles": -0.8, "tumbled": -0.8, "tumbling": -0.8,
    "recall": -0.75, "recalls": -0.75, "recalled": -0.75, "recalling": -0.75,
    "investigation": -0.7, "investigates": -0.7, "investigating": -0.7,
    "probe": -0.7, "probes": -0.7, "probed": -0.7, "probing": -0.7,
    "lawsuit": -0.65, "lawsuits": -0.65, "sued": -0.65, "suing": -0.65,
    "downgrade": -0.75, "downgraded": -0.75, "downgrades": -0.75,
    "antitrust": -0.8, "loss": -0.6, "losses": -0.65, "losing": -0.55,
    "halt": -0.75, "halts": -0.75, "halted": -0.75, "halting": -0.75,
    "compress": -0.5, "cut": -0.55, "cuts": -0.55, "cutting": -0.55,
    "warning": -0.65, "warns": -0.65, "warned": -0.65, "layoff": -0.65, "layoffs": -0.65,
    "default": -0.9, "defaults": -0.9, "defaulted": -0.9, "fraud": -0.95,
    "fine": -0.6, "fines": -0.6, "fined": -0.6, "penalty": -0.65, "penalties": -0.65,
    "malfunction": -0.7, "malfunctions": -0.7, "defect": -0.7, "defects": -0.7,
    "slump": -0.75, "slumps": -0.75, "slumped": -0.75, "drop": -0.5, "drops": -0.5, "dropped": -0.5,
    "bearish": -0.75, "pessimistic": -0.6, "weakness": -0.55, "insolvent": -0.9,
    "bankrupt": -0.9, "bankruptcy": -0.95, "debt crisis": -0.85,
}

EVENT_TAXONOMY_PATTERNS = [
    (EventCategory.REGULATORY, [r"\bantitrust\b", r"\bprobe\b", r"\binvestigat\w*", r"\blawsuit\b", r"\bsec\b", r"\bdoj\b", r"\bfine\b", r"\bpenalt\w*", r"\bregulat\w+", r"\brecall\w*", r"\bdefect\b", r"\bcomplian\w*"]),
    (EventCategory.EARNINGS, [r"\bearnings\b", r"\brevenue\b", r"\bprofit\b", r"\bquarterly\b", r"\bq[1-4]\b", r"\bguidance\b", r"\beps\b", r"\bnet income\b", r"\bbeat\w*", r"\bmiss\w*"]),
    (EventCategory.PRODUCT_LAUNCH, [r"\bunveil\w*", r"\blaunch\w*", r"\barchitecture\b", r"\bchip\b", r"\bsuperchip\b", r"\bsdk\b", r"\bplatform\b", r"\bbreakthrough\b", r"\bannounc\w*"]),
    (EventCategory.MERGER_ACQUISITION, [r"\bacqui\w+", r"\bmerger\b", r"\bbuyout\b", r"\bdeal\b", r"\bventure\b", r"\btakeover\b", r"\bpartner\w*"]),
    (EventCategory.CREDIT_EVENT, [r"\bdefault\b", r"\bbankrupt\w*", r"\bdebt\b", r"\bliquidity\b", r"\brating downgrade\b", r"\bbond spread\b", r"\binsolven\w*"]),
    (EventCategory.MACROECONOMIC, [r"\bfederal reserve\b", r"\bfed\b", r"\binterest rate\b", r"\binflation\b", r"\bgdp\b", r"\bcpi\b", r"\bjobs report\b", r"\brate cut\b", r"\brate hike\b", r"\bfomc\b"]),
    (EventCategory.GEOPOLITICAL, [r"\btariff\b", r"\bsanction\b", r"\btrade war\b", r"\bopec\b", r"\bconflict\b", r"\bembargo\b", r"\bwar\b"]),
]


class NLPRiskEngine:
    """Sub-second NLP inference engine for financial risk intelligence."""

    def resolve_entity(self, text: str) -> Tuple[str, str]:
        """
        Extracts company ticker and entity name from text.
        Returns (ticker, company_name). Defaults to ('MACRO', 'Macro Market') if general news.
        """
        lower_text = text.lower()
        
        # Check ticker specific aliases
        for ticker, info in TICKER_MAP.items():
            if f"${ticker.lower()}" in lower_text or f" {ticker.lower()} " in f" {lower_text} ":
                return ticker, info["name"]
            for alias in info["aliases"]:
                pattern = r"\b" + re.escape(alias) + r"\b"
                if re.search(pattern, lower_text):
                    return ticker, info["name"]

        return "MACRO", "Macroeconomic Market"

    def classify_event(self, text: str) -> EventCategory:
        """Classifies text into one of 7 standardized financial event categories."""
        lower_text = text.lower()
        for category, patterns in EVENT_TAXONOMY_PATTERNS:
            for pat in patterns:
                if re.search(pat, lower_text):
                    return category
        return EventCategory.MACROECONOMIC

    def calculate_sentiment(self, text: str) -> float:
        """
        Computes financial sentiment score bounded strictly in [-1.0, +1.0].
        """
        lower_text = text.lower()
        words = re.findall(r"\b\w+\b", lower_text)
        
        scores: List[float] = []
        for word in words:
            if word in BULLISH_KEYWORDS:
                scores.append(BULLISH_KEYWORDS[word])
            elif word in BEARISH_KEYWORDS:
                scores.append(BEARISH_KEYWORDS[word])

        # Also check multi-word keyphrases
        for phrase, score in BULLISH_KEYWORDS.items():
            if " " in phrase and phrase in lower_text:
                scores.append(score)
        for phrase, score in BEARISH_KEYWORDS.items():
            if " " in phrase and phrase in lower_text:
                scores.append(score)

        if not scores:
            return 0.0

        # Mean sentiment weighted by amplitude
        raw_sentiment = sum(scores) / len(scores)
        # Clamp strictly to [-1.0, 1.0]
        return round(max(-1.0, min(1.0, raw_sentiment)), 2)


    def calculate_impact_score(self, sentiment: float, event_type: EventCategory, text: str) -> float:
        """
        Calculates market severity impact score between 1.0 and 10.0.
        Combines absolute sentiment intensity, event category gravity, and high-impact multipliers.
        """
        # Base impact from sentiment magnitude (0.0 to 1.0 -> 2.0 to 6.0)
        base_impact = 2.0 + (abs(sentiment) * 4.5)

        # Event category gravity adjustment
        category_weights = {
            EventCategory.MACROECONOMIC: 1.8,
            EventCategory.GEOPOLITICAL: 1.8,
            EventCategory.REGULATORY: 1.6,
            EventCategory.CREDIT_EVENT: 2.0,
            EventCategory.EARNINGS: 1.4,
            EventCategory.PRODUCT_LAUNCH: 1.3,
            EventCategory.MERGER_ACQUISITION: 1.5,
        }
        category_boost = category_weights.get(event_type, 1.0)
        total_impact = base_impact * (category_boost / 1.5)

        # High-impact catalyst words
        catalysts = ["crushing", "record", "recall", "antitrust", "halt", "breakthrough", "default", "soar", "plunge"]
        for cat in catalysts:
            if cat in text.lower():
                total_impact += 1.0
                break

        return round(max(1.0, min(10.0, total_impact)), 1)

    def generate_rationale(self, ticker: str, sentiment: float, event_type: EventCategory, impact: float) -> str:
        """Generates clear, auditor-friendly 1-sentence plain-English explainability."""
        direction = "bullish catalyst" if sentiment > 0.1 else ("bearish headwind" if sentiment < -0.1 else "neutral development")
        sentiment_desc = "strongly" if abs(sentiment) >= 0.7 else "moderately"
        
        if ticker == "MACRO":
            return f"{event_type.value} event creates {sentiment_desc} {direction} across broader indices with severity {impact}/10."
        return f"{event_type.value} signal detected for {ticker}, indicating {sentiment_desc} {direction} with {impact}/10 market impact rating."

    def analyze(self, raw_item: RawTextItem) -> RiskSignal:
        """End-to-end NLP pipeline: Ingests RawTextItem -> Emits RiskSignal."""
        ticker, company_name = self.resolve_entity(raw_item.headline)
        event_type = self.classify_event(raw_item.headline)
        sentiment = self.calculate_sentiment(raw_item.headline)
        impact = self.calculate_impact_score(sentiment, event_type, raw_item.headline)
        rationale = self.generate_rationale(ticker, sentiment, event_type, impact)

        return RiskSignal(
            signal_id=f"sig_{uuid.uuid4().hex[:8]}",
            raw_item_id=raw_item.id,
            ticker=ticker,
            company_name=company_name,
            sentiment_score=sentiment,
            event_type=event_type,
            impact_score=impact,
            rationale=rationale,
            confidence=0.94 if ticker != "MACRO" else 0.88,
        )
