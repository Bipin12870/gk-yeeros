// Seeds Gozleme top-level category and three non-customizable items
// Usage: node scripts/seedGozleme.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Gozleme → project:', app.options.projectId);

  // Top-level row via category with groupId/groupName
  const category = { id: 'gozleme', name: 'Gozleme', groupId: 'gozleme', groupName: 'Gozleme', displayOrder: 200, active: true };
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
      id: 'gozleme_beef_spinach_cheese',
      name: 'Beef Spinach and Cheese Gozleme',
      categoryId: 'gozleme',
      imageUrl: 'https://picsum.photos/600/600?random=301',
      basePrice: PRICE,
      displayOrder: 10,
      active: true,
      modifierGroupIds: [],
      customizable: false,
      adminTweaks: { ingredients: ['spinach', 'cheese', 'beef'] },
    },
    {
      id: 'gozleme_chicken_spinach_cheese',
      name: 'Chicken Spinach and Cheese Gozleme',
      categoryId: 'gozleme',
      imageUrl: 'https://picsum.photos/600/600?random=302',
      basePrice: PRICE,
      displayOrder: 20,
      active: true,
      modifierGroupIds: [],
      customizable: false,
      adminTweaks: { ingredients: ['spinach', 'cheese', 'chicken'] },
    },
    {
      id: 'gozleme_spinach_cheese',
      name: 'Spinach and Cheese Gozleme',
      categoryId: 'gozleme',
      imageUrl: 'https://picsum.photos/600/600?random=303',
      basePrice: PRICE,
      displayOrder: 30,
      active: true,
      modifierGroupIds: [],
      customizable: false,
      adminTweaks: { ingredients: ['spinach', 'cheese'] },
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

  console.log('✅ Seeded Gozleme category and 3 items @ $14');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});

