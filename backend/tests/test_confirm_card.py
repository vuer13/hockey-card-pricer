def test_success(client):
    """Test the confirm card endpoint with valid data"""
    payload = {
        'name': 'Carey Price',
        'card_series': '2020-21 Upper Deck Series 1',
        'card_number': '31',
        'team_name': 'Montreal Canadiens',
        'card_type': 'Base',
        'front_image_key': 'cards/test/front.jpg',
        'back_image_key': 'cards/test/back.jpg',
    }

    r = client.post('/confirm-card', json=payload)
    assert r.status_code == 200
    body = r.json()

    assert body['status'] == 'ok'
    assert body['error'] is None
    assert 'card_id' in body['data']
    assert isinstance(body['data']['card_id'], str)
    assert len(body['data']['card_id']) > 0
    # May not need this check, but it ensures the card_id is not an empty string


def test_invalid_fields(client):
    """Test the confirm card endpoint with invalid fields (e.g. empty name, invalid card series)"""
    payload = {
        'name': '',
        'card_series': 'Young Guns',
        'card_number': '10',
        'front_image_key': 'a',
        'back_image_key': 'b',
    }

    r = client.post('/confirm-card', json=payload)
    assert r.status_code == 200
    body = r.json()

    assert body['status'] == 'error'
    assert body['data'] is None
    assert body['error']['code'] == 'INVALID_INPUT'


def test_expected_fields(client):
    """Test that the expected fields are returned when retrieving a card after confirming it"""
    payload = {
        'name': 'Sidney Crosby',
        'card_series': 'Base Set',
        'card_number': '87',
        'team_name': 'Penguins',
        'card_type': 'Base',
        'front_image_key': 'cards/test2/front.jpg',
        'back_image_key': 'cards/test2/back.jpg',
    }

    r = client.post('/confirm-card', json=payload)
    card_id = r.json()['data']['card_id']

    r2 = client.get(f'/card/{card_id}')
    assert r2.status_code == 200
    body = r2.json()

    assert body['status'] == 'ok'
    data = body['data']

    assert data['id'] == card_id
    assert data['name'] == 'Sidney Crosby'
    assert data['card_series'] == 'Base Set'
    assert data['card_number'] == '87'
    assert data['team_name'] == 'Penguins'
    assert data['card_type'] == 'Base'
    assert data['front_image_key'] == 'cards/test2/front.jpg'
    assert data['back_image_key'] == 'cards/test2/back.jpg'
    assert data['saved'] in (True, False)
