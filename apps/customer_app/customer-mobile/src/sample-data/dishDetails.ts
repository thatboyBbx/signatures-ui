// Short ingredient lines and customisation options (mock).
// Lines are shortened from the Borrowdale menu descriptions; the branch should check them.
// Add/remove options and their prices are placeholders until the API carries modifiers.
import type { CartExtra } from '../types/cart';

const lines: Record<string, string> = {
  'Maguru': 'Tripe · onion · tomato', 'Tsuro': 'Rabbit · traditional stew', 'Hanga': 'Guinea fowl · stew',
  'Road Runner': 'Free-range chicken · tomato · onion', 'Mabhonzo': 'Beef or pork bones · slow-cooked',
  'Beef Highfields': 'Beef · tomato · leafy greens', 'Fish — Tilapia': 'Tilapia · grilled or stewed',
  'Chimukuyu — Biltong': 'Dried cured beef or game', 'Zvinyenze': 'Goat tripe · tomato · onion',
  'Sig Fully Loaded Breakfast': 'Eggs · bacon · sausage · beans', 'Farm House': 'Fillet steak · eggs · bacon',
  'Health Bowl': 'Muesli · fruit · yoghurt', 'Avo Toast': 'Poached egg · avocado · bacon', 'Petite': 'Egg · bacon · home fries',
  'Eggs Florentine': 'Poached eggs · spinach · hollandaise', 'Chicken Mayo': 'Chicken · onion · pickled cucumber',
  'Chicken Avo Wrap': 'Chicken · avocado · house mayo', 'Signature Beef Burger': 'Beef · cheese · house mayo',
  'Combo': 'Double beef · cheese · house mayo', 'Chicken Burger': 'Chicken breast · cheese · house mayo',
  'Stirfries': 'Beef, chicken or pork', 'Sizzling Plate': 'Beef, pork or chicken',
  'Chicken Schnitzel': 'Crumbed chicken · mushroom sauce · mozzarella', 'Sea Food Bowl': 'Shrimp · calamari · prawns',
  'Mediterranean — Greek Salad': 'Cucumber · olives · cheese', 'Caesar Salad': 'Lettuce · anchovy · parmesan',
  'BBQ Chicken': 'BBQ sauce · chicken · mozzarella', 'Chicken And Mushroom': 'Chicken · mushroom · mozzarella',
  'Margarita': 'Tomato · mozzarella · basil', 'Meat Deluxe': 'Savoury meats · bacon · mozzarella', 'Hawaiian': 'Ham · pineapple · bacon',
  'Pesto Chicken': 'Chicken · basil pesto · parmesan', 'Chicken Alfredo': 'Chicken · parmesan · mushroom', 'Carbonara': 'Bacon · mushroom · parmesan',
};

const placeholder = /^A Signatures .* selection\.$/;

/** Split a menu description into its ingredients ("Beef patty, in-house mayo and cheese." → [...]). */
function ingredients(description?: string) {
  if (!description || placeholder.test(description)) return [];
  return description.replace(/\.$/, '').split(/,\s*|\s+and\s+/i)
    .map(part => part.replace(/^\d+\s*(g|kg)?\s+/i, '').replace(/in-house/i, 'house').trim().toLocaleLowerCase())
    .filter(Boolean);
}

/** "Beef · cheese · house mayo" — shown in small caps under the dish name. Empty when the menu has nothing to go on. */
export function ingredientLine(name: string, description?: string) {
  if (lines[name]) return lines[name];
  const parts = ingredients(description).slice(0, 3);
  if (!parts.length) return '';
  const line = parts.join(' · ');
  return line.charAt(0).toUpperCase() + line.slice(1);
}

const addOns: Record<string, CartExtra[]> = {
  Burgers: [{ id: 'add-cheese', name: 'Extra cheese', price: 1 }, { id: 'add-bacon', name: 'Bacon', price: 1.5 }, { id: 'add-egg', name: 'Fried egg', price: 1 }, { id: 'add-patty', name: 'Extra patty', price: 3 }],
  'Sandwich/Wraps': [{ id: 'add-cheese', name: 'Extra cheese', price: 1 }, { id: 'add-avo', name: 'Avocado', price: 1.5 }, { id: 'add-bacon', name: 'Bacon', price: 1.5 }],
  Pizza: [{ id: 'add-mozzarella', name: 'Extra mozzarella', price: 1.5 }, { id: 'add-bacon', name: 'Bacon', price: 1.5 }, { id: 'add-mushroom', name: 'Mushrooms', price: 1 }],
  Pasta: [{ id: 'add-parmesan', name: 'Extra parmesan', price: 1 }, { id: 'add-chicken', name: 'Extra chicken', price: 2.5 }],
  Salads: [{ id: 'add-chicken', name: 'Grilled chicken', price: 2.5 }, { id: 'add-avo', name: 'Avocado', price: 1.5 }],
  Breakfast: [{ id: 'add-egg', name: 'Extra egg', price: 1 }, { id: 'add-bacon', name: 'Extra bacon', price: 1.5 }],
  'Signature Style Mains': [{ id: 'add-mushroom-sauce', name: 'Mushroom sauce', price: 1.5 }, { id: 'add-pepper-sauce', name: 'Pepper sauce', price: 1.5 }],
};
const removable = new Set(['Burgers', 'Sandwich/Wraps', 'Salads', 'Breakfast']);

/** What the customer can leave out ("No onions") or add ("Extra cheese +$1"). */
export function dishOptions(name: string, category: string, description?: string): { remove: string[]; add: CartExtra[] } {
  // The first ingredient is the dish itself (the patty, the chicken), so it can't be left out.
  const remove = removable.has(category) ? ingredients(description).slice(1).filter(part => part.split(' ').length <= 3) : [];
  return { remove: [...new Set(remove)], add: addOns[category] ?? [] };
}
