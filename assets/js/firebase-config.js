// Firebase Configuration - Doggo App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ PEGA AQUÍ TUS CREDENCIALES DEL PASO 2
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "doggo-app-xxxxx.firebaseapp.com",
  projectId: "doggo-app-xxxxx",
  storageBucket: "doggo-app-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Exportar para usar en otros módulos
export { app, db };