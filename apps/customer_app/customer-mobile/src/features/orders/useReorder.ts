import { useMenu } from '../../context/MenuContext';
import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { barImageUri, barMenu, barServes } from '../bar/barMenu';
import { sizePrices } from '../food/screens/FoodDetailsScreen';
import { haptic } from '../../components/haptics';
import type { Order } from '../../types/order';
import { mealDeals } from '../../sample-data/mealDeals';

const same = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

/**
 * Refills the tray from a past order using today's menu and prices.
 * Items that are no longer on the menu are skipped and reported back.
 */
export function useReorder() {
  const { menu, preview } = useMenu();
  const { addItem } = useCart();
  const { venue } = useCheckout();
  return (order: Order) => {
    const missing: string[] = [];
    let added = 0;
    for (const item of order.items) {
      const drink = barMenu.find(entry => same(entry.name, item.name));
      if (item.foodId.startsWith('bar-') && drink) {
        const serve = barServes(drink.category).find(option => same(option.label, item.size)) ?? barServes(drink.category)[0];
        const unitPrice = Math.round(drink.price * serve.multiplier * 100) / 100;
        addItem({ id: `bar-${drink.id}-${serve.id}`, foodId: `bar-${drink.id}`, name: drink.name, image: barImageUri(drink.image),
          basePrice: drink.price, size: serve.label, sizePrice: unitPrice - drink.price, extras: [], quantity: item.quantity, unitPrice, totalPrice: unitPrice * item.quantity });
        added += item.quantity;
        continue;
      }
      const deal = item.foodId.startsWith('deal-') ? mealDeals.find(entry => entry.id === item.foodId) : undefined;
      if (deal) {
        addItem({ ...item, image: deal.image, basePrice: deal.price, unitPrice: deal.price, totalPrice: deal.price * item.quantity });
        added += item.quantity;
        continue;
      }
      const entry = menu.find(candidate => same(candidate.name, item.name) && candidate.available !== false);
      if (!entry) { missing.push(item.name); continue; }
      const base = Number(entry.price.replace('$', ''));
      const variant = entry.variants.find(option => same(option.label, item.size));
      const sizePrice = variant ? variant.price - base : preview ? sizePrices[item.size] ?? 0 : 0;
      const extrasTotal = preview ? item.extras.reduce((total, extra) => total + extra.price, 0) : 0;
      const unitPrice = base + sizePrice + extrasTotal;
      addItem({
        id: preview ? `${entry.name}-${item.size || 'Small'}-${item.extras.map(extra => extra.id).sort().join('-')}${item.removed?.length ? `-no-${item.removed.slice().sort().join('-')}` : ''}` : `${entry.id}:${variant?.id ?? ''}`,
        foodId: entry.id, menuItemId: preview ? undefined : entry.id, variantId: variant?.id, branchCode: preview ? undefined : venue?.code,
        name: entry.name, image: entry.image, basePrice: base, size: item.size || (variant?.label ?? 'Regular'), sizePrice,
        extras: preview ? item.extras : [], removed: preview ? item.removed : undefined, quantity: item.quantity, unitPrice, totalPrice: unitPrice * item.quantity,
      });
      added += item.quantity;
    }
    if (added) haptic('success');
    return { added, missing };
  };
}
