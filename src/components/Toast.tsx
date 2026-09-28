import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'warning' | 'error';
type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  show: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Une notification qui apparaît, puis disparaît seule — jamais de fenêtre bloquante. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId.current++;
    setItems((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast toast--${item.kind}`}>
            {item.message}
          </div>
        ))}
      </div>
      <style>{`
        .toast-stack {
          position: fixed;
          left: 50%;
          bottom: calc(84px + var(--safe-bottom));
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 60;
          width: min(92vw, 380px);
          pointer-events: none;
        }
        .toast {
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--cream);
          background: var(--wood-dark);
          box-shadow: 0 6px 20px rgba(42, 27, 20, 0.28);
          text-align: center;
        }
        .toast--success { background: var(--leaf); }
        .toast--warning { background: var(--amber); color: var(--ink); }
        .toast--error   { background: var(--clay); }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé sous <ToastProvider>.');
  return ctx;
}
