from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
db.execute(text("DELETE FROM sightings WHERE camera_id IN ('CAM_1', 'CAM_2')"))
db.execute(text("DELETE FROM cameras WHERE id IN ('CAM_1', 'CAM_2')"))
db.commit()
print('Deleted CAM_1 and CAM_2')
