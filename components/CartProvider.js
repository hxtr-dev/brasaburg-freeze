'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BURGERS, COMBOS, GELADINHOS, SAUCE } from '@/lib/menu';

const CartContext = createContext(null);
const CART_KEY = 'brasaburg:carrinho';
const CUSTOMER_KEY = 'brasaburg:cliente';

const GELADINHO_IDS = new Set(GELADINHOS.map((g) => g.id));
const GELADINHO_COMBO = COMBOS.find((c) => c.geladinhos === 2 && c.burgers.length === 0);

const CATALOG = new Map([...BURGERS, ...GELADINHOS, ...COMBOS, SAUCE].map((p) => [p.id, p]));

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // modo anônimo ou armazenamento bloqueado: o carrinho vive só nesta aba
  }
}

const lineKey = (productId, flavors = []) => [productId, ...flavors].join('|');

export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);
  const [customer, setCustomerState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(read(CART_KEY, []).filter((l) => CATALOG.has(l.productId)));
    setCustomerState(read(CUSTOMER_KEY, null));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) write(CART_KEY, lines);
  }, [lines, ready]);

  const add = useCallback((productId, flavors = []) => {
    const key = lineKey(productId, flavors);
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + 1) } : l));
      return [...prev, { key, productId, flavors, qty: 1 }];
    });
  }, []);

  const setQty = useCallback((key, qty) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l))));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  // Troca 2 geladinhos avulsos (mantendo os sabores) pelo Combo Freeze em Dupla.
  const swapGeladinhosForCombo = useCallback(() => {
    setLines((prev) => {
      const flavors = [];
      for (const l of prev) {
        if (!GELADINHO_IDS.has(l.productId)) continue;
        for (let i = 0; i < l.qty && flavors.length < 2; i++) flavors.push(l.productId);
      }
      if (flavors.length < 2) return prev;
      let next = prev;
      for (const id of flavors) {
        next = next
          .map((l) => (l.productId === id && l.qty > 0 ? { ...l, qty: l.qty - 1 } : l))
          .filter((l) => l.qty > 0 || l.productId !== id);
      }
      const comboId = GELADINHO_COMBO.id;
      const key = lineKey(comboId, flavors);
      const found = next.find((l) => l.key === key);
      if (found) return next.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + 1) } : l));
      return [...next, { key, productId: comboId, flavors, qty: 1 }];
    });
  }, []);

  const setCustomer = useCallback((c) => {
    setCustomerState(c);
    write(CUSTOMER_KEY, c);
  }, []);

  const value = useMemo(() => {
    const detailed = lines.map((l) => {
      const product = CATALOG.get(l.productId);
      const flavorNames = l.flavors.map((id) => GELADINHOS.find((g) => g.id === id)?.shortName).filter(Boolean);
      return { ...l, product, flavorNames, subtotal: product.price * l.qty };
    });
    return {
      ready,
      lines: detailed,
      count: detailed.reduce((n, l) => n + l.qty, 0),
      total: detailed.reduce((n, l) => n + l.subtotal, 0),
      looseGeladinhos: detailed.filter((l) => GELADINHO_IDS.has(l.productId)).reduce((n, l) => n + l.qty, 0),
      combo: GELADINHO_COMBO,
      swapGeladinhosForCombo,
      add,
      setQty,
      clear,
      customer,
      setCustomer,
    };
  }, [lines, ready, add, setQty, clear, swapGeladinhosForCombo, customer, setCustomer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa do CartProvider');
  return ctx;
}
