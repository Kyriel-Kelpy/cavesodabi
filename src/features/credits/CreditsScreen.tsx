import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../components/Toast';
import { fetchClientCredits, fetchClientDueSales, type ClientCredit, type ClientDueSale } from '../../data/credits';
import { addPayment, SaleError, describeSaleError } from '../../data/sales';
import { formatFcfa, formatTime } from '../../domain/format';

export function CreditsScreen() {
  const toast = useToast();
  const [clients, setClients] = useState<ClientCredit[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [dueSales, setDueSales] = useState<ClientDueSale[] | null>(null);
  const [payingSaleId, setPayingSaleId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchClientCredits();
      setClients(data);
      setLoadError(null);
    } catch {
      setLoadError('Impossible de charger les crédits. Vérifie ta connexion.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleClient(clientId: string) {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      setDueSales(null);
      return;
    }
    setExpandedClientId(clientId);
    setPayingSaleId(null);
    try {
      setDueSales(await fetchClientDueSales(clientId));
    } catch {
      toast.show("Impossible de charger le détail de ce client.", 'error');
      setDueSales([]);
    }
  }

  function openPayment(saleId: string, balanceFcfa: number) {
    setPayingSaleId(saleId);
    setAmountInput(String(balanceFcfa));
  }

  async function confirmPayment(clientId: string) {
    if (!payingSaleId) return;
    const amount = Math.round(Number(amountInput.replace(/[^\d]/g, '')) || 0);
    if (amount <= 0) {
      toast.show('Indique un montant supérieur à 0.', 'error');
      return;
    }
    setBusy(true);
    try {
      await addPayment(payingSaleId, amount);
      toast.show('Paiement enregistré.');
      setPayingSaleId(null);
      setDueSales(await fetchClientDueSales(clientId));
      load();
    } catch (err) {
      toast.show(err instanceof SaleError ? describeSaleError(err.code) : 'Le paiement a échoué.', 'error');
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
  if (!clients) return <p className="screen-status">Chargement…</p>;
  if (clients.length === 0) {
    return <p className="screen-status">Aucun crédit en cours. Tous les clients sont à jour.</p>;
  }

  const totalDue = clients.reduce((sum, c) => sum + c.balanceFcfa, 0);

  return (
    <div className="credits">
      <div className="credits__total">
        <span>Total à récupérer</span>
        <strong>{formatFcfa(totalDue)}</strong>
      </div>

      <ul className="credits__list">
        {clients.map((client) => {
          const expanded = expandedClientId === client.clientId;
          return (
            <li key={client.clientId} className="client-row">
              <button
                type="button"
                className="client-row__summary"
                onClick={() => toggleClient(client.clientId)}
                aria-expanded={expanded}
              >
                <span className="client-row__name">
                  {client.name}
                  {client.phone && <em> · {client.phone}</em>}
                </span>
                <span className="client-row__meta">
                  {client.unsettledSales} vente{client.unsettledSales > 1 ? 's' : ''} non soldée
                  {client.unsettledSales > 1 ? 's' : ''}
                </span>
                <strong className="client-row__balance">{formatFcfa(client.balanceFcfa)}</strong>
              </button>

              {expanded && (
                <div className="client-row__detail">
                  {dueSales === null && <p className="screen-status">Chargement…</p>}
                  {dueSales && dueSales.length === 0 && <p className="screen-status">Rien à afficher.</p>}
                  {dueSales && dueSales.length > 0 && (
                    <ul>
                      {dueSales.map((sale) => (
                        <li key={sale.id} className="due-sale">
                          <div className="due-sale__info">
                            <span className="due-sale__time">{formatTime(sale.createdAt)}</span>
                            <span>
                              {sale.productName} × {sale.quantity}
                            </span>
                            <span className="due-sale__balance">Reste {formatFcfa(sale.balanceFcfa)}</span>
                          </div>

                          {payingSaleId === sale.id ? (
                            <div className="inline-form">
                              <label>
                                Montant reçu (F)
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  autoFocus
                                  value={amountInput}
                                  onChange={(e) => setAmountInput(e.target.value)}
                                />
                              </label>
                              <div className="inline-form__buttons">
                                <button type="button" onClick={() => setPayingSaleId(null)} disabled={busy}>
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  className="primary"
                                  onClick={() => confirmPayment(client.clientId)}
                                  disabled={busy}
                                >
                                  Confirmer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="due-sale__pay"
                              onClick={() => openPayment(sale.id, sale.balanceFcfa)}
                            >
                              Encaisser
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <style>{`
        .screen-status { padding: 32px 20px; text-align: center; color: var(--ink-soft); }
        .credits { padding: 16px; padding-bottom: 100px; display: flex; flex-direction: column; gap: 16px; }
        .credits__total {
          display: flex; justify-content: space-between; align-items: baseline;
          background: var(--wood-dark); color: var(--cream); border-radius: var(--radius-lg); padding: 16px;
        }
        .credits__total strong { font-family: var(--font-display); font-size: 1.5rem; }
        .credits__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .client-row { background: #fff; border: 1px solid var(--line); border-radius: var(--radius-md); overflow: hidden; }
        .client-row__summary {
          width: 100%; display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 10px;
          padding: 14px; background: none; border: none; text-align: left; cursor: pointer; font: inherit;
        }
        .client-row__name { font-weight: 700; color: var(--wood-dark); }
        .client-row__name em { font-style: normal; color: var(--ink-soft); font-weight: 400; font-size: 0.85rem; }
        .client-row__meta { color: var(--ink-soft); font-size: 0.8rem; }
        .client-row__balance { color: var(--bordeaux); font-size: 1.1rem; }
        .client-row__detail { padding: 0 14px 14px; border-top: 1px dashed var(--line); }
        .client-row__detail ul { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .due-sale { display: flex; flex-direction: column; gap: 8px; }
        .due-sale__info { display: flex; gap: 10px; align-items: center; font-size: 0.9rem; }
        .due-sale__time { color: var(--ink-soft); }
        .due-sale__balance { margin-left: auto; color: var(--amber); font-weight: 600; }
        .due-sale__pay {
          align-self: flex-start; padding: 6px 12px; border-radius: var(--radius-md);
          border: 1px solid var(--wood-mid); background: var(--cream); cursor: pointer; font-weight: 600; font-size: 0.82rem;
        }
        .inline-form { display: flex; flex-direction: column; gap: 10px; background: var(--cream-deep); border-radius: var(--radius-md); padding: 12px; }
        .inline-form label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--ink-soft); }
        .inline-form input { font: inherit; padding: 10px; border: 1px solid var(--line); border-radius: var(--radius-md); }
        .inline-form__buttons { display: flex; justify-content: flex-end; gap: 8px; }
        .inline-form__buttons button { padding: 8px 14px; border-radius: var(--radius-md); border: 1px solid var(--line); background: #fff; cursor: pointer; font-weight: 600; }
        .inline-form__buttons .primary { background: var(--bordeaux); color: #fff; border: none; }
      `}</style>
    </div>
  );
}
