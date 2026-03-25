import os

os.environ["SKIP_DB_INIT"] = "1"
os.environ["SKIP_MODEL_LOAD"] = "1"


import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.main as main
from app.auth.supabase_auth import current_user
from app.db.database import Base

import uuid


# SQLite URL for testing
TEST_DB_URL = "sqlite:///./tests_test.db"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite + TestClient
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


TEST_USER_ID = uuid.uuid4()

def fake_user():
    return {"user_id": TEST_USER_ID}


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Create all tables once at the start of the test session
    Drop all tables at the end
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(monkeypatch):
    # Replace with fake user
    main.app.dependency_overrides[current_user] = fake_user

    # Override get_db dependency to use SQLite session
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    # Override get_db dependency to use SQLite session for tests
    main.app.dependency_overrides[main.get_db] = override_get_db

    # Patch to use SQLite session for tests
    monkeypatch.setattr(main, "SessionLocal", TestingSessionLocal)

    with TestClient(main.app) as c:
        yield c

    main.app.dependency_overrides.clear()
