"""
AegisRisk AI — Pydantic Data Contracts & Schemas
Defines structured data models for:
1. Ingestion feeds (RawTextItem)
2. AI/NLP Risk Engine outputs (RiskSignal)
3. Module A Tactical Index Rebalancing (PortfolioState)
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class EventCategory(str, Enum):
    """Standardized 7-category financial event taxonomy."""
    MACROECONOMIC = "Macroeconomic"
    GEOPOLITICAL = "Geopolitical"
    CREDIT_EVENT = "Credit Event"
    MERGER_ACQUISITION = "Merger/Acquisition"
    PRODUCT_LAUNCH = "Product Launch"
    REGULATORY = "Regulatory"
    EARNINGS = "Earnings"


class FeedSource(str, Enum):
    """Supported multi-source ingestion channels."""
    NEWS_API = "NewsAPI"
    GDELT = "GDELT"
    TWITTER_X = "Twitter/X"
    STOCKTWITS = "StockTwits"
    SIMULATOR = "Interactive Simulator"


class RawTextItem(BaseModel):
    """Unstructured text input ingested from news wires or social feeds."""
    id: str = Field(..., description="Unique event ID")
    source: FeedSource = Field(..., description="Data provider or platform")
    headline: str = Field(..., description="Raw headline or tweet body")
    url: Optional[str] = Field(None, description="Source article URL if available")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Ingestion timestamp")


class RiskSignal(BaseModel):
    """
    Structured machine-readable risk intelligence output from AI/NLP Engine.
    Directly satisfies Section 2 requirements of the Hackathon Case Study.
    """
    signal_id: str = Field(..., description="Unique signal ID")
    raw_item_id: str = Field(..., description="Reference to the ingested raw item")
    ticker: str = Field(..., description="Target stock ticker (e.g. AAPL, NVDA, TSLA, or MACRO)")
    company_name: str = Field(..., description="Resolved company name")
    sentiment_score: float = Field(
        ...,
        ge=-1.0,
        le=1.0,
        description="Sentiment metric: -1.0 (extremely bearish) to +1.0 (extremely bullish)"
    )
    event_type: EventCategory = Field(..., description="Categorized financial event taxonomy")
    impact_score: float = Field(
        ...,
        ge=1.0,
        le=10.0,
        description="Market severity score: 1.0 (minor chatter) to 10.0 (systemic volatility shock)"
    )
    rationale: str = Field(..., description="1-sentence explainability audit trail")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0, description="Model classification confidence")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StockHolding(BaseModel):
    """Individual stock holding within the tactical index basket."""
    ticker: str
    company_name: str
    sector: str
    base_weight: float = Field(..., description="Initial benchmark baseline weight (e.g. 6.67%)")
    current_weight: float = Field(..., description="Dynamically adjusted active weight")
    last_sentiment: float = Field(0.0, description="Latest sentiment score received")
    latest_price: float = Field(0.0, description="Latest real-time market price (USD)")
    price_change_pct: float = Field(0.0, description="24h price change percentage")


class PortfolioState(BaseModel):
    """Complete state of the 15-stock Tactical Rebalanced Index (Module A)."""
    holdings: List[StockHolding]
    total_weight: float = Field(100.0, description="Guaranteed sum of weights (100%)")
    last_rebalanced_at: datetime = Field(default_factory=datetime.utcnow)
    active_signals_count: int = Field(0, description="Total NLP signals processed")
    sentiment_tilt_factor: float = Field(0.5, description="Tuning parameter gamma")
