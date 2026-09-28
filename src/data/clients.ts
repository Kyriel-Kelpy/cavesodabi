import { supabase } from './supabaseClient';

export type Client = { id: string; name: string; phone: string | null };

export async function searchClients(query: string): Promise<Client[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone')
    .ilike('name', `%${trimmed}%`)
    .order('name')
    .limit(8);
  if (error) throw error;
  return data ?? [];
}

/** Utilisé quand le vendeur tape un nom qui n'existe pas encore : création à la volée. */
export async function createClient(name: string, phone?: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({ name: name.trim(), phone: phone?.trim() || null })
    .select('id, name, phone')
    .single();
  if (error) throw error;
  return data;
}
