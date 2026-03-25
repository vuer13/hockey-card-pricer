def make_confirm_payload():
    return {
        'name': 'Cole Caulfield',
        'card_series': '2023-24 Upper Deck Series 1',
        'card_number': '22',
        'team_name': 'MTL',
        'card_type': 'Base',
        'front_image_key': 'front/test.jpg',
        'back_image_key': 'back/test.jpg',
    }


def confirm_card(client):
    payload = make_confirm_payload()
    response = client.post('/confirm-card', json=payload)
    assert response.status_code == 200, response.text

    body = response.json()
    assert body['status'] == 'ok', body
    card_id = body['data']['card_id']
    assert card_id is not None

    return card_id


def test_flow_confirm_then_get_card(client):
    """User confirms a card, then fetches that card."""
    card_id = confirm_card(client)

    response = client.get(f'/card/{card_id}')
    assert response.status_code == 200, response.text

    body = response.json()
    assert body['status'] == 'ok', body
    data = body['data']

    assert data['id'] == card_id
    assert data['name'] == 'Cole Caulfield'
    assert data['card_series'] == '2023-24 Upper Deck Series 1'
    assert data['card_number'] == '22'
    assert data['team_name'] == 'MTL'
    assert data['card_type'] == 'Base'


def test_flow_confirm_price_and_get_prices(client, monkeypatch):
    """User confirms a card, prices it, then fetches saved price history."""
    card_id = confirm_card(client)

    fake_result = {
        'estimate': 125.0,
        'price_low': 110.0,
        'price_high': 140.0,
        'sales_count': 4,
        'confidence': 0.91,
    }

    def fake_price_lookup(*args, **kwargs):
        return fake_result

    monkeypatch.setattr('app.main.run_pricing', fake_price_lookup)

    price_payload = {
        'card_id': card_id,
        'name': 'Sidney Crosby',
        'card_series': 'Upper Deck',
        'card_number': '87',
        'card_type': 'Base',
    }

    response = client.post('/price-card', json=price_payload)
    assert response.status_code == 200, response.text

    body = response.json()
    assert body['status'] == 'ok', body
    assert body['data']['estimate'] == 125.0
    assert body['data']['price_low'] == 110.0
    assert body['data']['price_high'] == 140.0
    assert body['data']['sales_count'] == 4

    response = client.get(f'/card/{card_id}/prices')
    assert response.status_code == 200, response.text

    body = response.json()
    assert body['status'] == 'ok', body
    prices = body['data']

    assert len(prices) >= 1
    assert prices[0]['estimate'] == 125.0


def test_flow_save_and_unsave_card(client):
    """User saves a card, sees it in saved cards, then unsaves it."""
    card_id = confirm_card(client)

    response = client.put(f'/card/{card_id}/save', json={'saved': True})
    assert response.status_code == 200, response.text

    body = response.json()
    assert body['status'] == 'ok', body

    response = client.get('/saved-cards')
    assert response.status_code == 200, response.text

    body = response.json()
    assert body['status'] == 'ok', body
    saved_cards = body['data']
    saved_ids = [card['id'] for card in saved_cards]

    assert card_id in saved_ids

    response = client.put(f'/card/{card_id}/save', json={'saved': False})
    assert response.status_code == 200, response.text

    body = response.json()
    assert body['status'] == 'ok', body

    response = client.get('/saved-cards')
    assert response.status_code == 200, response.text

    body = response.json()
    assert body['status'] == 'ok', body
    saved_cards = body['data']
    saved_ids = [card['id'] for card in saved_cards]

    assert card_id not in saved_ids
