import { supabase } from './supabaseClient';

export type SaleHistoryItem = {
  id: string;
  createdAt: string;
  productName: string;
  quantity: number;
  totalFcfa: number;
  volumeMl: number;
  status: 'ACTIVE' | 'CANCELLED';
  cancelReason: string | null;
  clientId: string | null;
  clientName: string | null;
  sellerName: string | null;
  bonusProductName: string | null;
  bonusQuantity: number;
  paidFcfa: number;
  balanceFcfa: number;
};

type Row = {
  id: string;
  created_at: string;
  quantity: number;
  total_fcfa: number;
  volume_ml: number;
  status: 'ACTIVE' | 'CANCELLED';
  cancel_reason: string | null;
  bonus_quantity: number;
  product: { name: string } | null;
  bonus_product: { name: string } | null;
  client: { id: string; name: string } | null;
  seller: { name: string } | null;
  payments: { amount_fcfa: number }[] | null;
};

/** Historique le plus récent d'abord, ventes annulées incluses (affichées barrées côté écran). */
export async function fetchSalesHistory(limit = 100): Promise<SaleHistoryItem[]> {
  const { data, error } = await supabase
    .from('sales')
    .select(
      `id, created_at, quantity, total_fcfa, volume_ml, status, cancel_reason, bonus_quantity,
       product:products!sales_product_id_fkey(name),
       bonus_product:products!sales_bonus_product_id_fkey(name),
       client:clients(id, name),
       seller:profiles!sales_seller_id_fkey(name),
       payments(amount_fcfa)`,
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const paidFcfa = (row.payments ?? []).reduce((sum, p) => sum + p.amount_fcfa, 0);
    return {
      id: row.id,
      createdAt: row.created_at,
      productName: row.product?.name ?? '?',
      quantity: row.quantity,
      totalFcfa: row.total_fcfa,
      volumeMl: row.volume_ml,
      status: row.status,
      cancelReason: row.cancel_reason,
      clientId: row.client?.id ?? null,
      clientName: row.client?.name ?? null,
      sellerName: row.seller?.name ?? null,
      bonusProductName: row.bonus_product?.name ?? null,
      bonusQuantity: row.bonus_quantity,
      paidFcfa,
      balanceFcfa: row.status === 'ACTIVE' ? Math.max(row.total_fcfa - paidFcfa, 0) : 0,
    };
  });
}
