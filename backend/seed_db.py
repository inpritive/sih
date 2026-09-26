from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, text

def seed():
    db = SessionLocal()
    
    print("1. Seeding cameras...")
    # Note: PostGIS uses Longitude, Latitude order for POINT(X Y)
    cameras_data = [
        {"id": "cam_1", "name": "MG Road Junction", "lng": 77.5946, "lat": 12.9716},
        {"id": "cam_2", "name": "Koramangala Sony World", "lng": 77.6258, "lat": 12.9352},
        {"id": "cam_3", "name": "Indiranagar 100ft", "lng": 77.6412, "lat": 12.9784},
        {"id": "cam_4", "name": "Whitefield Hope Farm", "lng": 77.7470, "lat": 12.9840},
    ]
    
    for c in cameras_data:
        existing = db.query(models.Camera).filter(models.Camera.id == c["id"]).first()
        if not existing:
            cam = models.Camera(
                id=c["id"],
                name=c["name"],
                location=func.ST_SetSRID(func.ST_MakePoint(c["lng"], c["lat"]), 4326)
            )
            db.add(cam)
        else:
            existing.name = c["name"]
            existing.location = func.ST_SetSRID(func.ST_MakePoint(c["lng"], c["lat"]), 4326)
    db.commit()

    print("2. Seeding blacklist...")
    blacklist_items = [
        {"plate": "KA01AB1234", "reason": "stolen vehicle"},
        {"plate": "MH02CD5678", "reason": "unpaid fines"},
        {"plate": "DL3CBB1111", "reason": "wanted in hit and run"}
    ]
    
    for item in blacklist_items:
        existing = db.query(models.Blacklist).filter(models.Blacklist.plate == item["plate"]).first()
        if not existing:
            db.add(models.Blacklist(plate=item["plate"], reason=item["reason"]))

    db.commit()

    print("3. Clearing previous demo vehicle sightings...")
    demo_plates = ["DEMOCA01", "DEMOCA02", "KA01AB1234", "DL03CC8899"]
    for plate in demo_plates:
        db.query(models.Sighting).filter(models.Sighting.plate == plate).delete()
    db.commit()

    now = datetime.now(timezone.utc)

    print("4. Seeding chronological trajectory for DEMOCA01 (West -> East)...")
    # DEMOCA01 moves: MG Road -> Indiranagar -> Koramangala -> Whitefield
    democa01_route = [
        ("cam_1", now - timedelta(minutes=24), 0.98, "car", "white"),
        ("cam_3", now - timedelta(minutes=16), 0.97, "car", "white"),
        ("cam_2", now - timedelta(minutes=9), 0.99, "car", "white"),
        ("cam_4", now - timedelta(minutes=2), 0.96, "car", "white"),
    ]
    for cid, ts, conf, vtype, color in democa01_route:
        db.add(models.Sighting(
            plate="DEMOCA01",
            camera_id=cid,
            seen_at=ts,
            confidence=conf,
            vehicle_type=vtype,
            color=color
        ))

    print("5. Seeding chronological trajectory for DEMOCA02 (East -> West)...")
    # DEMOCA02 moves: Whitefield -> Koramangala -> Indiranagar -> MG Road
    democa02_route = [
        ("cam_4", now - timedelta(minutes=22), 0.99, "car", "silver"),
        ("cam_2", now - timedelta(minutes=15), 0.96, "car", "silver"),
        ("cam_3", now - timedelta(minutes=8), 0.98, "car", "silver"),
        ("cam_1", now - timedelta(minutes=1), 0.97, "car", "silver"),
    ]
    for cid, ts, conf, vtype, color in democa02_route:
        db.add(models.Sighting(
            plate="DEMOCA02",
            camera_id=cid,
            seen_at=ts,
            confidence=conf,
            vehicle_type=vtype,
            color=color
        ))

    print("6. Seeding stolen vehicle KA01AB1234 trajectory...")
    stolen_route = [
        ("cam_1", now - timedelta(minutes=30), 0.95, "car", "black"),
        ("cam_3", now - timedelta(minutes=18), 0.98, "car", "black"),
        ("cam_2", now - timedelta(minutes=5), 0.97, "car", "black"),
    ]
    for cid, ts, conf, vtype, color in stolen_route:
        db.add(models.Sighting(
            plate="KA01AB1234",
            camera_id=cid,
            seen_at=ts,
            confidence=conf,
            vehicle_type=vtype,
            color=color
        ))

    print("7. Seeding clone anomaly DL03CC8899 trajectory...")
    clone_route = [
        ("cam_1", now - timedelta(minutes=4), 0.98, "car", "blue"),
        ("cam_4", now - timedelta(minutes=2), 0.97, "car", "blue"),
    ]
    for cid, ts, conf, vtype, color in clone_route:
        db.add(models.Sighting(
            plate="DL03CC8899",
            camera_id=cid,
            seen_at=ts,
            confidence=conf,
            vehicle_type=vtype,
            color=color
        ))

    db.commit()
    print("Database seeding completed successfully.")
    db.close()

if __name__ == "__main__":
    seed()
