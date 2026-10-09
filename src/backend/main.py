"""
AegisRisk AI — Real-Time Financial NLP Risk Engine & Module A FastAPI Core
Entry point for REST API and WebSocket streaming server.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ingestion import IngestionPipeline
from nlp_engine import NLPRiskEngine
from rebalancer import TacticalIndexRebalancer
from schemas import FeedSource, PortfolioState, RawTextItem, RiskSignal


# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AegisRisk")

# Initialize Core Services
app = FastAPI(
    title="AegisRisk AI Engine",
    version="1.0.0",
    description="Real-Time Financial NLP Risk Engine & Tactical Index Rebalancing API"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ingestion = IngestionPipeline()
nlp_engine = NLPRiskEngine()
rebalancer = TacticalIndexRebalancer()

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

manager = ConnectionManager()


# Request Schemas
class CustomAnalyzeRequest(BaseModel):
    headline: str
    source: FeedSource = FeedSource.SIMULATOR


class AnalyzeResponse(BaseModel):
    raw_item: RawTextItem
    risk_signal: RiskSignal
    portfolio_state: PortfolioState


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "AegisRisk AI Core", "version": "1.0.0"}


@app.get("/api/feeds", response_model=List[RawTextItem])
async def get_initial_feeds():
    """Returns pre-loaded multi-source news and tweets."""
    return ingestion.get_all_initial_feeds()


@app.get("/api/portfolio", response_model=PortfolioState)
async def get_current_portfolio():
    """Returns the current 15-stock tactical index state."""
    return rebalancer.get_portfolio_state()


@app.get("/api/history")
async def get_rebalance_history():
    """Returns the chronological audit trail of rebalancing actions."""
    return {"history": rebalancer.rebalance_history}


@app.post("/api/portfolio/reset", response_model=PortfolioState)
async def reset_portfolio():
    """Resets portfolio weights back to baseline equal weight."""
    portfolio = rebalancer.reset()
    payload = {
        "type": "SNAPSHOT",
        "portfolio_state": portfolio.model_dump(mode="json"),
    }
    await manager.broadcast(payload)
    return portfolio



@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_custom_headline(req: CustomAnalyzeRequest):
    """
    Sub-second analysis endpoint:
    Ingests text -> Runs NLP Risk Engine -> Triggers Module A Rebalancing -> Broadcasts to UI.
    """
    try:
        raw_item = ingestion.ingest_custom_input(headline=req.headline, source=req.source)
        signal = nlp_engine.analyze(raw_item)
        portfolio = rebalancer.process_risk_signal(signal)

        payload = {
            "type": "NEW_SIGNAL",
            "raw_item": raw_item.model_dump(mode="json"),
            "risk_signal": signal.model_dump(mode="json"),
            "portfolio_state": portfolio.model_dump(mode="json"),
        }
        await manager.broadcast(payload)

        return AnalyzeResponse(
            raw_item=raw_item,
            risk_signal=signal,
            portfolio_state=portfolio
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail="Internal analysis error")


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    Real-time WebSocket endpoint streaming risk events and portfolio rebalances.
    """
    await manager.connect(websocket)
    # Send initial state snapshot upon connection
    initial_portfolio = rebalancer.get_portfolio_state()
    await websocket.send_json({
        "type": "SNAPSHOT",
        "portfolio_state": initial_portfolio.model_dump(mode="json")
    })

    try:
        while True:
            # Keep connection alive and listen for client messages (if any)
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                if parsed.get("action") == "INJECT_HEADLINE":
                    headline = parsed.get("headline", "")
                    raw_item = ingestion.ingest_custom_input(headline=headline)
                    signal = nlp_engine.analyze(raw_item)
                    portfolio = rebalancer.process_risk_signal(signal)
                    await manager.broadcast({
                        "type": "NEW_SIGNAL",
                        "raw_item": raw_item.model_dump(mode="json"),
                        "risk_signal": signal.model_dump(mode="json"),
                        "portfolio_state": portfolio.model_dump(mode="json"),
                    })
            except Exception as e:
                logger.error(f"WebSocket message handling error: {e}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
