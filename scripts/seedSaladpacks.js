// Seeds Saladpacks category with Regular and Large sizes (salads base)
// Usage: node scripts/seedSaladpacks.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Saladpacks → project:', app.options.projectId);

  // Top-level category row
  const category = { id: 'saladpacks', name: 'Saladpacks', groupId: 'saladpacks', groupName: 'Saladpacks', displayOrder: 240, active: true };
  await setDoc(doc(db, 'stores', STORE_ID, 'categories', category.id), {
    name: category.name,
    groupId: category.groupId,
    groupName: category.groupName,
    displayOrder: category.displayOrder,
    active: category.active,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Common fields — salads and sauces customizable; can add side of chips and drinks
  const base = {
    categoryId: 'saladpacks',
    active: true,
    customizable: true,
    // Customize salads, sauces, and meat; allow sides (chips) and drinks
    modifierGroupIds: ['meats', 'salads', 'sauces', 'sides', 'drinks'],
  };

  const items = [
    {
      id: 'saladpack_regular',
      name: 'Saladpack (Regular)',
      imageUrl: 'https://picsum.photos/600/600?random=701',
      basePrice: 16.0,
      displayOrder: 10,
      description: 'Salads base, no chips. Customize salads and sauces; add sides and drinks.',
    },
    {
      id: 'saladpack_large',
      name: 'Saladpack (Large)',
      imageUrl: 'https://picsum.photos/600/600?random=702',
      basePrice: 18.0,
      displayOrder: 20,
      description: 'Larger serve. Salads base, customize salads/sauces; add sides and drinks.',
    },
  ];

  const defaultSalads = { salads: ['lettuce', 'tomato', 'onion', 'tabouli'] };
  const hidden = { salads: ['hot_chips'] };

  for (const it of items) {
    const payload = {
      ...base,
      name: it.name,
      imageUrl: it.imageUrl,
      basePrice: it.basePrice,
      displayOrder: it.displayOrder,
      description: it.description,
      defaultSelections: defaultSalads,
      hiddenOptions: hidden,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'stores', STORE_ID, 'items', it.id), payload, { merge: true });
  }

  console.log('✅ Seeded Saladpacks category and two items @ $16/$18');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});
