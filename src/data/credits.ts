import { supabase } from './supabaseClient';

export type ClientCredit = {
  clientId: string;
  name: string;
  phone: string | null;
  balanceFcfa: number;
  unsettledSales: number;
};

/** Clients ayant un reste dû, du plus élevé au plus faible. */
export async function fetchClientCredits(): Promise<ClientCredit[]> {
  const { data, error } = await supabase
    .from('client_balances')
    .select('client_id, name, phone, balance_fcfa, unsettled_sales')
    .gt('balance_fcfa', 0)
    .order('balance_fcfa', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    clientId: r.client_id,
    name: r.name,
    phone: r.phone,
    balanceFcfa: r.balance_fcfa,
    unsettledSales: r.unsettled_sales,
  }));
}

export type ClientDueSale = {
  id: string;
  createdAt: string;
  productName: string;
  quantity: number;
  totalFcfa: number;
  paidFcfa: number;
  balanceFcfa: number;
};

type Row = {
  id: string;
  created_at: string;
  quantity: number;
  total_fcfa: number;
  product: { name: string } | null;
  payments: { amount_fcfa: number }[] | null;
};

/** Ventes non soldées d'un client, les plus anciennes en premier. */
export async function fetchClientDueSales(clientId: string): Promise<ClientDueSale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select(
      `id, created_at, quantity, total_fcfa,
       product:products!sales_product_id_fkey(name),
       payments(amount_fcfa)`,
    )
    .eq('client_id', clientId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as Row[])
    .map((row) => {
      const paidFcfa = (row.payments ?? []).reduce((sum, p) => sum + p.amount_fcfa, 0);
      return {
        id: row.id,
        createdAt: row.created_at,
        productName: row.product?.name ?? '?',
        quantity: row.quantity,
        totalFcfa: row.total_fcfa,
        paidFcfa,
        balanceFcfa: Math.max(row.total_fcfa - paidFcfa, 0),
      };
    })
    .filter((s) => s.balanceFcfa > 0);
}
