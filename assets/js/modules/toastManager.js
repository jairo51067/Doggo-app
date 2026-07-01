// ============================================
// TOAST MANAGER - Notificaciones Profesionales
// ============================================

export class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.counter = 0;
    this.init();
  }

  init() {
    // Crear contenedor si no existe
    this.container = document.querySelector('.toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
    console.log('✅ ToastManager inicializado');
  }

  /**
   * Muestra una notificación toast
   * @param {string} message - Mensaje principal
   * @param {string} title - Título del toast
   * @param {string} type - Tipo: 'success', 'error', 'info', 'warning'
   * @param {number} duration - Duración en ms (0 = no auto-cerrar)
   */
  show(message, title = '', type = 'info', duration = 4000) {
    const id = `toast-${++this.counter}`;

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = id;

    toast.innerHTML = `
      <div class="toast-body">
        <div class="toast-icon">${icons[type] || 'ℹ'}</div>
        <div class="toast-content">
          ${title ? `<div class="toast-title">${title}</div>` : ''}
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Cerrar notificación">✕</button>
      </div>
      ${duration > 0 ? '<div class="toast-progress"><div class="toast-progress-bar"></div></div>' : ''}
    `;

    // Configurar barra de progreso
    if (duration > 0) {
      const progressBar = toast.querySelector('.toast-progress-bar');
      if (progressBar) {
        progressBar.style.animationDuration = `${duration}ms`;
      }
    }

    // Botón cerrar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(id));

    // Auto-dismiss
    let timeoutId = null;
    if (duration > 0) {
      timeoutId = setTimeout(() => this.dismiss(id), duration);
    }

    // Pausar al hacer hover
    toast.addEventListener('mouseenter', () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      const progressBar = toast.querySelector('.toast-progress-bar');
      if (progressBar) {
        progressBar.style.animationPlayState = 'paused';
      }
    });

    toast.addEventListener('mouseleave', () => {
      if (duration > 0) {
        timeoutId = setTimeout(() => this.dismiss(id), 2000);
        const progressBar = toast.querySelector('.toast-progress-bar');
        if (progressBar) {
          progressBar.style.animationPlayState = 'running';
        }
      }
    });

    // Agregar al contenedor
    this.container.appendChild(toast);
    this.toasts.set(id, { element: toast, timeoutId });

    // Limitar a 5 toasts visibles
    if (this.toasts.size > 5) {
      const firstKey = this.toasts.keys().next().value;
      this.dismiss(firstKey);
    }

    return id;
  }

  /**
   * Cierra un toast con animación
   */
  dismiss(id) {
    const toastData = this.toasts.get(id);
    if (!toastData) return;

    const { element, timeoutId } = toastData;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    element.classList.add('hide');

    setTimeout(() => {
      element.remove();
      this.toasts.delete(id);
    }, 400);
  }

  /**
   * Métodos rápidos
   */
  success(message, title = 'Éxito', duration = 4000) {
    return this.show(message, title, 'success', duration);
  }

  error(message, title = 'Error', duration = 5000) {
    return this.show(message, title, 'error', duration);
  }

  info(message, title = 'Info', duration = 3000) {
    return this.show(message, title, 'info', duration);
  }

  warning(message, title = 'Atención', duration = 4000) {
    return this.show(message, title, 'warning', duration);
  }
}