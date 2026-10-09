import React, { useState } from 'react';
import { Send, Sparkles, Terminal } from 'lucide-react';
import type { FeedSource } from '../types';

interface HeadlineInjectorProps {
  onAnalyze: (headline: string, source: FeedSource) => Promise<void>;
  isAnalyzing: boolean;
}

const PRESET_HEADLINES = [
  {
    label: '🚀 NVDA: Next-Gen AI Chip',
    headline: 'Nvidia unveils next-generation Rubin AI superchip architecture exceeding compute efficiency benchmarks by 40%.',
    source: 'NewsAPI' as FeedSource,
  },
  {
    label: '⚠️ TSLA: Critical Recall',
    headline: 'Tesla recalls 450,000 vehicles over autonomous steering sensor defect, prompting federal regulator inquiry.',
    source: 'Twitter/X' as FeedSource,
  },
  {
    label: '💰 JPM: Record Earnings Beat',
    headline: 'JPMorgan Chase reports record Q2 net interest income and raises full-year guidance by $3 billion.',
    source: 'NewsAPI' as FeedSource,
  },
  {
    label: '⚖️ AAPL: Antitrust Investigation',
    headline: 'Department of Justice files antitrust enforcement action against Apple App Store revenue model.',
    source: 'GDELT' as FeedSource,
  },
  {
    label: '🌐 MACRO: Fed Rate Decision',
    headline: 'Federal Reserve unexpectedly cuts benchmark interest rates by 50 bps amid cooling inflation metrics.',
    source: 'NewsAPI' as FeedSource,
  },
  {
    label: '⚡ XOM: Record Discovery',
    headline: 'ExxonMobil discovers offshore deepwater oil reserve estimated at 800 million barrels.',
    source: 'StockTwits' as FeedSource,
  },
];

export const HeadlineInjector: React.FC<HeadlineInjectorProps> = ({
  onAnalyze,
  isAnalyzing,
}) => {
  const [customText, setCustomText] = useState('');
  const [selectedSource, setSelectedSource] = useState<FeedSource>('Interactive Simulator');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || isAnalyzing) return;
    onAnalyze(customText.trim(), selectedSource);
  };

  const handlePresetClick = (preset: typeof PRESET_HEADLINES[0]) => {
    setCustomText(preset.headline);
    setSelectedSource(preset.source);
    onAnalyze(preset.headline, preset.source);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            Interactive Headline Injector
          </h2>
        </div>
        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
          Real-Time Simulator
        </span>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Type any breaking news headline or click a preset to test sub-second FinBERT inference and instant index rebalancing:
      </p>

      {/* Preset Quick Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
        {PRESET_HEADLINES.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePresetClick(p)}
            disabled={isAnalyzing}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: 'rgba(30, 41, 59, 0.6)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
            }}
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Custom Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <textarea
            id="headline-input"
            rows={3}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. Microsoft partners with OpenAI on quantum computing initiative, boosting revenue forecast..."
            style={{
              width: '100%',
              resize: 'none',
              fontSize: '0.85rem',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-subtle)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Source:</span>
            <select
              id="source-select"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as FeedSource)}
              style={{
                fontSize: '0.75rem',
                padding: '4px 8px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <option value="Interactive Simulator">Interactive Simulator</option>
              <option value="NewsAPI">NewsAPI Wire</option>
              <option value="GDELT">GDELT Global News</option>
              <option value="Twitter/X">Twitter/X Social</option>
              <option value="StockTwits">StockTwits Feed</option>
            </select>
          </div>

          <button
            id="btn-analyze-headline"
            type="submit"
            disabled={!customText.trim() || isAnalyzing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: isAnalyzing
                ? 'rgba(56, 189, 248, 0.4)'
                : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#090d16',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)',
              opacity: !customText.trim() ? 0.6 : 1,
            }}
          >
            {isAnalyzing ? (
              <>
                <Sparkles size={16} className="animate-spin" />
                <span>Running NLP...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Inject Signal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
