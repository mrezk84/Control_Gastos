import React from 'react';
import Ticker from '../caja/Ticker';
import { useTheme } from '../../hooks/useTheme';

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
      <div className="cj-login-ticker"><Ticker items={PROMO_ITEMS} seconds={45} /></div>
      <div className="cj-login-split">
        <aside className="cj-login-aside" aria-hidden="true">
          <div className="cj-login-brand">
            <div className="cj-login-mark">$</div>
            <span>Control de Gastos</span>
          </div>
          <div className="cj-login-pitch">
            <h2>Cada peso, a la vista.</h2>
            <div className="cj-login-receipt">
              <div className="cj-login-receipt-row"><span>ÚLTIMO REGISTRO</span><span>N.º 0042</span></div>
              <div className="cj-login-receipt-rule" />
              <div className="cj-login-receipt-line"><span>Supermercado</span><span className="cj-dots" /><b>$38.420</b></div>
              <div className="cj-login-receipt-row cj-login-receipt-total"><span>TOTAL MES</span><b>$248.700</b></div>
            </div>
          </div>
          <div className="cj-login-lamps"><span /><span /><span /></div>
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
