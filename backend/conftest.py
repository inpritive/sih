import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from database import Base, get_db
from main import app

# Use a test database
TEST_DATABASE_URL = "postgresql://anpr:anprpassword@localhost:5432/anpr_test_db"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def setup_database():
    # Setup PostGIS extension manually first if possible or rely on base
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
        except Exception:
            pass
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(setup_database):
    """Returns a sqlalchemy session, and after the test tears down everything properly."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]

@pytest.fixture
def seed_data(db_session):
    from models import Camera
    c1 = Camera(id="CAM_TEST_1", name="Test Camera 1", location="SRID=4326;POINT(72.8777 19.0760)")
    c2 = Camera(id="CAM_TEST_2", name="Test Camera 2", location="SRID=4326;POINT(82.8778 19.0761)")
    db_session.add_all([c1, c2])
    db_session.commit()
    return {"CAM_TEST_1": c1, "CAM_TEST_2": c2}
