from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas
from geoalchemy2 import Geometry
import geoalchemy2.functions as geofunc

def get_cameras(db: Session):
    results = db.query(
        models.Camera.id,
        models.Camera.name,
        geofunc.ST_Y(models.Camera.location.cast(Geometry)).label('lat'),
        geofunc.ST_X(models.Camera.location.cast(Geometry)).label('lng')
    ).all()
    return [{"id": r.id, "name": r.name, "lat": r.lat, "lng": r.lng} for r in results]

def create_sighting(db: Session, sighting: schemas.SightingCreate):
    db_sighting = models.Sighting(
        plate=sighting.plate,
        camera_id=sighting.camera_id,
        seen_at=sighting.timestamp,
        confidence=sighting.confidence,
        vehicle_type=sighting.vehicle_type,
        color=sighting.color
    )
    db.add(db_sighting)
    db.commit()
    db.refresh(db_sighting)
    return db_sighting

def get_trajectory(db: Session, plate: str):
    results = db.query(
        models.Sighting.camera_id,
        geofunc.ST_Y(models.Camera.location.cast(Geometry)).label('lat'),
        geofunc.ST_X(models.Camera.location.cast(Geometry)).label('lng'),
        models.Sighting.seen_at,
        models.Sighting.confidence
    ).join(models.Camera, models.Sighting.camera_id == models.Camera.id) \
     .filter(models.Sighting.plate == plate) \
     .order_by(models.Sighting.seen_at).all()
    
    return [
        {
            "camera_id": r.camera_id,
            "lat": r.lat,
            "lng": r.lng,
            "timestamp": r.seen_at,
            "confidence": r.confidence
        }
        for r in results
    ]

def get_analytics_summary(db: Session):
    camera_counts = db.query(
        models.Sighting.camera_id, 
        func.count(models.Sighting.id).label('count')
    ).group_by(models.Sighting.camera_id).all()
    
    counts_dict = {r.camera_id: r.count for r in camera_counts}
    
    # Calculate simple density grid & congestion score based on counts
    density_grid = []
    congestion_score = {}
    
    # Let's get camera locations for density grid
    cameras = db.query(
        models.Camera.id,
        geofunc.ST_Y(models.Camera.location.cast(Geometry)).label('lat'),
        geofunc.ST_X(models.Camera.location.cast(Geometry)).label('lng')
    ).all()
    
    for cam in cameras:
        count = counts_dict.get(cam.id, 0)
        density_grid.append({
            "lat": cam.lat,
            "lng": cam.lng,
            "count": count
        })
        # Score from 0.0 to 1.0 based on count (say 10 vehicles is 1.0 score)
        score = min(1.0, count * 0.1)
        congestion_score[cam.id] = score
        
    return {
        "vehicle_counts_by_camera": counts_dict,
        "density_grid": density_grid,
        "congestion_score": congestion_score
    }

def create_blacklist(db: Session, blacklist_item: schemas.BlacklistCreate):
    db_blacklist = models.Blacklist(
        plate=blacklist_item.plate,
        reason=blacklist_item.reason
    )
    db.add(db_blacklist)
    db.commit()
    db.refresh(db_blacklist)
    return db_blacklist
