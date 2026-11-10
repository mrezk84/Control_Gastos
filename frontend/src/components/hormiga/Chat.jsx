import React, { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { answer, SUGGESTED_QUESTIONS } from '../../utils/hormiga';

function Blocks({ blocks, onPlan }) {
  return blocks.map((b, i) => {
    if (b.type === 'p') return <p key={i}>{b.text}</p>;
    if (b.type === 'ticket') {
      return (
        <div className="cj-hz-ticket" key={i}>
          {b.rows.map((r) => (
            <div className="cj-hz-ticket-row" key={r.label}><span>{r.label}</span><span className="cj-dots" /><b>{r.value}</b></div>
          ))}
          <div className="cj-hz-ticket-total"><span>{b.total.label}</span><b>{b.total.value}</b></div>
        </div>
      );
    }
    if (b.type === 'steps') {
      return (
        <ol className="cj-hz-steps" key={i}>
          {b.items.map((t, n) => (<li key={t}><span>{n + 1}</span>{t}</li>))}
        </ol>
      );
    }
    if (b.type === 'cta') {
      return <button type="button" className="cj-hz-cta is-inline" key={i} onClick={onPlan}><Icon name="target" duotone /><span>Sí, vamos al plan</span></button>;
    }
    return null;
  });
}

/**
 * Chat del asistente. No usa un servidor ni un modelo: responde con plantillas armadas con los gastos de la
 * persona (solo los lee). La API de la fase 1 de docs/specs/educacion-financiera.md lo reemplazaría.
 */
function Chat({ ctx, onPlan }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const ask = (text) => {
    const question = text.trim();
    if (!question) return;
    setMessages((m) => [...m, { from: 'me', text: question }, { from: 'bot', blocks: answer(question, ctx) }]);
    setDraft('');
  };

  return (
    <section className="cj-hz-chat" aria-label="Chat con el asistente">
      <div className="cj-hz-chat-head">
        <span className="cj-hz-bot" aria-hidden="true"><Icon name="robot" duotone /></span>
        <div>
          <b>Tu asistente</b>
          <small><Icon name="lock" /> SOLO LEE · NUNCA CAMBIA</small>
        </div>
      </div>

      <div className="cj-hz-thread" role="log" aria-live="polite">
        <div className="cj-hz-msg is-bot">
          <p>¡Hola! Pregúntame por tus compras chicas y te respondo con tus números.</p>
        </div>
        {messages.map((m, i) => (
          m.from === 'me' ? (
            <div className="cj-hz-msg is-me" key={i}>{m.text}</div>
          ) : (
            <div className="cj-hz-msg is-bot" key={i}><Blocks blocks={m.blocks} onPlan={onPlan} /></div>
          )
        ))}
        <div ref={endRef} />
      </div>

      <div className="cj-hz-suggest">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button key={q.id} type="button" className="cj-hz-chip" onClick={() => ask(q.label)}><Icon name={q.icon} />{q.label}</button>
        ))}
      </div>

      <form className="cj-hz-ask" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
        <label htmlFor="hz-msg" className="cj-sr">Escribe tu pregunta</label>
        <input id="hz-msg" type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Pregúntale lo que quieras…" autoComplete="off" />
        <button type="submit" aria-label="Enviar" disabled={!draft.trim()}><Icon name="paper-plane-tilt" /></button>
      </form>
    </section>
  );
}

export default Chat;
