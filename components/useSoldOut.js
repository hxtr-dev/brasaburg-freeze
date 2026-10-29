'use client';

import { useEffect, useState } from 'react';

// Lê da cozinha se os hambúrgueres estão esgotados (sold out).
export function useBurgersSoldOut() {
  const [soldOut, setSoldOut] = useState(false);
  useEffect(() => {
    let stop = false;
    fetch('/api/cardapio', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => !stop && setSoldOut(d.burgersSoldOut === true))
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, []);
  return soldOut;
}
