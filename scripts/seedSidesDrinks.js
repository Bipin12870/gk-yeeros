// Seeds a Sides & Drinks category with standalone purchasable items
// Usage: node scripts/seedSidesDrinks.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Sides & Drinks → project:', app.options.projectId);

  const category = { id: 'sides_drinks', name: 'Sides & Drinks', groupId: 'sides_drinks', groupName: 'Sides & Drinks', displayOrder: 260, active: true };
  await setDoc(doc(db, 'stores', STORE_ID, 'categories', category.id), {
    name: category.name,
    groupId: category.groupId,
    groupName: category.groupName,
    displayOrder: category.displayOrder,
    active: category.active,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  const items = [
    // Sides
    { id: 'chips_s', name: 'Chips (Small)', price: 4.0, order: 10 },
    { id: 'chips_m', name: 'Chips (Medium)', price: 5.0, order: 11 },
    { id: 'chips_l', name: 'Chips (Large)', price: 6.0, order: 12 },
    { id: 'feta_chips_m', name: 'Feta Chips (Medium)', price: 6.0, order: 13 },
    { id: 'feta_chips_l', name: 'Feta Chips (Large)', price: 7.0, order: 14 },
    // Drinks
    { id: 'drink_can_375', name: 'Drink — Can (375ml)', price: 3.5, order: 20 },
    { id: 'drink_bottle', name: 'Drink — Bottle', price: 4.5, order: 21 },
  ];

  for (const it of items) {
    await setDoc(doc(db, 'stores', STORE_ID, 'items', it.id), {
      categoryId: category.id,
      name: it.name,
      imageUrl: `https://picsum.photos/600/600?random=${900 + it.order}`,
      basePrice: it.price,
      active: true,
      displayOrder: it.order,
      modifierGroupIds: [],
      customizable: false,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  console.log('✅ Seeded Sides & Drinks with standalone items');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});

