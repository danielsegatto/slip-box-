// src/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwDTYZj0KXoHD1zCtWMfV4zCplUS89ZH8",
  authDomain: "slip-box-8baff.firebaseapp.com",
  projectId: "slip-box-8baff",
  storageBucket: "slip-box-8baff.firebasestorage.app",
  messagingSenderId: "931751504867",
  appId: "1:931751504867:web:2e0242125b3fb3ce378ed6",
  measurementId: "G-NEHZF37HCD"
};

const app = initializeApp(firebaseConfig);
// Initialize and export the database reference
export const db = getFirestore(app);