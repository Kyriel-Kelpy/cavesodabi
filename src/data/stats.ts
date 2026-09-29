import { supabase } from './supabaseClient';

export type StatsPeriod = 'today' | 'week' | 'month';

export type ProductStat = {
  productId: string;
  name: string;
  quantity: number;
  volumeMl: number;
  bonusQuantity: number;
};

export type PeriodStats = {
  period: StatsPeriod;
  revenueFcfa: number;
  soldMl: number;
  salesCount: number;
  bonusMl: number;
  profitFcfa: number;
  toCollectFcfa: number;
  outstandingTotalFcfa: number;
  byProduct: ProductStat[];
};

type RawStats = {
  period: StatsPeriod;
  revenue_fcfa: number;
  sold_ml: number;
  sales_count: number;
  bonus_ml: number;
  profit_fcfa: number;
  to_collect_fcfa: number;
  outstanding_total_fcfa: number;
  by_product: {
    product_id: string;
    name: string;
    quantity: number;
    volume_ml: number;
    bonus_quantity: number;
  }[];
};

export async function fetchPeriodStats(period: StatsPeriod): Promise<PeriodStats> {
  const { data, error } = await supabase.rpc('period_stats', { p_period: period });
  if (error) throw error;
  const raw = data as RawStats;
  return {
    period: raw.period,
    revenueFcfa: raw.revenue_fcfa,
    soldMl: raw.sold_ml,
    salesCount: raw.sales_count,
    bonusMl: raw.bonus_ml,
    profitFcfa: raw.profit_fcfa,
    toCollectFcfa: raw.to_collect_fcfa,
    outstandingTotalFcfa: raw.outstanding_total_fcfa,
    byProduct: (raw.by_product ?? []).map((p) => ({
      productId: p.product_id,
      name: p.name,
      quantity: p.quantity,
      volumeMl: p.volume_ml,
      bonusQuantity: p.bonus_quantity,
    })),
  };
}
