from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

import crud, schemas, services
from database import get_db
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # We need to create a copy of the list because elements might be removed during iteration
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except:
                self.disconnect(connection)

manager = ConnectionManager()

router = APIRouter()

@router.post("/sighting", response_model=schemas.SightingResponse)
def create_sighting(sighting: schemas.SightingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_sighting = crud.create_sighting(db, sighting)
    
    # Check blacklist
    blacklist_match = services.check_blacklist(db, db_sighting.plate)
    if blacklist_match:
        alert = {
            "type": "blacklist",
            "plate": db_sighting.plate,
            "camera_id": db_sighting.camera_id,
            "timestamp": db_sighting.seen_at.isoformat() + "Z",
            "confidence": db_sighting.confidence,
            "reason": blacklist_match.reason
        }
        background_tasks.add_task(manager.broadcast, alert)
        
    # Check clone
    clone_match = services.check_clone(db, db_sighting)
    if clone_match:
        alert = {
            "type": "clone",
            "plate": db_sighting.plate,
            "camera_id": db_sighting.camera_id,
            "timestamp": db_sighting.seen_at.isoformat() + "Z",
            "confidence": clone_match.confidence,
            "reason": clone_match.reason
        }
        background_tasks.add_task(manager.broadcast, alert)

    return {
        "camera_id": db_sighting.camera_id,
        "lat": 0.0, # Will be fixed in Phase 2 for proper response
        "lng": 0.0,
        "timestamp": db_sighting.seen_at,
        "confidence": db_sighting.confidence
    }

@router.get("/cameras", response_model=List[schemas.CameraResponse])
def get_cameras(db: Session = Depends(get_db)):
    return crud.get_cameras(db)

@router.get("/plate/{plate}/trajectory", response_model=schemas.TrajectoryResponse)
def get_trajectory(plate: str, db: Session = Depends(get_db)):
    sightings = crud.get_trajectory(db, plate=plate)
    return {"plate": plate, "sightings": sightings}

@router.get("/analytics/summary", response_model=schemas.AnalyticsSummaryResponse)
def get_analytics_summary(db: Session = Depends(get_db)):
    return crud.get_analytics_summary(db)

@router.post("/blacklist")
def create_blacklist(blacklist_item: schemas.BlacklistCreate, db: Session = Depends(get_db)):
    crud.create_blacklist(db, blacklist_item)
    return {"message": "Blacklist item created"}

@router.websocket("/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We keep connection open and listen for close
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/init-db")
def initialize_database():
    import init_db
    import seed_db
    try:
        init_db.init()
        seed_db.seed()
        return {"status": "success", "message": "Database initialized and seeded"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
        

