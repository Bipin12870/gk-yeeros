// scripts/firebaseAdmin.js
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "gk-yeeros-app.firebaseapp.com",
  projectId: "gk-yeeros-app",
  storageBucket: "gk-yeeros-app.appspot.com",
  messagingSenderId: "232221455883",
  appId: "1:232221455883:web:xxxx"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };