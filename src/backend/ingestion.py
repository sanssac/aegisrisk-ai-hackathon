"""
AegisRisk AI — Ingestion Pipeline
Handles multi-source ingestion from:
1. Financial News Articles (NewsAPI / GDELT)
2. Social Media Chatter (Twitter/X, StockTwits)
3. Interactive Simulator (Custom live judge input)
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator, List, Optional

from schemas import FeedSource, RawTextItem


class IngestionPipeline:
    """Manages multi-source data ingestion and live feed streaming."""

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is None:
            # Default to /data relative to project root
            self.data_dir = Path(__file__).resolve().parent.parent.parent / "data"
        else:
            self.data_dir = Path(data_dir)
        
        self.news_cache: List[RawTextItem] = []
        self.tweets_cache: List[RawTextItem] = []
        self._load_cached_datasets()

    def _load_cached_datasets(self) -> None:
        """Loads sample news and social datasets from /data directory."""
        news_file = self.data_dir / "sample_news.json"
        tweets_file = self.data_dir / "sample_tweets.json"

        if news_file.exists():
            with open(news_file, "r", encoding="utf-8") as f:
                news_data = json.load(f)
                for item in news_data:
                    self.news_cache.append(
                        RawTextItem(
                            id=item.get("id", f"news_{uuid.uuid4().hex[:6]}"),
                            source=FeedSource(item.get("source", "NewsAPI")),
                            headline=item["headline"],
                            url=item.get("url"),
                            timestamp=datetime.fromisoformat(item["published_at"].replace("Z", "+00:00")),
                        )
                    )

        if tweets_file.exists():
            with open(tweets_file, "r", encoding="utf-8") as f:
                tweet_data = json.load(f)
                for item in tweet_data:
                    self.tweets_cache.append(
                        RawTextItem(
                            id=item.get("id", f"tweet_{uuid.uuid4().hex[:6]}"),
                            source=FeedSource(item.get("source", "Twitter/X")),
                            headline=item["headline"],
                            url=item.get("url"),
                            timestamp=datetime.fromisoformat(item["published_at"].replace("Z", "+00:00")),
                        )
                    )

    def get_all_initial_feeds(self) -> List[RawTextItem]:
        """Combines and returns all preloaded feed items sorted chronologically."""
        combined = self.news_cache + self.tweets_cache
        combined.sort(key=lambda x: x.timestamp)
        return combined

    def ingest_custom_input(
        self,
        headline: str,
        source: FeedSource = FeedSource.SIMULATOR,
        url: Optional[str] = None
    ) -> RawTextItem:
        """
        Ingests on-the-fly custom headlines (e.g. from the Judge/User Live Simulator UI).
        """
        clean_headline = headline.strip()
        if not clean_headline:
            raise ValueError("Headline cannot be empty.")

        item = RawTextItem(
            id=f"custom_{uuid.uuid4().hex[:8]}",
            source=source,
            headline=clean_headline,
            url=url,
            timestamp=datetime.utcnow()
        )
        return item
