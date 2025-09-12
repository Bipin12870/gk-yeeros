// Seeds Souvlaki category with sticks and wraps
// Usage: node scripts/seedSouvlaki.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Souvlaki → project:', app.options.projectId);

  // Top-level category row
  const category = { id: 'souvlaki', name: 'Souvlaki', groupId: 'souvlaki', groupName: 'Souvlaki', displayOrder: 270, active: true };
  await setDoc(doc(db, 'stores', STORE_ID, 'categories', category.id), {
    name: category.name,
    groupId: category.groupId,
    groupName: category.groupName,
    displayOrder: category.displayOrder,
    active: category.active,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Simple sticks — non-customizable, $5 each
  const sticks = [
    {
      id: 'souvlaki_stick_chicken',
      name: 'Chicken Souvlaki',
      categoryId: 'souvlaki',
      imageUrl: 'https://picsum.photos/600/600?random=1001',
      basePrice: 5.0,
      displayOrder: 10,
      active: true,
      modifierGroupIds: [],
      customizable: false,
    },
    {
      id: 'souvlaki_stick_lamb',
      name: 'Lamb Souvlaki',
      categoryId: 'souvlaki',
      imageUrl: 'https://picsum.photos/600/600?random=1002',
      basePrice: 5.0,
      displayOrder: 20,
      active: true,
      modifierGroupIds: [],
      customizable: false,
    },
  ];

  // Wraps — mirror Yerros Classic/Traditional but limit meat to lamb/chicken
  const wraps = [
    {
      id: 'souvlaki_classic',
      name: 'Classic Souvlaki',
      categoryId: 'souvlaki',
      description: 'Same as Yerros Classic. Choose lamb or chicken souvlaki.',
      imageUrl: 'https://picsum.photos/600/600?random=1003',
      basePrice: 16.0,
      displayOrder: 30,
      active: true,
      customizable: true,
      modifierGroupIds: ['salads','sauces','meats','add_ons','bread','sides','drinks','combo'],
      hiddenOptions: { salads: ['hot_chips'], meats: ['beef','beef_and_chicken','beef_and_lamb','chicken_and_lamb'] },
    },
    {
      id: 'souvlaki_traditional',
      name: 'Traditional Souvlaki',
      categoryId: 'souvlaki',
      description: 'Same as Yerros Traditional. Default tomato, onion, hot chips, tatziki. Lamb or chicken only.',
      imageUrl: 'https://picsum.photos/600/600?random=1004',
      basePrice: 16.0,
      displayOrder: 40,
      active: true,
      customizable: true,
      modifierGroupIds: ['salads','sauces','meats','bread','add_ons','sides','drinks','combo'],
      defaultSelections: { salads: ['tomato','onion','hot_chips'], sauces: ['tatziki'], bread: ['souvlaki'] },
      hiddenOptions: { meats: ['beef','beef_and_chicken','beef_and_lamb','chicken_and_lamb'] },
    },
    {
      id: 'souvlaki_and_chips',
      name: 'Souvlaki and Chips',
      categoryId: 'souvlaki',
      description: 'Includes medium chips. Choose lamb or chicken souvlaki.',
      imageUrl: 'https://picsum.photos/600/600?random=1005',
      basePrice: 16.0,
      displayOrder: 50,
      active: true,
      // Allow choosing meat only; chips included in base price
      customizable: true,
      modifierGroupIds: ['meats'],
      hiddenOptions: { meats: ['beef', 'beef_and_chicken', 'beef_and_lamb', 'chicken_and_lamb'] },
    },
  ];

  const items = [...sticks, ...wraps];

  for (const it of items) {
    const payload = {
      categoryId: it.categoryId,
      name: it.name,
      imageUrl: it.imageUrl,
      basePrice: it.basePrice,
      active: it.active,
      displayOrder: it.displayOrder,
      updatedAt: serverTimestamp(),
    };
    if (it.customizable !== undefined) payload.customizable = it.customizable;
    if (it.modifierGroupIds !== undefined) payload.modifierGroupIds = it.modifierGroupIds;
    if (it.defaultSelections !== undefined) payload.defaultSelections = it.defaultSelections;
    if (it.hiddenOptions !== undefined) payload.hiddenOptions = it.hiddenOptions;
    if (it.description !== undefined) payload.description = it.description;
    await setDoc(doc(db, 'stores', STORE_ID, 'items', it.id), payload, { merge: true });
  }

  console.log('✅ Seeded Souvlaki category with sticks, wraps, and combo');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});
