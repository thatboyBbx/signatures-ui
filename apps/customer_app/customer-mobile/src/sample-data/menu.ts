import { dishPhoto } from './dishPhotos';
// Borrowdale menu transcription for UI preview only.
// Source checked 2026-11-22: https://menus.co.zw/restaurants/harare/signatures-restaurant/signatures-restaurant
// Prices and availability must be confirmed by the branch before live ordering is enabled.
type SourceDish = readonly [name: string, price: number, description?: string];
const previewImages: Record<string, string> = {
  'Traditional Menu': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80', Starches: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80', Breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80', 'Sandwich/Wraps': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80', Burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80', Starters: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=80', 'Signature Style Mains': 'https://images.unsplash.com/photo-1546241072-48010ad2862c?auto=format&fit=crop&w=900&q=80', Salads: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80', Pizza: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80', Dessert: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80', Pasta: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=900&q=80',
};
const menuSections: ReadonlyArray<readonly [category: string, dishes: readonly SourceDish[]]> = [
  ['Traditional Menu', [['Maguru', 5, 'Slow-cooked cow tripe with onions and tomatoes.'], ['Tsuro', 9, 'Rabbit prepared as a traditional meat dish.'], ['Hanga', 9, 'Guinea fowl served as a stew.'], ['Road Runner', 7, 'Indigenous free-range chicken in a tomato and onion stew.'], ['Oxtail — Muswe', 11], ['Mabhonzo', 7, 'Beef or pork deboned bones slow-cooked into a stew.'], ['Beef Highfields', 9, 'Beef with tomatoes, onions and leafy greens.'], ['Knuckle Bones', 9], ['Fish — Tilapia', 6, 'Grilled or stewed tilapia.'], ['Beefstew', 8], ['Madora — Mopane Worms', 5], ['Chimukuyu — Biltong', 10, 'Dried, cured beef or game.'], ['Zvinyenze', 9, 'Goat intestines and tripe slow-cooked with tomatoes and onions.']]],
  ['Starches', [['Rice Dovi', 3], ['Mhunga', 2], ['Zviyo', 2], ['White Sadza', 1]]],
  ['Breakfast', [['Sig Fully Loaded Breakfast', 10, '2 eggs, potato home fries, beans, bacon, sausages, tomatoes and mushrooms.'], ['Farm House', 12, '2 eggs, 125g fillet steak, beans, tomatoes and bacon.'], ['Health Bowl', 8, 'Muesli, fresh fruit, yoghurt and honey syrup.'], ['Avo Toast', 7, 'Poached egg, avocado, in-house mayo, pickled red onions, bacon and toast.'], ['Petite', 6, 'Egg, potato home fries, beans, bacon, tomatoes and toast.'], ['Eggs Florentine', 9, 'Poached eggs, wilted spinach, hollandaise and bacon on toast.'], ['Omelette', 4]]],
  ['Sandwich/Wraps', [['Chicken Mayo', 10, 'Shredded chicken, onions, lettuce and pickled cucumber.'], ['Ham & Cheese', 10], ['Cheese & Tomato Toast', 5], ['Chicken Avo Wrap', 12, 'Chicken breast, avocado, in-house mayo, greens, tomatoes and cheese.']]],
  ['Burgers', [['Signature Beef Burger', 9, 'Beef patty, in-house mayo, greens, tomatoes and cheese.'], ['Combo', 15, 'Double beef patties, in-house mayo, greens, tomatoes and cheese.'], ['Chicken Burger', 9, 'Chicken breast, in-house mayo, greens, tomatoes and cheese.']]],
  ['Starters', [['Chicken Wings', 7], ['Beef / Chicken Samoosas', 4]]],
  ['Signature Style Mains', [['Stirfries', 10, 'Beef, chicken or pork.'], ['Rump Steak 250g', 12], ['Ribeye Steak 350g', 15], ['Sirloin Steak 350g', 15], ['Tomahawk Steak 500g', 18], ['T-Bone Steak 350g', 16], ['Sizzling Plate', 15, 'Beef, pork or chicken.'], ['Chicken Schnitzel', 13, 'Crumbed chicken breast with mushroom sauce and mozzarella.'], ['Prawns', 15], ['Sea Food Bowl', 25, '120g shrimps, 8 calamari, 9 prawns, sweet corn and potatoes.'], ['Pork Ribs 500g', 20], ['Pork Ribs 1kg', 35]]],
  ['Salads', [['Mediterranean — Greek Salad', 10, 'Cucumber, tomatoes, red onion, Kalamata olives and cheese.'], ['Caesar Salad', 13, 'Lettuce, croutons, eggs, anchovies, garlic and Parmesan.']]],
  ['Pizza', [['BBQ Chicken', 10, 'BBQ sauce, chicken breast and mozzarella.'], ['Chicken And Mushroom', 12, 'Mozzarella, mushrooms and chicken.'], ['Margarita', 8, 'Red tomato sauce, mozzarella and green basil.'], ['Meat Deluxe', 15, 'Savoury meats, mozzarella, pizza sauce and bacon.'], ['Hawaiian', 12, 'Mozzarella, diced ham, pineapple and bacon.']]],
  ['Dessert', [['Panna Cotta', 5], ['Fruit Salad', 5]]],
  ['Pasta', [['Pesto Chicken', 12, 'Chicken breast, basil pesto, garlic, Parmesan and tomatoes.'], ['Chicken Alfredo', 15, 'Grilled chicken breast, Parmesan, béchamel sauce and mushroom.'], ['Carbonara', 15, 'Mushroom, bacon, Parmesan and béchamel sauce.']]],
];
export const sampleMenu = menuSections.flatMap(([category, dishes]) => dishes.map(([name, price, description], index) => ({
  id: `${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`, category, restaurant: 'Signatures Borrowdale', time: '20–35 min', name,
  description: description ?? `A Signatures Borrowdale ${category.toLowerCase()} selection.`, price: `$${price.toFixed(2)}`, rating: '',
  // Per-dish photo where one exists; category photo otherwise. See dishPhotos.ts.
  image: dishPhoto(name) ?? previewImages[category],
})));

