'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import ThemeReset from '@/components/ThemeReset';
import { PAYMENT_METHODS, formatPrice } from '@/lib/menu';

function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function EntrarPage() {
  const { customer, setCustomer, total, totalPix } = useCart();
  const router = useRouter();
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [payment, setPayment] = useState(customer?.payment ?? '');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2) return setError('Digite seu nome.');
    if (digits.length < 10) return setError('Digite seu WhatsApp com DDD.');
    if (!payment) return setError('Escolha a forma de pagamento.');
    setCustomer({ name: name.trim(), phone, payment });
    router.push('/confirmar');
  };

  return (
    <div className="narrow">
      <ThemeReset />
      <form className="panel-form" onSubmit={submit}>
        <h1>Quem está pedindo?</h1>
        <p>Usamos seu nome para chamar no balcão e o WhatsApp para avisar quando o pedido ficar pronto.</p>
        <label>
          Nome
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={60} required />
        </label>
        <label>
          WhatsApp
          <input
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(11) 98765-4321"
            required
          />
        </label>
        <fieldset className="pay-options">
          <legend>
            Forma de pagamento <span>(pagamento feito apenas no balcão de retirada)</span>
          </legend>
          {PAYMENT_METHODS.map((m) => {
            const amount = m.id === 'pix' ? totalPix : total;
            return (
              <label key={m.id} className={`pay-option ${payment === m.id ? 'on' : ''}`}>
                <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => {
                    setPayment(m.id);
                    setError('');
                  }} />
                <span className="pay-name">
                  {m.label}
                  {m.id === 'pix' && <em>Mais barato</em>}
                </span>
                {total > 0 && <b>{formatPrice(amount)}</b>}
              </label>
            );
          })}
          {totalPix < total && (
            <p className="pay-hint">Pagando no Pix você economiza {formatPrice(total - totalPix)} neste pedido.</p>
          )}
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-big">Continuar</button>
      </form>
    </div>
  );
}
