// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPW0rFfOc5RUHGfJYnav5QONNXReabd5E",
  authDomain: "pedidostiemporeal.firebaseapp.com",
  projectId: "pedidostiemporeal",
  storageBucket: "pedidostiemporeal.appspot.com",
  messagingSenderId: "984170711800",
  appId: "1:984170711800:web:3394ead8e3eef20f9a090d",
  measurementId: "G-D301LJ2MJP",
  databaseURL: "https://pedidostiemporeal-default-rtdb.firebaseio.com" // Add this line
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

export { app, db };