'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeReset from '@/components/ThemeReset';
import { PAYMENT_METHODS, formatPrice, paymentLabel } from '@/lib/menu';

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
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    let stop = false;
    let timer;
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

  const changePayment = async (payment) => {
    if (payment === order.payment) return;
    setChanging(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ payment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível trocar a forma de pagamento.');
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setChanging(false);
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
          <p>
            {order.name}, vá ao balcão de retirada e pague <b>{formatPrice(order.total)}</b>
            {order.payment ? ` no ${paymentLabel(order.payment, true)}` : ''}. Assim que o pagamento for confirmado,
            o número do seu pedido aparece aqui.
          </p>

          <fieldset className="pay-options">
            <legend>
              Forma de pagamento <span>(pagamento feito apenas no balcão de retirada)</span>
            </legend>
            {PAYMENT_METHODS.map((m) => (
              <label key={m.id} className={`pay-option ${order.payment === m.id ? 'on' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value={m.id}
                  checked={order.payment === m.id}
                  disabled={changing}
                  onChange={() => changePayment(m.id)}
                />
                <span className="pay-name">{m.label}</span>
              </label>
            ))}
          </fieldset>
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
