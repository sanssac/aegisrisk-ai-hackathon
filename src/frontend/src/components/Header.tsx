import React from 'react';
import { Activity, Play, RotateCcw, Shield } from 'lucide-react';

interface HeaderProps {
  wsConnected: boolean;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetPortfolio: () => void;
  signalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  isSimulating,
  onToggleSimulation,
  onResetPortfolio,
  signalsCount,
}) => {
  return (
    <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Left: Brand & Track */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            }}
          >
            <Shield size={24} color="#0f172a" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AegisRisk AI
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                S&P Global & CRISIL 2026
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                Module A: Index Rebalancer
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Sub-second Financial NLP Risk Engine & Sentiment-Tilt Quantitative Optimization • Signals: {signalsCount}
            </p>
          </div>
        </div>

        {/* Right: Controls & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* WebSocket Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span
              className="pulse-radar"
              style={{
                backgroundColor: wsConnected ? 'var(--bullish)' : 'var(--bearish)',
                boxShadow: wsConnected
                  ? '0 0 0 0 rgba(16, 185, 129, 0.7)'
                  : '0 0 0 0 rgba(244, 63, 94, 0.7)',
              }}
            />
            <span style={{ color: wsConnected ? 'var(--bullish)' : 'var(--bearish)' }}>
              {wsConnected ? 'LIVE WS STREAM' : 'DISCONNECTED'}
            </span>
            <span style={{ color: 'var(--text-dim)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>FinBERT Latency: &lt;350ms</span>
          </div>

          {/* Simulate Live Feed Toggle */}
          <button
            id="btn-simulate-feed"
            onClick={onToggleSimulation}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: isSimulating
                ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.4))'
                : 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.3))',
              color: isSimulating ? '#f43f5e' : 'var(--accent-cyan)',
              border: isSimulating
                ? '1px solid rgba(244, 63, 94, 0.5)'
                : '1px solid rgba(56, 189, 248, 0.4)',
            }}
          >
            {isSimulating ? (
              <>
                <Activity size={16} className="animate-spin" />
                <span>Pause Auto Feed</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Stream Live Feeds</span>
              </>
            )}
          </button>

          {/* Reset Portfolio */}
          <button
            id="btn-reset-portfolio"
            onClick={onResetPortfolio}
            title="Reset active weights back to equal 6.67% baseline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 500,
              background: 'rgba(30, 41, 59, 0.7)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <RotateCcw size={15} />
            <span>Reset Weights</span>
          </button>
        </div>

      </div>
    </header>
  );
};
