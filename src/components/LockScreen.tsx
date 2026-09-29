import { useState, type ReactNode } from 'react';

// Le mot de passe n'est jamais écrit en clair ici : seule son empreinte (SHA-256) est comparée.
// ⚠️ Ce n'est PAS une vraie sécurité : n'importe qui inspectant le code du site peut la retrouver
// et la contourner. C'est juste une porte discrète pour empêcher un passant d'ouvrir l'appli.
// La vraie protection reste de ne pas mettre de données réelles avant l'étape 9 (connexion + RLS).
const PASSWORD_HASH = '4360c93aef8875ca50e534047de2698bb0dd77105614a8679f0b91f70e9dca2d';
const SESSION_KEY = 'cave-de-pepe:unlocked';

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isUnlocked(): boolean {
  return window.sessionStorage.getItem(SESSION_KEY) === '1';
}

export function lockApp() {
  window.sessionStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

export function LockScreen({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function tryUnlock() {
    if (!value || checking) return;
    setChecking(true);
    const hash = await sha256Hex(value);
    if (hash === PASSWORD_HASH) {
      window.sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
    } else {
      setError(true);
      setValue('');
    }
    setChecking(false);
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="lock-screen">
      <div className="lock-screen__card">
        <span className="lock-screen__mark" aria-hidden="true" />
        <h1>La Cave de Pépé</h1>
        <p>Entre le code d'accès pour continuer.</p>

        {/* Pas de <form> : on gère nous-mêmes la validation, pour éviter que le navigateur
            ne propose d'enregistrer ce champ comme un mot de passe de site. */}
        <input
          type="password"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          name="cave-de-pepe-code"
          placeholder="Code d'accès"
          value={value}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tryUnlock();
          }}
          className={error ? 'lock-screen__input--error' : ''}
        />
        {error && <p className="lock-screen__error">Code incorrect.</p>}

        <button type="button" onClick={tryUnlock} disabled={checking || !value}>
          {checking ? 'Vérification…' : 'Entrer'}
        </button>
      </div>

      <style>{`
        .lock-screen {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 24px; background: var(--wood-dark);
        }
        .lock-screen__card {
          width: 100%; max-width: 340px; background: var(--cream); border-radius: var(--radius-lg);
          padding: 28px 24px; display: flex; flex-direction: column; align-items: center; gap: 10px;
          text-align: center; box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        }
        .lock-screen__mark {
          width: 26px; height: 30px; border-radius: 3px 3px 8px 8px; background: var(--bordeaux);
          box-shadow: inset 0 -3px 0 rgba(0,0,0,0.15); margin-bottom: 4px;
        }
        .lock-screen__card h1 { font-size: 1.3rem; }
        .lock-screen__card p { margin: 0 0 8px; color: var(--ink-soft); font-size: 0.9rem; }
        .lock-screen__card input {
          width: 100%; font: inherit; font-size: 1.1rem; text-align: center; letter-spacing: 0.05em;
          padding: 12px; border: 1px solid var(--line); border-radius: var(--radius-md); background: #fff;
        }
        .lock-screen__input--error { border-color: var(--clay); }
        .lock-screen__error { color: var(--clay); font-size: 0.85rem; margin: 0; }
        .lock-screen__card button {
          width: 100%; padding: 12px; border-radius: var(--radius-md); border: none;
          background: var(--bordeaux); color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer;
          margin-top: 4px;
        }
        .lock-screen__card button:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}
