"""Neutralización de inyección de fórmulas (CSV/Excel injection) en las exportaciones.

Un texto que empieza por «=», «+», «-», «@», tabulación o retorno de carro lo interpreta una hoja de
cálculo como fórmula. Descripción y categoría las escribe la persona (o llegan de un CSV importado),
así que se tratan como no confiables al exportarlas.
"""

FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def neutralize_for_csv(value):
    """Antepone una comilla simple a los textos que una hoja de cálculo ejecutaría como fórmula.

    Los números y las fechas pasan sin cambios. Entrecomillar el CSV por sí solo no basta.
    """
    if isinstance(value, str) and value.startswith(FORMULA_PREFIXES):
        return "'" + value
    return value


def restore_from_csv(value: str) -> str:
    """Inverso de `neutralize_for_csv` al importar: así exportar e importar no acumula comillas."""
    if value.startswith("'") and value[1:].startswith(FORMULA_PREFIXES):
        return value[1:]
    return value


def write_text_cell(ws, row: int, column: int, value):
    """Escribe una celda de Excel; los textos se fuerzan a tipo texto para que nunca sean fórmulas."""
    cell = ws.cell(row=row, column=column, value=value)
    if isinstance(value, str):
        cell.data_type = "s"
    return cell
