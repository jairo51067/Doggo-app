// ============================================
// TOAST MANAGER - Sistema de notificaciones
// ============================================

export class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

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

    hide(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 400);
    }

    clearAll() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.hide(toast));
    }

    success(message, title = '¡Éxito!', duration = 3000) {
        return this.show(message, 'success', title, duration);
    }

    error(message, title = 'Error', duration = 4000) {
        return this.show(message, 'error', title, duration);
    }

    info(message, title = 'Información', duration = 3000) {
        return this.show(message, 'info', title, duration);
    }

    warning(message, title = 'Atención', duration = 3500) {
        return this.show(message, 'warning', title, duration);
    }
}