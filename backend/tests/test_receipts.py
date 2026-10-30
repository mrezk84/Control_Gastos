import io

from PIL import Image

from .conftest import png_bytes
from .test_expenses import crear


def subir(client, headers, expense_id, nombre="recibo.png", contenido=None, tipo="image/png"):
    return client.post(
        "/receipts/upload",
        headers=headers,
        data={"expense_id": str(expense_id)},
        files={"file": (nombre, contenido if contenido is not None else png_bytes(), tipo)},
    )


class TestSubidaYDescarga:
    def test_la_imagen_se_reduce_y_se_guarda_en_la_base(self, client, auth):
        g = crear(client, auth)
        r = subir(client, auth, g["id"])
        assert r.status_code == 200
        assert r.json()["file_type"] == "image" and r.json()["file_path"] is None

        f = client.get(f"/receipts/{r.json()['id']}/file", headers=auth)
        assert f.status_code == 200 and f.headers["content-type"] == "image/jpeg"
        ancho, alto = Image.open(io.BytesIO(f.content)).size
        assert max(ancho, alto) <= 1600
        assert len(f.content) < len(png_bytes())

    def test_el_gasto_apunta_al_archivo(self, client, auth):
        g = crear(client, auth)
        rid = subir(client, auth, g["id"]).json()["id"]
        assert client.get("/expenses/", headers=auth).json()[0]["receipt_url"] == f"/receipts/{rid}/file"

    def test_pdf_se_guarda_tal_cual(self, client, auth):
        g = crear(client, auth)
        pdf = b"%PDF-1.4 contenido de prueba"
        r = subir(client, auth, g["id"], "factura.pdf", pdf, "application/pdf")
        assert r.status_code == 200 and r.json()["file_type"] == "pdf"
        f = client.get(f"/receipts/{r.json()['id']}/file", headers=auth)
        assert f.headers["content-type"] == "application/pdf" and f.content == pdf

    def test_lista_los_recibos_de_un_gasto(self, client, auth):
        g = crear(client, auth)
        subir(client, auth, g["id"])
        subir(client, auth, g["id"], "otro.png")
        assert len(client.get(f"/receipts/expense/{g['id']}", headers=auth).json()) == 2

    def test_eliminar_el_recibo(self, client, auth):
        g = crear(client, auth)
        rid = subir(client, auth, g["id"]).json()["id"]
        assert client.delete(f"/receipts/{rid}", headers=auth).status_code == 204
        assert client.get(f"/receipts/{rid}/file", headers=auth).status_code == 404


class TestValidaciones:
    def test_extension_no_permitida(self, client, auth):
        g = crear(client, auth)
        assert subir(client, auth, g["id"], "virus.exe", b"MZ", "application/octet-stream").status_code == 400

    def test_archivo_demasiado_grande(self, client, auth):
        g = crear(client, auth)
        enorme = b"0" * (4 * 1024 * 1024 + 1)
        assert subir(client, auth, g["id"], "grande.png", enorme).status_code == 400

    def test_imagen_corrupta(self, client, auth):
        g = crear(client, auth)
        assert subir(client, auth, g["id"], "rota.png", b"no soy una imagen").status_code == 400

    def test_gasto_inexistente(self, client, auth):
        assert subir(client, auth, 999).status_code == 404

    def test_escanear_sin_clave_de_ocr_explica_el_motivo(self, client, auth):
        r = client.post("/receipts/scan", headers=auth, files={"file": ("r.png", png_bytes((200, 200)), "image/png")})
        assert r.status_code == 500 and "OCR_SPACE_API_KEY" in r.json()["detail"]


class TestAislamiento:
    def test_no_se_sube_un_recibo_a_un_gasto_ajeno(self, client, auth, other_auth):
        g = crear(client, auth)
        assert subir(client, other_auth, g["id"]).status_code == 404

    def test_no_se_descarga_ni_borra_el_recibo_ajeno(self, client, auth, other_auth):
        g = crear(client, auth)
        rid = subir(client, auth, g["id"]).json()["id"]
        assert client.get(f"/receipts/{rid}/file", headers=other_auth).status_code == 404
        assert client.delete(f"/receipts/{rid}", headers=other_auth).status_code == 404
        assert client.get(f"/receipts/expense/{g['id']}", headers=other_auth).status_code == 404

    def test_requiere_sesion(self, client, auth):
        g = crear(client, auth)
        rid = subir(client, auth, g["id"]).json()["id"]
        assert client.get(f"/receipts/{rid}/file").status_code == 401
