import app.main as main
from app.auth.supabase_auth import current_user


def only_user_a(client):
    """Ensures only User A can see the card, not User B"""
    # Create as User A
    card_id = client.post(
        '/confirm-card',
        json={
            'name': 'Carey Price',
            'card_series': 'Upper Deck Series 1',
            'card_number': '31',
            'team_name': 'MTL Canadiens',
            'card_type': 'Base',
            'front_image_key': 'cards/a/front.jpg',
            'back_image_key': 'cards/a/back.jpg',
        },
    ).json()['data']['card_id']

    # Switch to User B
    main.app.dependency_overrides[current_user] = lambda: {'user_id': 'other_user'}

    r = client.get(f'/card/{card_id}')
    assert r.status_code == 200
    body = r.json()
    assert body['status'] == 'error'
    # your code uses INVALID_INPUT for not found
    assert body['error']['code'] == 'INVALID_INPUT'


def only_user_a_price(client, monkeypatch):
    """User A creates card; User B cannot price it (FORBIDDEN)"""

    import app.main as main2

    card_id = client.post(
        '/confirm-card',
        json={
            'name': 'Carey Price',
            'card_series': 'Upper Deck Series 1',
            'card_number': '31',
            'team_name': 'MTL Canadiens',
            'card_type': 'Base',
            'front_image_key': 'cards/a2/front.jpg',
            'back_image_key': 'cards/a2/back.jpg',
        },
    ).json()['data']['card_id']

    monkeypatch.setattr(main2, 'run_pricing', lambda _: {'estimate': 1.0, 'price_low': 1.0, 'price_high': 1.0, 'sales_count': 1, 'confidence': 1.0})

    # Switch to User B
    main2.app.dependency_overrides[current_user] = lambda: {'user_id': 'other_user'}

    r = client.post(
        '/price-card',
        json={'card_id': card_id, 'name': 'Carey Price', 'card_series': 'Upper Deck Series 1', 'card_number': '31', 'card_type': 'Base'},
    )
    body = r.json()
    assert body['status'] == 'error'
    assert body['error']['code'] == 'FORBIDDEN'


def user_a_save_only(client):
    """User A creates card; User B cannot save it"""
    card_id = client.post(
        '/confirm-card',
        json={
            'name': 'Carey Price',
            'card_series': 'Upper Deck Series 1',
            'card_number': '31',
            'team_name': 'MTL Canadiens',
            'card_type': 'Base',
            'front_image_key': 'cards/a3/front.jpg',
            'back_image_key': 'cards/a3/back.jpg',
        },
    ).json()['data']['card_id']

    # Switch to User B
    main.app.dependency_overrides[current_user] = lambda: {'user_id': 'other_user'}

    r = client.put(f'/card/{card_id}/save', json={'saved': True})
    body = r.json()
    assert body['status'] == 'error'
    assert body['error']['code'] == 'NOT_FOUND'
