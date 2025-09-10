const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const config = require('./firebaseConfig');

// 1) Initialize Firebase for Node script
const app = initializeApp(config);
const db = getFirestore(app);

async function main() {
  console.log('SEEDING PROJECT:', app.options.projectId);

  // 2) Your store payload
  const storeDoc = {
    name: "Gk's Yerros",
    tagline: "Authentic Greek Street Food",
    timezone: "Australia/Sydney",
    online: true,
    phone: "+61 400 000 000",
    address: "123 Example St, Sydney NSW",
    announcement: "",
    hours: {
      mon: ["10:00-20:00"],
      tue: ["10:00-20:00"],
      wed: ["10:00-20:00"],
      thu: ["10:00-22:00"],
      fri: ["10:00-23:00"],
      sat: ["11:00-23:00"],
      sun: ["11:00-21:00"]
    },
    social: {
      instagram: "https://instagram.com/yourhandle",
      facebook: "https://facebook.com/yourpage",
      tiktok: ""
    },
    legal: {
      termsUrl: "https://example.com/terms",     // you can overwrite later
      privacyUrl: "https://example.com/privacy"
    },
    updatedAt: serverTimestamp(),
  };

  // optional staff array you wanted
  const staff = [
    {
      id: "owner_bipin",
      name: "Bipin Sapkota",
      role: "Owner",
      bio: "Runs the joint; keeps the spits spinning.",
      photoUrl: "https://i.pravatar.cc/300?img=12",
      socials: { instagram: "https://instagram.com/...", }
    },
    {
      id: "chef_maria",
      name: "Maria",
      role: "Head Chef",
      bio: "Masters sauces & seasoning.",
      photoUrl: "https://i.pravatar.cc/300?img=32",
      socials: {}
    }
  ];

  // 3) Write store root
  await setDoc(doc(db, 'stores', 'MAIN'), storeDoc, { merge: true });
  // 4) Write staff array under stores/MAIN (we’ll keep it as a map with array, or you can do a subcollection if you prefer)
  await setDoc(doc(db, 'stores', 'MAIN'), { staff }, { merge: true });

  console.log('✅ Seed complete. Check Firestore → stores/MAIN');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
