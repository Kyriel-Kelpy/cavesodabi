import { useState } from 'react';
import { StatsScreen } from '../stats/StatsScreen';
import { AdminScreen } from '../admin/AdminScreen';

type Tab = 'stats' | 'admin';

export function PlusScreen() {
  const [tab, setTab] = useState<Tab>('stats');

  return (
    <div className="plus-screen">
      <div className="plus-screen__tabs">
        <button type="button" className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>
          Statistiques
        </button>
        <button type="button" className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>
          Administration
        </button>
      </div>

      {tab === 'stats' ? <StatsScreen /> : <AdminScreen />}

      <style>{`
        .plus-screen { padding: 16px; padding-bottom: 100px; display: flex; flex-direction: column; gap: 16px; }
        .plus-screen__tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--line); padding-bottom: 10px; }
        .plus-screen__tabs button {
          padding: 8px 4px; background: none; border: none; font-weight: 700; font-size: 0.9rem;
          color: var(--ink-soft); cursor: pointer; border-bottom: 2px solid transparent;
        }
        .plus-screen__tabs button.active { color: var(--bordeaux); border-color: var(--bordeaux); }
      `}</style>
    </div>
  );
}
