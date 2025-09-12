// Seeds Pide top-level category and three non-customizable items
// Usage: node scripts/seedPide.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Pide → project:', app.options.projectId);

  // Top-level row via category with groupId/groupName (like Gozleme)
  const category = { id: 'pide', name: 'Pide', groupId: 'pide', groupName: 'Pide', displayOrder: 210, active: true };
  await setDoc(doc(db, 'stores', STORE_ID, 'categories', category.id), {
    name: category.name,
    groupId: category.groupId,
    groupName: category.groupName,
    displayOrder: category.displayOrder,
    active: category.active,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  const PRICE = 14.0;
  const items = [
    {
      id: 'pide_beef_cheese',
      name: 'Beef and Cheese Pide',
      categoryId: 'pide',
      imageUrl: 'https://picsum.photos/600/600?random=401',
      basePrice: PRICE,
      displayOrder: 10,
      active: true,
      modifierGroupIds: [],
      customizable: false,
      adminTweaks: { ingredients: ['beef', 'cheese'] },
    },
    {
      id: 'pide_spinach_cheese',
      name: 'Spinach and Cheese Pide',
      categoryId: 'pide',
      imageUrl: 'https://picsum.photos/600/600?random=402',
      basePrice: PRICE,
      displayOrder: 20,
      active: true,
      modifierGroupIds: [],
      customizable: false,
      adminTweaks: { ingredients: ['spinach', 'cheese'] },
    },
    {
      id: 'pide_chicken_spinach_mushroom_cheese',
      name: 'Chicken Spinach Mushroom and Cheese Pide',
      categoryId: 'pide',
      imageUrl: 'https://picsum.photos/600/600?random=403',
      basePrice: PRICE,
      displayOrder: 30,
      active: true,
      modifierGroupIds: [],
      customizable: false,
      adminTweaks: { ingredients: ['chicken', 'spinach', 'mushroom', 'cheese'] },
    },
  ];

  for (const it of items) {
    await setDoc(doc(db, 'stores', STORE_ID, 'items', it.id), {
      categoryId: it.categoryId,
      name: it.name,
      imageUrl: it.imageUrl,
      basePrice: it.basePrice,
      active: it.active,
      displayOrder: it.displayOrder,
      modifierGroupIds: it.modifierGroupIds,
      customizable: it.customizable,
      adminTweaks: it.adminTweaks,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  console.log('✅ Seeded Pide category and 3 items @ $14');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});

