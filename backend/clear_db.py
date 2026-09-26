from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
db.execute(text("DELETE FROM clone_alerts"))
db.execute(text("DELETE FROM sightings"))
db.commit()
print('Cleared sightings')
