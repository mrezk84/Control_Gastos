---
target: login
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/marcosrezk/Proyecto_Control_Gastos/Control_Gastos/frontend/src/components/Login.js"
target_fingerprint: "sha256:1285f465d2241503ff5a86e24b6c53a23110634193860f491ddc849aa9136ed9"
target_path: /Users/marcosrezk/Proyecto_Control_Gastos/Control_Gastos/frontend/src/components/Login.js
timestamp: 2026-11-04T01-19-32Z
slug: frontend-src-components-login-js
closed: true
---
# Crítica: Login (Login.js + AuthShell.js)
Method: dual-agent. Score 29/40 (Good). Browser evidence unavailable (extensión no conectada).

Prioridades:
- [P1] En móvil el formulario queda bajo el panel decorativo (adapt)
- [P1] Error sin aria-describedby, sin foco al campo ni salida (harden)
- [P2] OAuth sin estado de carga (harden)
- [P2] Objetivos táctiles < 44 px: "¿La olvidaste?", "Crear cuenta" (adapt)
- [P3] Enlace dentro del label ensucia el nombre accesible (clarify)

Detector: 7 avisos slop (overused-font x6, gradient-text x2 en AuthEnhancements.css:131,400); ninguno en Login.js/AuthShell.js. AuthEnhancements.css se importa en index.css:7 pero Login no usa sus clases.
