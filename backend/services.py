from sqlalchemy.orm import Session
import models
import Levenshtein
from datetime import datetime, timezone
import geoalchemy2.functions as geofunc

def check_blacklist(db: Session, plate: str):
    # Fetch all blacklisted plates
    blacklisted_items = db.query(models.Blacklist).all()
    for item in blacklisted_items:
        # Edit distance <= 2 is considered a match to tolerate 0/O or 1/I confusion
        if Levenshtein.distance(plate, item.plate) <= 2:
            return item
    return None

def check_clone(db: Session, new_sighting: models.Sighting):
    new_camera = db.query(models.Camera).filter(models.Camera.id == new_sighting.camera_id).first()
    if not new_camera:
        return None
        
    previous_sightings = db.query(
        models.Sighting, 
        models.Camera
    ).join(
        models.Camera, models.Sighting.camera_id == models.Camera.id
    ).filter(
        models.Sighting.plate == new_sighting.plate,
        models.Sighting.id != new_sighting.id
    ).order_by(models.Sighting.seen_at.desc()).limit(5).all()

    for prev_sighting, prev_camera in previous_sightings:
        # Calculate distance in meters using PostGIS ST_Distance
        distance_meters = db.query(
            geofunc.ST_Distance(
                new_camera.location, 
                prev_camera.location
            )
        ).scalar()
        
        if distance_meters is None:
            continue
            
        time_diff_seconds = abs((new_sighting.seen_at - prev_sighting.seen_at).total_seconds())
        if time_diff_seconds == 0:
            time_diff_seconds = 0.001
            
        speed_m_s = distance_meters / time_diff_seconds
        speed_km_h = speed_m_s * 3.6
        
        if speed_km_h > 120.0: # threshold with buffer
            confidence = min(0.99, 0.5 + (speed_km_h - 120) / 200) 
            
            reason = "impossible travel time"
            
            if new_sighting.vehicle_type != prev_sighting.vehicle_type:
                confidence = min(0.99, confidence + 0.1)
                reason += ", type mismatch"
            if new_sighting.color != prev_sighting.color:
                confidence = min(0.99, confidence + 0.1)
                reason += ", color mismatch"
                
            clone_alert = models.CloneAlert(
                plate=new_sighting.plate,
                sighting_id_1=prev_sighting.id,
                sighting_id_2=new_sighting.id,
                confidence=confidence,
                reason=reason
            )
            db.add(clone_alert)
            db.commit()
            db.refresh(clone_alert)
            return clone_alert
            
    return None
