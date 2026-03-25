def test_cards_return(client):
    """/GET cards returns list of cards and expected fields"""
    payload = {
        'name': 'SearchTest One',
        'card_series': 'Series',
        'card_number': '10',
        'team_name': 'X',
        'card_type': 'Base',
        'front_image_key': 'cards/s1/front.jpg',
        'back_image_key': 'cards/s1/back.jpg',
    }
    client.post('/confirm-card', json=payload)

    r = client.get('/cards')
    assert r.status_code == 200
    body = r.json()

    assert body['status'] == 'ok'
    assert isinstance(body['data'], list)
    if body['data']:
        item = body['data'][0]
        for k in ['id', 'name', 'card_series', 'card_number', 'team_name', 'card_type', 'image', 'saved']:
            assert k in item


def test_filter(client):
    """/GET cards with filter returns expected results"""
    match_id = client.post(
        '/confirm-card',
        json={
            'name': 'UNIQUE_SEARCH_NAME_123',
            'card_series': 'Series',
            'card_number': '99',
            'team_name': 'T',
            'card_type': 'Base',
            'front_image_key': 'cards/u/front.jpg',
            'back_image_key': 'cards/u/back.jpg',
        },
    ).json()['data']['card_id']

    nonmatch_id = client.post(
        '/confirm-card',
        json={
            'name': 'SOME_OTHER_NAME',
            'card_series': 'Series',
            'card_number': '100',
            'team_name': 'T',
            'card_type': 'Base',
            'front_image_key': 'cards/nm/front.jpg',
            'back_image_key': 'cards/nm/back.jpg',
        },
    ).json()['data']['card_id']

    r = client.get('/cards', params={'q': 'UNIQUE_SEARCH_NAME_123'})
    assert r.status_code == 200
    body = r.json()
    assert body['status'] == 'ok'

    ids = [c['id'] for c in body['data']]

    assert match_id in ids
    assert nonmatch_id not in ids

    assert any('UNIQUE_SEARCH_NAME_123' in c['name'] for c in body['data'])
