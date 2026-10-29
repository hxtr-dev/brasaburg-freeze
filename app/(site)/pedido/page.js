'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import PriceTag from '@/components/PriceTag';
import ProductPhoto from '@/components/ProductPhoto';
import { BURGERS, COMBOS, GELADINHOS, SAUCE, formatPrice, needsBurger } from '@/lib/menu';
import { scrollToSection } from '@/lib/smooth-scroll';
import { useBurgersSoldOut } from '@/components/useSoldOut';

function useSectionTheme(refs, onActive) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          document.documentElement.dataset.theme = e.target.dataset.theme;
          onActive(e.target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    refs.forEach((r) => r.current && io.observe(r.current));
    return () => io.disconnect();
  }, [refs, onActive]);
}

function useFlash() {
  const [on, setOn] = useState(false);
  return [on, () => {
    setOn(true);
    setTimeout(() => setOn(false), 1200);
  }];
}

function SoldOutPhoto({ product, soldOut }) {
  return (
    <div className="photo-wrap">
      <ProductPhoto product={product} className="thumb" />
      {soldOut && <span className="sold-out-tag">Sold out</span>}
    </div>
  );
}

function ProductCard({ product, onAdd, soldOut = false }) {
  const [added, flash] = useFlash();
  return (
    <article id={product.id} className={`card ${soldOut ? 'sold-out' : ''}`}>
      <SoldOutPhoto product={product} soldOut={soldOut} />
      <div className="card-body">
        <h3>{product.name}</h3>
        <p>{product.tagline}</p>
        {product.sauce && (
          <span className={`sauce-note ${product.sauce}`}>
            {product.sauce === 'incluso' ? 'Molho incluso' : `Molho: + ${formatPrice(SAUCE.price)}`}
          </span>
        )}
        <div className="card-buy">
          <PriceTag product={product} />
          <button
            type="button"
            className="btn"
            disabled={soldOut}
            onClick={() => {
              onAdd();
              flash();
            }}
          >
            {soldOut ? 'Esgotado' : added ? 'Adicionado ✓' : 'Adicionar'}
          </button>
        </div>
      </div>
    </article>
  );
}

function SauceCard({ onAdd, soldOut = false }) {
  const [added, flash] = useFlash();
  return (
    <div id={SAUCE.id} className={`sauce-card ${soldOut ? 'sold-out' : ''}`}>
      <div>
        <h3>Molho da casa extra</h3>
        <p>Porção de 30g para acompanhar o seu hambúrguer. No Brasa Supreme o molho já vem incluso.</p>
      </div>
      <div className="sauce-buy">
        <span className="price">{formatPrice(SAUCE.price)}</span>
        {soldOut && <span className="sold-out-tag inline">Sold out</span>}
        <button
          type="button"
          className="btn"
          disabled={soldOut}
          onClick={() => {
            onAdd();
            flash();
          }}
        >
          {soldOut ? 'Esgotado' : added ? 'Adicionado ✓' : 'Adicionar molho'}
        </button>
      </div>
    </div>
  );
}

function ComboPicker({ combo, onClose, onConfirm }) {
  const [picked, setPicked] = useState([]);
  const full = picked.length === combo.geladinhos;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="combo-title" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="combo-title">{combo.name}</h3>
        <p>
          Escolha {combo.geladinhos === 1 ? 'o sabor do geladinho' : `os ${combo.geladinhos} geladinhos (pode repetir o sabor)`}.
        </p>
        <div className="flavor-list">
          {GELADINHOS.map((g) => {
            const count = picked.filter((id) => id === g.id).length;
            return (
              <button
                key={g.id}
                type="button"
                className={`flavor ${count ? 'on' : ''}`}
                disabled={full && !count}
                onClick={() => {
                  if (count && combo.geladinhos === 1) setPicked([]);
                  else if (!full) setPicked([...picked, g.id]);
                }}
              >
                {g.shortName}
                {count > 0 && <span className="flavor-count">×{count}</span>}
              </button>
            );
          })}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => (picked.length ? setPicked([]) : onClose())}>
            {picked.length ? 'Limpar' : 'Cancelar'}
          </button>
          <button type="button" className="btn" disabled={!full} onClick={() => onConfirm(picked)}>
            Adicionar ao pedido
          </button>
        </div>
      </div>
    </div>
  );
}

function ComboSuggestion({ floating = false, onSwapped }) {
  const { looseGeladinhos, combo, swapGeladinhosForCombo } = useCart();
  if (looseGeladinhos < 2) return null;
  const savings = combo.geladinhos * GELADINHOS[0].price - combo.price;
  return (
    <div className={`combo-tip ${floating ? 'floating' : ''}`} role="status">
      <p>
        <b>Dica:</b> 2 geladinhos saem por <b>{formatPrice(combo.price)}</b> no {combo.name}
        {savings > 0 ? ` (você economiza ${formatPrice(savings)})` : ''}.
      </p>
      <button
        type="button"
        className="btn"
        onClick={() => {
          swapGeladinhosForCombo();
          onSwapped?.();
        }}
      >
        Trocar pelo combo
      </button>
    </div>
  );
}

