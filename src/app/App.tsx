import { NavLink, Route, Routes } from 'react-router-dom';
import { QuickSaleScreen } from '../features/quick-sale/QuickSaleScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { CreditsScreen } from '../features/credits/CreditsScreen';
import { StockScreen } from '../features/stock/StockScreen';
import { PlusScreen } from '../features/plus/PlusScreen';
import { lockApp } from '../components/LockScreen';

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
        <img src="/favicon.svg" alt="" className="app-header__mark" />
        <h1>La Cave de Pépé</h1>
        <button type="button" className="app-header__lock" onClick={lockApp} aria-label="Verrouiller">
          🔒
        </button>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<QuickSaleScreen />} />
          <Route path="/historique" element={<HistoryScreen />} />
          <Route path="/credits" element={<CreditsScreen />} />
          <Route path="/stock" element={<StockScreen />} />
          <Route path="/plus" element={<PlusScreen />} />
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
          width: 26px;
          height: 26px;
          flex-shrink: 0;
        }
        .app-header h1 {
          color: var(--cream);
          font-size: 1.15rem;
          flex: 1;
        }
        .app-header__lock {
          background: none; border: none; font-size: 1.1rem; cursor: pointer; opacity: 0.75; padding: 4px;
        }
        .app-content { flex: 1; }
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
