import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Sliders } from 'lucide-react';
import type { PortfolioState, StockHolding } from '../types';

interface RebalancerViewProps {
  portfolio: PortfolioState | null;
  lastUpdatedTicker?: string;
}

type SortField = 'weight' | 'delta' | 'sentiment' | 'ticker';

export const RebalancerView: React.FC<RebalancerViewProps> = ({
  portfolio,
  lastUpdatedTicker,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('weight');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  if (!portfolio || !portfolio.holdings) {
    return null;
  }

  // Extract unique sectors
  const sectors = ['ALL', ...Array.from(new Set(portfolio.holdings.map((h) => h.sector)))];

  // Filter holdings
  let filtered = portfolio.holdings.filter(
    (h) => selectedSector === 'ALL' || h.sector === selectedSector
  );

  // Sort holdings
  filtered.sort((a, b) => {
    let diff = 0;
    if (sortField === 'weight') {
      diff = b.current_weight - a.current_weight;
    } else if (sortField === 'delta') {
      const deltaA = a.current_weight - a.base_weight;
      const deltaB = b.current_weight - b.base_weight;
      diff = deltaB - deltaA;
    } else if (sortField === 'sentiment') {
      diff = b.last_sentiment - a.last_sentiment;
    } else if (sortField === 'ticker') {
      return sortAsc ? a.ticker.localeCompare(b.ticker) : b.ticker.localeCompare(a.ticker);
    }
    return sortAsc ? -diff : diff;
  });

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
      {/* Top Header & Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
              Module A: Tactical Index Rebalancing Matrix
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            15-Stock Benchmark Basket • Real-Time Sentiment-Tilt Weights ($w_0 = 6.67\%$, $\gamma = {portfolio.sentiment_tilt_factor}$)
          </p>
        </div>

        {/* Sector Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSector(s)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 600,
                background:
                  selectedSector === s
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(56, 189, 248, 0.4))'
                    : 'rgba(30, 41, 59, 0.5)',
                color: selectedSector === s ? 'var(--accent-cyan)' : 'var(--text-muted)',
                border:
                  selectedSector === s
                    ? '1px solid rgba(56, 189, 248, 0.5)'
                    : '1px solid var(--border-subtle)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Buttons Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Sort By:</span>
          <button
            onClick={() => handleSortToggle('weight')}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: sortField === 'weight' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: sortField === 'weight' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Active Weight {sortField === 'weight' && (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
          </button>
          <button
            onClick={() => handleSortToggle('delta')}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: sortField === 'delta' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: sortField === 'delta' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Delta Tilt {sortField === 'delta' && (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
          </button>
          <button
            onClick={() => handleSortToggle('sentiment')}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: sortField === 'sentiment' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: sortField === 'sentiment' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Sentiment {sortField === 'sentiment' && (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
          </button>
          <button
            onClick={() => handleSortToggle('ticker')}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: sortField === 'ticker' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: sortField === 'ticker' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Ticker Name {sortField === 'ticker' && (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: 'var(--bullish)', borderRadius: '2px' }} />
            <span>Overweight (&gt;6.67%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: 'var(--bearish)', borderRadius: '2px' }} />
            <span>Underweight (&lt;6.67%)</span>
          </div>
        </div>
      </div>

      {/* Grid of Holdings Cards / Interactive Bars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '14px',
        }}
      >
        {filtered.map((h: StockHolding) => {
          const delta = h.current_weight - h.base_weight;
          const isOver = delta > 0.05;
          const isUnder = delta < -0.05;
          const isTargeted = lastUpdatedTicker === h.ticker;
          const barWidthPct = Math.min(100, Math.max(5, (h.current_weight / 18.0) * 100));
          const baseMarkerPct = (h.base_weight / 18.0) * 100;

          return (
            <div
              key={h.ticker}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: isTargeted
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'rgba(30, 41, 59, 0.45)',
                border: isTargeted
                  ? '1px solid var(--accent-cyan)'
                  : '1px solid var(--border-subtle)',
                boxShadow: isTargeted ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Card Top: Ticker & Price */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                    {h.ticker}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {h.company_name}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    ${h.latest_price.toFixed(2)}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '0.68rem',
                      color: h.price_change_pct >= 0 ? 'var(--bullish)' : 'var(--bearish)',
                    }}
                  >
                    {h.price_change_pct >= 0 ? '+' : ''}
                    {h.price_change_pct.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Card Mid: Weight & Delta */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight:</span>
                  <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: isOver ? 'var(--bullish)' : isUnder ? 'var(--bearish)' : 'var(--text-main)' }}>
                    {h.current_weight.toFixed(2)}%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className={`badge ${isOver ? 'badge-bullish' : isUnder ? 'badge-bearish' : 'badge-neutral'}`}
                    style={{ fontSize: '0.68rem' }}
                  >
                    {delta >= 0 ? '+' : ''}
                    {delta.toFixed(2)}%
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      color: h.last_sentiment > 0 ? 'var(--bullish)' : h.last_sentiment < 0 ? 'var(--bearish)' : 'var(--neutral)',
                    }}
                  >
                    Sent: {h.last_sentiment > 0 ? '+' : ''}{h.last_sentiment.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Card Bottom: Comparative Dynamic Bar */}
              <div
                style={{
                  height: '10px',
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: 'var(--radius-full)',
                  position: 'relative',
                  overflow: 'visible',
                  marginTop: '6px',
                }}
              >
                {/* Active Weight Bar */}
                <div
                  style={{
                    height: '100%',
                    width: `${barWidthPct}%`,
                    background: isOver
                      ? 'linear-gradient(90deg, #059669, #10b981)'
                      : isUnder
                      ? 'linear-gradient(90deg, #e11d48, #f43f5e)'
                      : '#3b82f6',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />

                {/* Benchmark Baseline Marker (6.67%) */}
                <div
                  title="Benchmark Equal Weight: 6.67%"
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    bottom: '-3px',
                    left: `${baseMarkerPct}%`,
                    width: '2px',
                    background: '#ffffff',
                    boxShadow: '0 0 4px #ffffff',
                    zIndex: 2,
                  }}
                />
              </div>

              {/* Sub-label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>Floor: 1.5%</span>
                <span style={{ color: '#ffffff' }}>Base: 6.67%</span>
                <span>Cap: 18.0%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
