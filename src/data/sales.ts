import { supabase } from './supabaseClient';

// Ces fonctions n'écrivent jamais directement dans sales / payments / stock_movements :
// elles appellent les fonctions serveur (RPC) qui portent les règles métier et les
// vérifications (client obligatoire en cas de crédit, trop-perçu interdit, etc.).
// Le frontend affiche les erreurs, il ne les prévient pas à l'avance.

export type SaleErrorCode =
  | 'INVALID_QUANTITY'
  | 'PRODUCT_NOT_FOUND'
  | 'INVALID_BONUS'
  | 'SELLER_NOT_FOUND'
  | 'CLIENT_NOT_FOUND'
  | 'INVALID_PAYMENT'
  | 'CLIENT_REQUIRED'
  | 'SALE_NOT_FOUND'
  | 'SALE_CANCELLED'
  | 'ALREADY_SETTLED'
  | 'OVERPAYMENT'
  | 'ALREADY_CANCELLED'
  | 'INVALID_AMOUNT'
  | 'INVALID_STOCK'
  | 'NO_DIFFERENCE'
  | 'INVALID_PERIOD'
  | 'NO_ALT_PRICE'
  | 'UNKNOWN';

export class SaleError extends Error {
  code: SaleErrorCode;
  constructor(code: string) {
    super(code);
    this.code = (SALE_ERROR_CODES as readonly string[]).includes(code)
      ? (code as SaleErrorCode)
      : 'UNKNOWN';
  }
}

const SALE_ERROR_CODES = [
  'INVALID_QUANTITY', 'PRODUCT_NOT_FOUND', 'INVALID_BONUS', 'SELLER_NOT_FOUND',
  'CLIENT_NOT_FOUND', 'INVALID_PAYMENT', 'CLIENT_REQUIRED', 'SALE_NOT_FOUND',
  'SALE_CANCELLED', 'ALREADY_SETTLED', 'OVERPAYMENT', 'ALREADY_CANCELLED',
  'INVALID_AMOUNT', 'INVALID_STOCK', 'NO_DIFFERENCE', 'INVALID_PERIOD', 'NO_ALT_PRICE',
] as const;

/** Traduit un code d'erreur serveur en phrase compréhensible par le vendeur. */
export function describeSaleError(code: SaleErrorCode): string {
  switch (code) {
    case 'CLIENT_REQUIRED':
      return "Il reste un montant à payer : choisis ou crée un client pour cette vente.";
    case 'INVALID_PAYMENT':
      return "Le montant reçu ne peut pas dépasser le total de la vente.";
    case 'OVERPAYMENT':
      return "Ce montant dépasse ce qu'il reste à payer.";
    case 'ALREADY_SETTLED':
      return "Cette vente est déjà entièrement payée.";
    case 'ALREADY_CANCELLED':
      return "Cette vente est déjà annulée.";
    case 'SALE_CANCELLED':
      return "Impossible : cette vente a été annulée.";
    case 'NO_DIFFERENCE':
      return "Le stock réel est déjà égal au stock théorique, rien à corriger.";
    case 'NO_ALT_PRICE':
      return "Ce produit n'a pas de second prix configuré.";
    case 'PRODUCT_NOT_FOUND':
    case 'CLIENT_NOT_FOUND':
    case 'SELLER_NOT_FOUND':
    case 'SALE_NOT_FOUND':
      return "Introuvable — l'écran a peut-être besoin d'être rafraîchi.";
    default:
      return "Une erreur est survenue, réessaie.";
  }
}

function rpcError(error: { message: string }): never {
  // Supabase place le message levé par `raise exception '<code>'` dans error.message.
  throw new SaleError(error.message);
}

export type CreateSaleInput = {
  productId: string;
  quantity: number;
  sellerId?: string | null;
  clientId?: string | null;
  /** Montant reçu ; omis = payé comptant en entier. */
  paidFcfa?: number | null;
  bonusProductId?: string | null;
  bonusQuantity?: number;
  /** true = applique le prix alternatif (Gros/Occasionnel) du produit, vérifié côté serveur. */
  useAltPrice?: boolean;
};

export async function createSale(input: CreateSaleInput) {
  const { data, error } = await supabase.rpc('create_sale', {
    p_product_id: input.productId,
    p_quantity: input.quantity,
    p_seller_id: input.sellerId ?? null,
    p_client_id: input.clientId ?? null,
    p_paid_fcfa: input.paidFcfa ?? null,
    p_bonus_product_id: input.bonusProductId ?? null,
    p_bonus_quantity: input.bonusQuantity ?? 0,
    p_use_alt_price: input.useAltPrice ?? false,
  });
  if (error) rpcError(error);
  return data as {
    sale_id: string;
    unit_price: number;
    total_fcfa: number;
    paid_fcfa: number;
    balance_fcfa: number;
    stock_ml: number;
  };
}

export async function addPayment(saleId: string, amountFcfa: number, receivedBy?: string | null, note?: string) {
  const { data, error } = await supabase.rpc('add_payment', {
    p_sale_id: saleId,
    p_amount_fcfa: amountFcfa,
    p_received_by: receivedBy ?? null,
    p_note: note ?? null,
  });
  if (error) rpcError(error);
  return data as { sale_id: string; paid_fcfa: number; balance_fcfa: number };
}

export async function cancelSale(saleId: string, userId?: string | null, reason?: string) {
  const { data, error } = await supabase.rpc('cancel_sale', {
    p_sale_id: saleId,
    p_user_id: userId ?? null,
    p_reason: reason ?? null,
  });
  if (error) rpcError(error);
  return data as { sale_id: string; stock_ml: number };
}

export async function addStockEntry(ml: number, userId?: string | null, note?: string) {
  const { data, error } = await supabase.rpc('add_stock_entry', {
    p_ml: ml,
    p_user_id: userId ?? null,
    p_note: note ?? null,
  });
  if (error) rpcError(error);
  return data as { stock_ml: number };
}

export async function correctStock(realMl: number, userId?: string | null, reason?: string) {
  const { data, error } = await supabase.rpc('correct_stock', {
    p_real_ml: realMl,
    p_user_id: userId ?? null,
    p_reason: reason ?? null,
  });
  if (error) rpcError(error);
  return data as { previous_ml: number; stock_ml: number; delta_ml: number };
}
