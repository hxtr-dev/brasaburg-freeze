import { formatPrice } from '@/lib/menu';

// Preço no cartão com o preço do Pix logo abaixo, quando ele for menor.
export default function PriceTag({ product, className = '' }) {
  return (
    <span className={`price-tag ${className}`}>
      <span className="price">{formatPrice(product.price)}</span>
      {product.pixPrice < product.price && <span className="pix-price">{formatPrice(product.pixPrice)} no Pix</span>}
    </span>
  );
}
