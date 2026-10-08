"""
AegisRisk AI — Module A: Tactical Index Rebalancer
Subscribes to AI/NLP Risk Signals and dynamically tilts portfolio weights
across a 15-stock S&P benchmark basket within institutional risk limits.
"""

from datetime import datetime
from typing import Dict, List, Optional
import numpy as np

from nlp_engine import TICKER_MAP
from schemas import PortfolioState, RiskSignal, StockHolding


# Baseline starting prices (fallback when offline or market closed)
DEFAULT_PRICES: Dict[str, float] = {
    "AAPL": 228.50,
    "MSFT": 448.20,
    "NVDA": 132.80,
    "GOOGL": 182.40,
    "AMZN": 196.10,
    "META": 575.60,
    "TSLA": 242.30,
    "JPM": 218.40,
    "BAC": 41.50,
    "GS": 512.90,
    "XOM": 118.20,
    "CVX": 154.30,
    "JNJ": 162.80,
    "PFE": 28.70,
    "UNH": 586.40,
}


class TacticalIndexRebalancer:
    """
    Module A: Quantitative dynamic rebalancer adjusting weights based on sentiment tilt.
    """

    def __init__(self, gamma: float = 0.50, min_weight: float = 1.5, max_weight: float = 18.0):
        self.gamma = gamma  # Tilt sensitivity
        self.min_weight = min_weight  # Floor: 1.5%
        self.max_weight = max_weight  # Cap: 18.0%
        self.tickers = list(TICKER_MAP.keys())
        self.n_assets = len(self.tickers)
        self.base_weight = round(100.0 / self.n_assets, 2)  # ~6.67%
        
        # State tracking
        self.current_sentiments: Dict[str, float] = {t: 0.0 for t in self.tickers}
        self.current_weights: Dict[str, float] = {t: self.base_weight for t in self.tickers}
        self.prices: Dict[str, float] = DEFAULT_PRICES.copy()
        self.signals_processed: int = 0
        self.rebalance_history: List[Dict] = []
        
        # Normalize baseline
        self._normalize_weights()

    def update_prices(self, fetched_prices: Optional[Dict[str, float]] = None) -> None:
        """Updates stock market prices (from yfinance or live quote stream)."""
        if fetched_prices:
            self.prices.update(fetched_prices)

    def process_risk_signal(self, signal: RiskSignal) -> PortfolioState:
        """
        Consumes an incoming RiskSignal and calculates new portfolio weights.
        """
        self.signals_processed += 1
        ticker = signal.ticker

        # If it's a specific constituent ticker, update its sentiment state
        if ticker in self.tickers:
            # Exponential decay on past sentiment + new signal impact
            self.current_sentiments[ticker] = round(
                (self.current_sentiments[ticker] * 0.4) + (signal.sentiment_score * 0.6), 2
            )
        elif ticker == "MACRO":
            # Macro shock: tilt defensive vs aggressive sectors
            for t, info in TICKER_MAP.items():
                sector = info["sector"]
                if signal.sentiment_score < 0:
                    # Risk-off: defensive sectors (Healthcare, Energy) gain; Tech loses
                    if sector in ["Healthcare", "Energy"]:
                        self.current_sentiments[t] += 0.25 * abs(signal.sentiment_score)
                    elif sector in ["Technology", "Consumer Discretionary"]:
                        self.current_sentiments[t] -= 0.35 * abs(signal.sentiment_score)
                else:
                    # Risk-on
                    if sector in ["Technology", "Consumer Discretionary"]:
                        self.current_sentiments[t] += 0.25 * signal.sentiment_score

        # Apply Sentiment-Tilt optimization formula
        raw_weights = {}
        for t in self.tickers:
            sent = self.current_sentiments[t]
            impact_factor = (signal.impact_score / 10.0) if t == ticker else 0.5
            tilt = 1.0 + (self.gamma * sent * impact_factor)
            raw_weights[t] = self.base_weight * max(0.2, tilt)

        # Apply institutional constraints & normalize to 100%
        self._apply_constraints_and_normalize(raw_weights)

        # Record snapshot in history
        state = self.get_portfolio_state()
        self.rebalance_history.append({
            "timestamp": state.last_rebalanced_at.isoformat(),
            "trigger_signal": signal.signal_id,
            "trigger_ticker": signal.ticker,
            "weights": {h.ticker: h.current_weight for h in state.holdings}
        })

        return state

    def _apply_constraints_and_normalize(self, raw_weights: Dict[str, float]) -> None:
        """Clamps weights within [min_weight, max_weight] and normalizes sum to exactly 100%."""
        weights = np.array([raw_weights[t] for t in self.tickers], dtype=float)
        
        # Iterative projection to enforce both bounds and 100% sum
        for _ in range(10):
            # Clip
            weights = np.clip(weights, self.min_weight, self.max_weight)
            # Re-scale
            total = np.sum(weights)
            if total > 0:
                weights = (weights / total) * 100.0

        for i, t in enumerate(self.tickers):
            self.current_weights[t] = round(float(weights[i]), 2)

        # Ensure final exact rounding sum to 100.0
        self._normalize_weights()

    def _normalize_weights(self) -> None:
        """Guarantees sum of weights is exactly 100.00% without floating point drift."""
        current_sum = sum(self.current_weights.values())
        diff = round(100.0 - current_sum, 2)
        if diff != 0:
            first_ticker = self.tickers[0]
            self.current_weights[first_ticker] = round(self.current_weights[first_ticker] + diff, 2)

    def get_portfolio_state(self) -> PortfolioState:
        """Constructs and returns the full structured PortfolioState."""
        holdings = []
        for t in self.tickers:
            info = TICKER_MAP[t]
            holdings.append(
                StockHolding(
                    ticker=t,
                    company_name=info["name"],
                    sector=info["sector"],
                    base_weight=self.base_weight,
                    current_weight=self.current_weights[t],
                    last_sentiment=self.current_sentiments[t],
                    latest_price=self.prices.get(t, 100.0),
                    price_change_pct=round(self.current_sentiments[t] * 1.8, 2),
                )
            )

        return PortfolioState(
            holdings=holdings,
            total_weight=round(sum(self.current_weights.values()), 2),
            last_rebalanced_at=datetime.utcnow(),
            active_signals_count=self.signals_processed,
            sentiment_tilt_factor=self.gamma,
        )
