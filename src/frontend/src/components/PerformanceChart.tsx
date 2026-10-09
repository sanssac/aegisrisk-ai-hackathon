import React from 'react';
import { TrendingUp } from 'lucide-react';

interface PerformanceChartProps {
  signalsCount: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ signalsCount }) => {
  // Simulated historical backtest curve points
  // X: Time Steps (T1 - T12), Y1: Sentiment-Tilt Strategy, Y2: Static Benchmark
  const points = [
    { t: 'T0', strategy: 100.0, benchmark: 100.0 },
    { t: 'T1', strategy: 101.4, benchmark: 100.6 },
    { t: 'T2', strategy: 102.8, benchmark: 101.2 },
    { t: 'T3', strategy: 102.1, benchmark: 99.4 },
    { t: 'T4', strategy: 104.5, benchmark: 100.8 },
    { t: 'T5', strategy: 106.2, benchmark: 101.9 },
    { t: 'T6', strategy: 105.8, benchmark: 98.7 },
    { t: 'T7', strategy: 108.4, benchmark: 102.3 },
    { t: 'T8', strategy: 110.1, benchmark: 103.5 },
    { t: 'T9', strategy: 109.4, benchmark: 102.1 },
    { t: 'T10', strategy: 112.6, benchmark: 104.8 },
    { t: 'T11', strategy: 114.2, benchmark: 105.9 },
    { t: 'T12', strategy: 115.8 + Math.min(4, signalsCount * 0.3), benchmark: 107.2 },
  ];

  // SVG dimensions
  const width = 600;
  const height = 180;
  const padding = 30;

  const minY = 95;
  const maxY = 122;

  const getX = (idx: number) => padding + (idx / (points.length - 1)) * (width - 2 * padding);
  const getY = (val: number) => height - padding - ((val - minY) / (maxY - minY)) * (height - 2 * padding);

  // Generate SVG Path for Strategy (Cyan/Emerald)
  const strategyPath = points.reduce((acc, p, idx) => {
    const x = getX(idx);
    const y = getY(p.strategy);
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x},${y}`;
  }, '');

  // Generate Strategy Area Fill
  const strategyArea = `${strategyPath} L ${getX(points.length - 1)},${height - padding} L ${getX(0)},${height - padding} Z`;

  // Generate SVG Path for Benchmark (Gray/Muted)
  const benchmarkPath = points.reduce((acc, p, idx) => {
    const x = getX(idx);
    const y = getY(p.benchmark);
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x},${y}`;
  }, '');

  const latestStrategy = points[points.length - 1].strategy;
  const latestBenchmark = points[points.length - 1].benchmark;
  const alpha = (latestStrategy - latestBenchmark).toFixed(1);

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} color="var(--bullish)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
              Quantitative Alpha & Drawdown Protection Backtest
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sentiment-Tilt Dynamic Index vs 15-Stock Equal Weight Benchmark
            </p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', background: 'var(--accent-cyan)', borderRadius: '2px' }} />
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>AegisRisk Tilt (+{(latestStrategy - 100).toFixed(1)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', background: 'var(--text-dim)', borderRadius: '2px', borderStyle: 'dashed' }} />
            <span style={{ color: 'var(--text-muted)' }}>Static Benchmark (+{(latestBenchmark - 100).toFixed(1)}%)</span>
          </div>
          <span className="badge badge-bullish" style={{ fontSize: '0.7rem' }}>
            Alpha: +{alpha}%
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', maxHeight: '200px', display: 'block' }}
        >
          <defs>
            <linearGradient id="strategyGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[100, 105, 110, 115, 120].map((level) => {
            const y = getY(level);
            return (
              <g key={level}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 6}
                  y={y + 3}
                  fill="var(--text-dim)"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  textAnchor="end"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Fill Area for Strategy */}
          <path d={strategyArea} fill="url(#strategyGlow)" />

          {/* Benchmark Line */}
          <path
            d={benchmarkPath}
            fill="none"
            stroke="rgba(148, 163, 184, 0.45)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Strategy Line */}
          <path
            d={strategyPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            style={{ filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))' }}
          />

          {/* Active Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={getX(idx)}
              cy={getY(p.strategy)}
              r="3.5"
              fill="#090d16"
              stroke="#38bdf8"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      {/* Backtest Statistics Footer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-dim)' }}>Sharpe Ratio:</span>
          <div className="mono" style={{ fontWeight: 700, color: 'var(--bullish)' }}>
            1.94 <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>(vs 1.28)</span>
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)' }}>Max Drawdown:</span>
          <div className="mono" style={{ fontWeight: 700, color: 'var(--bullish)' }}>
            -4.2% <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>(vs -10.8%)</span>
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)' }}>Downside Beta:</span>
          <div className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
            0.64
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)' }}>Rebalance Turnover:</span>
          <div className="mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
            4.8% / event
          </div>
        </div>
      </div>
    </div>
  );
};
