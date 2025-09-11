// Seed Traditional items (regular and kids) with per-item default selections
// Usage: node scripts/seedTraditional.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Traditional items → project:', app.options.projectId);

  // Ensure categories exist (Regular and Kids variants)
  const categories = [
    { id: 'yerros_traditional', name: 'Yerros Traditional', groupId: 'regular', groupName: 'Yerros Regular', displayOrder: 30, active: true },
    { id: 'yerros_traditional_kids', name: 'Yerros Traditional (Kids)', groupId: 'kids', groupName: 'Yerros Kids', displayOrder: 40, active: true },
  ];
  for (const c of categories) {
    await setDoc(doc(db, 'stores', STORE_ID, 'categories', c.id), {
      name: c.name,
      groupId: c.groupId,
      groupName: c.groupName,
      displayOrder: c.displayOrder,
      active: c.active,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  // Per-item default selections requested:
  // - salads: tomato, onion, hot chips (inside wrap)
  // - sauces: tatziki
  // - bread: souvlaki (default)
  const defaultSelections = {
    salads: ['tomato', 'onion', 'hot_chips'],
    sauces: ['tatziki'],
    bread: ['souvlaki'],
  };

  const items = [
    {
      id: 'yerros_traditional',
      categoryId: 'yerros_traditional',
      name: 'Yerros Traditional',
      description: 'Traditional recipe with tomato, onion, hot chips, and tatziki by default. Customizable.',
      imageUrl: 'https://picsum.photos/600/600?random=203',
      basePrice: 16.0,
      active: true,
      displayOrder: 30,
      modifierGroupIds: ['salads','sauces','meats','bread','add_ons','sides','drinks','combo'],
      defaultSelections,
    },
    {
      id: 'yerros_traditional_kids',
      categoryId: 'yerros_traditional_kids',
      name: 'Yerros Traditional (Kids)',
      description: 'Kids-sized traditional with tomato, onion, hot chips, and tatziki by default. Customizable.',
      imageUrl: 'https://picsum.photos/600/600?random=204',
      basePrice: 12.0,
      active: true,
      displayOrder: 40,
      modifierGroupIds: ['salads','sauces','meats','bread','add_ons','sides','drinks','combo'],
      defaultSelections,
    },
  ];

  for (const it of items) {
    await setDoc(doc(db, 'stores', STORE_ID, 'items', it.id), {
      categoryId: it.categoryId,
      name: it.name,
      description: it.description,
      imageUrl: it.imageUrl,
      basePrice: it.basePrice,
      active: it.active,
      displayOrder: it.displayOrder,
      modifierGroupIds: it.modifierGroupIds,
      defaultSelections: it.defaultSelections,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  console.log('✅ Seeded Traditional items (regular $16, kids $12) with defaults.');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});
