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
    tagline: "Authentic Lebanese Street Food",
    timezone: "Australia/Sydney",
    online: true,
    phone: "0295209106",
    address: "60 Station Street, Engadine, Sydney NSW",
    announcement: "",
    pickup: {
      enabled: true,
      minLeadMinutes: 10,
      maxLeadMinutes: 25,
      bufferMinutes: 5,
    },
    hours: {
      mon: ["10:00-19:00"],
      tue: ["10:00-19:00"],
      wed: ["10:00-20:00"],
      thu: ["10:00-20:00"],
      fri: ["10:00-20:00"],
      sat: ["11:00-20:00"],
      sun: ["11:00-20:00"]
    },
    social: {
      instagram: "https://www.instagram.com/gksyeeros_engadine?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      facebook: "https://www.facebook.com/profile.php?id=100076822425238&ref=_xav_ig_profile_page_web#",
      tiktok: ""
    },
    legal: {
      termsUrl: "https://gist.githubusercontent.com/Bipin12870/930b468ac24df6151967a4a6dfa3eb4f/raw/3f5af6c44f09af56ee533e2454654b76b21edb97/gistfile1.txt",     // you can overwrite later
      privacyUrl: "https://gist.githubusercontent.com/Bipin12870/930b468ac24df6151967a4a6dfa3eb4f/raw/3f5af6c44f09af56ee533e2454654b76b21edb97/gistfile1.txt"
    },
    updatedAt: serverTimestamp(),
  };

  // Staff list
  const staff = [
    { id: "tony_chaouk", name: "Tony Chaouk", role: "Owner", photo: "https://i.pravatar.cc/300?img=11", bio: "Co-owner overseeing operations and quality." },
    { id: "amara_chaouk", name: "Amara Chaouk", role: "Owner", photo: "https://i.pravatar.cc/300?img=14", bio: "Co-owner focused on customer experience." },
    { id: "aboudy_chaouk", name: "Aboudy Chaouk", role: "Staff", photo: "https://i.pravatar.cc/300?img=21", bio: "All-rounder helping across the floor." },
    { id: "sonu_rai", name: "Sonu Rai", role: "Supervisor", photo: "https://i.pravatar.cc/300?img=22", bio: "Keeps service running smoothly. Best in the business" },
    { id: "amritpal_singh", name: "Amritpal Singh", role: "Grill", photo: "https://i.pravatar.cc/300?img=23", bio: "On the grill crafting perfect sears." },
    { id: "bipin_sapkota", name: "Bipin Sapkota", role: "Staff", photo: "https://i.pravatar.cc/300?img=12", bio: "Supporting front and back of house." },
    { id: "mahmudda", name: "Mahmudda Sister", role: "Staff", photo: "https://i.pravatar.cc/300?img=24", bio: "Kitchen support, helping wherever needed." },
    { id: "prakash", name: "Prakash", role: "Staff", photo: "https://i.pravatar.cc/300?img=25", bio: "Reliable hand across shifts." },
  ];

  // 3) Write store root
  await setDoc(doc(db, 'stores', 'MAIN'), storeDoc, { merge: true });
  // 4) Write staff array under stores/MAIN
  await setDoc(doc(db, 'stores', 'MAIN'), { staff }, { merge: true });

  console.log('✅ Seed complete. Check Firestore → stores/MAIN');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
