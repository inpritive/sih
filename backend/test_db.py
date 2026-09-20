from sqlalchemy import create_engine
import os

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://anpr:anprpassword@localhost:5432/anpr_db")
print(f"Connecting to {SQLALCHEMY_DATABASE_URL}...")
try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    connection = engine.connect()
    print("Connection successful!")
    connection.close()
except Exception as e:
    print(f"Connection failed: {e}")
