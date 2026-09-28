import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Erreur volontairement bruyante : mieux vaut planter tôt que vendre sans base connectée.
  throw new Error(
    'Configuration Supabase manquante. Copie .env.example vers .env et renseigne ' +
      'VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(url, anonKey, {
  realtime: { params: { eventsPerSecond: 5 } },
});
