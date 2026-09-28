import { NavLink, Route, Routes } from 'react-router-dom';
import { QuickSaleScreen } from '../features/quick-sale/QuickSaleScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="coming-soon">
      <h2>{title}</h2>
      <p>Cet écran arrive dans une prochaine étape du projet.</p>
    </div>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Vente', end: true },
  { to: '/historique', label: 'Historique' },
  { to: '/credits', label: 'Crédits' },
  { to: '/stock', label: 'Stock' },
  { to: '/plus', label: 'Plus' },
];

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header__mark" aria-hidden="true" />
        <h1>La Cave de Pépé</h1>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<QuickSaleScreen />} />
          <Route path="/historique" element={<HistoryScreen />} />
          <Route path="/credits" element={<ComingSoon title="Crédits en cours" />} />
          <Route path="/stock" element={<ComingSoon title="Stock : entrées et corrections" />} />
          <Route path="/plus" element={<ComingSoon title="Statistiques et administration" />} />
        </Routes>
      </main>

      <nav className="app-nav" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="app-nav__link">
            {item.label}
          </NavLink>
        ))}
      </nav>

      <style>{`
        .app-shell { display: flex; flex-direction: column; min-height: 100vh; }
        .app-header {
          display: flex; align-items: center; gap: 10px;
          padding: calc(14px + var(--safe-top)) 16px 14px;
          background: var(--wood-dark);
          position: sticky; top: 0; z-index: 20;
        }
        .app-header__mark {
          width: 22px; height: 26px; border-radius: 3px 3px 8px 8px;
          background: var(--bordeaux);
          box-shadow: inset 0 -3px 0 rgba(0,0,0,0.15);
        }
        .app-header h1 {
          color: var(--cream);
          font-size: 1.15rem;
        }
        .app-content { flex: 1; }
        .coming-soon { padding: 48px 24px; text-align: center; color: var(--ink-soft); }
        .coming-soon h2 { margin-bottom: 8px; }
        .app-nav {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
          display: flex; justify-content: space-around;
          background: #fff;
          border-top: 1px solid var(--line);
          padding: 8px 4px calc(8px + var(--safe-bottom));
        }
        .app-nav__link {
          flex: 1; text-align: center; padding: 6px 2px;
          font-size: 0.78rem; font-weight: 600;
          color: var(--ink-soft); text-decoration: none;
          border-radius: var(--radius-md);
        }
        .app-nav__link.active { color: var(--bordeaux); background: rgba(122, 31, 46, 0.08); }
      `}</style>
    </div>
  );
}
