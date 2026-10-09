import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { HeadlineInjector } from './components/HeadlineInjector';
import { LiveFeedStream } from './components/LiveFeedStream';
import { MetricsBar } from './components/MetricsBar';
import { PerformanceChart } from './components/PerformanceChart';
import { RebalancerView } from './components/RebalancerView';
import { SignalCard } from './components/SignalCard';
import type { FeedSource, PortfolioState, RawTextItem, RiskSignal } from './types';

const API_BASE = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws/stream';

export const App: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [latestSignal, setLatestSignal] = useState<RiskSignal | null>(null);
  const [latestHeadline, setLatestHeadline] = useState<string>('');
  const [feeds, setFeeds] = useState<RawTextItem[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastUpdatedTicker, setLastUpdatedTicker] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const currentFeedIdxRef = useRef<number>(0);

  // 1. Initial Data Fetch via REST
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [portRes, feedsRes] = await Promise.all([
          fetch(`${API_BASE}/api/portfolio`),
          fetch(`${API_BASE}/api/feeds`),
        ]);

        if (portRes.ok) {
          const portData: PortfolioState = await portRes.json();
          setPortfolio(portData);
        }

        if (feedsRes.ok) {
          const feedsData: RawTextItem[] = await feedsRes.json();
          setFeeds(feedsData);
        }
      } catch (err) {
        console.warn('Backend REST unreachable, using fallback defaults:', err);
      }
    };

    fetchInitialData();
  }, []);

  // 2. WebSocket Connection Lifecycle
  useEffect(() => {
    let reconnectTimeout: number;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[WebSocket] Connected to AegisRisk signal bus.');
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'SNAPSHOT' && data.portfolio_state) {
              setPortfolio(data.portfolio_state);
            } else if (data.type === 'NEW_SIGNAL') {
              if (data.portfolio_state) setPortfolio(data.portfolio_state);
              if (data.risk_signal) {
                setLatestSignal(data.risk_signal);
                setLastUpdatedTicker(data.risk_signal.ticker);
              }
              if (data.raw_item) {
                setLatestHeadline(data.raw_item.headline);
                setFeeds((prev) => [data.raw_item, ...prev.filter((f) => f.id !== data.raw_item.id)]);
              }
            }
          } catch (e) {
            console.error('[WebSocket] Message parsing error:', e);
          }
        };

        ws.onclose = () => {
          console.log('[WebSocket] Disconnected. Attempting reconnect in 3s...');
          setWsConnected(false);
          reconnectTimeout = window.setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[WebSocket] Error:', err);
          ws.close();
        };
      } catch (e) {
        console.warn('[WebSocket] Connection failed:', e);
        reconnectTimeout = window.setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // 3. Analyze Custom Headline Handler
  const handleAnalyze = async (headline: string, source: FeedSource = 'Interactive Simulator') => {
    setIsAnalyzing(true);
    setLatestHeadline(headline);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, source }),
      });

      if (response.ok) {
        const data = await response.json();
        setLatestSignal(data.risk_signal);
        setPortfolio(data.portfolio_state);
        setLastUpdatedTicker(data.risk_signal.ticker);
        setFeeds((prev) => [data.raw_item, ...prev.filter((f) => f.id !== data.raw_item.id)]);
      } else {
        console.error('Analysis endpoint returned error:', response.statusText);
      }
    } catch (err) {
      console.error('Error invoking analyze endpoint:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Reset Portfolio Handler
  const handleResetPortfolio = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/portfolio/reset`, { method: 'POST' });
      if (res.ok) {
        const resetPort: PortfolioState = await res.json();
        setPortfolio(resetPort);
        setLatestSignal(null);
        setLatestHeadline('');
        setLastUpdatedTicker('');
      }
    } catch (err) {
      console.error('Error resetting portfolio:', err);
    }
  };

  // 5. Toggle Automated Live Simulation
  const handleToggleSimulation = () => {
    if (isSimulating) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      if (feeds.length > 0) {
        const nextItem = feeds[currentFeedIdxRef.current % feeds.length];
        currentFeedIdxRef.current += 1;
        handleAnalyze(nextItem.headline, nextItem.source);

        simIntervalRef.current = window.setInterval(() => {
          const item = feeds[currentFeedIdxRef.current % feeds.length];
          currentFeedIdxRef.current += 1;
          handleAnalyze(item.headline, item.source);
        }, 4500);
      }
    }
  };

  // 6. Select Ingestion Feed Handler
  const handleSelectFeed = (item: RawTextItem) => {
    handleAnalyze(item.headline, item.source);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px 48px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Header with System Status */}
      <Header
        wsConnected={wsConnected}
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
        onResetPortfolio={handleResetPortfolio}
        signalsCount={portfolio?.active_signals_count || 0}
      />

      {/* 2. Executive KPI Metrics Strip */}
      <MetricsBar portfolio={portfolio} />

      {/* 3. Top Row: Interactive Headline Injector + AI Risk Engine Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        <HeadlineInjector onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        <SignalCard signal={latestSignal} headline={latestHeadline} />
      </div>

      {/* 4. Centerpiece: Module A Tactical Index Rebalancing Matrix */}
      <RebalancerView portfolio={portfolio} lastUpdatedTicker={lastUpdatedTicker} />

      {/* 5. Bottom Row: Backtest Alpha Performance + Multi-source Live Stream */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        <PerformanceChart signalsCount={portfolio?.active_signals_count || 0} />
        <LiveFeedStream
          feeds={feeds}
          onSelectFeed={handleSelectFeed}
          isAnalyzing={isAnalyzing}
        />
      </div>

      {/* 6. Footer & Domain Compliance */}
      <footer
        style={{
          textAlign: 'center',
          padding: '20px 0',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
        }}
      >
        <div style={{ marginBottom: '6px' }}>
          <strong style={{ color: 'var(--text-muted)' }}>AegisRisk AI</strong> — Real-Time Financial NLP Risk Engine & Tactical Index Rebalancer
        </div>
        <div>
          S&P Global & CRISIL Campus Hackathon 2026 Submission • Track: <strong>Module A</strong> • MIT Open Source License
        </div>
      </footer>

    </div>
  );
};

export default App;
