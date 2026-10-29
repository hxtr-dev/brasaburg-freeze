import { formatPrice } from '@/lib/menu';

export default function PriceTag({ product, className = '' }) {
  return (
    <span className={`price-tag ${className}`}>
      <span className="price">{formatPrice(product.price)}</span>
    </span>
  );
}
