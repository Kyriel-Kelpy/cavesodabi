import { useEffect, useState } from 'react';
import { fetchPeriodStats, type PeriodStats, type StatsPeriod } from '../../data/stats';
import { formatFcfa, mlToLiters } from '../../domain/format';

const TABS: { key: StatsPeriod; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

function liters(ml: number): string {
  return mlToLiters(ml).toLocaleString('fr-FR', { maximumFractionDigits: 3 });
}

export function StatsScreen() {
  const [period, setPeriod] = useState<StatsPeriod>('today');
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setError(null);
    fetchPeriodStats(period)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger les statistiques.');
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="stats-screen">
      <div className="stats-screen__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={period === tab.key ? 'active' : ''}
            onClick={() => setPeriod(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="screen-status">{error}</p>}
      {!error && !stats && <p className="screen-status">Chargement…</p>}

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-card--main">
              <span>Chiffre d'affaires</span>
              <strong>{formatFcfa(stats.revenueFcfa)}</strong>
            </div>
            <div className="stat-card">
              <span>Volume vendu</span>
              <strong>{liters(stats.soldMl)} L</strong>
            </div>
            <div className="stat-card">
              <span>Nombre de ventes</span>
              <strong>{stats.salesCount}</strong>
            </div>
            <div className="stat-card">
              <span>Offert en bonus</span>
              <strong>{liters(stats.bonusMl)} L</strong>
            </div>
            <div className="stat-card">
              <span>Reste à récupérer (période)</span>
              <strong>{formatFcfa(stats.toCollectFcfa)}</strong>
            </div>
            <div className="stat-card">
              <span>Crédits en cours (total)</span>
              <strong>{formatFcfa(stats.outstandingTotalFcfa)}</strong>
            </div>
          </div>

          <div className="stats-by-product">
            <h2>Par produit</h2>
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Vendus</th>
                  <th>Volume</th>
                  <th>Bonus</th>
                </tr>
              </thead>
              <tbody>
                {stats.byProduct.map((p) => (
                  <tr key={p.productId}>
                    <td>{p.name}</td>
                    <td>{p.quantity}</td>
                    <td>{liters(p.volumeMl)} L</td>
                    <td>{p.bonusQuantity > 0 ? p.bonusQuantity : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`
        .screen-status { padding: 32px 20px; text-align: center; color: var(--ink-soft); }
        .stats-screen { display: flex; flex-direction: column; gap: 16px; }
        .stats-screen__tabs { display: flex; gap: 8px; }
        .stats-screen__tabs button {
          flex: 1; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--line);
          background: #fff; font-weight: 600; font-size: 0.85rem; cursor: pointer; color: var(--ink-soft);
        }
        .stats-screen__tabs button.active { background: var(--bordeaux); color: #fff; border-color: var(--bordeaux); }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .stat-card {
          display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: var(--radius-md);
          background: #fff; border: 1px solid var(--line);
        }
        .stat-card span { font-size: 0.78rem; color: var(--ink-soft); }
        .stat-card strong { font-family: var(--font-display); font-size: 1.25rem; color: var(--wood-dark); }
        .stat-card--main { grid-column: 1 / -1; background: var(--wood-dark); border: none; }
        .stat-card--main span, .stat-card--main strong { color: var(--cream); }
        .stat-card--main strong { font-size: 1.6rem; }
        .stats-by-product h2 { font-family: var(--font-body); font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
        .stats-by-product table { width: 100%; border-collapse: collapse; background: #fff; border-radius: var(--radius-md); overflow: hidden; }
        .stats-by-product th, .stats-by-product td { padding: 8px 10px; text-align: left; font-size: 0.88rem; border-bottom: 1px solid var(--line); }
        .stats-by-product th { color: var(--ink-soft); font-weight: 600; font-size: 0.78rem; }
      `}</style>
    </div>
  );
}
