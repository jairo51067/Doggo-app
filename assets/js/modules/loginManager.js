// ============================================
// LOGIN MANAGER - Gestión del formulario de login
// ============================================

import { AuthManager } from './authManager.js';

export class LoginManager {
  constructor(toastManager) {
    this.toastManager = toastManager;
    this.authManager = new AuthManager();
    this.form = null;
  }

  async init() {
    console.log('🔐 LoginManager.init() ejecutado');

    // Verificar si ya está autenticado
    if (this.authManager.isAuthenticated()) {
      console.log('✅ Usuario ya autenticado, redirigiendo a admin...');
      window.location.hash = '#/admin';
      return;
    }

    this.form = document.getElementById('login-form');
    if (!this.form) {
      console.error('❌ Formulario de login no encontrado');
      return;
    }

    this.initFormSubmit();
    this.initFieldValidation();

    console.log('✅ LoginManager inicializado');
  }

  initFormSubmit() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  initFieldValidation() {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    if (emailInput) {
      emailInput.addEventListener('blur', () => this.validateField(emailInput));
    }

    if (passwordInput) {
      passwordInput.addEventListener('blur', () => this.validateField(passwordInput));
    }
  }

  validateField(input) {
    const feedback = input.closest('.form-group')?.querySelector('.field-feedback');
    if (!feedback) return true;

    const value = input.value.trim();
    input.classList.remove('error', 'success');
    feedback.innerHTML = '';

    if (input.required && !value) {
      input.classList.add('error');
      feedback.innerHTML = '<span class="error-msg">Este campo es obligatorio</span>';
      return false;
    }

    if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      input.classList.add('error');
      feedback.innerHTML = '<span class="error-msg">Email inválido</span>';
      return false;
    }

    if (input.type === 'password' && value && value.length < 6) {
      input.classList.add('error');
      feedback.innerHTML = '<span class="error-msg">Mínimo 6 caracteres</span>';
      return false;
    }

    if (value) {
      input.classList.add('success');
    }

    return true;
  }

  async handleLogin() {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorDiv = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const btnLogin = document.getElementById('btn-login');
    const btnText = btnLogin.querySelector('.btn-text');
    const btnLoader = btnLogin.querySelector('.btn-loader');

     console.log('🔍 handleLogin() ejecutado');
  console.log('📧 Email:', emailInput.value);
  console.log('🔑 Password length:', passwordInput.value.length);

    // Validar campos
    const emailValid = this.validateField(emailInput);
    const passwordValid = this.validateField(passwordInput);

    if (!emailValid || !passwordValid) {
       console.log('❌ Validación fallida');
      return;
    }

    // Mostrar loading
    btnLogin.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    errorDiv.style.display = 'none';

    try {
       console.log('🚀 Llamando a authManager.login()...');
      const result = await this.authManager.login(
        emailInput.value.trim(),
        passwordInput.value
      );

       console.log('📥 Resultado del login:', result);

      if (result.success) {
          console.log('✅ Login exitoso, redirigiendo...');
        if (this.toastManager) {
          this.toastManager.success('¡Bienvenido!', 'Login exitoso');
        }
        
        // Redirigir al panel de admin después de 1 segundo
        setTimeout(() => {
          window.location.hash = '#/admin';
           console.log('🔄 Redirigiendo a #/admin');
        }, 1000);
      } else {
          console.log('❌ Login fallido:', result.error);
        errorText.textContent = result.error;
        errorDiv.style.display = 'flex';
        
        if (this.toastManager) {
          this.toastManager.error(result.error, 'Error de login');
        }
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      errorText.textContent = 'Error inesperado. Intenta de nuevo.';
      errorDiv.style.display = 'flex';
    } finally {
      btnLogin.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  }

  destroy() {
    console.log('🗑️ LoginManager destruido');
  }
}