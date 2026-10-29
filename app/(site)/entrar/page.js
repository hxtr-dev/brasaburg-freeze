'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import ThemeReset from '@/components/ThemeReset';

function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function EntrarPage() {
  const { customer, setCustomer } = useCart();
  const router = useRouter();
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [referral, setReferral] = useState(customer?.referral ?? '');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2) return setError('Digite seu nome.');
    if (digits.length < 10) return setError('Digite seu WhatsApp com DDD.');
    const code = referral.trim().toUpperCase();
    if (code) {
      setChecking(true);
      try {
        const res = await fetch('/api/indicacao/validar', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code, phone }),
        });
        const data = await res.json();
        if (!res.ok) return setError(data.error || 'Não foi possível conferir o código.');
      } catch {
        return setError('Não foi possível conferir o código. Tente de novo.');
      } finally {
        setChecking(false);
      }
    }
    setCustomer({ name: name.trim(), phone, referral: code });
    router.push('/confirmar');
  };

  return (
    <div className="narrow">
      <ThemeReset />
      <form className="panel-form" onSubmit={submit}>
        <h1>Quem está pedindo?</h1>
        <p>Usamos seu nome para chamar no balcão e o WhatsApp para avisar quando o pedido ficar pronto. O pagamento é feito pelo site, logo após enviar o pedido.</p>
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
        <label>
          <span>
            Código de quem te indicou <span className="optional">(opcional)</span>
          </span>
          <input
            value={referral}
            onChange={(e) => {
              setReferral(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
              setError('');
            }}
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={16}
            placeholder="Ex.: MARIA4321"
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-big" disabled={checking}>
          {checking ? 'Conferindo código…' : 'Continuar'}
        </button>
      </form>
    </div>
  );
}
