import { useCallback, useEffect, useState } from 'react';
import { StockPill } from '../../components/StockPill';
import { useToast } from '../../components/Toast';
import { fetchCurrentStockMl, fetchSettings, subscribeToStockChanges } from '../../data/catalog';
import { addStockEntry, correctStock, SaleError, describeSaleError } from '../../data/sales';
import { fetchStockMovements, type MovementType, type StockMovement } from '../../data/stock';
import { formatDayHeading, formatTime, litersToMl, mlToLiters, stockLevel } from '../../domain/format';

const TYPE_LABEL: Record<MovementType, string> = {
  SALE: 'Vente',
  BONUS: 'Bonus',
  ENTRY: 'Entrée de stock',
  CORRECTION: 'Correction',
  CANCELLATION: 'Annulation',
};

function formatDeltaLiters(ml: number): string {
  const liters = mlToLiters(ml);
  const sign = liters > 0 ? '+' : '';
  return `${sign}${liters.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} L`;
}

type OpenForm = 'entry' | 'correction' | null;

export function StockScreen() {
  const toast = useToast();
  const [stockMl, setStockMl] = useState<number | null>(null);
  const [thresholds, setThresholds] = useState<{ lowStockMl: number; criticalStockMl: number } | null>(null);
  const [movements, setMovements] = useState<StockMovement[] | null>(null);
  const [filter, setFilter] = useState<MovementType | 'ALL'>('ALL');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const [litersInput, setLitersInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [stock, settings, moves] = await Promise.all([
        fetchCurrentStockMl(),
        fetchSettings(),
        fetchStockMovements(150),
      ]);
      setStockMl(stock);
      setThresholds({ lowStockMl: settings.lowStockMl, criticalStockMl: settings.criticalStockMl });
      setMovements(moves);
      setLoadError(null);
    } catch {
      setLoadError('Impossible de charger le stock. Vérifie ta connexion.');
    }
  }, []);

  useEffect(() => {
    load();
    return subscribeToStockChanges(load);
  }, [load]);

  function openEntry() {
    setOpenForm('entry');
    setLitersInput('');
    setNoteInput('');
  }
  function openCorrection() {
    setOpenForm('correction');
    setLitersInput(stockMl !== null ? String(mlToLiters(stockMl)) : '');
    setNoteInput('');
  }
  function closeForm() {
    setOpenForm(null);
  }

  async function confirmEntry() {
    const liters = Number(litersInput.replace(',', '.'));
    if (!liters || liters <= 0) {
      toast.show('Indique une quantité en litres supérieure à 0.', 'error');
      return;
    }
    setBusy(true);
    try {
      await addStockEntry(litersToMl(liters), null, noteInput);
      toast.show('Entrée de stock enregistrée.');
      closeForm();
      load();
    } catch (err) {
      toast.show(err instanceof SaleError ? describeSaleError(err.code) : "L'entrée a échoué.", 'error');
    } finally {
      setBusy(false);
    }
  }

  async function confirmCorrection() {
    const liters = Number(litersInput.replace(',', '.'));
    if (liters === null || liters === undefined || Number.isNaN(liters) || liters < 0) {
      toast.show('Indique le stock réel en litres.', 'error');
      return;
    }
    setBusy(true);
    try {
      await correctStock(litersToMl(liters), null, noteInput);
      toast.show('Correction enregistrée.');
      closeForm();
      load();
    } catch (err) {
      toast.show(err instanceof SaleError ? describeSaleError(err.code) : "La correction a échoué.", 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="screen-status">
        <p>{loadError}</p>
        <button type="button" className="link-btn" onClick={load}>
          Réessayer
        </button>
      </div>
    );
  }
  if (stockMl === null || thresholds === null || movements === null) {
    return <p className="screen-status">Chargement…</p>;
  }

  const level = stockLevel(stockMl, thresholds);
  const filtered = filter === 'ALL' ? movements : movements.filter((m) => m.type === filter);

  return (
    <div className="stock-screen">
      <div className="stock-screen__top">
        <StockPill stockMl={stockMl} level={level} />
        <div className="stock-screen__actions">
          <button type="button" onClick={openEntry}>
            Entrée de stock
          </button>
          <button type="button" onClick={openCorrection}>
            Correction
          </button>
        </div>
      </div>

      {openForm && (
        <div className="inline-form">
          <label>
            {openForm === 'entry' ? 'Quantité reçue (L)' : 'Stock réel constaté (L)'}
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={litersInput}
              onChange={(e) => setLitersInput(e.target.value)}
              placeholder={openForm === 'entry' ? '25' : String(mlToLiters(stockMl))}
            />
          </label>
          <label>
            Note (facultative)
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder={openForm === 'entry' ? 'Nouvelle livraison' : 'Écart constaté à l’inventaire'}
            />
          </label>
          <div className="inline-form__buttons">
            <button type="button" onClick={closeForm} disabled={busy}>
              Annuler
            </button>
            <button
              type="button"
              className="primary"
              onClick={openForm === 'entry' ? confirmEntry : confirmCorrection}
              disabled={busy}
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      <div className="stock-screen__journal">
        <div className="stock-screen__journal-header">
          <h2>Journal des mouvements</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value as MovementType | 'ALL')}>
            <option value="ALL">Tous</option>
            {Object.entries(TYPE_LABEL).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="screen-status">Rien à afficher pour ce filtre.</p>
        ) : (
          <ul>
            {filtered.map((m) => (
              <li key={m.id} className={`movement movement--${m.type.toLowerCase()}`}>
                <span className="movement__when">
                  {formatDayHeading(m.createdAt)} · {formatTime(m.createdAt)}
                </span>
                <span className="movement__type">{TYPE_LABEL[m.type]}</span>
                <span className="movement__delta">{formatDeltaLiters(m.deltaMl)}</span>
                {(m.note || m.userName) && (
                  <span className="movement__note">
                    {m.userName && <>{m.userName}</>}
                    {m.userName && m.note && ' · '}
                    {m.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .screen-status { padding: 32px 20px; text-align: center; color: var(--ink-soft); }
        .stock-screen { padding: 16px; padding-bottom: 100px; display: flex; flex-direction: column; gap: 16px; }
        .stock-screen__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .stock-screen__actions { display: flex; gap: 10px; }
        .stock-screen__actions button {
          padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--wood-mid);
          background: var(--cream); font-weight: 600; cursor: pointer; font-size: 0.88rem;
        }
        .inline-form { display: flex; flex-direction: column; gap: 10px; background: var(--cream-deep); border-radius: var(--radius-md); padding: 14px; }
        .inline-form label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--ink-soft); }
        .inline-form input { font: inherit; padding: 10px; border: 1px solid var(--line); border-radius: var(--radius-md); }
        .inline-form__buttons { display: flex; justify-content: flex-end; gap: 8px; }
        .inline-form__buttons button { padding: 8px 14px; border-radius: var(--radius-md); border: 1px solid var(--line); background: #fff; cursor: pointer; font-weight: 600; }
        .inline-form__buttons .primary { background: var(--bordeaux); color: #fff; border: none; }
        .stock-screen__journal-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .stock-screen__journal-header h2 { font-family: var(--font-body); font-size: 1rem; font-weight: 700; color: var(--wood-dark); }
        .stock-screen__journal-header select { font: inherit; padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--line); background: #fff; }
        .stock-screen__journal ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .movement {
          display: grid; grid-template-columns: auto 1fr auto; gap: 6px 10px; align-items: baseline;
          background: #fff; border: 1px solid var(--line); border-radius: var(--radius-md); padding: 10px 12px; font-size: 0.88rem;
        }
        .movement__when { color: var(--ink-soft); font-size: 0.78rem; grid-column: 1 / span 3; }
        .movement__type { font-weight: 600; }
        .movement__delta { font-weight: 700; text-align: right; }
        .movement__note { grid-column: 1 / span 3; color: var(--ink-soft); font-size: 0.82rem; }
        .movement--entry .movement__delta { color: var(--leaf); }
        .movement--sale .movement__delta, .movement--bonus .movement__delta { color: var(--bordeaux); }
        .movement--cancellation .movement__delta { color: var(--leaf); }
        .movement--correction .movement__delta { color: var(--amber); }
      `}</style>
    </div>
  );
}
