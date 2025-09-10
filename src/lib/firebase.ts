// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDLhcV955cNNua9hlE3-xjQycd7JQOAhmc',
  authDomain: 'gk-yeeros-app.firebaseapp.com',
  projectId: 'gk-yeeros-app',
  storageBucket: 'gk-yeeros-app.firebasestorage.app', // or your appspot.com bucket if that's what the console shows
  messagingSenderId: '232221455883',
  appId: '1:232221455883:web:9f7b81643724e9a3bc390e',
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);