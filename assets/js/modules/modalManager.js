// ============================================
// MODAL MANAGER - Sistema de modales personalizados
// ============================================

export class ModalManager {
    constructor() {
        this.container = null;
    }

    /**
     * Muestra un modal de confirmación
     */
    confirm(message, title = 'Confirmar', confirmText = 'Sí, continuar', cancelText = 'Cancelar', type = 'warning') {
        return new Promise((resolve) => {
            const icons = {
                warning: '⚠️',
                danger: '🚨',
                info: 'ℹ️'
            };

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-box">
                    <div class="modal-icon">${icons[type] || '❓'}</div>
                    <h3 class="modal-title">${title}</h3>
                    <p class="modal-message">${message}</p>
                    <div class="modal-actions">
                        <button class="modal-btn cancel" data-action="cancel">${cancelText}</button>
                        <button class="modal-btn ${type === 'danger' ? 'danger' : 'confirm'}" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const handleAction = (action) => {
                overlay.remove();
                resolve(action === 'confirm');
            };

            overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => handleAction(false));
            overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => handleAction(true));
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    handleAction(false);
                }
            });

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleAction(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }
        /**
     * Muestra un modal informativo (solo botón de cerrar)
     */
    show({ title = 'Información', content = '', confirmText = 'Entendido', showCancel = false }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-box">
                    <div class="modal-icon">🎉</div>
                    <h3 class="modal-title">${title}</h3>
                    <div class="modal-content">${content}</div>
                    <div class="modal-actions">
                        ${showCancel ? '<button class="modal-btn cancel" data-action="cancel">Cancelar</button>' : ''}
                        <button class="modal-btn confirm" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const handleClose = () => {
                overlay.remove();
                resolve(true);
            };

            overlay.querySelector('[data-action="confirm"]').addEventListener('click', handleClose);
            
            if (showCancel) {
                overlay.querySelector('[data-action="cancel"]').addEventListener('click', handleClose);
            }

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    handleClose();
                }
            });

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleClose();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }
}