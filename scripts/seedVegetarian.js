// Seeds Vegetarian category and items
// Usage: node scripts/seedVegetarian.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function main() {
  console.log('Seeding Vegetarian → project:', app.options.projectId);

  // Top-level category row
  const category = { id: 'vegetarian', name: 'Vegetarian', groupId: 'vegetarian', groupName: 'Vegetarian', displayOrder: 260, active: true };
  await setDoc(doc(db, 'stores', STORE_ID, 'categories', category.id), {
    name: category.name,
    groupId: category.groupId,
    groupName: category.groupName,
    displayOrder: category.displayOrder,
    active: category.active,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Items under Vegetarian
  const items = [
    // 1) Halloumi Pack — non-customizable, $10
    {
      id: 'halloumi_pack',
      name: 'Halloumi Pack',
      categoryId: 'vegetarian',
      description: '4 pieces of halloumi. No customizations.',
      imageUrl: 'https://picsum.photos/600/600?random=1601',
      basePrice: 10.0,
      displayOrder: 10,
      active: true,
      customizable: false,
      // Metadata for inclusion (quantities are for admin reference only)
      adminTweaks: { includes: ['halloumi_x4'] },
    },

    // 2) Veggie Pita — like Traditional but with halloumi + eggplant instead of meat
    {
      id: 'veggie_pita',
      name: 'Veggie Pita',
      categoryId: 'vegetarian',
      description: 'Traditional style with halloumi and eggplant instead of meat. Customizable.',
      imageUrl: 'https://picsum.photos/600/600?random=1602',
      basePrice: 15.0,
      displayOrder: 20,
      active: true,
      customizable: true,
      modifierGroupIds: ['salads','sauces','bread','add_ons','sides','drinks','combo'],
      defaultSelections: { salads: ['tomato','onion','hot_chips'], sauces: ['tatziki'], bread: ['souvlaki'] },
      // Mark halloumi + eggplant included in base price (not user-selectable here)
      adminTweaks: { includes: ['halloumi','eggplant'] },
      // Explicitly hide any meat-related options
      hiddenOptions: { meats: ['lamb','beef','chicken','beef_and_chicken','beef_and_lamb','chicken_and_lamb'], add_ons: ['extra_meat'] },
    },

    // 3) Falafel Roll — customizable, default salads + hommous
    {
      id: 'falafel_roll',
      name: 'Falafel Roll',
      categoryId: 'vegetarian',
      description: 'Default: Lettuce, tomato, onion, tabouli, hommous. Customizable.',
      imageUrl: 'https://picsum.photos/600/600?random=1603',
      basePrice: 15.0,
      displayOrder: 30,
      active: true,
      customizable: true,
      modifierGroupIds: ['salads','sauces','bread','add_ons','sides','drinks','combo'],
      defaultSelections: { salads: ['lettuce','tomato','onion','tabouli'], sauces: ['hommous'], bread: ['souvlaki'] },
      hiddenOptions: { salads: ['hot_chips'], meats: ['lamb','beef','chicken','beef_and_chicken','beef_and_lamb','chicken_and_lamb'], add_ons: ['extra_meat'] },
    },

    // 4) Vegetarian Plate — customizable salads and sauces only
    {
      id: 'vegetarian_plate',
      name: 'Vegetarian Plate',
      categoryId: 'vegetarian',
      description: 'Plate with salads, 2 vine leaves, 2 falafels, 1 cabbage roll, and 1 pita bread. Salads and sauces customizable.',
      imageUrl: 'https://picsum.photos/600/600?random=1604',
      basePrice: 18.0,
      displayOrder: 40,
      active: true,
      customizable: true,
      // Allow only salads, sauces, and limited add-ons (halloumi, pita bread)
      modifierGroupIds: ['salads','sauces','add_ons'],
      defaultSelections: { salads: ['lettuce','tomato','onion','tabouli'] },
      hiddenOptions: { salads: ['hot_chips'], add_ons: ['cheese', 'extra_meat' ], meats: ['lamb','beef','chicken','beef_and_chicken','beef_and_lamb','chicken_and_lamb'] },
      adminTweaks: { includes: ['vine_leaves_x2','falafel_x2','cabbage_roll_x1','pita_bread'] },
    },

    // 5) Halloumi & Eggplant Plate — non-customizable, includes medium chips
    {
      id: 'halloumi_eggplant_plate',
      name: 'Halloumi & Eggplant Plate',
      categoryId: 'vegetarian',
      description: 'Medium chips with 4 pieces halloumi and 3 pieces eggplant. No customizations.',
      imageUrl: 'https://picsum.photos/600/600?random=1605',
      basePrice: 18.0,
      displayOrder: 50,
      active: true,
      customizable: false,
      adminTweaks: { includes: ['chips_m','halloumi_x4','eggplant_x3'] },
    },
  ];

  for (const it of items) {
    const payload = {
      categoryId: it.categoryId,
      name: it.name,
      description: it.description,
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
    if (it.adminTweaks !== undefined) payload.adminTweaks = it.adminTweaks;
    await setDoc(doc(db, 'stores', STORE_ID, 'items', it.id), payload, { merge: true });
  }

  console.log('✅ Seeded Vegetarian category with 5 items');
}

main().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});
