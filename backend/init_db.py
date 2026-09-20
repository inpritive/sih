from sqlalchemy import text
from database import engine
import models

def init():
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
        except Exception as e:
            print(f"Skipping extension creation (it likely already exists): {e}")
    models.Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init()
    print("Database initialized.")
