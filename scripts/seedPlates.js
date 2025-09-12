// Seeds Plates category with a customizable Meat Plate
// Usage: node scripts/seedPlates.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Plates → project:', app.options.projectId);

  // Top-level category row
  const category = { id: 'plates', name: 'Plates', groupId: 'plates', groupName: 'Plates', displayOrder: 280, active: true };
  await setDoc(doc(db, 'stores', STORE_ID, 'categories', category.id), {
    name: category.name,
    groupId: category.groupId,
    groupName: category.groupName,
    displayOrder: category.displayOrder,
    active: category.active,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Item: Meat Plate — choose meat; salads default and customizable; chips + pita included and not customizable
  const item = {
    id: 'meat_plate',
    name: 'Meat Plate',
    categoryId: 'plates',
    description: 'Chicken, Lamb, or Beef plate with lettuce, tomato, onion, tabouli. Includes medium chips and 1 pita bread.',
    imageUrl: 'https://picsum.photos/600/600?random=1101',
    basePrice: 26.0,
    displayOrder: 10,
    active: true,
    customizable: true,
    // Available modifiers: meats, salads, sauces, add-ons (no bread or sides; chips+pita included)
    modifierGroupIds: ['meats','salads','sauces','add_ons'],
    // Default selections: salads + default meat (can be changed)
    defaultSelections: {
      salads: ['lettuce','tomato','onion','tabouli'],
      meats: ['lamb'],
    },
    // Hide wrap-only salad option since chips included separately
    hiddenOptions: { salads: ['hot_chips'] },
    // Metadata for inclusion (non-customizable items included in base price)
    adminTweaks: { includes: ['chips_m','pita_bread'] },
  };

  // Write item
  const payload = {
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    basePrice: item.basePrice,
    active: item.active,
    displayOrder: item.displayOrder,
    customizable: item.customizable,
    modifierGroupIds: item.modifierGroupIds,
    defaultSelections: item.defaultSelections,
    hiddenOptions: item.hiddenOptions,
    adminTweaks: item.adminTweaks,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'stores', STORE_ID, 'items', item.id), payload, { merge: true });

  console.log('✅ Seeded Plates category with Meat Plate @ $26');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});

