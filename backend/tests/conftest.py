import pytest
from fastapi.testclient import TestClient
import app.main as main
from app.auth.supabase_auth import current_user


def fake_user():
    return {"user_id": "test_user_id"}


class DummyDB:
    def execute(self, _sql):
        return 1
    def close(self):
        pass


@pytest.fixture
def client(monkeypatch):
    # Replace with fake user
    main.app.dependency_overrides[current_user] = fake_user

    # Stop startup from connecting to Supabase DB
    monkeypatch.setattr(main, "init_db", lambda: None)

    # Avoid loading ML models during tests
    monkeypatch.setattr(main, "load_models", lambda: (None, None, None))
    monkeypatch.setattr(main, "CardDetectionPipeline", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(main, "TextExtraction", lambda *_args, **_kwargs: None)

    # SessionLocal() will return a dummy DB object that does nothing
    monkeypatch.setattr(main, "SessionLocal", lambda: DummyDB())

    with TestClient(main.app) as c:
        yield c

    main.app.dependency_overrides.clear()