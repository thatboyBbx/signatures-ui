import { dishPhoto } from './dishPhotos';
import type { CartExtra } from '../types/cart';

export type MealDeal = { id: string; dish: string; title: string; items: CartExtra[]; price: number; regular: number; image: string; confirmedByBranch: boolean };

// Mock: built on the Combo burger the branch already sells. Price and saving are placeholders;
// the card only goes live once the branch confirms the deal (confirmedByBranch).
export const mealDeals: MealDeal[] = [{
  id: 'deal-combo', dish: 'Combo', title: 'Combo + fries + drink',
  items: [{ id: 'deal-fries', name: 'French fries', price: 0 }, { id: 'deal-drink', name: 'Soft drink', price: 0 }],
  price: 16, regular: 18, image: dishPhoto('Combo') ?? '', confirmedByBranch: false,
}];
