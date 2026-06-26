// ============================================
// MODAL MANAGER - Sistema de modales personalizados
// ============================================

/**
 * Sistema de modales de confirmación personalizados
 */
export class ModalManager {
    constructor() {
        this.container = null;
    }

    /**
     * Muestra un modal de confirmación
     * @param {string} message - Mensaje principal
     * @param {string} title - Título del modal
     * @param {string} confirmText - Texto del botón confirmar
     * @param {string} cancelText - Texto del botón cancelar
     * @param {string} type - Tipo: 'warning', 'danger', 'info'
     * @returns {Promise<boolean>} - Resuelve con true si confirma, false si cancela
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
}

// Exportar una instancia por defecto
export const modalManager = new ModalManager();