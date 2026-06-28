// Test de conexión con Firebase
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function testConnection() {
  try {
    console.log('🔥 Probando conexión con Firebase...');
    
    // Crear un documento de prueba
    const docRef = await addDoc(collection(db, "test_connection"), {
      message: "¡Conexión exitosa!",
      timestamp: serverTimestamp(),
      test: true
    });
    
    console.log('✅ ¡Firebase funciona! Documento creado con ID: ', docRef.id);
    console.log('👉 Ve a la consola de Firebase > Firestore Database > test_connection');
    return true;
  } catch (error) {
    console.error('❌ Error conectando con Firebase:', error);
    return false;
  }
}

// Ejecutar prueba cuando cargue la página
window.addEventListener('DOMContentLoaded', () => {
  testConnection();
});