'use client';

import { useEffect, useState } from 'react';
import { formatPhone } from '@/lib/phone';

// Ranking do programa de indicação: quem trouxe mais pessoas (com pedido pago) fica no topo.
export default function Referrals() {
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch('/api/cozinha/indicacoes', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (!stop) {
          setRanking(json.ranking);
          setError('');
        }
      } catch {
        if (!stop) setError('Não foi possível carregar as indicações. Tentando de novo…');
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  return (
    <section className="referrals" aria-label="Ranking de indicações">
      <h2>Ranking de indicações</h2>
      <p className="muted">
        Conta cada pessoa (WhatsApp diferente) que usou o código e já teve o pedido marcado como pago.
      </p>
      {error && <p className="form-error">{error}</p>}
      {!ranking && !error && <p className="muted">Carregando…</p>}
      {ranking && ranking.length === 0 && <p className="muted">Ninguém gerou um código ainda.</p>}
      {ranking && ranking.length > 0 && (
        <ol className="ranking">
          {ranking.map((r, i) => (
            <li key={r.code} className={i < 3 && r.people > 0 ? `top top-${i + 1}` : ''}>
              <span className="rank-pos">{i + 1}º</span>
              <span className="rank-who">
                <b>{r.code}</b>
                <small>
                  {r.name} · {formatPhone(r.phone)}
                </small>
              </span>
              <span className="rank-count">
                <b>{r.people}</b>
                <small>{r.people === 1 ? 'pessoa' : 'pessoas'}</small>
                {r.pending > 0 && <small className="rank-pending">+{r.pending} aguardando pagamento</small>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
