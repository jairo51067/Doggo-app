// ============================================
// TOAST MANAGER - Sistema de notificaciones
// ============================================

/**
 * Sistema de notificaciones tipo Toast
 */
export class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    /**
     * Inicializa el contenedor de toasts
     */
    init() {
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    /**
     * Muestra una notificación
     * @param {string} message - Mensaje principal
     * @param {string} type - Tipo: 'success', 'error', 'info', 'warning'
     * @param {string} title - Título opcional
     * @param {number} duration - Duración en ms (0 para no auto-cerrar)
     * @returns {HTMLElement} - Elemento toast creado
     */
    show(message, type = 'info', title = '', duration = 3000) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Cerrar notificación">✕</button>
        `;

        this.container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hide(toast);
        });

        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Oculta una notificación
     * @param {HTMLElement} toast - Elemento toast a ocultar
     */
    hide(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 400);
    }

    /**
     * Limpia todas las notificaciones
     */
    clearAll() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.hide(toast));
    }

    /**
     * Notificación de éxito
     */
    success(message, title = '¡Éxito!', duration = 3000) {
        return this.show(message, 'success', title, duration);
    }

    /**
     * Notificación de error
     */
    error(message, title = 'Error', duration = 4000) {
        return this.show(message, 'error', title, duration);
    }

    /**
     * Notificación informativa
     */
    info(message, title = 'Información', duration = 3000) {
        return this.show(message, 'info', title, duration);
    }

    /**
     * Notificación de advertencia
     */
    warning(message, title = 'Atención', duration = 3500) {
        return this.show(message, 'warning', title, duration);
    }
}

// Exportar una instancia por defecto
export const toastManager = new ToastManager();