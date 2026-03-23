import app.main as main


def test_price_sucess(client, monkeypatch):
    """POST /price-card success creates CardPrice row"""
    # Create card
    card_id = client.post("/confirm-card", json={
        "name": "Cole Caufield",
        "card_series": "2021-22 Upper Deck Series 1 Hockey",
        "card_number": "201",
        "team_name": "Montreal Canadiens",
        "card_type": "Young Guns",
        "front_image_key": "cards/p/front.jpg",
        "back_image_key": "cards/p/back.jpg",
    }).json()["data"]["card_id"]

    # Mock pricing
    def fake_pricing(_):
        return {
            "estimate": 123.45,
            "price_low": 100.0,
            "price_high": 150.0,
            "sales_count": 10,
            "confidence": 0.9,
        }

    monkeypatch.setattr(main, "run_pricing", fake_pricing)

    r = client.post("/price-card", json={
        "card_id": card_id,
        "name": "Cole Caufield",
        "card_series": "2021-22 Upper Deck Series 1 Hockey",
        "card_number": "201",
        "card_type": "Young Guns"
    })
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    

def test_price_card_no_estimate(client, monkeypatch):
    """POST /price-card when pricing has no estimate"""
    card_id = client.post("/confirm-card", json={
        "name": "Ryan Nugent-Hopkins",
        "card_series": "2021-22 Upper Deck Series 1 Hockey",
        "card_number": "93",
        "team_name": "Edmonton Oilers",
        "card_type": "Base",
        "front_image_key": "cards/np/front.jpg",
        "back_image_key": "cards/np/back.jpg",
    }).json()["data"]["card_id"]

    def fake_pricing(_):
        return {"sales_count": 0}  # no "estimate"

    monkeypatch.setattr(main, "run_pricing", fake_pricing)

    r = client.post("/price-card", json={
        "card_id": card_id,
        "name": "Ryan Nugent-Hopkins",
        "card_series": "2021-22 Upper Deck Series 1 Hockey",
        "card_number": "93",
        "card_type": "Base"
    })
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "error"
    assert body["error"]["code"] == "PRICING_NO_DATA"


def test_get_price(client, monkeypatch):
    """GET /card/{id}/prices returns list after pricing"""
    card_id = client.post("/confirm-card", json={
        "name": "Prices List Guy",
        "card_series": "Set",
        "card_number": "7",
        "team_name": "Y",
        "card_type": "Base",
        "front_image_key": "cards/pl/front.jpg",
        "back_image_key": "cards/pl/back.jpg",
    }).json()["data"]["card_id"]

    def fake_pricing(_):
        return {
            "estimate": 50.0,
            "price_low": 40.0,
            "price_high": 60.0,
            "sales_count": 3,
            "confidence": 0.5,
        }

    monkeypatch.setattr(main, "run_pricing", fake_pricing)

    client.post("/price-card", json={
        "card_id": card_id,
        "name": "Prices List Guy",
        "card_series": "Set",
        "card_number": "7",
        "card_type": "Base",
    })

    r = client.get(f"/card/{card_id}/prices")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 1


def test_points_sorted(client, monkeypatch):
    """GET /card/{id}/price-trend returns points sorted by created_at"""
    card_id = client.post("/confirm-card", json={
        "name": "Mitch Marner",
        "card_series": "2021-22 Upper Deck Series 2",
        "card_number": "93",
        "team_name": "Vegas Golden Knights",
        "card_type": "Base",
        "front_image_key": "cards/t/front.jpg",
        "back_image_key": "cards/t/back.jpg",
    }).json()["data"]["card_id"]

    prices = [
        {"estimate": 10.0, "price_low": 8.0, "price_high": 12.0, "sales_count": 1, "confidence": 0.2},
        {"estimate": 20.0, "price_low": 18.0, "price_high": 22.0, "sales_count": 2, "confidence": 0.3},
    ]

    def fake_pricing_factory():
        i = {"idx": 0}
        def _fake(_):
            out = prices[i["idx"]]
            i["idx"] += 1
            return out
        return _fake

    monkeypatch.setattr(main, "run_pricing", fake_pricing_factory())

    client.post("/price-card", json={
        "card_id": card_id,
        "name": "Mitch Marner",
        "card_series": "2021-22 Upper Deck Series 2",
        "card_number": "93",
        "card_type": "Base"
    })
    client.post("/price-card", json={
        "card_id": card_id,
        "name": "Mitch Marner",
        "card_series": "2021-22 Upper Deck Series 2",
        "card_number": "93",
        "card_type": "Base"
    })

    r = client.get(f"/card/{card_id}/price-trend")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 2

    # first estimate should be 10.0 then 20.0
    assert data[0]["estimate"] == 10.0
    assert data[1]["estimate"] == 20.0