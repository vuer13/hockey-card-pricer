import app.main as main


def test_health(client):
    """GET /health-check returns ok"""
    response = client.get("/health-check")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ready(client):
    """GET /ready returns ready when DB is up"""
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_not_ready(client, monkeypatch):
    """GET /ready returns not_ready when DB fails"""

    def boom():
        raise RuntimeError("DB down")

    monkeypatch.setattr(main, "SessionLocal", boom)

    r = client.get("/ready")
    assert r.status_code == 200
    assert r.json() == {"status": "not_ready"}
