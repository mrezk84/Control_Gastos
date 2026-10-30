from app.database import normalize_database_url


class TestNormalizeDatabaseUrl:
    def test_postgresql_recibe_el_controlador_explicito(self):
        # Regresión: sin controlador, una versión reciente de SQLAlchemy usó psycopg 3 (no instalado) y la
        # función de Vercel se caía al arrancar con "No module named 'psycopg'"
        url = "postgresql://u:p@ep-x-pooler.neon.tech/db?sslmode=require"
        assert normalize_database_url(url) == "postgresql+psycopg2://u:p@ep-x-pooler.neon.tech/db?sslmode=require"

    def test_postgres_corto_tambien(self):
        assert normalize_database_url("postgres://u:p@h/db").startswith("postgresql+psycopg2://u:p@h/db")

    def test_un_controlador_ya_indicado_se_respeta(self):
        assert normalize_database_url("postgresql+psycopg://u:p@h/db") == "postgresql+psycopg://u:p@h/db"
        assert normalize_database_url("postgresql+psycopg2://u:p@h/db") == "postgresql+psycopg2://u:p@h/db"

    def test_otras_bases_no_se_tocan(self):
        assert normalize_database_url("sqlite:///./local.db") == "sqlite:///./local.db"
        assert normalize_database_url("sqlite://") == "sqlite://"

    def test_los_parametros_de_conexion_se_conservan(self):
        url = "postgresql://u:p@h/db?sslmode=require&channel_binding=require"
        assert normalize_database_url(url).endswith("?sslmode=require&channel_binding=require")
