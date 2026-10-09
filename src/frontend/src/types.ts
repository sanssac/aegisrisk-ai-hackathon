export type EventCategory =
  | 'Macroeconomic'
  | 'Geopolitical'
  | 'Credit Event'
  | 'Merger/Acquisition'
  | 'Product Launch'
  | 'Regulatory'
  | 'Earnings';

export type FeedSource =
  | 'NewsAPI'
  | 'GDELT'
  | 'Twitter/X'
  | 'StockTwits'
  | 'Interactive Simulator';

export interface RawTextItem {
  id: string;
  source: FeedSource;
  headline: string;
  url?: string;
  timestamp: string;
}

export interface RiskSignal {
  signal_id: string;
  raw_item_id: string;
  ticker: string;
  company_name: string;
  sentiment_score: number; // -1.0 to +1.0
  event_type: EventCategory;
  impact_score: number; // 1.0 to 10.0
  rationale: string;
  confidence: number;
  timestamp: string;
}

export interface StockHolding {
  ticker: string;
  company_name: string;
  sector: string;
  base_weight: number;
  current_weight: number;
  last_sentiment: number;
  latest_price: number;
  price_change_pct: number;
}

export interface PortfolioState {
  holdings: StockHolding[];
  total_weight: number;
  last_rebalanced_at: string;
  active_signals_count: number;
  sentiment_tilt_factor: number;
}

export interface RebalanceLogItem {
  timestamp: string;
  trigger_signal: string;
  trigger_ticker: string;
  weights: Record<string, number>;
}
