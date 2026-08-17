import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// User provided live Firebase configuration (ConnectAbroadNow project)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAwlVYTzLR7yzTCK2bT-NBdy32QYRfPVII",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "connectabroadnow.firebaseapp.com",
  databaseURL: "https://connectabroadnow-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "connectabroadnow",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "connectabroadnow.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "769091972833",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:769091972833:web:f4f67c3050702bb75511a0",
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
