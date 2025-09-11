// Seeds base menu structure: categories and modifier groups
// Usage: node scripts/seedMenu.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

const app = initializeApp(config);
const db = getFirestore(app);

const STORE_ID = 'MAIN';

async function seed() {
  console.log('Seeding base menu into project:', app.options.projectId);

  // 1) Categories
  const categories = [
    { id: 'yerros_classics', name: 'Yerros Classics', displayOrder: 10, active: true, groupId: 'regular', groupName: 'Yerros Regular' },
    { id: 'yerros_classics_kids', name: 'Yerros Classics (Kids)', displayOrder: 20, active: true, groupId: 'kids', groupName: 'Yerros Kids' },
    { id: 'yerros_traditional', name: 'Yerros Traditional', displayOrder: 30, active: true, groupId: 'regular', groupName: 'Yerros Regular' },
    { id: 'yerros_traditional_kids', name: 'Yerros Traditional (Kids)', displayOrder: 40, active: true, groupId: 'kids', groupName: 'Yerros Kids' },
  ];

  for (const cat of categories) {
    await setDoc(doc(db, 'stores', STORE_ID, 'categories', cat.id), {
      name: cat.name,
      displayOrder: cat.displayOrder,
      active: cat.active,
      groupId: cat.groupId,
      groupName: cat.groupName,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  // 2) Modifier Groups
  const groups = [
    {
      id: 'salads',
      name: 'Salads',
      required: false,
      min: 0,
      max: 6,
      multi: true,
      isVariantGroup: false,
      options: [
        { id: 'lettuce', name: 'Lettuce', priceDelta: 0, defaultSelected: true },
        { id: 'tomato', name: 'Tomato', priceDelta: 0, defaultSelected: true },
        { id: 'onion', name: 'Onion', priceDelta: 0, defaultSelected: true },
        { id: 'tabouli', name: 'Tabouli', priceDelta: 0 },
        { id: 'hot_chips', name: 'Hot Chips (in wrap)', priceDelta: 0 },
      ],
    },
    {
      id: 'sauces',
      name: 'Sauces',
      required: true,
      min: 1,
      max: 2,
      multi: true,
      isVariantGroup: false,
      options: [
        { id: 'hommous', name: 'Hommous', priceDelta: 0 },
        { id: 'garlic', name: 'Garlic', priceDelta: 0 },
        { id: 'homemade_chilli', name: 'Homemade Chilli', priceDelta: 0 },
        { id: 'bbq', name: 'BBQ', priceDelta: 0 },
        { id: 'tomato_sauce', name: 'Tomato Sauce', priceDelta: 0 },
        { id: 'sweet_chilli', name: 'Sweet Chilli', priceDelta: 0 },
        { id: 'chilli', name: 'Chilli', priceDelta: 0 },
        { id: 'sour_cream', name: 'Sour Cream', priceDelta: 0 },
        { id: 'mayo', name: 'Mayo', priceDelta: 0 },
        { id: 'tatziki', name: 'Tatziki', priceDelta: 0 },
        { id: 'lemon_sauce', name: 'Lemon Sauce', priceDelta: 0 },
      ],
    },
    {
      id: 'meats',
      name: 'Meat',
      required: true,
      min: 1,
      max: 1,
      multi: false,
      isVariantGroup: false,
      // If regular price includes one meat, keep these 0.
      // If you upsell certain meats, set deltas here.
      options: [
        { id: 'lamb', name: 'Lamb', priceDelta: 0 },
        { id: 'beef', name: 'Beef', priceDelta: 0 },
        { id: 'chicken', name: 'Chicken', priceDelta: 0 },
      ],
    },
    {
      id: 'add_ons',
      name: 'Add-Ons',
      required: false,
      min: 0,
      max: 5,
      multi: true,
      isVariantGroup: false,
      options: [
        { id: 'cheese', name: 'Cheese', priceDelta: 1.0 },
        { id: 'halloumi', name: 'Halloumi', priceDelta: 3.0 },
        { id: 'pita_bread', name: 'Pita Bread', priceDelta: 2.0 },
      ],
    },
    {
      id: 'bread',
      name: 'Bread',
      required: true,
      min: 1,
      max: 1,
      multi: false,
      isVariantGroup: false,
      options: [
        { id: 'souvlaki', name: 'Souvlaki Bread (Default)', priceDelta: 0, defaultSelected: true },
        { id: 'lebanese', name: 'Lebanese Bread', priceDelta: 0 },
        { id: 'gluten_free', name: 'Gluten Free Bread', priceDelta: 1.5 },
      ],
    },
    {
      id: 'sides',
      name: 'Sides',
      required: false,
      min: 0,
      max: 5,
      multi: true,
      isVariantGroup: false,
      options: [
        { id: 'chips_s', name: 'Chips (Small)', priceDelta: 4.0 },
        { id: 'chips_m', name: 'Chips (Medium)', priceDelta: 5.0 },
        { id: 'chips_l', name: 'Chips (Large)', priceDelta: 6.0 },
        { id: 'feta_chips_m', name: 'Feta Chips (Medium)', priceDelta: 6.0 },
        { id: 'feta_chips_l', name: 'Feta Chips (Large)', priceDelta: 7.0 },
      ],
    },
    {
      id: 'drinks',
      name: 'Drinks',
      required: false,
      min: 0,
      max: 2,
      multi: true,
      isVariantGroup: false,
      options: [
        { id: 'can_375', name: 'Can (375ml)', priceDelta: 3.5 },
        { id: 'bottle', name: 'Bottle', priceDelta: 4.5 },
      ],
    },
    {
      id: 'combo',
      name: 'Combo',
      required: false,
      min: 0,
      max: 1,
      multi: false,
      isVariantGroup: false,
      options: [
        { id: 'combo_small_chips_drink', name: 'Small chips + drink', priceDelta: 6.5 },
        { id: 'combo_small_chips_bottle', name: 'Small chips + bottle', priceDelta: 7.5 },
      ],
    },
  ];

  for (const g of groups) {
    await setDoc(doc(db, 'stores', STORE_ID, 'modifierGroups', g.id), {
      name: g.name,
      required: g.required,
      min: g.min,
      max: g.max,
      multi: g.multi,
      isVariantGroup: g.isVariantGroup,
      options: g.options,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  console.log('✅ Base menu seeded: categories and modifier groups');

  // 3) Example Items: Yerros Classic (Regular) and Kids
  const items = [
    {
      id: 'yerros_classic',
      categoryId: 'yerros_classics',
      name: 'Yerros Classic',
      description: 'Default: Lettuce, tomato, onion. Customizable.',
      imageUrl: 'https://picsum.photos/600/600?random=101',
      basePrice: 16.0,
      active: true,
      displayOrder: 10,
      modifierGroupIds: ['salads','sauces','meats','add_ons','bread','sides','drinks','combo'],
      hiddenOptions: { salads: ['hot_chips'] },
    },
    {
      id: 'yerros_classic_kids',
      categoryId: 'yerros_classics_kids',
      name: 'Yerros Classic (Kids)',
      description: 'Smaller portion. Default: Lettuce, tomato, onion. Customizable.',
      imageUrl: 'https://picsum.photos/600/600?random=102',
      basePrice: 12.0,
      active: true,
      displayOrder: 20,
      modifierGroupIds: ['salads','sauces','meats','add_ons','bread','sides','drinks','combo'],
      hiddenOptions: { salads: ['hot_chips'] },
    },
    {
      id: 'yerros_traditional',
      categoryId: 'yerros_traditional',
      name: 'Yerros Traditional',
      description: 'A classic traditional flavor profile.',
      imageUrl: 'https://picsum.photos/600/600?random=103',
      basePrice: 17.0,
      active: true,
      displayOrder: 30,
      modifierGroupIds: ['salads','sauces','meats','add_ons','bread','sides','drinks','combo'],
    },
    {
      id: 'yerros_traditional_kids',
      categoryId: 'yerros_traditional_kids',
      name: 'Yerros Traditional (Kids)',
      description: 'Kids-sized traditional favorite.',
      imageUrl: 'https://picsum.photos/600/600?random=104',
      basePrice: 13.0,
      active: true,
      displayOrder: 40,
      modifierGroupIds: ['salads','sauces','meats','add_ons','bread','sides','drinks','combo'],
    }
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
      hiddenOptions: it.hiddenOptions,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  console.log('✅ Example items seeded: Yerros Classic (16.00) and Kids (12.00)');
}

seed().catch(err => {
  console.error('❌ Seed failed', err);
  process.exit(1);
});
