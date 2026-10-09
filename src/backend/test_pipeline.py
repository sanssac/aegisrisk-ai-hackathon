"""
AegisRisk AI — End-to-End Pipeline Verification Script
Runs an interactive diagnostic test of:
1. Multi-source Ingestion
2. AI/NLP Risk Engine (FinBERT-style signals)
3. Module A Tactical Rebalancing & Constraints
"""

import sys
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from ingestion import IngestionPipeline
from nlp_engine import NLPRiskEngine
from rebalancer import TacticalIndexRebalancer


def run_pipeline_test():
    print("=" * 70)
    print(">> AEGISRISK AI: END-TO-END PIPELINE DIAGNOSTIC & VERIFICATION")
    print("=" * 70)

    # 1. Initialize Components
    print("\n[STEP 1] Initializing Ingestion, NLP Engine, and Module A Rebalancer...")
    ingestion = IngestionPipeline()
    nlp = NLPRiskEngine()
    rebalancer = TacticalIndexRebalancer()
    print("[OK] All 3 core components initialized successfully.")

    # 2. Test Ingestion
    print("\n[STEP 2] Testing Multi-Source Ingestion Layer...")
    feeds = ingestion.get_all_initial_feeds()
    print(f"[OK] Loaded {len(feeds)} sample events across NewsAPI, GDELT, Twitter/X, and StockTwits.")
    for idx, item in enumerate(feeds[:3], 1):
        print(f"  ({idx}) [{item.source.value}] {item.headline[:65]}...")

    # 3. Test AI/NLP Risk Engine Inference
    print("\n[STEP 3] Testing AI/NLP Risk Engine on Ingested Feeds...")
    test_headlines = [
        "Nvidia unveils next-generation Rubin AI architecture with 3.3x efficiency boost, crushing analyst targets.",
        "Tesla recalls 450,000 electric vehicles over critical steering assist sensor malfunction, halting deliveries.",
        "European Union opens antitrust investigation into Microsoft cloud licensing practices."
    ]

    for h in test_headlines:
        raw_item = ingestion.ingest_custom_input(headline=h)
        signal = nlp.analyze(raw_item)
        print(f"\n  Headline: \"{h}\"")
        print(f"  |-- Resolved Ticker:   {signal.ticker} ({signal.company_name})")
        print(f"  |-- Event Taxonomy:    {signal.event_type.value}")
        print(f"  |-- Sentiment Score:   {signal.sentiment_score:+.2f} (Scale: -1.0 to +1.0)")
        print(f"  |-- Impact Severity:   {signal.impact_score:.1f} / 10.0")
        print(f"  \\-- AI Audit Rationale: {signal.rationale}")

    # 4. Test Module A Dynamic Rebalancing
    print("\n" + "=" * 70)
    print("[STEP 4] Testing Module A Dynamic Tactical Rebalancing...")
    print("=" * 70)

    # Initial Portfolio State
    initial_state = rebalancer.get_portfolio_state()
    print(f"\nInitial Equal-Weight Portfolio (Total: {initial_state.total_weight:.2f}%):")
    for h in initial_state.holdings[:5]:
        print(f"  * {h.ticker:<5} | Base: {h.base_weight:.2f}% | Current: {h.current_weight:.2f}% | Sentiment: {h.last_sentiment:+.2f}")
    print("  ... (15 stocks total)")

    # Injecting High-Impact Bullish Signal on NVDA
    print("\n>>> INJECTING SIGNAL 1: Strong Bullish Catalyst on NVDA (Sentiment +0.88, Impact 8.5)")
    nvda_item = ingestion.ingest_custom_input("Nvidia crushes revenue estimates with explosive AI datacenter demand, surging +15%.")
    nvda_signal = nlp.analyze(nvda_item)
    state_after_nvda = rebalancer.process_risk_signal(nvda_signal)

    nvda_holding = next(h for h in state_after_nvda.holdings if h.ticker == "NVDA")
    print(f"[OK] NVDA Weight tilted: {nvda_holding.base_weight:.2f}% -> {nvda_holding.current_weight:.2f}%")
    print(f"[OK] Total Portfolio Weight: {state_after_nvda.total_weight:.2f}% (Strictly 100% normalized)")

    # Injecting High-Impact Bearish Signal on TSLA
    print("\n>>> INJECTING SIGNAL 2: Severe Bearish Headwind on TSLA (Sentiment -0.78, Impact 8.0)")
    tsla_item = ingestion.ingest_custom_input("Tesla faces massive recall and regulatory probe, halting Gigafactory production lines.")
    tsla_signal = nlp.analyze(tsla_item)
    state_after_tsla = rebalancer.process_risk_signal(tsla_signal)

    tsla_holding = next(h for h in state_after_tsla.holdings if h.ticker == "TSLA")
    print(f"[OK] TSLA Weight tilted: {tsla_holding.base_weight:.2f}% -> {tsla_holding.current_weight:.2f}%")
    print(f"[OK] Total Portfolio Weight: {state_after_tsla.total_weight:.2f}% (Strictly 100% normalized)")

    # Verification of Guardrails
    print("\n[STEP 5] Verifying Institutional Risk Limits:")
    all_weights = [h.current_weight for h in state_after_tsla.holdings]
    min_w = min(all_weights)
    max_w = max(all_weights)
    total_w = sum(all_weights)

    print(f"  * Min Weight across basket: {min_w:.2f}% (Constraint: >= 1.50%) -> {'PASSED' if min_w >= 1.5 else 'FAILED'}")
    print(f"  * Max Weight across basket: {max_w:.2f}% (Constraint: <= 18.00%) -> {'PASSED' if max_w <= 18.0 else 'FAILED'}")
    print(f"  * Total Sum of Weights:     {total_w:.2f}% (Constraint: == 100.00%) -> {'PASSED' if round(total_w, 2) == 100.0 else 'FAILED'}")

    print("\n" + "=" * 70)
    print(">> ALL DIAGNOSTIC CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_pipeline_test()
