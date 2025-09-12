// Seeds Meatpacks category with Regular and Large sizes (meat only)
// Usage: node scripts/seedMeatpacks.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Meatpacks → project:', app.options.projectId);

  // Top-level category row
  const category = { id: 'meatpacks', name: 'Meatpacks', groupId: 'meatpacks', groupName: 'Meatpacks', displayOrder: 250, active: true };
  await setDoc(doc(db, 'stores', STORE_ID, 'categories', category.id), {
    name: category.name,
    groupId: category.groupId,
    groupName: category.groupName,
    displayOrder: category.displayOrder,
    active: category.active,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Common fields — just meat, customizable sauces/add-ons/sides/drinks
  const base = {
    categoryId: 'meatpacks',
    active: true,
    customizable: true,
    // Choose meat; customize sauces, add-ons; can add sides and drinks
    modifierGroupIds: ['meats', 'sauces', 'add_ons', 'sides', 'drinks'],
  };

  const items = [
    {
      id: 'meatpack_regular',
      name: 'Meatpack (Regular)',
      imageUrl: 'https://picsum.photos/600/600?random=801',
      basePrice: 18.0,
      displayOrder: 10,
      description: 'Just meat. Customize sauces and add-ons; add sides and drinks if you like.',
    },
    {
      id: 'meatpack_large',
      name: 'Meatpack (Large)',
      imageUrl: 'https://picsum.photos/600/600?random=802',
      basePrice: 26.0,
      displayOrder: 20,
      description: 'Bigger serve of meat. Customize sauces/add-ons; optional sides and drinks.',
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

  console.log('✅ Seeded Meatpacks category and two items @ $18/$26');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});

