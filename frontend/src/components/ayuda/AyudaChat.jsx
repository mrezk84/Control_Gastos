import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { helpAnswer, suggestedFor } from '../../utils/ayuda';

function Blocks({ blocks, onGo }) {
  return blocks.map((b, i) => {
    if (b.type === 'p') return <p key={i}>{b.text}</p>;
    if (b.type === 'steps') {
      return (
        <ol className="cj-hz-steps" key={i}>
          {b.items.map((t, n) => (<li key={t}><span>{n + 1}</span>{t}</li>))}
        </ol>
      );
    }
    if (b.type === 'link') {
      return (
        <button type="button" className="cj-hz-cta is-inline" key={i} onClick={() => onGo(b.to)}>
          <Icon name="arrow-square-out" /><span>{b.label}</span>
        </button>
      );
    }
    return null;
  });
}

/**
 * Chat de ayuda de la aplicación. No usa servidor ni modelo: responde con una base de conocimiento local
 * (utils/ayuda.js) sobre cómo usar cada pantalla. Se abre desde la cabecera; Escape lo cierra.
 */
function AyudaChat({ open, onClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const ask = (text) => {
    const question = text.trim();
    if (!question) return;
    const reply = helpAnswer(question, pathname);
    setMessages((m) => [...m, { from: 'me', text: question }, { from: 'bot', ...reply }]);
    setDraft('');
  };

  const go = (to) => {
    navigate(to);
    if (window.innerWidth < 840) onClose();
  };

  const starters = suggestedFor(pathname);

  return (
    <aside className="cj-help" role="dialog" aria-label="Ayuda de la aplicación">
      <header className="cj-help-head">
        <span className="cj-hz-bot" aria-hidden="true"><Icon name="lifebuoy" duotone /></span>
        <div>
          <b>Ayuda</b>
          <small>RESPUESTAS SOBRE CÓMO USAR LA APP</small>
        </div>
        <button type="button" className="cj-guia-hide" onClick={onClose} aria-label="Cerrar la ayuda"><Icon name="x" /></button>
      </header>

      <div className="cj-help-thread" role="log" aria-live="polite">
        <div className="cj-hz-msg is-bot">
          <p>¡Hola! Te ayudo a usar la app. ¿Qué quieres hacer?</p>
          {messages.length === 0 && (
            <div className="cj-help-starters">
              {starters.map((t) => (
                <button key={t.id} type="button" className="cj-hz-chip" onClick={() => ask(t.title)}>{t.title}</button>
              ))}
            </div>
          )}
        </div>
        {messages.map((m, i) => (
          m.from === 'me' ? (
            <div className="cj-hz-msg is-me" key={i}>{m.text}</div>
          ) : (
            <div className="cj-hz-msg is-bot" key={i}>
              <Blocks blocks={m.blocks} onGo={go} />
              {m.suggestions?.length > 0 && (
                <div className="cj-help-starters">
                  {m.suggestions.map((t) => (
                    <button key={t.id} type="button" className="cj-hz-chip" onClick={() => ask(t.title)}>{t.title}</button>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
        <div ref={endRef} />
      </div>

      <form className="cj-hz-ask cj-help-ask" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
        <label htmlFor="help-msg" className="cj-sr">Escribe tu pregunta</label>
        <input id="help-msg" ref={inputRef} type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ej.: ¿cómo escaneo un recibo?" autoComplete="off" />
        <button type="submit" aria-label="Enviar" disabled={!draft.trim()}><Icon name="paper-plane-tilt" /></button>
      </form>
    </aside>
  );
}

export default AyudaChat;
