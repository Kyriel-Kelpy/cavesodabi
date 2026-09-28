import { supabase } from './supabaseClient';

export type Profile = { id: string; name: string; role: 'ADMIN' | 'VENDEUR' };

export async function fetchActiveProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

const CURRENT_SELLER_KEY = 'cave-de-pepe:seller-id';

/** V1 sans connexion : on retient juste "qui est ce téléphone" en local. */
export function getRememberedSellerId(): string | null {
  return window.localStorage.getItem(CURRENT_SELLER_KEY);
}

export function rememberSellerId(id: string) {
  window.localStorage.setItem(CURRENT_SELLER_KEY, id);
}
