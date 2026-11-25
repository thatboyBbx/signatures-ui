// Features built against local mocks (see services/mockApi.ts and sample-data/dishDetails.ts).
// Each is on in the UI preview only. Turn a flag on for live once the backend piece next to it exists.
const preview = process.env.EXPO_PUBLIC_UI_PREVIEW === '1';

export const mockFeatures = {
  /** Add/remove ingredients. Needs modifiers on GET /branches/:code/menu and on order items. */
  customise: preview,
  /** Promo code row in the cart. Needs POST /promo-codes/validate and promo_code on POST /orders. Only if the restaurant runs codes. */
  promoCodes: preview,
  /** Meal-deal card on Home. Needs the branch to confirm the deal and its price. */
  mealDeals: preview,
  /** Rate after delivery. Needs POST /orders/:id/rating and rating averages on the menu. */
  ratings: preview,
};
