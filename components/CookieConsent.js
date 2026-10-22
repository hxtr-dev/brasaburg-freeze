'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY = 'brasaburg:cookies';
export const OPEN_EVENT = 'bbf:cookies';

// Guarda a escolha do visitante (aceitar ou recusar cookies não essenciais).
// Hoje o site só usa armazenamento essencial, então recusar não tira nenhuma função.
export function getCookieChoice() {
  try {
    return JSON.parse(localStorage.getItem(KEY))?.choice ?? null;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getCookieChoice()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const choose = (choice) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <div className="cookie-text">
        <strong>Sua privacidade importa</strong>
        <p>
          Usamos armazenamento essencial para manter seu carrinho e fazer o pedido funcionar. Cookies de análise ou
          publicidade só serão usados com a sua permissão. Saiba mais na nossa{' '}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
      </div>
      <div className="cookie-actions">
        <button type="button" className="btn btn-ghost" onClick={() => choose('rejected')}>
          Recusar
        </button>
        <button type="button" className="btn" onClick={() => choose('accepted')}>
          Aceitar
        </button>
      </div>
    </div>
  );
}

export function CookieSettingsLink() {
  return (
    <button type="button" className="footer-link" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Preferências de cookies
    </button>
  );
}
