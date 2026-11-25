import type { Order } from '../types/order';
import { dishPhoto } from './dishPhotos';

// UI preview only: a sample order so the tracking screen can be reviewed without the API.
export const PREVIEW_ORDER_ID = 'SIG-PREVIEW-0001';

export function makePreviewOrder(venueName = 'Paramount Signature · CBD'): Order {
  const items = [
    { id: 'preview-1', foodId: 'preview-burger', name: 'Signature Beef Burger', image: dishPhoto('Signature Beef Burger') ?? '', basePrice: 9, size: 'Medium', sizePrice: 1.5, extras: [{ id: 'fries', name: 'French fries', price: 2 }], quantity: 1, unitPrice: 12.5, totalPrice: 12.5 },
    { id: 'preview-2', foodId: 'preview-wings', name: 'Chicken Wings', image: dishPhoto('Chicken Wings') ?? '', basePrice: 7, size: 'Small', sizePrice: 0, extras: [], quantity: 2, unitPrice: 7, totalPrice: 14 },
  ];
  const subtotal = items.reduce((total, item) => total + item.totalPrice, 0);
  return {
    orderType: 'delivery', id: PREVIEW_ORDER_ID, restaurantName: venueName, items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0), subtotal, deliveryFee: 2.5, total: subtotal + 2.5,
    address: { id: 'preview-home', label: 'Home', address: '12 Sample Road, Borrowdale, Harare' },
    paymentMethod: { id: 'cash', label: 'Cash on delivery', detail: 'Pay your driver when your order arrives.', icon: 'cash-outline' },
    status: 'preparing', estimatedMinutes: 25,
    driver: { id: 'preview-driver', code: 'DRV-07', name: 'Sample Driver', status: 'assigned' },
    createdAt: new Date().toISOString(),
  };
}
