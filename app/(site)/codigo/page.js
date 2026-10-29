'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import ThemeReset from '@/components/ThemeReset';

const SITE = 'https://brasaburg-freeze.vercel.app/pedido';

function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Área "Código": o cliente gera o código de indicação dele para compartilhar com os amigos.
export default function CodigoPage() {
  const { customer } = useCart();
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Digite seu nome.');
    if (phone.replace(/\D/g, '').length < 10) return setError('Digite seu WhatsApp com DDD.');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/codigo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível gerar seu código.');
      setCode(data.code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // sem permissão de copiar: o código continua visível na tela
    }
  };

  const shareText = `Peça na BrasaBurg & Freeze e use meu código de indicação: ${code}\n${SITE}`;

  return (
    <div className="narrow">
      <ThemeReset />
      {code ? (
        <div className="panel-form ticket">
          <p className="kicker">Seu código de indicação</p>
          <p className="referral-code">{code}</p>
          <p>
            Compartilhe com seus amigos. Quando eles fizerem um pedido, é só colocar este código no campo "Código de quem te
            indicou".
          </p>
          <button type="button" className="btn btn-big" onClick={copy}>
            {copied ? 'Copiado ✓' : 'Copiar código'}
          </button>
          <a
            className="btn btn-whats"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
          >
            Compartilhar no WhatsApp
          </a>
          <Link href="/pedido" className="btn btn-ghost">Fazer um pedido</Link>
        </div>
      ) : (
        <form className="panel-form" onSubmit={submit}>
          <h1>Seu código</h1>
          <p>
            Coloque seu nome e WhatsApp para receber seu código de indicação. Se você já tem um, ele aparece de novo.
          </p>
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
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-big" disabled={loading}>
            {loading ? 'Gerando…' : 'Ver meu código'}
          </button>
        </form>
      )}
    </div>
  );
}
