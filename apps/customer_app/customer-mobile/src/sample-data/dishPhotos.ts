// Per-dish placeholder photography (Unsplash, free licence) until the restaurant supplies its own.
// To use your own photo, put it in `ownPhotos` (a bundled require or a hosted URL); it wins over the stock entry.
const stock: Record<string, string> = {
  'Maguru': '1787465195117-231e63fe1b47',
  'Tsuro': '1565280654386-36c3ea205191',
  'Hanga': '1542933692-c69b0dc73ab6',
  'Road Runner': '1764304733301-3a9f335f0c67',
  'Oxtail — Muswe': '1783684539282-cc34b91ed983',
  'Mabhonzo': '1708782344071-35ed44b849a9',
  'Beef Highfields': '1608500219063-e5164085cd6f',
  'Knuckle Bones': '1759392773285-0f86affdf1df',
  'Fish — Tilapia': '1765265432611-17d3f2da2d5d',
  'Beefstew': '1519699788450-ad34386a3bfc',
  'Madora — Mopane Worms': '1719240215949-1cb1fd37915b',
  'Chimukuyu — Biltong': '1652209695374-7a91c243f12f',
  'Zvinyenze': '1608500218987-0f2b3be34b47',
  'Rice Dovi': '1708782344490-9026aaa5eec7',
  // No stock photo of sadza exists; this maize-meal block is the closest match. Replace with real photos.
  'White Sadza': '1666181551815-b9adecb24e46',
  'Mhunga': '1666181551815-b9adecb24e46',
  'Zviyo': '1666181551815-b9adecb24e46',
  'Sig Fully Loaded Breakfast': '1525473233136-080cdd8b7cb2',
  'Farm House': '1676037150429-77d231b14c4e',
  'Health Bowl': '1692071106919-01bc0b9b0919',
  'Avo Toast': '1525351484163-7529414344d8',
  'Petite': '1541329351076-600b0f9fdf28',
  'Eggs Florentine': '1611338657930-6149655698e0',
  'Omelette': '1510693206972-df098062cb71',
  'Chicken Mayo': '1785960072741-a049c641f795',
  'Ham & Cheese': '1647505794572-0a6d945d664d',
  'Cheese & Tomato Toast': '1788603726260-a2ec12434158',
  'Chicken Avo Wrap': '1626700051175-6818013e1d4f',
  'Signature Beef Burger': '1568901346375-23c9450c58cd',
  'Combo': '1572802419224-296b0aeee0d9',
  'Chicken Burger': '1761515397046-44035db91504',
  'Chicken Wings': '1567620832903-9fc6debc209f',
  'Beef / Chicken Samoosas': '1601050690597-df0568f70950',
  'Stirfries': '1760504526069-ff0f8bf6e4ca',
  'Rump Steak 250g': '1588168333986-5078d3ae3976',
  'Ribeye Steak 350g': '1546964124-0cce460f38ef',
  'Sirloin Steak 350g': '1774806288349-3d910c6a9334',
  'Tomahawk Steak 500g': '1615937657715-bc7b4b7962c1',
  'T-Bone Steak 350g': '1598577789978-b87168a57b69',
  'Sizzling Plate': '1781332145904-997eeba2962c',
  'Chicken Schnitzel': '1682970078535-cd0cf994ee96',
  'Prawns': '1559742811-822873691df8',
  'Sea Food Bowl': '1765100479761-2359e22fbe16',
  'Pork Ribs 500g': '1787402574601-af49caa6cb63',
  'Pork Ribs 1kg': '1544025162-d76694265947',
  'Mediterranean — Greek Salad': '1778449532114-430396ada55b',
  'Caesar Salad': '1782839577893-da9383e55c96',
  'BBQ Chicken': '1565299624946-b28f40a0ae38',
  'Chicken And Mushroom': '1692737580563-7ba2d896f0f6',
  'Margarita': '1574071318508-1cdbab80d002',
  'Meat Deluxe': '1705286324371-d6a6d9519dc2',
  'Hawaiian': '1562835155-a7c2a225e97d',
  'Panna Cotta': '1787550275377-9f54a07c68c8',
  'Fruit Salad': '1760881592698-abbf44a47872',
  'Pesto Chicken': '1473093295043-cdd812d0e601',
  'Chicken Alfredo': '1645112411341-6c4fd023714a',
  'Carbonara': '1633337474564-1d9478ca4e2e',
};

/** Drop the restaurant's own dish photos here, keyed by dish name. */
export const ownPhotos: Record<string, string> = {};

export const unsplash = (id: string, width = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

/** Best available photo for a dish: own photo, then a per-dish stock photo, else undefined. */
export function dishPhoto(name: string): string | undefined {
  if (ownPhotos[name]) return ownPhotos[name];
  const id = stock[name];
  return id ? unsplash(id) : undefined;
}

export const stockDishPhotoIds = stock;
