import { useEffect, useState } from 'react';
import { useToast } from '../../components/Toast';
import { fetchAllProducts, updateProductPrice, updateStockThresholds } from '../../data/admin';
import { fetchSettings } from '../../data/catalog';
import { formatFcfa, mlToLiters, type Product } from '../../domain/format';

export function AdminScreen() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const [lowStockL, setLowStockL] = useState('');
  const [criticalStockL, setCriticalStockL] = useState('');
  const [savingThresholds, setSavingThresholds] = useState(false);

  useEffect(() => {
    fetchAllProducts().then(setProducts);
    fetchSettings().then((s) => {
      setLowStockL(String(mlToLiters(s.lowStockMl)));
      setCriticalStockL(String(mlToLiters(s.criticalStockMl)));
    });
  }, []);

  async function savePrice(product: Product) {
    const raw = priceEdits[product.id];
    const price = Math.round(Number((raw ?? '').replace(/[^\d]/g, '')));
    if (!price || price <= 0) {
      toast.show('Indique un prix supérieur à 0.', 'error');
      return;
    }
    setSavingProductId(product.id);
    try {
      await updateProductPrice(product.id, price);
      toast.show(`Prix de ${product.name} mis à jour.`);
      setProducts((current) => current?.map((p) => (p.id === product.id ? { ...p, priceFcfa: price } : p)) ?? null);
      setPriceEdits((current) => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
    } catch {
      toast.show('La mise à jour du prix a échoué.', 'error');
    } finally {
      setSavingProductId(null);
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

  return (
    <div className="admin-screen">
      <section>
        <h2>Prix des produits</h2>
        {!products && <p className="screen-status">Chargement…</p>}
        {products && (
          <ul className="admin-products">
            {products.map((product) => (
              <li key={product.id}>
                <span className="admin-products__name">{product.name}</span>
                <span className="admin-products__current">{formatFcfa(product.priceFcfa)}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nouveau prix"
                  value={priceEdits[product.id] ?? ''}
                  onChange={(e) => setPriceEdits((current) => ({ ...current, [product.id]: e.target.value }))}
                />
                <button
                  type="button"
                  disabled={!priceEdits[product.id] || savingProductId === product.id}
                  onClick={() => savePrice(product)}
                >
                  Enregistrer
                </button>
              </li>
            ))}
          </ul>
        )}
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
        .admin-products { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .admin-products li {
          display: grid; grid-template-columns: 1fr auto 100px auto; gap: 8px; align-items: center;
          background: #fff; border: 1px solid var(--line); border-radius: var(--radius-md); padding: 10px 12px;
        }
        .admin-products__name { font-weight: 600; }
        .admin-products__current { color: var(--ink-soft); font-size: 0.85rem; }
        .admin-products input, .admin-thresholds input {
          font: inherit; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--radius-md);
        }
        .admin-products button, .admin-thresholds button {
          padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--wood-mid);
          background: var(--cream); font-weight: 600; cursor: pointer; font-size: 0.82rem;
        }
        .admin-products button:disabled { opacity: 0.5; cursor: default; }
        .admin-thresholds { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; background: #fff; border: 1px solid var(--line); border-radius: var(--radius-md); padding: 14px; }
        .admin-thresholds label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--ink-soft); }
        .admin-thresholds .primary { background: var(--bordeaux); color: #fff; border: none; }
        .admin-note { font-size: 0.82rem; color: var(--ink-soft); }
        .admin-note code { background: var(--cream-deep); padding: 2px 5px; border-radius: 4px; }
      `}</style>
    </div>
  );
}
