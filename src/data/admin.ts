import { supabase } from './supabaseClient';
import type { Product } from '../domain/format';

export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, volume_ml, price_fcfa, sort_order, is_active, price_label, alt_price_fcfa, alt_price_label')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    volumeMl: p.volume_ml,
    priceFcfa: p.price_fcfa,
    sortOrder: p.sort_order,
    isActive: p.is_active,
    priceLabel: p.price_label,
    altPriceFcfa: p.alt_price_fcfa,
    altPriceLabel: p.alt_price_label,
  }));
}

export async function updateProductPrice(productId: string, priceFcfa: number): Promise<void> {
  const { error } = await supabase.from('products').update({ price_fcfa: priceFcfa }).eq('id', productId);
  if (error) throw error;
}

/** Uniquement pour les produits qui ont déjà un prix alternatif configuré (Demi, Litre). */
export async function updateProductAltPrice(productId: string, altPriceFcfa: number): Promise<void> {
  const { error } = await supabase.from('products').update({ alt_price_fcfa: altPriceFcfa }).eq('id', productId);
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

export async function updatePurchaseCostPerLiter(costFcfa: number): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({ purchase_cost_per_liter_fcfa: costFcfa })
    .eq('id', true);
  if (error) throw error;
}
