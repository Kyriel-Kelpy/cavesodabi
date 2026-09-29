import { useEffect, useState } from 'react';
import { useToast } from '../../components/Toast';
import {
  fetchAllProducts,
  updateProductAltPrice,
  updateProductPrice,
  updatePurchaseCostPerLiter,
  updateStockThresholds,
} from '../../data/admin';
import { fetchSettings } from '../../data/catalog';
import { formatFcfa, mlToLiters, type Product } from '../../domain/format';

type PriceKey = `${string}:main` | `${string}:alt`;

export function AdminScreen() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [priceEdits, setPriceEdits] = useState<Record<PriceKey, string>>({});
  const [savingKey, setSavingKey] = useState<PriceKey | null>(null);

  const [lowStockL, setLowStockL] = useState('');
  const [criticalStockL, setCriticalStockL] = useState('');
  const [savingThresholds, setSavingThresholds] = useState(false);

  const [costPerLiter, setCostPerLiter] = useState('');
  const [savingCost, setSavingCost] = useState(false);

  useEffect(() => {
    fetchAllProducts().then(setProducts);
    fetchSettings().then((s) => {
      setLowStockL(String(mlToLiters(s.lowStockMl)));
      setCriticalStockL(String(mlToLiters(s.criticalStockMl)));
      setCostPerLiter(String(s.purchaseCostPerLiterFcfa));
    });
  }, []);

  async function saveMainPrice(product: Product) {
    const key: PriceKey = `${product.id}:main`;
    const price = Math.round(Number((priceEdits[key] ?? '').replace(/[^\d]/g, '')));
    if (!price || price <= 0) {
      toast.show('Indique un prix supérieur à 0.', 'error');
      return;
    }
    setSavingKey(key);
    try {
      await updateProductPrice(product.id, price);
      toast.show(`Prix de ${product.name} mis à jour.`);
      setProducts((current) => current?.map((p) => (p.id === product.id ? { ...p, priceFcfa: price } : p)) ?? null);
      setPriceEdits((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    } catch {
      toast.show('La mise à jour du prix a échoué.', 'error');
    } finally {
      setSavingKey(null);
    }
  }

  async function saveAltPrice(product: Product) {
    const key: PriceKey = `${product.id}:alt`;
    const price = Math.round(Number((priceEdits[key] ?? '').replace(/[^\d]/g, '')));
    if (!price || price <= 0) {
      toast.show('Indique un prix supérieur à 0.', 'error');
      return;
    }
    setSavingKey(key);
    try {
      await updateProductAltPrice(product.id, price);
      toast.show(`Prix « ${product.altPriceLabel} » de ${product.name} mis à jour.`);
      setProducts((current) => current?.map((p) => (p.id === product.id ? { ...p, altPriceFcfa: price } : p)) ?? null);
      setPriceEdits((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    } catch {
      toast.show('La mise à jour du prix a échoué.', 'error');
    } finally {
      setSavingKey(null);
    }
  }

  async function saveThresholds() {
    const low = Number(lowStockL.replace(',', '.'));
    const critical = Number(criticalStockL.replace(',', '.'));
    if (!Number.isFinite(low) || !Number.isFinite(critical) || low < 0 || critical < 0) {
      toast.show('Indique des seuils valides en litres.', 'error');
      return;
    }
    if (critical > low) {
      toast.show('Le seuil critique doit être inférieur ou égal au seuil faible.', 'error');
      return;
    }
    setSavingThresholds(true);
    try {
      await updateStockThresholds({ lowStockMl: Math.round(low * 1000), criticalStockMl: Math.round(critical * 1000) });
      toast.show('Seuils de stock mis à jour.');
    } catch {
      toast.show('La mise à jour des seuils a échoué.', 'error');
    } finally {
      setSavingThresholds(false);
    }
  }

  async function saveCost() {
    const cost = Number(costPerLiter.replace(/[^\d]/g, ''));
    if (!Number.isFinite(cost) || cost < 0) {
      toast.show("Indique un coût d'achat valide.", 'error');
      return;
    }
    setSavingCost(true);
    try {
      await updatePurchaseCostPerLiter(Math.round(cost));
      toast.show("Coût d'achat mis à jour.");
    } catch {
      toast.show("La mise à jour du coût d'achat a échoué.", 'error');
    } finally {
      setSavingCost(false);
    }
  }

  return (
    <div className="admin-screen">
      <section>
        <h2>Prix des produits</h2>
        {!products && <p className="screen-status">Chargement…</p>}
        {products && (
          <ul className="admin-products">
            {products.map((product) => {
              const mainKey: PriceKey = `${product.id}:main`;
              const altKey: PriceKey = `${product.id}:alt`;
              return (
                <li key={product.id} className="admin-product">
                  <span className="admin-product__name">{product.name}</span>

                  <div className="admin-product__price-row">
                    <span className="admin-product__price-label">
                      {product.priceLabel ?? 'Prix'} · actuel {formatFcfa(product.priceFcfa)}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Nouveau prix"
                      value={priceEdits[mainKey] ?? ''}
                      onChange={(e) => setPriceEdits((current) => ({ ...current, [mainKey]: e.target.value }))}
                    />
                    <button
                      type="button"
                      disabled={!priceEdits[mainKey] || savingKey === mainKey}
                      onClick={() => saveMainPrice(product)}
                    >
                      Enregistrer
                    </button>
                  </div>

                  {product.altPriceFcfa !== null && (
                    <div className="admin-product__price-row">
                      <span className="admin-product__price-label">
                        {product.altPriceLabel} · actuel {formatFcfa(product.altPriceFcfa)}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Nouveau prix"
                        value={priceEdits[altKey] ?? ''}
                        onChange={(e) => setPriceEdits((current) => ({ ...current, [altKey]: e.target.value }))}
                      />
                      <button
                        type="button"
                        disabled={!priceEdits[altKey] || savingKey === altKey}
                        onClick={() => saveAltPrice(product)}
                      >
                        Enregistrer
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2>Coût d'achat (pour le bénéfice)</h2>
        <div className="admin-thresholds">
          <label>
            Coût d'achat au litre (F)
            <input
              type="text"
              inputMode="numeric"
              value={costPerLiter}
              onChange={(e) => setCostPerLiter(e.target.value)}
            />
          </label>
          <button type="button" className="primary" onClick={saveCost} disabled={savingCost}>
            Enregistrer
          </button>
        </div>
        <p className="admin-hint">
          Ce que tu paies au fournisseur, quel que soit le prix appliqué au client. Sert uniquement à estimer le
          bénéfice dans Statistiques.
        </p>
      </section>

      <section>
        <h2>Seuils d'alerte de stock</h2>
        <div className="admin-thresholds">
          <label>
            Stock faible (L)
            <input type="text" inputMode="decimal" value={lowStockL} onChange={(e) => setLowStockL(e.target.value)} />
          </label>
          <label>
            Stock critique (L)
            <input
              type="text"
              inputMode="decimal"
              value={criticalStockL}
              onChange={(e) => setCriticalStockL(e.target.value)}
            />
          </label>
          <button type="button" className="primary" onClick={saveThresholds} disabled={savingThresholds}>
            Enregistrer les seuils
          </button>
        </div>
      </section>

      <p className="admin-note">
        Ajouter ou retirer un vendeur se fait pour l'instant directement dans Supabase (table <code>profiles</code>).
      </p>

      <style>{`
        .screen-status { padding: 20px; text-align: center; color: var(--ink-soft); }
        .admin-screen { display: flex; flex-direction: column; gap: 24px; }
        .admin-screen h2 { font-family: var(--font-body); font-size: 1rem; font-weight: 700; margin-bottom: 10px; }
        .admin-products { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .admin-product {
          background: #fff; border: 1px solid var(--line); border-radius: var(--radius-md); padding: 12px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .admin-product__name { font-weight: 700; color: var(--wood-dark); }
        .admin-product__price-row { display: grid; grid-template-columns: 1fr 100px auto; gap: 8px; align-items: center; }
        .admin-product__price-label { font-size: 0.82rem; color: var(--ink-soft); }
        .admin-product input, .admin-thresholds input {
          font: inherit; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--radius-md);
        }
        .admin-product button, .admin-thresholds button {
          padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--wood-mid);
          background: var(--cream); font-weight: 600; cursor: pointer; font-size: 0.82rem;
        }
        .admin-product button:disabled { opacity: 0.5; cursor: default; }
        .admin-thresholds { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; background: #fff; border: 1px solid var(--line); border-radius: var(--radius-md); padding: 14px; }
        .admin-thresholds label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--ink-soft); }
        .admin-thresholds .primary { background: var(--bordeaux); color: #fff; border: none; }
        .admin-hint { font-size: 0.78rem; color: var(--ink-soft); margin: 6px 0 0; }
        .admin-note { font-size: 0.82rem; color: var(--ink-soft); }
        .admin-note code { background: var(--cream-deep); padding: 2px 5px; border-radius: 4px; }
      `}</style>
    </div>
  );
}
