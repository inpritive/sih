from sqlalchemy import text
from database import engine
import models

def init():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.commit()
    models.Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init()
    print("Database initialized.")
