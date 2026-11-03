"""Adaptadores de QR por país. Cada módulo expone matches(text) -> bool y parse(text) -> dict.

Para añadir un país: crea <iso2>.py con esas dos funciones, sus tests, y agrégalo a ADAPTERS.
"""
from . import ar, uy

ADAPTERS = [uy, ar]
