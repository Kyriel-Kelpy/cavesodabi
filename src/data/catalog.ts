import { supabase } from './supabaseClient';
import type { Product } from '../domain/format';

export type Settings = {
  lowStockMl: number;
  criticalStockMl: number;
  timezone: string;
};

export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, volume_ml, price_fcfa, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    volumeMl: p.volume_ml,
    priceFcfa: p.price_fcfa,
    sortOrder: p.sort_order,
    isActive: p.is_active,
  }));
}

export async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('low_stock_ml, critical_stock_ml, timezone')
    .single();
  if (error) throw error;
  return {
    lowStockMl: data.low_stock_ml,
    criticalStockMl: data.critical_stock_ml,
    timezone: data.timezone,
  };
}

export async function fetchCurrentStockMl(): Promise<number> {
  const { data, error } = await supabase.from('current_stock').select('stock_ml').single();
  if (error) throw error;
  return data.stock_ml;
}

/** S'abonne aux mouvements de stock pour que tous les téléphones se mettent à jour ensemble. */
export function subscribeToStockChanges(onChange: () => void) {
  const channel = supabase
    .channel('stock-movements-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_movements' }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
