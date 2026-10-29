'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import ThemeReset from '@/components/ThemeReset';
import { formatPrice, paymentLabel } from '@/lib/menu';

export default function ConfirmarPage() {
  const { ready, lines, total, customer, setCustomer, clear } = useCart();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ready && !paymentLabel(customer?.payment)) router.replace('/entrar');
  }, [ready, customer, router]);

  if (!ready || !paymentLabel(customer?.payment)) return null;


  const send = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: customer.name,
          phone: customer.phone,
          payment: customer.payment,
          referral: customer.referral || undefined,
          items: lines.map((l) => ({ productId: l.productId, qty: l.qty, flavors: l.flavors })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar o pedido.');
      clear();
      // O código vale uma vez por pessoa; não fica salvo para o próximo pedido.
      if (customer.referral) setCustomer({ ...customer, referral: '' });
      router.push(`/acompanhar/${data.publicId}`);
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  return (
    <div className="narrow">
      <ThemeReset />
      <div className="panel-form">
        <h1>Confira seu pedido</h1>
        {lines.length === 0 ? (
          <p>
            Seu carrinho está vazio. <Link href="/pedido">Escolher produtos</Link>
          </p>
        ) : (
          <>
            <ul className="cart-lines">
              {lines.map((l) => (
                <li key={l.key}>
                  <div>
                    <b>{l.qty}× {l.product.name}</b>
                    {l.flavorNames.length > 0 && <small>Geladinho: {l.flavorNames.join(', ')}</small>}
                  </div>
                  <span className="price">{formatPrice(l.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <span>Total no {paymentLabel(customer.payment, true)}</span>
              <b>{formatPrice(total)}</b>
            </div>
            <p className="pay-note">Pagamento feito apenas no balcão de retirada.</p>
            <p className="who">
              {customer.name} · {customer.phone} · {paymentLabel(customer.payment)} · <Link href="/entrar">alterar</Link>
            </p>
            {customer.referral && <p className="who">Código de indicação: {customer.referral}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="button" className="btn btn-big" onClick={send} disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar Pedido para cozinha'}
            </button>
            <Link href="/pedido" className="btn btn-ghost">Adicionar mais itens</Link>
          </>
        )}
      </div>
    </div>
  );
}
