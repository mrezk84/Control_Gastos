"""Pruebas de auditoría: PASS confirma el comportamiento vulnerable observado.

Usa SQLite en memoria y sustituye el transporte HTTP; no contacta producción.
"""
import sys, importlib, io
from urllib.parse import urlparse, parse_qs
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
sys.path.insert(0, str(ROOT / 'backend' / 'tests'))
from conftest import client, auth, sent_emails, register, login
from openpyxl import load_workbook

def test_reset_reusable_and_old_session_valid(client, auth, sent_emails):
    assert client.post('/auth/forgot-password',json={'email':'ana@example.com'}).status_code == 200
    token = parse_qs(urlparse(sent_emails[0][1]).query)['token'][0]
    assert client.post('/auth/reset-password',json={'token':token,'new_password':'nuevo123'}).status_code == 200
    assert client.get('/auth/me',headers=auth).status_code == 200
    assert client.post('/auth/reset-password',json={'token':token,'new_password':'otro1234'}).status_code == 200
    assert login(client,password='otro1234').status_code == 200

def test_login_without_rate_limit(client):
    codes=[client.post('/auth/token',data={'username':'nobody','password':'bad'}).status_code for _ in range(12)]
    assert codes == [401]*12

def test_oauth_state_reusable_without_browser_binding():
    oauth=importlib.import_module('app.routes.oauth_routes')
    state=oauth._make_state('google')
    oauth._check_state(state,'google')
    oauth._check_state(state,'google')

def test_oauth_email_links_different_subject(client, auth):
    from app.main import app
    from app.database import get_db
    oauth=importlib.import_module('app.routes.oauth_routes')
    with next(app.dependency_overrides[get_db]()) as db:
        user=oauth._get_or_create_oauth_user(db,'ana@example.com','microsoft','unrelated-subject')
        assert user.username == 'ana'
        assert user.hashed_password

def test_excel_formula_injection(client,auth):
    formula='=1+1'
    assert client.post('/expenses/',headers=auth,json={'description':formula,'category':'Otros','amount':1,'date':'2026-11-09'}).status_code == 200
    response=client.get('/expenses/export/excel',headers=auth)
    cell=load_workbook(io.BytesIO(response.content)).active['B2']
    assert cell.data_type == 'f'
    assert cell.value == formula

def test_push_ssrf_uses_private_endpoint(client,auth,monkeypatch):
    import base64
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization
    import requests
    push=importlib.import_module('app.services.push')
    key=ec.generate_private_key(ec.SECP256R1())
    public=key.public_key().public_bytes(serialization.Encoding.X962,serialization.PublicFormat.UncompressedPoint)
    enc=lambda b:base64.urlsafe_b64encode(b).rstrip(b'=').decode()
    monkeypatch.setenv('VAPID_PRIVATE_KEY', enc(key.private_numbers().private_value.to_bytes(32,"big")))
    monkeypatch.setenv('VAPID_PUBLIC_KEY',enc(public))
    captured=[]
    def fake_request(self,method,url,**kwargs):
        captured.append((method,url,kwargs.get('timeout')))
        r=requests.Response();r.status_code=201;r._content=b'';return r
    monkeypatch.setattr(requests.sessions.Session,'request',fake_request)
    endpoint='https://127.0.0.1:8443/internal'
    assert client.post('/push/subscribe',headers=auth,json={'endpoint':endpoint,'keys':{'p256dh':enc(public),'auth':enc(b'0123456789abcdef')}}).status_code == 201
    assert client.post('/expenses/',headers=auth,json={'description':'test','category':'Otros','amount':1,'date':'2026-11-09','from_scan':True}).status_code == 200
    assert captured and captured[0][1] == endpoint