function CartSheet({ open, onClose, soldOut }) {
  const { lines, total, setQty } = useCart();
  const router = useRouter();
  if (!open) return null;
  const blocked = soldOut && lines.some((l) => needsBurger(l.productId));
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cart-title" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <h3 id="cart-title">Seu pedido</h3>
        {lines.length === 0 ? (
          <p>Seu carrinho está vazio.</p>
        ) : (
          <ul className="cart-lines">
            {lines.map((l) => (
              <li key={l.key}>
                <div>
                  <b>{l.product.name}</b>
                  {l.flavorNames.length > 0 && <small>Geladinho: {l.flavorNames.join(', ')}</small>}
                  {soldOut && needsBurger(l.productId) && <small className="sold-out-text">Sold out, tire do pedido</small>}
                </div>
                <div className="qty">
                  <button type="button" aria-label="Diminuir" onClick={() => setQty(l.key, l.qty - 1)}>−</button>
                  <span>{l.qty}</span>
                  <button type="button" aria-label="Aumentar" onClick={() => setQty(l.key, l.qty + 1)}>+</button>
                </div>
                <span className="price">{formatPrice(l.subtotal)}</span>
              </li>
            ))}
          </ul>
        )}
        <ComboSuggestion />
        <div className="cart-total">
          <span>Total</span>
          <b>{formatPrice(total)}</b>
        </div>
        {blocked && <p className="form-error">Os hambúrgueres estão esgotados. Tire do pedido os itens marcados para continuar.</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Continuar escolhendo</button>
          <button
            type="button"
            className="btn"
            disabled={lines.length === 0 || blocked}
            onClick={() => router.push('/entrar')}
          >
            Finalizar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PedidoPage() {
  const { add, count, total } = useCart();
  const soldOut = useBurgersSoldOut();
  const [combo, setCombo] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const burgersRef = useRef(null);
  const geladinhosRef = useRef(null);
  const combosRef = useRef(null);
  const [refs] = useState(() => [geladinhosRef, burgersRef, combosRef]);
  const [activeTab, setActiveTab] = useState('geladinhos');
  useSectionTheme(refs, setActiveTab);

  useEffect(() => {
    document.documentElement.dataset.theme = 'freeze';
  }, []);

  return (
    <div className="order-page">
      <header className="order-head">
        <h1>Faça seu pedido</h1>
        <p>Escolha os produtos, finalize e acompanhe pelo número do pedido.</p>
      </header>
      <nav className="order-tabs">
        {[
          ['geladinhos', 'Geladinhos'],
          ['hamburgueres', 'Hambúrgueres'],
          ['combos', 'Combos'],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className={activeTab === id ? 'on' : ''}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(id);
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="geladinhos" ref={geladinhosRef} data-theme="freeze" className="order-section freeze">
        <h2>Geladinhos gourmet</h2>
        <div className="cards">
          {GELADINHOS.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={() => add(p.id)} />
          ))}
        </div>
      </section>

      <section id="hamburgueres" ref={burgersRef} data-theme="brasa" className="order-section brasa">
        <h2>Hambúrgueres</h2>
        <div className="cards">
          {BURGERS.map((p) => (
            <ProductCard key={p.id} product={p} soldOut={soldOut} onAdd={() => add(p.id)} />
          ))}
        </div>
        <SauceCard soldOut={soldOut} onAdd={() => add(SAUCE.id)} />
      </section>

      <section id="combos" ref={combosRef} data-theme="mix" className="order-section mix">
        <h2>Combos</h2>
        <div className="cards">
          {/* Com os hambúrgueres esgotados, os combos disponíveis aparecem primeiro. */}
          {[...COMBOS]
            .sort((a, b) => Number(soldOut && needsBurger(a.id)) - Number(soldOut && needsBurger(b.id)))
            .map((c) => {
              const out = soldOut && needsBurger(c.id);
              return (
                <article key={c.id} id={c.id} className={`card combo ${out ? 'sold-out' : ''}`}>
                  <SoldOutPhoto product={c} soldOut={out} />
                  <div className="card-body">
                    <h3>{c.name}</h3>
                    <p>{c.description}</p>
                    <div className="card-buy">
                      <PriceTag product={c} />
                      <button type="button" className="btn" disabled={out} onClick={() => setCombo(c)}>
                        {out ? 'Esgotado' : 'Escolher'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      {count > 0 && !cartOpen && <ComboSuggestion floating />}
      {count > 0 && (
        <button type="button" className="cart-bar" onClick={() => setCartOpen(true)}>
          <span>{count} {count === 1 ? 'item' : 'itens'}</span>
          <b>Ver pedido · {formatPrice(total)}</b>
        </button>
      )}

      {combo && (
        <ComboPicker
          combo={combo}
          onClose={() => setCombo(null)}
          onConfirm={(flavors) => {
            add(combo.id, flavors);
            setCombo(null);
          }}
        />
      )}
      <CartSheet open={cartOpen} soldOut={soldOut} onClose={() => setCartOpen(false)} />
    </div>
  );
}
