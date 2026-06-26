// ============================================
// MICRO-INTERACCIONES - Animaciones y efectos
// ============================================

/**
 * Inicializa las micro-interacciones de la aplicación
 */
export function initMicroInteractions() {
    // Efecto de escala en botones
    document.querySelectorAll('button:not(.toast-close)').forEach(btn => {
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Efecto hover en tarjetas
    document.querySelectorAll('.doggo-card, .extra-chip, .delivery-card, .bebida-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        });
    });
}