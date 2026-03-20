def test_saved(client):
    """Ensures card is saved"""
    
    payload = {
        "name": "Nathan MacKinnon",
        "card_series": "Base Set",
        "card_number": "29",
        "team_name": "Colorado Avalanche",
        "card_type": "Base",
        "front_image_key": "cards/test3/front.jpg",
        "back_image_key": "cards/test3/back.jpg",
    }
    
    card_id = client.post("/confirm-card", json=payload).json()["data"]["card_id"]

    r = client.put(f"/card/{card_id}/save", json={"saved": True})
    assert r.status_code == 200
    body = r.json()

    assert body["status"] == "ok"
    assert body["data"]["id"] == card_id
    assert body["data"]["saved"] is True
    
    
def test_saved_not_Saved(client):
    """Ensures card is not saved when set to False"""
    
    payload = {
        "name": "Cale Makar",
        "card_series": "Base Set",
        "card_number": "8",
        "team_name": "Colorado Avalanche",
        "card_type": "Base",
        "front_image_key": "cards/test4/front.jpg",
        "back_image_key": "cards/test4/back.jpg",
    }
    
    card_id = client.post("/confirm-card", json=payload).json()["data"]["card_id"]

    # set True first
    client.put(f"/card/{card_id}/save", json={"saved": True})

    # then set False
    r = client.put(f"/card/{card_id}/save", json={"saved": False})
    assert r.status_code == 200
    body = r.json()

    assert body["status"] == "ok"
    assert body["data"]["saved"] is False
    
    
def test_saved_cards_returned(client):
    """Ensures only saved cards are returned in /saved-cards endpoint"""
    # Card A saved
    a = {
        "name": "Player A",
        "card_series": "Set",
        "card_number": "1",
        "team_name": "A",
        "card_type": "Base",
        "front_image_key": "cards/a/front.jpg",
        "back_image_key": "cards/a/back.jpg",
    }
    card_a = client.post("/confirm-card", json=a).json()["data"]["card_id"]
    client.put(f"/card/{card_a}/save", json={"saved": True})

    # Card B not saved
    b = {
        "name": "Player B",
        "card_series": "Set",
        "card_number": "2",
        "team_name": "B",
        "card_type": "Base",
        "front_image_key": "cards/b/front.jpg",
        "back_image_key": "cards/b/back.jpg",
    }
    card_b = client.post("/confirm-card", json=b).json()["data"]["card_id"]
    client.put(f"/card/{card_b}/save", json={"saved": False})

    r = client.get("/saved-cards")
    assert r.status_code == 200
    body = r.json()

    assert body["status"] == "ok"
    ids = [c["id"] for c in body["data"]]

    assert card_a in ids
    assert card_b not in ids