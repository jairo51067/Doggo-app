// ============================================
// AUTH MANAGER - Gestión de autenticación (Singleton)
// ============================================

import { auth } from '../firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Singleton: una sola instancia compartida
let instance = null;

export class AuthManager {
  constructor() {
    // Si ya existe una instancia, retornarla
    if (instance) {
      return instance;
    }

    this.currentUser = null;
    this.authStateCallbacks = [];
    this.isInitialized = false;
    
    // Escuchar cambios de autenticación (solo una vez)
    if (!this.isInitialized) {
      onAuthStateChanged(auth, (user) => {
        console.log('🔔 Auth state changed:', user ? user.email : 'null');
        this.currentUser = user;
        this.notifyAuthStateChange(user);
      });
      this.isInitialized = true;
    }

    // Guardar instancia
    instance = this;
  }

  /**
   * Inicia sesión con email y password
   */
  async login(email, password) {
    try {
      console.log('🔐 Intentando login...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Login exitoso:', user.email);
      this.currentUser = user;
      
      return {
        success: true,
        user: {
          email: user.email,
          uid: user.uid
        }
      };
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta más tarde';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Cierra la sesión
   */
  async logout() {
    try {
      console.log('🚪 Cerrando sesión...');
      await signOut(auth);
      this.currentUser = null;
      console.log('✅ Sesión cerrada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated() {
    console.log('🔍 isAuthenticated:', this.currentUser !== null);
    return this.currentUser !== null;
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Registra un callback para cambios de autenticación
   */
  onAuthStateChange(callback) {
    this.authStateCallbacks.push(callback);
    
    // Llamar inmediatamente con el estado actual
    callback(this.currentUser);
  }

  /**
   * Notifica a todos los callbacks sobre cambio de autenticación
   */
  notifyAuthStateChange(user) {
    this.authStateCallbacks.forEach(callback => {
      callback(user);
    });
  }
}