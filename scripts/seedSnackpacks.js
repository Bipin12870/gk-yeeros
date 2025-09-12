// Seeds Snackpacks category with Regular and Large sizes
// Usage: node scripts/seedSnackpacks.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Snackpacks → project:', app.options.projectId);

  // Top-level category row
  const category = { id: 'snackpacks', name: 'Snackpacks', groupId: 'snackpacks', groupName: 'Snackpacks', displayOrder: 230, active: true };
  await setDoc(doc(db, 'stores', STORE_ID, 'categories', category.id), {
    name: category.name,
    groupId: category.groupId,
    groupName: category.groupName,
    displayOrder: category.displayOrder,
    active: category.active,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Common fields
  const base = {
    categoryId: 'snackpacks',
    active: true,
    customizable: true,
    // Customization for sauces, add-ons, meats selection, and drinks.
    modifierGroupIds: ['meats', 'sauces', 'add_ons', 'drinks'],
  };

  const items = [
    {
      id: 'snackpack_regular',
      name: 'Snackpack (Regular)',
      imageUrl: 'https://picsum.photos/600/600?random=601',
      basePrice: 16.0,
      displayOrder: 10,
      description: 'Chips on the bottom, meat on top. Customize sauces, add-ons, and drinks.',
    },
    {
      id: 'snackpack_large',
      name: 'Snackpack (Large)',
      imageUrl: 'https://picsum.photos/600/600?random=602',
      basePrice: 18.0,
      displayOrder: 20,
      description: 'Bigger serve: chips on the bottom, meat on top. Customize sauces, add-ons, and drinks.',
    },
  ];

  for (const it of items) {
    const payload = {
      ...base,
      name: it.name,
      imageUrl: it.imageUrl,
      basePrice: it.basePrice,
      displayOrder: it.displayOrder,
      description: it.description,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'stores', STORE_ID, 'items', it.id), payload, { merge: true });
  }

  console.log('✅ Seeded Snackpacks category and two items @ $16/$18');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});

