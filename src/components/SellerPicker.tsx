import { useEffect, useState } from 'react';
import { fetchActiveProfiles, getRememberedSellerId, rememberSellerId, type Profile } from '../data/profiles';

/**
 * Provisoire (voir étape 9 du plan) : pas d'authentification pour la V1.
 * Ce sélecteur retient juste, par téléphone, qui saisit les ventes.
 */
export function SellerPicker({
  sellerId,
  onChange,
}: {
  sellerId: string | null;
  onChange: (id: string) => void;
}) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);

  useEffect(() => {
    fetchActiveProfiles().then((list) => {
      setProfiles(list);
      const remembered = getRememberedSellerId();
      if (!sellerId && remembered && list.some((p) => p.id === remembered)) {
        onChange(remembered);
      }
    });
    // onChange/sellerId volontairement hors dépendances : ne s'exécute qu'au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profiles) return null;

  const current = profiles.find((p) => p.id === sellerId) ?? null;

  return (
    <label className="seller-picker">
      <span className="seller-picker__label">Vendeur</span>
      <select
        value={current?.id ?? ''}
        onChange={(e) => {
          rememberSellerId(e.target.value);
          onChange(e.target.value);
        }}
      >
        <option value="" disabled>
          Choisir…
        </option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <style>{`
        .seller-picker {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--ink-soft);
        }
        .seller-picker select {
          font: inherit;
          font-weight: 600;
          color: var(--wood-dark);
          border: 1px solid var(--line);
          border-radius: var(--radius-md);
          padding: 6px 10px;
          background: var(--cream);
        }
      `}</style>
    </label>
  );
}
