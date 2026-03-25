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


def test_not_ready(client):
    """GET /ready returns not_ready when DB fails"""

    class BrokenDB:
        def execute(self, *args, **kwargs):
            raise RuntimeError("DB down")

    def broken_get_db():
        yield BrokenDB()

    main.app.dependency_overrides[main.get_db] = broken_get_db
    try:
        r = client.get("/ready")
        assert r.status_code == 200
        assert r.json() == {"status": "not_ready"}
    finally:
        main.app.dependency_overrides.pop(main.get_db, None)
