// Firebase Configuration - Doggo App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ PEGA AQUÍ TUS CREDENCIALES DEL PASO 2
const firebaseConfig = {
  apiKey: "AIzaSyBAqVGYYoKOgSj6agTPVszOzXIcjnG0A8A",
  authDomain: "doggo-app-fa2c4.firebaseapp.com",
  projectId: "doggo-app-fa2c4",
  storageBucket: "doggo-app-fa2c4.firebasestorage.app",
  messagingSenderId: "114624164774",
  appId: "1:114624164774:web:ac27fa7e9e9cead9d15567"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Exportar para usar en otros módulos
export { app, db };