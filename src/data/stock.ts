import { supabase } from './supabaseClient';

export type MovementType = 'SALE' | 'BONUS' | 'ENTRY' | 'CORRECTION' | 'CANCELLATION';

export type StockMovement = {
  id: string;
  type: MovementType;
  deltaMl: number;
  note: string | null;
  createdAt: string;
  userName: string | null;
};

type Row = {
  id: string;
  type: MovementType;
  delta_ml: number;
  note: string | null;
  created_at: string;
  user: { name: string } | null;
};

export async function fetchStockMovements(limit = 150, type?: MovementType): Promise<StockMovement[]> {
  let query = supabase
    .from('stock_movements')
    .select('id, type, delta_ml, note, created_at, user:profiles(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    type: row.type,
    deltaMl: row.delta_ml,
    note: row.note,
    createdAt: row.created_at,
    userName: row.user?.name ?? null,
  }));
}
