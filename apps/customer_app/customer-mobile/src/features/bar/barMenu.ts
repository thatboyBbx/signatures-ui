import { AssetRegistry, Image, Platform, type ImageSourcePropType } from 'react-native';
export type BarDrink = { id: string; name: string; category: string; note: string; image: ImageSourcePropType; cutout?: boolean; studio?: boolean; price: number };
export type BarServe = { id: string; label: string; detail: string; multiplier: number };

// UI-preview prices (USD), set from mid-range Harare bar & grill menus checked 22 Nov 2026
// (The Three Monkeys, Tiger's Milk, Casa Mia, Firepit, Hyatt Explorers Bar): local lagers $2–3,
// imported $3–5, ciders ~$3, cocktails $7–9. Bottles of spirits/wine are estimates. Confirm with the branch.
const previewPrices: Record<string, number> = {
  'black-label': 2.5, castle: 2.5, zambezi: 2.5, 'flying-fish': 3, stella: 4, corona: 4.5,
  hunters: 3, 'hunters-gold': 3, 'brutal-fruit': 3, jameson: 45, tanqueray: 38,
  merlot: 18, moscato: 16, 'old-fashioned': 8, mojito: 7, 'mint-cooler': 4,
};

/** Delivery-friendly serves per category. Six-packs carry a small saving. */
export function barServes(category: string): BarServe[] {
  if (category === 'Beers' || category === 'Ciders') return [
    { id: 'single', label: 'Single', detail: '1 bottle', multiplier: 1 },
    { id: 'six', label: 'Six-pack', detail: '6 bottles', multiplier: 5.5 },
  ];
  if (category === 'Bottles' || category === 'Wine') return [{ id: 'bottle', label: 'Bottle', detail: '750 ml', multiplier: 1 }];
  return [
    { id: 'regular', label: 'Regular', detail: 'Single serve', multiplier: 1 },
    { id: 'double', label: 'Double', detail: 'Two serves', multiplier: 1.8 },
  ];
}

/** Cart lines store image URIs, so resolve bundled drink photos to a URI per platform. */
export function barImageUri(source: ImageSourcePropType): string {
  if (source && typeof source === 'object' && !Array.isArray(source) && 'uri' in source) return source.uri ?? '';
  if (typeof source !== 'number') return '';
  if (Platform.OS === 'web') {
    const asset = AssetRegistry.getAssetByID(source);
    if (!asset) return '';
    const location = __DEV__ ? asset.httpServerLocation : asset.httpServerLocation.replace(/\.\.\//g, '_');
    return `${location}/${asset.name}.${asset.type}`;
  }
  return Image.resolveAssetSource(source)?.uri ?? '';
}
export const barCategories = ['All', 'Beers', 'Ciders', 'Bottles', 'Wine', 'Cocktails', 'Mocktails'] as const;
const drinks: Omit<BarDrink, 'price'>[] = [
  { id: 'black-label', name: 'Black Label', category: 'Beers', note: 'Carling lager', image: require('../../../assets/paramount/bar-products/black-label.png'), cutout: true },
  { id: 'castle', name: 'Castle Lager', category: 'Beers', note: 'Lager', image: require('../../../assets/paramount/bar-products/castle.png'), cutout: true },
  { id: 'zambezi', name: 'Zambezi', category: 'Beers', note: 'Zimbabwe’s own lager', image: require('../../../assets/paramount/bar-products/zambezi.png'), cutout: true },
  { id: 'flying-fish', name: 'Flying Fish', category: 'Beers', note: 'Flavoured beer', image: require('../../../assets/paramount/bar-products/flying-fish.png'), cutout: true },
  { id: 'stella', name: 'Stella Artois', category: 'Beers', note: 'Belgian lager', image: require('../../../assets/paramount/bar-products/stella-photo.jpg') },
  { id: 'corona', name: 'Corona Extra', category: 'Beers', note: 'Lager', image: require('../../../assets/paramount/bar-products/corona-extra.jpg') },
  { id: 'hunters', name: 'Hunter’s Dry', category: 'Ciders', note: 'Dry apple cider', image: require('../../../assets/paramount/bar-products/hunters.png'), cutout: true },
  { id: 'hunters-gold', name: 'Hunter’s Gold', category: 'Ciders', note: 'Apple cider', image: require('../../../assets/paramount/bar-products/hunters-gold.png'), cutout: true },
  { id: 'brutal-fruit', name: 'Brutal Fruit', category: 'Ciders', note: 'Ruby apple spritzer', image: require('../../../assets/paramount/bar-products/brutal-fruit-ruby-apple.webp') },
  { id: 'jameson', name: 'Jameson', category: 'Bottles', note: 'Irish whiskey', image: require('../../../assets/paramount/bar-products/jameson-black-barrel.png'), studio: true },
  { id: 'tanqueray', name: 'Tanqueray', category: 'Bottles', note: 'London dry gin', image: require('../../../assets/paramount/bar-products/tanquery-gin.jpg'), studio: true },
  { id: 'merlot', name: 'Du Toitskloof', category: 'Wine', note: 'Merlot · red', image: require('../../../assets/paramount/bar-products/du-toitskloof-merlot.webp') },
  { id: 'moscato', name: 'Du Toitskloof', category: 'Wine', note: 'Moscato · white', image: require('../../../assets/paramount/bar-products/du-toitskloof-moscato.webp') },
  { id: 'old-fashioned', name: 'Old Fashioned', category: 'Cocktails', note: 'Whisky · bitters · orange', image: require('../../../assets/paramount/bar-drinks.jpg') },
  { id: 'mojito', name: 'Mojito', category: 'Cocktails', note: 'Rum · lime · mint', image: require('../../../assets/paramount/bar-products/mint-lime.jpg') },
  { id: 'mint-cooler', name: 'Mint & Lime', category: 'Mocktails', note: 'Mint · lime · soda', image: require('../../../assets/paramount/bar-products/mint-lime.jpg') },
];
export const barMenu: BarDrink[] = drinks.map(drink => ({ ...drink, price: previewPrices[drink.id] ?? 0 }));
