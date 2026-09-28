import type { StockLevel } from '../domain/format';
import { formatLiters } from '../domain/format';

const LABEL: Record<StockLevel, string> = {
  normal: 'Stock',
  low: 'Stock faible',
  critical: 'Stock critique',
};

export function StockPill({ stockMl, level }: { stockMl: number; level: StockLevel }) {
  return (
    <div className={`stock-pill stock-pill--${level}`}>
      <span className="stock-pill__label">{LABEL[level]}</span>
      <span className="stock-pill__value">{formatLiters(stockMl)}</span>
      <style>{`
        .stock-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          background: var(--cream-deep);
          border: 1px solid var(--line);
          min-width: 140px;
        }
        .stock-pill__label {
          font-size: 0.72rem;
          color: var(--ink-soft);
        }
        .stock-pill__value {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--wood-dark);
        }
        .stock-pill--low .stock-pill__value { color: var(--amber); }
        .stock-pill--low .stock-pill__label { color: var(--amber); }
        .stock-pill--critical { background: rgba(154, 59, 46, 0.1); border-color: var(--clay); }
        .stock-pill--critical .stock-pill__value,
        .stock-pill--critical .stock-pill__label { color: var(--clay); }
      `}</style>
    </div>
  );
}
