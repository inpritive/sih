from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SightingCreate(BaseModel):
    plate: str
    camera_id: str
    timestamp: datetime
    confidence: float
    vehicle_type: str
    color: str

class CameraResponse(BaseModel):
    id: str
    name: str
    lat: float
    lng: float

class SightingResponse(BaseModel):
    camera_id: str
    lat: float
    lng: float
    timestamp: datetime
    confidence: float

class TrajectoryResponse(BaseModel):
    plate: str
    sightings: List[SightingResponse]

class AnalyticsSummaryResponse(BaseModel):
    vehicle_counts_by_camera: dict
    density_grid: List[dict]
    congestion_score: dict

class BlacklistCreate(BaseModel):
    plate: str
    reason: str
