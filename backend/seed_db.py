from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models

def seed():
    db = SessionLocal()
    
    print("Seeding cameras...")
    # Using WKT (Well-Known Text) for geometry insertion
    # Note: PostGIS uses Longitude, Latitude order for POINT(X Y)
    cameras = [
        models.Camera(id="cam_1", name="MG Road Junction", location="SRID=4326;POINT(77.5946 12.9716)"),
        models.Camera(id="cam_2", name="Koramangala Sony World", location="SRID=4326;POINT(77.6258 12.9352)"),
        models.Camera(id="cam_3", name="Indiranagar 100ft", location="SRID=4326;POINT(77.6412 12.9784)"),
        models.Camera(id="cam_4", name="Whitefield Hope Farm", location="SRID=4326;POINT(77.7470 12.9840)"),
    ]
    
    for cam in cameras:
        existing = db.query(models.Camera).filter(models.Camera.id == cam.id).first()
        if not existing:
            db.add(cam)

    print("Seeding blacklist...")
    blacklist_items = [
        models.Blacklist(plate="KA01AB1234", reason="stolen vehicle"),
        models.Blacklist(plate="MH02CD5678", reason="unpaid fines"),
        models.Blacklist(plate="DL3CBB1111", reason="wanted in hit and run")
    ]
    
    for item in blacklist_items:
        existing = db.query(models.Blacklist).filter(models.Blacklist.plate == item.plate).first()
        if not existing:
            db.add(item)
            
    db.commit()
    print("Database seeding completed.")
    db.close()

if __name__ == "__main__":
    seed()
