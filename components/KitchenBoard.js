'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PAYMENT_METHODS, countBurgers, formatPrice, paymentLabel, prepMinutes } from '@/lib/menu';
import { formatPhone } from '@/lib/phone';

const POLL_MS = 4000;

function clock(ms) {
  const s = Math.floor(Math.abs(ms) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function whatsappLink(order) {
  const text = `Olá, ${order.name}! Seu pedido #${order.number} na BrasaBurg & Freeze está pronto. Pode retirar no balcão.`;
  return `https://wa.me/${order.phone}?text=${encodeURIComponent(text)}`;
}

// Arrecadado = pedidos já pagos no balcão. A receber = pedidos aguardando pagamento.
function DaySummary({ rows }) {
  const sum = (pred) => rows.filter(pred).reduce((n, r) => n + r.total, 0);
  const count = rows.reduce((n, r) => n + r.count, 0);
  const received = sum((r) => r.paid);
  const pending = sum((r) => !r.paid);
  const byMethod = PAYMENT_METHODS.map((m) => [m.short, sum((r) => r.paid && r.payment_method === m.id)]);
  const unknown = sum((r) => r.paid && !r.payment_method);
  if (unknown > 0) byMethod.push(['Sem forma', unknown]);
  return (
    <section className="day-summary" aria-label="Total do dia">
      <div className="day-main">
        <span>Arrecadado hoje</span>
        <b>{formatPrice(received)}</b>
        <small>
          {byMethod.map(([label, v]) => `${label} ${formatPrice(v)}`).join(' · ')}
        </small>
      </div>
      <div>
        <span>A receber</span>
        <b>{formatPrice(pending)}</b>
        <small>aguardando pagamento</small>
      </div>
      <div>
        <span>Total do dia</span>
        <b>{formatPrice(received + pending)}</b>
        <small>{count} {count === 1 ? 'pedido' : 'pedidos'}</small>
      </div>
    </section>
  );
}

function PayButton({ order, onPaid, onReceipt }) {
  if (order.paidAt) {
    return (
      <button type="button" className="pay-state paid" onClick={() => onReceipt(order)} title="Ver notinha">
        Pago
      </button>
    );
  }
  return (
    <button
      type="button"
      className="pay-state waiting"
      onClick={() => {
        const how = paymentLabel(order.payment) ?? 'forma não informada';
        if (window.confirm(`Confirmar pagamento do pedido #${order.number}?\n${formatPrice(order.total)} · ${how}`)) onPaid(order);
      }}
    >
      Aguardando pagamento
    </button>
  );
}

function receiptLines(order) {
  const when = new Date(order.paidAt ?? order.createdAt);
  return [
    'BrasaBurg & Freeze',
    `Notinha do pedido #${order.number}`,
    `${when.toLocaleDateString('pt-BR')} ${when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    `Cliente: ${order.name}`,
    '------------------------------',
    ...order.items.flatMap((i) => [
      `${i.qty}x ${i.name} - ${formatPrice(i.unitPrice * i.qty)}`,
      ...i.details.map((d) => `   ${d}`),
    ]),
    '------------------------------',
    `Total: ${formatPrice(order.total)}`,
    `Pagamento: ${paymentLabel(order.payment) ?? 'não informado'} - PAGO`,
    'Obrigado pela preferência!',
  ];
}

// Notinha mostrada no tablet; só pode ser enviada para o WhatsApp do próprio cliente do pedido.
function Receipt({ order, onClose }) {
  const lines = receiptLines(order);
  const share = `https://wa.me/${order.phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Notinha do pedido #${order.number}`} onClick={onClose}>
      <div className="modal receipt" onClick={(e) => e.stopPropagation()}>
        <pre className="receipt-paper">{lines.join('\n')}</pre>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Fechar</button>
          <a className="btn btn-whats" href={share} target="_blank" rel="noreferrer">
            Enviar para {order.name} no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function beep(ctx) {
  const now = ctx.currentTime;
  [0, 0.18, 0.36].forEach((t, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = i === 2 ? 1320 : 880;
    gain.gain.setValueAtTime(0.0001, now + t);
    gain.gain.exponentialRampToValueAtTime(0.4, now + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + 0.17);
  });
}

function OrderCard({ order, now, onReady, onPaid, onReceipt }) {
  const elapsed = now - new Date(order.createdAt).getTime();
  const minutes = prepMinutes(order.items);
  const burgers = countBurgers(order.items);
  const limitMs = minutes * 60 * 1000;
  const left = limitMs - elapsed;
  const level = left < 0 ? 'late' : left < 5 * 60 * 1000 ? 'warn' : 'ok';
  const pct = Math.max(0, Math.min(100, (left / limitMs) * 100));
  return (
    <article className={`ticket-card ${level}`}>
      <header>
        <span className="ticket-num">#{order.number}</span>
        <span className="ticket-timer" aria-label="Tempo restante">
          {left < 0 ? `+${clock(left)}` : clock(left)}
        </span>
      </header>
      <div className="ticket-bar"><span style={{ width: `${pct}%` }} /></div>
      <p className="ticket-who">
        <b>{order.name}</b> · {formatPhone(order.phone)}
      </p>
      <p className="ticket-time">
        Chegou às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        {' · '}prazo {minutes} min{burgers > 1 ? ` (${burgers} hambúrgueres)` : ''}
        {left < 0 ? ' · atrasado' : ''}
      </p>
      <ul>
        {order.items.map((i, n) => (
          <li key={n}>
            <b>{i.qty}×</b> {i.name}
            {i.details.length > 0 && <small>{i.details.join(' · ')}</small>}
          </li>
        ))}
      </ul>
      <p className="ticket-total">
        <span>
          Total a cobrar
          {order.payment && <em className={`pay-badge ${order.payment}`}>{paymentLabel(order.payment, true)}</em>}
        </span>
        <b>{formatPrice(order.total)}</b>
      </p>
      <PayButton order={order} onPaid={onPaid} onReceipt={onReceipt} />
      <a className="btn btn-big btn-ready" href={whatsappLink(order)} target="_blank" rel="noreferrer" onClick={() => onReady(order)}>
        Pedido Pronto e avisar no WhatsApp
      </a>
    </article>
  );
}

export default function KitchenBoard() {
  const [data, setData] = useState({ open: [], ready: [], delivered: [], summary: [] });
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [online, setOnline] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const audioRef = useRef(null);
  const seenRef = useRef(null);
  const wakeRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/cozinha/orders', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/cozinha/entrar';
        return;
      }
      const json = await res.json();
      setOffset(new Date(json.serverNow).getTime() - Date.now());
      const ids = new Set(json.open.map((o) => o.id));
      if (seenRef.current && audioRef.current && json.open.some((o) => !seenRef.current.has(o.id))) beep(audioRef.current);
      seenRef.current = ids;
      setData(json);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  const setStatus = async (order, status) => {
    setData((d) => {
      const open = d.open.filter((o) => o.id !== order.id);
      const ready = d.ready.filter((o) => o.id !== order.id);
      const delivered = d.delivered.filter((o) => o.id !== order.id);
      if (status === 'pronto') ready.unshift({ ...order, status, readyAt: order.readyAt ?? new Date().toISOString() });
      if (status === 'novo') open.push({ ...order, status });
      if (status === 'entregue') delivered.unshift({ ...order, status });
      open.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return { ...d, open, ready, delivered };
    });
    await fetch(`/api/cozinha/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    load();
  };

  const markPaid = async (order) => {
    const paid = { ...order, paidAt: new Date().toISOString() };
    const swap = (list) => list.map((o) => (o.id === order.id ? paid : o));
    setData((d) => ({ ...d, open: swap(d.open), ready: swap(d.ready), delivered: swap(d.delivered) }));
    setReceipt(paid);
    await fetch(`/api/cozinha/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ paid: true }),
    }).catch(() => {});
    load();
  };

  // Som e tela sempre ligada só podem ser ativados por um toque.
  const enableSound = async () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioRef.current = audioRef.current || new Ctx();
    await audioRef.current.resume();
    beep(audioRef.current);
    setSoundOn(true);
    try {
      wakeRef.current = await navigator.wakeLock?.request('screen');
    } catch {
      // sem suporte: o tablet segue a configuração de tela dele
    }
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const serverNow = now + offset;
  return (
    <div className="kitchen">
      <header className="kitchen-head">
        <div className="brand">
          <img src="/logo.png" alt="" width="44" height="44" />
          <h1>Cozinha</h1>
        </div>
        <div className="kitchen-meta">
          <span className={`dot ${online ? 'on' : 'off'}`} />
          {online ? 'Conectado' : 'Sem conexão, tentando de novo…'}
          <span className="sep">·</span>
          {data.open.length} na fila
          <span className="sep">·</span>
          {new Date(serverNow).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          {!soundOn && (
            <button type="button" className="btn" onClick={enableSound}>Ativar som e tela cheia</button>
          )}
        </div>
      </header>

      <DaySummary rows={data.summary} />

      <section className="queue" aria-label="Pedidos na fila">
        {data.open.length === 0 ? (
          <p className="empty">Nenhum pedido na fila. Os novos aparecem aqui sozinhos.</p>
        ) : (
          data.open.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              now={serverNow}
              onReady={(x) => setStatus(x, 'pronto')}
              onPaid={markPaid}
              onReceipt={setReceipt}
            />
          ))
        )}
      </section>

      {data.ready.length > 0 && (
        <section className="ready-list" aria-label="Prontos hoje">
          <h2>Prontos hoje</h2>
          <ul>
            {data.ready.map((o) => (
              <li key={o.id}>
                <span className="ticket-num">#{o.number}</span>
                <span>{o.name}</span>
                <span className="muted">
                  pronto às {new Date(o.readyAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <a href={whatsappLink(o)} target="_blank" rel="noreferrer" className="link">Reenviar WhatsApp</a>
                <button type="button" className="link" onClick={() => setStatus(o, 'novo')}>Desfazer</button>
                <PayButton order={o} onPaid={markPaid} onReceipt={setReceipt} />
                <span className="ready-total">
                  {o.payment && <em className={`pay-badge ${o.payment}`}>{paymentLabel(o.payment, true)}</em>}
                  {formatPrice(o.total)}
                </span>
                <button
                  type="button"
                  className="btn-x"
                  aria-label={`Pedido #${o.number} entregue, tirar da lista`}
                  title="Entregue: tirar da lista"
                  onClick={() => setStatus(o, 'entregue')}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <p className="ready-hint">Toque no × quando o cliente retirar o pedido.</p>
        </section>
      )}

      {data.delivered.length > 0 && (
        <details className="delivered-list">
          <summary>Entregues hoje ({data.delivered.length})</summary>
          <ul>
            {data.delivered.map((o) => (
              <li key={o.id}>
                <span className="ticket-num">#{o.number}</span>
                <span>{o.name}</span>
                <span className="ready-total">
                  {o.payment && <em className={`pay-badge ${o.payment}`}>{paymentLabel(o.payment, true)}</em>}
                  {formatPrice(o.total)}
                </span>
                <PayButton order={o} onPaid={markPaid} onReceipt={setReceipt} />
                <button type="button" className="link" onClick={() => setStatus(o, 'pronto')}>Voltar para prontos</button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {receipt && <Receipt order={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
