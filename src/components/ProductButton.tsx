import type { Product } from '../domain/format';
import { formatFcfa } from '../domain/format';

export function ProductButton({
  product,
  selected,
  onSelect,
}: {
  product: Product;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`product-btn${selected ? ' product-btn--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="product-btn__name">{product.name}</span>
      <span className="product-btn__price">{formatFcfa(product.priceFcfa)}</span>
      <style>{`
        .product-btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 22px 8px;
          min-height: 104px;
          border-radius: var(--radius-lg);
          border: 2px solid var(--wood-mid);
          background: linear-gradient(180deg, var(--cream) 0%, var(--cream-deep) 100%);
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }
        .product-btn::after {
          content: '';
          position: absolute;
          inset: 6px;
          border-radius: calc(var(--radius-lg) - 6px);
          border: 1px solid rgba(180, 112, 58, 0.35);
          pointer-events: none;
        }
        .product-btn:active { transform: scale(0.97); }
        .product-btn__name {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--wood-dark);
          letter-spacing: 0.02em;
        }
        .product-btn__price {
          font-size: 1rem;
          font-weight: 600;
          color: var(--bordeaux);
        }
        .product-btn--selected {
          border-color: var(--bordeaux);
          background: linear-gradient(180deg, #fff 0%, var(--cream-deep) 100%);
          box-shadow: 0 4px 14px rgba(122, 31, 46, 0.22);
        }
      `}</style>
    </button>
  );
}
