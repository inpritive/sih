from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from geoalchemy2 import Geometry
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    location = Column(Geometry(geometry_type='POINT', srid=4326))

class Sighting(Base):
    __tablename__ = "sightings"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plate = Column(String, index=True)
    camera_id = Column(String, ForeignKey("cameras.id"))
    seen_at = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float)
    vehicle_type = Column(String)
    color = Column(String)

    camera = relationship("Camera")

class Blacklist(Base):
    __tablename__ = "blacklist"
    plate = Column(String, primary_key=True, index=True)
    reason = Column(String)
    added_at = Column(DateTime, default=datetime.utcnow)

class CloneAlert(Base):
    __tablename__ = "clone_alerts"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plate = Column(String, index=True)
    sighting_id_1 = Column(Integer, ForeignKey("sightings.id"))
    sighting_id_2 = Column(Integer, ForeignKey("sightings.id"))
    confidence = Column(Float)
    reason = Column(String)
    flagged_at = Column(DateTime, default=datetime.utcnow)
