import React from 'react';
import { Bot, CheckCircle2, Flame, Gauge, Info, Target, Zap } from 'lucide-react';
import type { EventCategory, RiskSignal } from '../types';

interface SignalCardProps {
  signal: RiskSignal | null;
  headline?: string;
}

const getEventBadgeClass = (category: EventCategory): string => {
  switch (category) {
    case 'Product Launch':
      return 'badge-cyan';
    case 'Earnings':
      return 'badge-bullish';
    case 'Regulatory':
    case 'Credit Event':
      return 'badge-bearish';
    case 'Macroeconomic':
    case 'Geopolitical':
      return 'badge-purple';
    case 'Merger/Acquisition':
    default:
      return 'badge-neutral';
  }
};

export const SignalCard: React.FC<SignalCardProps> = ({ signal, headline }) => {
  if (!signal) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: 'var(--text-dim)',
        }}
      >
        <Bot size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Awaiting live NLP risk signal...
        </p>
        <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
          Inject a headline or start live simulation to view AI extraction metrics.
        </p>
      </div>
    );
  }

  const isBullish = signal.sentiment_score > 0.05;
  const isBearish = signal.sentiment_score < -0.05;
  const sentimentPct = Math.round(((signal.sentiment_score + 1) / 2) * 100);

  return (
    <div className="glass-panel animate-slide-down" style={{ padding: '20px 24px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            AI Risk Engine Inference
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            ID: {signal.signal_id.slice(0, 8)}
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
            FinBERT-NER
          </span>
        </div>
      </div>

      {/* Raw Headline Reference */}
      {headline && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(15, 23, 42, 0.85)',
            borderLeft: `3px solid ${isBullish ? 'var(--bullish)' : isBearish ? 'var(--bearish)' : 'var(--accent-cyan)'}`,
            marginBottom: '16px',
            fontSize: '0.82rem',
            fontStyle: 'italic',
            color: 'var(--text-main)',
          }}
        >
          "{headline}"
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Ticker & Entity */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Target size={14} color="var(--accent-cyan)" />
            <span>Target Asset</span>
          </div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {signal.ticker}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {signal.company_name}
            </span>
          </div>
        </div>

        {/* Event Taxonomy */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Zap size={14} color="var(--accent-purple)" />
            <span>Event Taxonomy</span>
          </div>
          <div style={{ marginTop: '6px' }}>
            <span className={`badge ${getEventBadgeClass(signal.event_type)}`}>
              {signal.event_type}
            </span>
          </div>
        </div>
      </div>

      {/* Sentiment Gauge & Impact Severity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Sentiment Meter */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={14} color="var(--accent-cyan)" />
              <span>Sentiment Score</span>
            </div>
            <span
              className="mono"
              style={{
                fontWeight: 700,
                color: isBullish ? 'var(--bullish)' : isBearish ? 'var(--bearish)' : 'var(--neutral)',
              }}
            >
              {signal.sentiment_score > 0 ? '+' : ''}
              {signal.sentiment_score.toFixed(2)}
            </span>
          </div>

          {/* Meter Bar */}
          <div
            style={{
              height: '6px',
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: 'var(--radius-full)',
              marginTop: '8px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${sentimentPct}%`,
                background: isBullish
                  ? 'linear-gradient(90deg, #38bdf8, #10b981)'
                  : isBearish
                  ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                  : '#94a3b8',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            <span>-1.0 Bearish</span>
            <span>0.0 Neutral</span>
            <span>+1.0 Bullish</span>
          </div>
        </div>

        {/* Impact Severity */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={14} color="#fbbf24" />
              <span>Impact Severity</span>
            </div>
            <span className="mono" style={{ fontWeight: 700, color: '#fbbf24' }}>
              {signal.impact_score.toFixed(1)} / 10
            </span>
          </div>

          {/* Impact Meter */}
          <div
            style={{
              height: '6px',
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: 'var(--radius-full)',
              marginTop: '8px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(signal.impact_score / 10) * 100}%`,
                background: 'linear-gradient(90deg, #fbbf24, #f97316)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            <span>Low Volatility</span>
            <span>Market Shock</span>
          </div>
        </div>
      </div>

      {/* Explainability Audit Rationale */}
      <div
        style={{
          padding: '12px 14px',
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--accent-purple)', fontWeight: 600, marginBottom: '4px' }}>
          <Info size={14} />
          <span>AI Audit Trail & Reasoning:</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
          {signal.rationale}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
          <CheckCircle2 size={12} color="var(--bullish)" />
          <span>Model Confidence: {(signal.confidence * 100).toFixed(0)}% | Timestamp: {new Date(signal.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
