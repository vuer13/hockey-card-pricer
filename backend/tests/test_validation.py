def detect_card_invalid_image_type(client):
    """POST /detect-card invalid image_type"""
    r = client.post(
        '/detect-card',
        data={'image_type': 'side'},
        files={'file': ('x.jpg', b'fakebytes', 'image/jpeg')},
    )
    assert r.status_code == 200
    body = r.json()
    assert body['status'] == 'error'
    assert body['error']['code'] == 'INVALID_INPUT'
