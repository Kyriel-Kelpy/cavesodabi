// Règles pures, sans effet de bord : conversions, formatage, seuils.
// Rien ici ne parle au réseau — c'est ce qui rend ce fichier facile à tester.

export type Product = {
  id: string;
  name: string;
  volumeMl: number;
  priceFcfa: number;
  sortOrder: number;
  isActive: boolean;
};

export type StockLevel = 'normal' | 'low' | 'critical';

/** 1 L = 1000 ml. On affiche toujours à partir des ml (jamais l'inverse). */
export function mlToLiters(ml: number): number {
  return ml / 1000;
}

/** Affichage court : « 21 L », « 8,625 L ». Toujours en français (virgule). */
export function formatLiters(ml: number): string {
  const liters = mlToLiters(ml);
  const rounded = Math.round(liters * 1000) / 1000;
  return `${rounded.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} L`;
}

/** Affichage monétaire : « 1 500 F ». Pas de décimales, le FCFA n'en a pas. */
export function formatFcfa(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} F`;
}

export function stockLevel(
  stockMl: number,
  thresholds: { lowStockMl: number; criticalStockMl: number },
): StockLevel {
  if (stockMl < thresholds.criticalStockMl) return 'critical';
  if (stockMl < thresholds.lowStockMl) return 'low';
  return 'normal';
}

/** Total d'une vente simple (avant tout paiement partiel). */
export function saleTotals(product: Product, quantity: number) {
  return {
    totalFcfa: quantity * product.priceFcfa,
    volumeMl: quantity * product.volumeMl,
  };
}

/** Reste à payer : jamais négatif à l'affichage, même si une donnée est incohérente. */
export function remainingFcfa(totalFcfa: number, paidFcfa: number): number {
  return Math.max(totalFcfa - paidFcfa, 0);
}

const DAY_NAMES_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/** Heure courte pour l'historique : « 14:32 ». */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Regroupement de l'historique par jour, avec un intitulé lisible. */
export function formatDayHeading(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return "Aujourd'hui";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return `${DAY_NAMES_SHORT[d.getDay()]} ${d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'long' })}`;
}
