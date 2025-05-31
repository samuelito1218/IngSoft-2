import { getAuth } from 'firebase/auth'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; 
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyDPW0rFfOc5RUHGfJYnav5QONNXReabd5E",
  authDomain: "pedidostiemporeal.firebaseapp.com",
  projectId: "pedidostiemporeal",
  storageBucket: "pedidostiemporeal.firebasestorage.app",
  messagingSenderId: "984170711800",
  appId: "1:984170711800:web:3394ead8e3eef20f9a090d",
  measurementId: "G-D301LJ2MJP",
  databaseURL: "https://pedidostiemporeal-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);
const storage = getStorage(app);

export { app, auth, storage, db }