import React from 'react';
import Ticker from '../caja/Ticker';
import { useTheme } from '../../hooks/useTheme';

// Marquesina promocional del login y el registro: desactivada. Ponla en true para volver a mostrarla.
const SHOW_PROMO_TICKER = false;

// Marquesina promocional (cada par es [texto, resaltado en negrita])
const PROMO_ITEMS = [
  ['Tu control financiero', null],
  ['Escanea facturas y códigos', 'QR'],
  ['Avisos antes de', 'cada vencimiento'],
  ['Presupuestos y', 'analíticas'],
  ['Funciona en', 'cualquier país'],
  ['Modo', 'claro y oscuro'],
  ['Cada peso,', 'a la vista'],
];

/** Marco de las pantallas de acceso (Login.dc.html): marquesina, panel de acento a la izquierda y formulario a la derecha. */
function AuthShell({ children }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="cj cj-login">
      {SHOW_PROMO_TICKER && <div className="cj-login-ticker"><Ticker items={PROMO_ITEMS} seconds={45} /></div>}
      <div className="cj-login-split">
        <aside className="cj-login-aside" aria-hidden="true">
          <div className="cj-login-brand">
            <div className="cj-login-mark">$</div>
            <span>Control de Gastos</span>
          </div>
          <div className="cj-login-pitch">
            <h2>Cada peso, <em>a la vista.</em></h2>
            <p>Escanea el recibo, registra con centavos y mira cuánto te queda del mes.</p>
            <div className="cj-login-preview">
              <div className="cj-login-preview-row">
                <span>Gastado en el mes</span>
                <span className="cj-login-chip">−8,4 %</span>
              </div>
              <div className="cj-login-preview-amt">$58.420<small>,50</small></div>
              <div className="cj-login-preview-bar"><span /></div>
              <div className="cj-login-preview-item"><span>Supermercado</span><b>−$4.250,50</b></div>
            </div>
          </div>
          <ul className="cj-login-points">
            <li><i className="ph ph-qr-code" aria-hidden="true" />Escaneo QR y OCR</li>
            <li><i className="ph ph-bell" aria-hidden="true" />Avisos de vencimiento</li>
            <li><i className="ph ph-globe" aria-hidden="true" />Tu moneda</li>
          </ul>
        </aside>

        <main className="cj-login-main">
          <div className="cj-login-top">
            <button
              type="button"
              className="cj-login-theme"
              onClick={toggle}
              aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              <i className={`ph ph-${theme === 'dark' ? 'sun' : 'moon'}`} aria-hidden="true" />
            </button>
          </div>
          <div className="cj-login-center">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AuthShell;
