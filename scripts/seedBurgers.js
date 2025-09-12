// Seeds Burgers top-level category and a Chicken Burger item
// Usage: node scripts/seedBurgers.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Burgers → project:', app.options.projectId);

  // Top-level category row (similar to Gozleme/Pide)
  const category = { id: 'burgers', name: 'Burgers', groupId: 'burgers', groupName: 'Burgers', displayOrder: 220, active: true };
  await setDoc(doc(db, 'stores', STORE_ID, 'categories', category.id), {
    name: category.name,
    groupId: category.groupId,
    groupName: category.groupName,
    displayOrder: category.displayOrder,
    active: category.active,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  const PRICE = 12.0;

  // Default selections requested: Lettuce, cheese, Mayo
  const defaultSelections = {
    salads: ['lettuce'],
    sauces: ['mayo'],
    add_ons: ['cheese'],
  };

  const item = {
    id: 'chicken_burger',
    name: 'Chicken Burger',
    categoryId: 'burgers',
    imageUrl: 'https://picsum.photos/600/600?random=501',
    basePrice: PRICE,
    displayOrder: 10,
    active: true,
    // Customizable and combo available → include appropriate modifier groups
    customizable: true,
    modifierGroupIds: ['salads', 'sauces', 'add_ons', 'sides', 'drinks', 'combo'],
    defaultSelections,
    // Block Tabouli and Hot Chips for Burgers (salads group)
    hiddenOptions: { salads: ['tabouli', 'hot_chips'] },
  };

  await setDoc(doc(db, 'stores', STORE_ID, 'items', item.id), {
    categoryId: item.categoryId,
    name: item.name,
    imageUrl: item.imageUrl,
    basePrice: item.basePrice,
    active: item.active,
    displayOrder: item.displayOrder,
    customizable: item.customizable,
    modifierGroupIds: item.modifierGroupIds,
    defaultSelections: item.defaultSelections,
    hiddenOptions: item.hiddenOptions,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Beef Burger — includes item-specific beetroot option in salads
  const beefDefaults = {
    salads: ['lettuce', 'tomato', 'onion', 'beetroot'],
    sauces: ['bbq'],
  };
  const beef = {
    id: 'beef_burger',
    name: 'Beef Burger',
    categoryId: 'burgers',
    imageUrl: 'https://picsum.photos/600/600?random=502',
    basePrice: PRICE,
    displayOrder: 20,
    active: true,
    customizable: true,
    modifierGroupIds: ['salads', 'sauces', 'add_ons', 'sides', 'drinks', 'combo'],
    defaultSelections: beefDefaults,
    hiddenOptions: { salads: ['tabouli', 'hot_chips'] },
    extraOptions: {
      salads: [
        { id: 'beetroot', name: 'Beetroot', priceDelta: 0, defaultSelected: true },
      ],
    },
  };

  await setDoc(doc(db, 'stores', STORE_ID, 'items', beef.id), {
    categoryId: beef.categoryId,
    name: beef.name,
    imageUrl: beef.imageUrl,
    basePrice: beef.basePrice,
    active: beef.active,
    displayOrder: beef.displayOrder,
    customizable: beef.customizable,
    modifierGroupIds: beef.modifierGroupIds,
    defaultSelections: beef.defaultSelections,
    hiddenOptions: beef.hiddenOptions,
    extraOptions: beef.extraOptions,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  console.log('✅ Seeded Burgers category and Chicken Burger @ $12 with defaults and combo');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});
