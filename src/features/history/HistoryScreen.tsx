import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../components/Toast';
import { fetchSalesHistory, type SaleHistoryItem } from '../../data/history';
import { addPayment, cancelSale, SaleError, describeSaleError } from '../../data/sales';
import { formatDayHeading, formatFcfa, formatTime, mlToLiters } from '../../domain/format';

type PendingAction = { saleId: string; kind: 'payment' | 'cancel' } | null;

function groupByDay(items: SaleHistoryItem[]) {
  const groups: { heading: string; items: SaleHistoryItem[] }[] = [];
  for (const item of items) {
    const heading = formatDayHeading(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) {
      last.items.push(item);
    } else {
      groups.push({ heading, items: [item] });
    }
  }
  return groups;
}

function saleStatusLabel(item: SaleHistoryItem): { text: string; tone: 'ok' | 'due' | 'cancelled' } {
  if (item.status === 'CANCELLED') return { text: 'Annulée', tone: 'cancelled' };
  if (item.balanceFcfa > 0) return { text: `Reste ${formatFcfa(item.balanceFcfa)}`, tone: 'due' };
  return { text: 'Payé', tone: 'ok' };
}

export function HistoryScreen() {
  const toast = useToast();
  const [items, setItems] = useState<SaleHistoryItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [amountInput, setAmountInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchSalesHistory(150);
      setItems(data);
      setLoadError(null);
    } catch {
      setLoadError("Impossible de charger l'historique. Vérifie ta connexion.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openPayment(saleId: string) {
    setPending({ saleId, kind: 'payment' });
    setAmountInput('');
  }
  function openCancel(saleId: string) {
    setPending({ saleId, kind: 'cancel' });
    setReasonInput('');
  }
  function closeAction() {
    setPending(null);
  }

  async function confirmPayment() {
    if (!pending) return;
    const amount = Math.round(Number(amountInput.replace(/[^\d]/g, '')) || 0);
    if (amount <= 0) {
      toast.show('Indique un montant supérieur à 0.', 'error');
      return;
    }
    setBusy(true);
    try {
      await addPayment(pending.saleId, amount);
      toast.show('Paiement enregistré.');
      closeAction();
      load();
    } catch (err) {
      toast.show(err instanceof SaleError ? describeSaleError(err.code) : 'Le paiement a échoué.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function confirmCancel() {
    if (!pending) return;
    setBusy(true);
    try {
      await cancelSale(pending.saleId, null, reasonInput);
      toast.show('Vente annulée, stock remis à jour.');
      closeAction();
      load();
    } catch (err) {
      toast.show(err instanceof SaleError ? describeSaleError(err.code) : "L'annulation a échoué.", 'error');
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
  if (!items) return <p className="screen-status">Chargement…</p>;
  if (items.length === 0) {
    return <p className="screen-status">Aucune vente enregistrée pour l'instant.</p>;
  }

  const groups = groupByDay(items);

  return (
    <div className="history">
      {groups.map((group) => (
        <section key={group.heading} className="history__day">
          <h2>{group.heading}</h2>
          <ul>
            {group.items.map((item) => {
              const status = saleStatusLabel(item);
              const expanded = expandedId === item.id;
              return (
                <li key={item.id} className={`sale-row${item.status === 'CANCELLED' ? ' sale-row--cancelled' : ''}`}>
                  <button
                    type="button"
                    className="sale-row__summary"
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    aria-expanded={expanded}
                  >
                    <span className="sale-row__time">{formatTime(item.createdAt)}</span>
                    <span className="sale-row__desc">
                      {item.productName} × {item.quantity}
                      {item.clientName && <em> · {item.clientName}</em>}
                    </span>
                    <span className="sale-row__amount">{formatFcfa(item.totalFcfa)}</span>
                    <span className={`sale-row__status sale-row__status--${status.tone}`}>{status.text}</span>
                  </button>

                  {expanded && (
                    <div className="sale-row__detail">
                      <dl>
                        <div>
                          <dt>Volume</dt>
                          <dd>{mlToLiters(item.volumeMl).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} L</dd>
                        </div>
                        {item.sellerName && (
                          <div>
                            <dt>Vendeur</dt>
                            <dd>{item.sellerName}</dd>
                          </div>
                        )}
                        {item.bonusProductName && (
                          <div>
                            <dt>Bonus</dt>
                            <dd>
                              {item.bonusQuantity} × {item.bonusProductName}
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt>Payé</dt>
                          <dd>{formatFcfa(item.paidFcfa)}</dd>
                        </div>
                        {item.status === 'CANCELLED' && item.cancelReason && (
                          <div>
                            <dt>Motif d'annulation</dt>
                            <dd>{item.cancelReason}</dd>
                          </div>
                        )}
                      </dl>

                      {item.status === 'ACTIVE' && (
                        <div className="sale-row__actions">
                          {item.balanceFcfa > 0 && (
                            <button type="button" onClick={() => openPayment(item.id)}>
                              Encaisser un paiement
                            </button>
                          )}
                          <button type="button" className="sale-row__cancel" onClick={() => openCancel(item.id)}>
                            Annuler la vente
                          </button>
                        </div>
                      )}

                      {pending?.saleId === item.id && pending.kind === 'payment' && (
                        <div className="inline-form">
                          <label>
                            Montant reçu (F)
                            <input
                              type="text"
                              inputMode="numeric"
                              autoFocus
                              value={amountInput}
                              onChange={(e) => setAmountInput(e.target.value)}
                              placeholder={String(item.balanceFcfa)}
                            />
                          </label>
                          <div className="inline-form__buttons">
                            <button type="button" onClick={closeAction} disabled={busy}>
                              Annuler
                            </button>
                            <button type="button" className="primary" onClick={confirmPayment} disabled={busy}>
                              Confirmer
                            </button>
                          </div>
                        </div>
                      )}

                      {pending?.saleId === item.id && pending.kind === 'cancel' && (
                        <div className="inline-form">
                          <label>
                            Motif (facultatif)
                            <input
                              type="text"
                              autoFocus
                              value={reasonInput}
                              onChange={(e) => setReasonInput(e.target.value)}
                              placeholder="Erreur de saisie, doublon…"
                            />
                          </label>
                          <div className="inline-form__buttons">
                            <button type="button" onClick={closeAction} disabled={busy}>
                              Retour
                            </button>
                            <button type="button" className="danger" onClick={confirmCancel} disabled={busy}>
                              Confirmer l'annulation
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <style>{`
        .history { padding: 16px; padding-bottom: 100px; display: flex; flex-direction: column; gap: 22px; }
        .history__day h2 { font-size: 1rem; color: var(--ink-soft); margin-bottom: 8px; font-family: var(--font-body); font-weight: 700; }
        .history__day ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .sale-row { background: #fff; border: 1px solid var(--line); border-radius: var(--radius-md); overflow: hidden; }
        .sale-row--cancelled .sale-row__summary { opacity: 0.55; text-decoration: line-through; }
        .sale-row__summary {
          width: 100%; display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 10px;
          padding: 12px 14px; background: none; border: none; text-align: left; cursor: pointer; font: inherit;
        }
        .sale-row__time { color: var(--ink-soft); font-size: 0.85rem; }
        .sale-row__desc { font-weight: 600; }
        .sale-row__desc em { font-style: normal; color: var(--copper); font-weight: 500; }
        .sale-row__amount { font-weight: 700; color: var(--bordeaux); }
        .sale-row__status { font-size: 0.78rem; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
        .sale-row__status--ok { background: rgba(76, 122, 82, 0.14); color: var(--leaf); }
        .sale-row__status--due { background: rgba(199, 126, 35, 0.16); color: var(--amber); }
        .sale-row__status--cancelled { background: rgba(90, 76, 64, 0.12); color: var(--ink-soft); }
        .sale-row__detail { padding: 4px 14px 14px; border-top: 1px dashed var(--line); display: flex; flex-direction: column; gap: 12px; }
        .sale-row__detail dl { display: flex; flex-direction: column; gap: 4px; margin: 8px 0 0; }
        .sale-row__detail dl > div { display: flex; justify-content: space-between; font-size: 0.9rem; }
        .sale-row__detail dt { color: var(--ink-soft); }
        .sale-row__actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .sale-row__actions button { padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--wood-mid); background: var(--cream); cursor: pointer; font-weight: 600; font-size: 0.85rem; }
        .sale-row__cancel { color: var(--clay); border-color: var(--clay); background: none; }
        .inline-form { display: flex; flex-direction: column; gap: 10px; background: var(--cream-deep); border-radius: var(--radius-md); padding: 12px; }
        .inline-form label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--ink-soft); }
        .inline-form input { font: inherit; padding: 10px; border: 1px solid var(--line); border-radius: var(--radius-md); }
        .inline-form__buttons { display: flex; justify-content: flex-end; gap: 8px; }
        .inline-form__buttons button { padding: 8px 14px; border-radius: var(--radius-md); border: 1px solid var(--line); background: #fff; cursor: pointer; font-weight: 600; }
        .inline-form__buttons .primary { background: var(--bordeaux); color: #fff; border: none; }
        .inline-form__buttons .danger { background: var(--clay); color: #fff; border: none; }
      `}</style>
    </div>
  );
}
