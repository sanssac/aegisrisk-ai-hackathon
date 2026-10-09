import React, { useState } from 'react';
import { Globe, MessageSquare, Radio, Rss, Sparkles } from 'lucide-react';
import type { FeedSource, RawTextItem } from '../types';

interface LiveFeedStreamProps {
  feeds: RawTextItem[];
  onSelectFeed: (feed: RawTextItem) => void;
  isAnalyzing: boolean;
}

const getSourceIcon = (source: FeedSource) => {
  switch (source) {
    case 'NewsAPI':
      return <Rss size={13} color="var(--accent-cyan)" />;
    case 'GDELT':
      return <Globe size={13} color="var(--accent-purple)" />;
    case 'Twitter/X':
    case 'StockTwits':
      return <MessageSquare size={13} color="#38bdf8" />;
    default:
      return <Radio size={13} color="var(--bullish)" />;
  }
};

const getSourceBadgeClass = (source: FeedSource): string => {
  switch (source) {
    case 'NewsAPI':
      return 'badge-cyan';
    case 'GDELT':
      return 'badge-purple';
    case 'Twitter/X':
    case 'StockTwits':
      return 'badge-neutral';
    default:
      return 'badge-bullish';
  }
};

export const LiveFeedStream: React.FC<LiveFeedStreamProps> = ({
  feeds,
  onSelectFeed,
  isAnalyzing,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const filteredFeeds = feeds.filter(
    (f) => activeFilter === 'ALL' || f.source === activeFilter
  );

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="var(--bullish)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            Multi-Source Ingestion Feed
          </h2>
        </div>
        <span className="badge badge-bullish" style={{ fontSize: '0.65rem' }}>
          {filteredFeeds.length} Events Ingested
        </span>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {['ALL', 'NewsAPI', 'GDELT', 'Twitter/X', 'StockTwits'].map((s) => (
          <button
            key={s}
            onClick={() => setActiveFilter(s)}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.7rem',
              fontWeight: 500,
              background: activeFilter === s ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              color: activeFilter === s ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: activeFilter === s ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Feed List Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingRight: '4px',
        }}
      >
        {filteredFeeds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No feeds matching filter.
          </div>
        ) : (
          filteredFeeds.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className={`badge ${getSourceBadgeClass(item.source)}`} style={{ fontSize: '0.62rem' }}>
                  {getSourceIcon(item.source)}
                  {item.source}
                </span>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.4 }}>
                {item.headline}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => onSelectFeed(item)}
                  disabled={isAnalyzing}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={11} />
                  <span>Test NLP</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
