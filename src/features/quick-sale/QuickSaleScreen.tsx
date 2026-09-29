import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductButton } from '../../components/ProductButton';
import { StockPill } from '../../components/StockPill';
import { SellerPicker } from '../../components/SellerPicker';
import { useToast } from '../../components/Toast';
import { fetchActiveProducts, fetchCurrentStockMl, fetchSettings, subscribeToStockChanges } from '../../data/catalog';
import { createSale, SaleError, describeSaleError } from '../../data/sales';
import { createClient, searchClients, type Client } from '../../data/clients';
import { formatFcfa, formatLiters, saleTotals, stockLevel, type Product } from '../../domain/format';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      products: Product[];
      stockMl: number;
      thresholds: { lowStockMl: number; criticalStockMl: number };
    };

export function QuickSaleScreen() {
  const toast = useToast();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [sellerId, setSellerId] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const [clientQuery, setClientQuery] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [pickedClient, setPickedClient] = useState<Client | null>(null);

  const [partialPayment, setPartialPayment] = useState(false);
  const [paidInput, setPaidInput] = useState('');

  const [bonusProductId, setBonusProductId] = useState<string | null>(null);
  const [bonusQuantity, setBonusQuantity] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [products, stockMl, settings] = await Promise.all([
        fetchActiveProducts(),
        fetchCurrentStockMl(),
        fetchSettings(),
      ]);
      setState({
        status: 'ready',
        products,
        stockMl,
        thresholds: { lowStockMl: settings.lowStockMl, criticalStockMl: settings.criticalStockMl },
      });
    } catch {
      setState({ status: 'error', message: "Impossible de charger les données. Vérifie ta connexion." });
    }
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToStockChanges(load);
    return unsubscribe;
  }, [load]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (clientQuery.trim().length >= 2) {
        searchClients(clientQuery).then(setClientResults);
      } else {
        setClientResults([]);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [clientQuery]);

  const products = state.status === 'ready' ? state.products : [];
  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;
  const bonusProduct = products.find((p) => p.id === bonusProductId) ?? null;

  const totals = useMemo(
    () => (selectedProduct ? saleTotals(selectedProduct, quantity) : null),
    [selectedProduct, quantity],
  );

  function resetSalePanel() {
    setSelectedProductId(null);
    setQuantity(1);
    setOptionsOpen(false);
    setClientQuery('');
    setClientResults([]);
    setPickedClient(null);
    setPartialPayment(false);
    setPaidInput('');
    setBonusProductId(null);
    setBonusQuantity(0);
  }

  function pickProduct(product: Product) {
    setSelectedProductId(product.id);
    setQuantity(1);
  }

  async function resolveClientId(): Promise<string | null> {
    if (pickedClient) return pickedClient.id;
    const name = clientQuery.trim();
    if (!name) return null;
    const created = await createClient(name);
    return created.id;
  }

  async function handleSubmit() {
    if (!selectedProduct || !totals || submitting) return;
    setSubmitting(true);
    try {
      const clientId = await resolveClientId();
      const paidFcfa = partialPayment
        ? Math.max(0, Math.round(Number(paidInput.replace(/[^\d]/g, '')) || 0))
        : null;

      const result = await createSale({
        productId: selectedProduct.id,
        quantity,
        sellerId,
        clientId,
        paidFcfa,
        bonusProductId: bonusQuantity > 0 ? bonusProductId : null,
        bonusQuantity,
      });

      if (result.balance_fcfa > 0) {
        toast.show(`Vente enregistrée — reste ${formatFcfa(result.balance_fcfa)} à payer.`, 'warning');
      } else {
        toast.show('Vente enregistrée.');
      }

      if (state.status === 'ready') {
        const newLevel = stockLevel(result.stock_ml, state.thresholds);
        if (newLevel === 'critical') {
          toast.show(`Stock critique : ${formatLiters(result.stock_ml)} restants.`, 'error');
        } else if (newLevel === 'low') {
          toast.show(`Stock faible : ${formatLiters(result.stock_ml)} restants.`, 'warning');
        }
      }

      resetSalePanel();
      load();
    } catch (err) {
      if (err instanceof SaleError) {
        toast.show(describeSaleError(err.code), 'error');
      } else {
        toast.show("La vente n'a pas pu être enregistrée. Réessaie.", 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (state.status === 'loading') {
    return <p className="screen-status">Chargement…</p>;
  }
  if (state.status === 'error') {
    return (
      <div className="screen-status">
        <p>{state.message}</p>
        <button type="button" onClick={load} className="link-btn">
          Réessayer
        </button>
      </div>
    );
  }

  const level = stockLevel(state.stockMl, state.thresholds);

  return (
    <div className="quick-sale">
      <header className="quick-sale__header">
        <StockPill stockMl={state.stockMl} level={level} />
        <SellerPicker sellerId={sellerId} onChange={setSellerId} />
      </header>

      <div className="quick-sale__grid">
        {products.map((product) => (
          <ProductButton
            key={product.id}
            product={product}
            selected={product.id === selectedProductId}
            onSelect={() => pickProduct(product)}
          />
        ))}
      </div>

      {selectedProduct && totals && (
        <div className="sale-panel">
          <div className="sale-panel__quantity">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuer">
              −
            </button>
            <span>
              {selectedProduct.name} × {quantity}
            </span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="Augmenter">
              +
            </button>
          </div>

          <div className="sale-panel__totals">
            <strong>{formatFcfa(totals.totalFcfa)}</strong>
            <span>{(totals.volumeMl / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} L</span>
          </div>

          <button
            type="button"
            className="link-btn"
            onClick={() => setOptionsOpen((v) => !v)}
          >
            {optionsOpen ? 'Masquer les options' : 'Client, paiement, bonus, vendeur'}
          </button>

          {optionsOpen && (
            <div className="sale-panel__options">
              <label className="field">
                <span>Client (facultatif)</span>
                <input
                  type="text"
                  value={pickedClient ? pickedClient.name : clientQuery}
                  placeholder="Nom du client"
                  onChange={(e) => {
                    setPickedClient(null);
                    setClientQuery(e.target.value);
                  }}
                />
                {!pickedClient && clientResults.length > 0 && (
                  <ul className="field__suggestions">
                    {clientResults.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => { setPickedClient(c); setClientQuery(''); }}>
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </label>

              <label className="field field--checkbox">
                <input
                  type="checkbox"
                  checked={partialPayment}
                  onChange={(e) => setPartialPayment(e.target.checked)}
                />
                <span>Paiement partiel (sinon : payé comptant en entier)</span>
              </label>
              {partialPayment && (
                <label className="field">
                  <span>Montant reçu (F)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value)}
                    placeholder={String(totals.totalFcfa)}
                  />
                </label>
              )}

              <label className="field">
                <span>Bonus (facultatif)</span>
                <div className="field__bonus">
                  <select
                    value={bonusProductId ?? ''}
                    onChange={(e) => {
                      setBonusProductId(e.target.value || null);
                      if (!e.target.value) setBonusQuantity(0);
                      else if (bonusQuantity === 0) setBonusQuantity(1);
                    }}
                  >
                    <option value="">Aucun</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {bonusProductId && (
                    <div className="sale-panel__quantity sale-panel__quantity--small">
                      <button type="button" onClick={() => setBonusQuantity((q) => Math.max(1, q - 1))}>
                        −
                      </button>
                      <span>× {bonusQuantity}</span>
                      <button type="button" onClick={() => setBonusQuantity((q) => q + 1)}>
                        +
                      </button>
                    </div>
                  )}
                </div>
                {bonusProduct && bonusQuantity > 0 && (
                  <p className="field__hint">
                    Sortie de stock supplémentaire : {bonusQuantity} × {bonusProduct.name}, sans effet sur le
                    chiffre d'affaires.
                  </p>
                )}
              </label>
            </div>
          )}

          <button type="button" className="primary-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer la vente'}
          </button>
        </div>
      )}

      <style>{`
        .screen-status { padding: 32px 20px; text-align: center; color: var(--ink-soft); }
        .quick-sale { padding: 16px; padding-bottom: 100px; display: flex; flex-direction: column; gap: 16px; }
        .quick-sale__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .quick-sale__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sale-panel {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sale-panel__quantity { display: flex; align-items: center; justify-content: center; gap: 18px; font-weight: 600; font-size: 1.1rem; }
        .sale-panel__quantity button {
          width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--wood-mid);
          background: var(--cream); font-size: 1.3rem; line-height: 1; cursor: pointer;
        }
        .sale-panel__quantity--small button { width: 30px; height: 30px; font-size: 1rem; }
        .sale-panel__totals { display: flex; justify-content: space-between; align-items: baseline; }
        .sale-panel__totals strong { font-family: var(--font-display); font-size: 1.6rem; color: var(--bordeaux); }
        .sale-panel__totals span { color: var(--ink-soft); }
        .link-btn { background: none; border: none; color: var(--copper); font-weight: 600; padding: 4px 0; text-align: left; cursor: pointer; }
        .sale-panel__options { display: flex; flex-direction: column; gap: 14px; padding-top: 6px; border-top: 1px dashed var(--line); }
        .field { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; color: var(--ink-soft); position: relative; }
        .field input, .field select { font: inherit; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--cream); }
        .field--checkbox { flex-direction: row; align-items: center; }
        .field__suggestions { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid var(--line); border-radius: var(--radius-md); z-index: 5; list-style: none; margin: 4px 0 0; padding: 4px; }
        .field__suggestions button { width: 100%; text-align: left; padding: 8px; border: none; background: none; cursor: pointer; border-radius: 6px; }
        .field__suggestions button:hover { background: var(--cream-deep); }
        .field__bonus { display: flex; align-items: center; gap: 12px; }
        .field__hint { margin: 0; font-size: 0.8rem; color: var(--copper); }
        .primary-btn {
          padding: 14px; border-radius: var(--radius-md); border: none; background: var(--bordeaux);
          color: #fff; font-weight: 700; font-size: 1.05rem; cursor: pointer;
        }
        .primary-btn:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}
