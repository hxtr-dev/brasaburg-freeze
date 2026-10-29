'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeReset from '@/components/ThemeReset';
import { formatPrice, paymentLabel } from '@/lib/menu';

function ItemList({ items }) {
  return (
    <ul className="cart-lines">
      {items.map((i, n) => (
        <li key={n}>
          <div>
            <b>{i.qty}× {i.name}</b>
            {i.details.length > 0 && <small>{i.details.join(' · ')}</small>}
          </div>
          <span className="price">{formatPrice(i.unitPrice * i.qty)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AcompanharPage({ params }) {
  const { id } = use(params);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [payingOnline, setPayingOnline] = useState(false);
  const [pix, setPix] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}/pix`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setPix)
      .catch(() => {});
  }, [id]);

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pix.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Não deu para copiar. Segure o código e copie à mão.');
    }
  };

  useEffect(() => {
    let stop = false;
    let timer;
    // Ao voltar do checkout, confirma o pagamento sem esperar o aviso automático da InfinitePay.
    const q = new URLSearchParams(window.location.search);
    if (q.get('transaction_nsu') && q.get('slug')) {
      fetch('/api/pagamentos/infinitepay', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          order_nsu: id,
          slug: q.get('slug'),
          transaction_nsu: q.get('transaction_nsu'),
          capture_method: q.get('capture_method'),
        }),
      }).catch(() => {});
    }
    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (stop) return;
        setOrder(data);
        if (data.status === 'novo' || !data.paidAt) timer = setTimeout(load, 5000);
      } catch (err) {
        if (!stop) setError(err.message || 'Não foi possível carregar o pedido.');
        if (!stop) timer = setTimeout(load, 10000);
      }
    };
    load();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id]);

  const payOnline = async () => {
    setPayingOnline(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${id}/pagar`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível iniciar o pagamento.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setPayingOnline(false);
    }
  };

  if (!order) {
    return (
      <div className="narrow">
        <ThemeReset theme="brasa" />
        <div className="panel-form ticket">
          <p>{error || 'Carregando seu pedido…'}</p>
        </div>
      </div>
    );
  }

  // Enquanto o balcão não confirma o pagamento, o cliente vê o valor e pode trocar a forma de pagamento.
  if (!order.paidAt) {
    return (
      <div className="narrow">
        <ThemeReset theme="freeze" />
        <div className="panel-form ticket">
          <p className="kicker">Pedido recebido</p>
          <p className="pay-waiting" aria-live="polite">Aguardando pagamento</p>
          {pix ? (
            <div className="pix-box">
              <p>
                {order.name}, falta só o pagamento de <b>{formatPrice(order.total)}</b>. Pague com Pix: abra o app do seu
                banco e leia o QR code, ou use o Pix copia e cola.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pix-qr" src={pix.qr} alt="QR code do Pix" width="240" height="240" />
              <button type="button" className="btn btn-big" onClick={copyPix}>
                {copied ? 'Código copiado ✓' : 'Copiar Pix copia e cola'}
              </button>
              <small>Recebedor: {pix.name}. Depois de pagar, é só esperar: assim que a cozinha confirmar, o número do seu pedido aparece aqui.</small>
              <button type="button" className="btn btn-ghost pix-card" onClick={payOnline} disabled={payingOnline}>
                {payingOnline ? 'Abrindo pagamento…' : 'Prefere pagar com cartão?'}
              </button>
            </div>
          ) : (
            <div className="pay-split-online">
              <p>
                {order.name}, falta só o pagamento de <b>{formatPrice(order.total)}</b>. Pague pelo site com Pix, débito ou
                crédito. Assim que for confirmado, o número do seu pedido aparece aqui.
              </p>
              <button type="button" className="btn btn-big pay-online-btn" onClick={payOnline} disabled={payingOnline}>
                {payingOnline ? 'Abrindo pagamento…' : `Pagar ${formatPrice(order.total)} pelo site`}
              </button>
            </div>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}

          <ItemList items={order.items} />
          <div className="cart-total">
            <span>Total{order.payment ? ` no ${paymentLabel(order.payment, true)}` : ''}</span>
            <b>{formatPrice(order.total)}</b>
          </div>
        </div>
      </div>
    );
  }

  const ready = order.status !== 'novo';
  return (
    <div className="narrow">
      <ThemeReset theme={ready ? 'freeze' : 'brasa'} />
      <div className="panel-form ticket">
        <p className="kicker">Pedido enviado para a cozinha</p>
        <p className="ticket-number">#{order.number}</p>
        <p className={`ticket-status ${ready ? 'is-ready' : ''}`} aria-live="polite">
          {order.status === 'novo' && 'Preparando seu pedido…'}
          {order.status === 'pronto' && 'Pronto! Pode retirar no balcão.'}
          {order.status === 'entregue' && 'Pedido entregue. Bom apetite!'}
          {order.status === 'cancelado' && 'Pedido cancelado. Fale com o balcão.'}
        </p>
        <p>
          {order.name}, guarde este número. Quando o pedido ficar pronto, esta tela muda e avisamos no seu WhatsApp.
        </p>
        <ItemList items={order.items} />
        <div className="cart-total">
          <span>Total{order.payment ? ` no ${paymentLabel(order.payment, true)}` : ''}</span>
          <b>{formatPrice(order.total)}</b>
        </div>
        <p className="pay-done">Pago</p>
        <Link href="/pedido" className="btn btn-ghost">Fazer outro pedido</Link>
      </div>
    </div>
  );
}
