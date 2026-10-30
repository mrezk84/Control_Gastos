GASTO = {"description": "Supermercado", "amount": 1500.5, "category": "Alimentación", "date": "2026-10-30"}


def crear(client, headers, **cambios):
    r = client.post("/expenses/", headers=headers, json={**GASTO, **cambios})
    assert r.status_code == 200, r.text
    return r.json()


class TestCrud:
    def test_crear_y_listar(self, client, auth):
        g = crear(client, auth)
        assert g["amount"] == 1500.5 and g["category"] == "Alimentación" and g["date"] == "2026-10-30"
        lista = client.get("/expenses/", headers=auth).json()
        assert [e["id"] for e in lista] == [g["id"]]

    def test_requiere_sesion(self, client):
        assert client.get("/expenses/").status_code == 401
        assert client.post("/expenses/", json=GASTO).status_code == 401

    def test_editar_el_monto(self, client, auth):
        g = crear(client, auth)
        r = client.put(f"/expenses/{g['id']}", headers=auth, json={"amount": 2600})
        assert r.status_code == 200 and r.json()["amount"] == 2600

    def test_editar_la_fecha(self, client, auth):
        # Regresión: ExpenseUpdate.date se resolvía como None y toda edición con fecha daba 422
        g = crear(client, auth)
        r = client.put(f"/expenses/{g['id']}", headers=auth, json={**GASTO, "date": "2026-10-29", "amount": 10})
        assert r.status_code == 200, r.text
        assert r.json()["date"] == "2026-10-29" and r.json()["amount"] == 10

    def test_fecha_invalida_se_rechaza(self, client, auth):
        g = crear(client, auth)
        assert client.put(f"/expenses/{g['id']}", headers=auth, json={"date": "no-es-fecha"}).status_code == 422

    def test_eliminar(self, client, auth):
        g = crear(client, auth)
        assert client.delete(f"/expenses/{g['id']}", headers=auth).status_code == 204
        assert client.get("/expenses/", headers=auth).json() == []

    def test_resumen(self, client, auth):
        crear(client, auth, amount=100, category="Salud")
        crear(client, auth, amount=300, category="Salud")
        r = client.get("/expenses/summary", headers=auth)
        assert r.status_code == 200


class TestAislamientoEntreUsuarios:
    def test_cada_usuario_ve_solo_sus_gastos(self, client, auth, other_auth):
        crear(client, auth, description="de ana")
        crear(client, other_auth, description="de beto")
        assert [e["description"] for e in client.get("/expenses/", headers=auth).json()] == ["de ana"]
        assert [e["description"] for e in client.get("/expenses/", headers=other_auth).json()] == ["de beto"]

    def test_no_se_puede_editar_ni_borrar_el_gasto_ajeno(self, client, auth, other_auth):
        g = crear(client, auth)
        assert client.put(f"/expenses/{g['id']}", headers=other_auth, json={"amount": 1}).status_code == 404
        assert client.delete(f"/expenses/{g['id']}", headers=other_auth).status_code == 404
        assert client.get("/expenses/", headers=auth).json()[0]["amount"] == 1500.5

    def test_editar_o_borrar_algo_inexistente(self, client, auth):
        assert client.put("/expenses/999", headers=auth, json={"amount": 1}).status_code == 404
        assert client.delete("/expenses/999", headers=auth).status_code == 404


class TestPresupuestos:
    BUDGET = {"category": "Alimentación", "amount": 50000, "month": 10, "year": 2026}

    def test_crear_listar_y_aislar(self, client, auth, other_auth):
        r = client.post("/budgets/", headers=auth, json=self.BUDGET)
        assert r.status_code == 201
        assert len(client.get("/budgets/", headers=auth).json()) == 1
        assert client.get("/budgets/", headers=other_auth).json() == []

    def test_no_se_toca_el_presupuesto_ajeno(self, client, auth, other_auth):
        b = client.post("/budgets/", headers=auth, json=self.BUDGET).json()
        assert client.put(f"/budgets/{b['id']}", headers=other_auth, json={"amount": 1}).status_code == 404
        assert client.delete(f"/budgets/{b['id']}", headers=other_auth).status_code == 404
