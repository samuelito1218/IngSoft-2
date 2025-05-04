// Import the functions you need from the SDKs you need
import { getAuth } from 'firebase/auth'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; // Añadir esta importación
import { getStorage } from "firebase/storage"; // Añadir esta importación
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPW0rFfOc5RUHGfJYnav5QONNXReabd5E",
  authDomain: "pedidostiemporeal.firebaseapp.com",
  projectId: "pedidostiemporeal",
  storageBucket: "pedidostiemporeal.firebasestorage.app",
  messagingSenderId: "984170711800",
  appId: "1:984170711800:web:3394ead8e3eef20f9a090d",
  measurementId: "G-D301LJ2MJP",
  databaseURL: "https://pedidostiemporeal-default-rtdb.firebaseio.com/" // Añadir esta línea
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// initialize firebase auth
const auth = getAuth(app);
// initialize realtime database
const db = getDatabase(app);
const storage = getStorage(app);

// Exportar los servicios
export { app, auth, storage, db }