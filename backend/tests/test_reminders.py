from datetime import date, timedelta


HOY = date.today()


def nuevo(client, headers, **c):
    body = {"description": "UTE", "amount": 3200, "category": "Servicios",
            "due_date": (HOY + timedelta(days=5)).isoformat(), "source": "qr", **c}
    r = client.post("/reminders/", headers=headers, json=body)
    assert r.status_code == 201, r.text
    return r.json()


class TestRecordatorios:
    def test_crud(self, client, auth):
        r = nuevo(client, auth)
        assert r["status"] == "pending" and r["source"] == "qr"
        assert [x["id"] for x in client.get("/reminders/?status=pending", headers=auth).json()] == [r["id"]]
        u = client.put(f"/reminders/{r['id']}", headers=auth, json={"amount": 4000})
        assert u.status_code == 200 and u.json()["amount"] == 4000
        assert client.delete(f"/reminders/{r['id']}", headers=auth).status_code == 204
        assert client.get("/reminders/", headers=auth).json() == []

    def test_validaciones(self, client, auth):
        base = {"description": "x", "amount": 10, "due_date": "2026-12-01"}
        assert client.post("/reminders/", headers=auth, json={**base, "amount": 0}).status_code == 422
        assert client.post("/reminders/", headers=auth, json={**base, "description": "  "}).status_code == 422
        assert client.post("/reminders/", headers=auth, json={**base, "source": "otro"}).status_code == 422

    def test_requiere_sesion(self, client):
        assert client.get("/reminders/").status_code == 401

    def test_aislamiento_entre_usuarios(self, client, auth, other_auth):
        r = nuevo(client, auth)
        assert client.get("/reminders/", headers=other_auth).json() == []
        assert client.put(f"/reminders/{r['id']}", headers=other_auth, json={"amount": 1}).status_code == 404
        assert client.delete(f"/reminders/{r['id']}", headers=other_auth).status_code == 404
        assert client.post(f"/reminders/{r['id']}/pay", headers=other_auth).status_code == 404

    def test_descartar(self, client, auth):
        r = nuevo(client, auth)
        assert client.put(f"/reminders/{r['id']}", headers=auth, json={"status": "dismissed"}).json()["status"] == "dismissed"
        assert client.get("/reminders/?status=pending", headers=auth).json() == []
        assert client.put(f"/reminders/{r['id']}", headers=auth, json={"status": "paid"}).status_code == 422

    def test_pagar_crea_el_gasto(self, client, auth):
        r = nuevo(client, auth)
        p = client.post(f"/reminders/{r['id']}/pay", headers=auth)
        assert p.status_code == 200 and p.json()["status"] == "paid" and p.json()["expense_id"]
        gastos = client.get("/expenses/", headers=auth).json()
        assert len(gastos) == 1 and gastos[0]["amount"] == 3200 and gastos[0]["category"] == "Servicios"
        assert client.post(f"/reminders/{r['id']}/pay", headers=auth).status_code == 409


class TestNotificaciones:
    GASTO = {"description": "Edenor", "amount": 58000, "category": "Servicios", "date": HOY.isoformat()}

    def test_gasto_escaneado_notifica(self, client, auth):
        client.post("/expenses/", headers=auth, json={**self.GASTO, "amount": 1000})
        r = client.post("/expenses/", headers=auth, json={**self.GASTO, "from_scan": True})
        assert r.status_code == 200 and "from_scan" not in r.json()
        n = client.get("/notifications/", headers=auth).json()
        assert n["unread_count"] == 1
        assert n["notifications"][0]["kind"] == "payment_registered"
        assert n["notifications"][0]["body"] == "$58.000 en Edenor · Total del mes: $59.000"

    def test_gasto_normal_no_notifica(self, client, auth):
        client.post("/expenses/", headers=auth, json=self.GASTO)
        assert client.get("/notifications/", headers=auth).json()["unread_count"] == 0

    def test_moneda_del_perfil_en_el_texto(self, client, auth):
        assert client.put("/auth/me", headers=auth, json={"currency": "usd"}).json()["currency"] == "USD"
        client.post("/expenses/", headers=auth, json={**self.GASTO, "amount": 1250.5, "from_scan": True})
        body = client.get("/notifications/", headers=auth).json()["notifications"][0]["body"]
        assert body.startswith("US$1.250,50 en Edenor")

    def test_marcar_leidas(self, client, auth, other_auth):
        for _ in range(2):
            client.post("/expenses/", headers=auth, json={**self.GASTO, "from_scan": True})
        lista = client.get("/notifications/", headers=auth).json()
        assert lista["unread_count"] == 2
        uno = lista["notifications"][0]["id"]
        assert client.post(f"/notifications/{uno}/read", headers=other_auth).status_code == 404
        assert client.post(f"/notifications/{uno}/read", headers=auth).json()["read_at"]
        assert client.get("/notifications/", headers=auth).json()["unread_count"] == 1
        assert client.post("/notifications/read-all", headers=auth).status_code == 204
        assert client.get("/notifications/", headers=auth).json()["unread_count"] == 0
        assert client.get("/notifications/", headers=other_auth).json()["notifications"] == []


class TestPerfil:
    def test_actualizar_y_validar(self, client, auth):
        r = client.put("/auth/me", headers=auth,
                       json={"country": "uy", "currency": "uyu", "timezone": "America/Montevideo"})
        assert r.status_code == 200
        assert (r.json()["country"], r.json()["currency"]) == ("UY", "UYU")
        assert client.get("/auth/me", headers=auth).json()["timezone"] == "America/Montevideo"
        assert client.put("/auth/me", headers=auth, json={"country": "URY"}).status_code == 422
        assert client.put("/auth/me", headers=auth, json={"currency": "12"}).status_code == 422
        assert client.put("/auth/me", headers=auth, json={"timezone": "Marte/Olympus"}).status_code == 422


class TestOCR:
    def test_vencimiento_en_el_ocr(self):
        from app.services.ocr_service import OCRService
        r = OCRService._parse_receipt_text("UTE\nTotal: $ 3200\nFecha 01/11/2026\nVencimiento: 20/11/2026")
        assert r["due_date"] == "2026-11-20" and r["amount"] == 3200
