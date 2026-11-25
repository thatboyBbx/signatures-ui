// Mock endpoints for features the API doesn't have yet. Shapes are what the UI expects back,
// so the real calls can replace these one for one.
const wait = (ms = 450) => new Promise(resolve => setTimeout(resolve, ms));

export type Promo = { code: string; label: string; percent?: number; amount?: number; minimum?: number };

// Placeholder codes for the preview only. Replace with the restaurant's real codes, if it runs any.
const promoCodes: Promo[] = [
  { code: 'SIGNATURE10', label: '10% off', percent: 10 },
  { code: 'WELCOME5', label: '$5 off orders over $25', amount: 5, minimum: 25 },
];

export function promoDiscount(promo: Promo | null, subtotal: number) {
  if (!promo || subtotal <= 0) return 0;
  if (promo.minimum && subtotal < promo.minimum) return 0;
  const value = promo.percent ? subtotal * promo.percent / 100 : promo.amount ?? 0;
  return Math.min(subtotal, Math.round(value * 100) / 100);
}

/** POST /promo-codes/validate (mock). */
export async function validatePromo(code: string, subtotal: number): Promise<{ ok: true; promo: Promo } | { ok: false; message: string }> {
  await wait();
  const promo = promoCodes.find(entry => entry.code === code.trim().toUpperCase());
  if (!promo) return { ok: false, message: 'That code isn’t valid.' };
  if (promo.minimum && subtotal < promo.minimum) return { ok: false, message: `Spend $${promo.minimum.toFixed(2)} or more to use this code.` };
  return { ok: true, promo };
}

/** POST /orders/:id/rating (mock). */
export async function sendRating(_input: { orderId: string; score: number; note?: string }) { await wait(250); return { ok: true }; }

