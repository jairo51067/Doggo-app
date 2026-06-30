// ============================================
// AUTH MANAGER - Gestión de autenticación
// ============================================

import { auth } from '../firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authStateCallbacks = [];
    
    // Escuchar cambios de autenticación
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.notifyAuthStateChange(user);
    });
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