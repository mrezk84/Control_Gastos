from datetime import date, timedelta

from app.services import hormiga as svc


def gasto(client, headers, description, amount, day=None, category="Alimentación"):
    day = day or date.today()
    r = client.post("/expenses/", headers=headers, json={
        "description": description, "amount": amount, "category": category, "date": day.isoformat()})
    assert r.status_code == 200, r.text
    return r.json()


def avisos(client, headers):
    return [n for n in client.get("/notifications/", headers=headers).json()["notifications"] if n["kind"].startswith("ant_")]


class TestUmbralAdaptativo:
    def test_con_pocos_datos_usa_el_de_por_defecto(self):
        assert svc.adaptive_threshold([100, 200, 50]) == svc.DEFAULT_THRESHOLD

    def test_se_adapta_al_percentil_30_de_la_persona(self):
        montos = list(range(10, 160, 10))  # 15 compras: 10..150
        t = svc.adaptive_threshold(montos)
        assert 40 <= t <= 60  # ~ percentil 30

    def test_otro_bolsillo_otro_umbral(self):
        barato = svc.adaptive_threshold([20 * i for i in range(1, 21)])
        caro = svc.adaptive_threshold([2000 * i for i in range(1, 21)])
        assert caro > barato * 50

    def test_normaliza_tildes_y_mayusculas(self):
        assert svc.normalize("  Café ") == svc.normalize("cafe") == "cafe"

    def test_repeticion_cada_cinco(self):
        assert [n for n in range(1, 16) if svc.should_notify_repeat(n)] == [3, 5, 10, 15]


class TestConfig:
    def test_valores_iniciales_automaticos(self, client, auth):
        c = client.get("/hormiga/config", headers=auth).json()
        assert c["mode"] == "auto" and c["threshold"] == svc.DEFAULT_THRESHOLD and c["notify"] is True and c["limit"] is None

    def test_fijar_umbral_manual_y_volver_a_automatico(self, client, auth):
        c = client.put("/hormiga/config", headers=auth, json={"threshold": 150}).json()
        assert c["mode"] == "manual" and c["threshold"] == 150
        c = client.put("/hormiga/config", headers=auth, json={"threshold": None}).json()
        assert c["mode"] == "auto"

    def test_valores_invalidos_se_rechazan(self, client, auth):
        assert client.put("/hormiga/config", headers=auth, json={"threshold": -5}).status_code == 422
        assert client.put("/hormiga/config", headers=auth, json={"limit": 0}).status_code == 422

    def test_excluidas_se_normalizan_sin_duplicados(self, client, auth):
        c = client.put("/hormiga/config", headers=auth, json={"excluded": ["Café", "cafe ", "Bus"]}).json()
        assert c["excluded"] == ["cafe", "bus"]

    def test_requiere_sesion(self, client):
        assert client.get("/hormiga/config").status_code == 401


class TestAvisos:
    def test_tercera_compra_repetida_avisa(self, client, auth):
        gasto(client, auth, "Café", 95, date.today() - timedelta(days=2))
        gasto(client, auth, "café", 95, date.today() - timedelta(days=1))
        assert avisos(client, auth) == []
        gasto(client, auth, "Cafe", 100)
        n = avisos(client, auth)
        assert len(n) == 1 and n[0]["kind"] == "ant_repeat"
        assert "3 veces" in n[0]["title"] and "290" in n[0]["body"]
        assert n[0]["link"] == "/hormiga"

    def test_compra_grande_no_cuenta(self, client, auth):
        for i in range(3):
            gasto(client, auth, "Supermercado", 1500, date.today() - timedelta(days=i))
        assert avisos(client, auth) == []

    def test_limite_de_un_aviso_por_dia(self, client, auth):
        for i, name in enumerate(["Café", "Kiosco"]):
            for d in range(3):
                gasto(client, auth, name, 50, date.today() - timedelta(days=d))
        assert len(avisos(client, auth)) == 1  # el segundo patrón espera al día siguiente

    def test_aviso_del_tope_al_80_por_ciento(self, client, auth):
        client.put("/hormiga/config", headers=auth, json={"limit": 1000})
        gasto(client, auth, "Uno", 200)
        gasto(client, auth, "Dos", 250)
        assert avisos(client, auth) == []
        gasto(client, auth, "Tres", 280)  # 730 → aún no; 
        gasto(client, auth, "Cuatro", 100)  # 830 → cruza el 80 %
        n = avisos(client, auth)
        assert len(n) == 1 and n[0]["kind"] == "ant_limit" and "80 %" in n[0]["title"]

    def test_avisos_desactivados(self, client, auth):
        client.put("/hormiga/config", headers=auth, json={"notify": False})
        for d in range(3):
            gasto(client, auth, "Café", 95, date.today() - timedelta(days=d))
        assert avisos(client, auth) == []

    def test_excluida_no_avisa(self, client, auth):
        client.put("/hormiga/config", headers=auth, json={"excluded": ["Boleto bus"]})
        for d in range(3):
            gasto(client, auth, "Boleto bus", 48, date.today() - timedelta(days=d))
        assert avisos(client, auth) == []

    def test_un_error_al_avisar_no_rompe_el_registro(self, client, auth, monkeypatch):
        monkeypatch.setattr(svc, "candidate_alert", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("falla")))
        r = client.post("/expenses/", headers=auth, json={"description": "Café", "amount": 95, "category": "Alimentación", "date": date.today().isoformat()})
        assert r.status_code == 200
