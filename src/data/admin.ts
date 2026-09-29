import { supabase } from './supabaseClient';
import type { Product } from '../domain/format';

export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, volume_ml, price_fcfa, sort_order, is_active')
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

export async function updateProductPrice(productId: string, priceFcfa: number): Promise<void> {
  const { error } = await supabase.from('products').update({ price_fcfa: priceFcfa }).eq('id', productId);
  if (error) throw error;
}

export type StockThresholds = { lowStockMl: number; criticalStockMl: number };

export async function updateStockThresholds(thresholds: StockThresholds): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({ low_stock_ml: thresholds.lowStockMl, critical_stock_ml: thresholds.criticalStockMl })
    .eq('id', true);
  if (error) throw error;
}
