// ============================================
// CONTACTO MANAGER - Formulario de contacto
// ============================================

/**
 * Gestiona el formulario de contacto
 */
export class ContactoManager {
    /**
     * @param {ToastManager} toastManager - Instancia del gestor de toasts
     */
    constructor(toastManager) {
        this.toastManager = toastManager;
        this.form = null;
        this.isInitialized = false;
    }

    /**
     * Inicializa el formulario de contacto
     */
    init() {
        console.log('📬 ContactoManager.init()');
        
        this.form = document.getElementById('contacto-form');
        if (!this.form) {
            console.warn('⚠️ Formulario de contacto no encontrado');
            return;
        }

        // Validación en tiempo real
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            input.addEventListener('input', () => {
                this.validateField(input);
            });
        });

        // Envío del formulario
        this.form.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        this.isInitialized = true;
        console.log('✅ ContactoManager inicializado correctamente');
    }

    /**
     * Valida un campo del formulario
     * @param {HTMLElement} field - Campo a validar
     * @returns {boolean} - true si es válido
     */
    validateField(field) {
        const parent = field.closest('.form-group');
        if (!parent) return true;
        
        const feedback = parent.querySelector('.field-feedback');
        if (feedback) {
            feedback.innerHTML = '';
            feedback.className = 'field-feedback';
        }
        field.classList.remove('error', 'success');

        let isValid = true;
        let errorMessage = '';

        if (field.required && !field.value.trim()) {
            isValid = false;
            errorMessage = 'Este campo es obligatorio';
        } else if (field.type === 'email' && field.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value.trim())) {
                isValid = false;
                errorMessage = 'Ingresa un email válido';
            }
        } else if (field.type === 'tel' && field.value.trim()) {
            const phoneRegex = /^(\+?\d{1,3}[-.]?)?\d{10,14}$/;
            if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Ingresa un número válido';
            }
        }

        if (!isValid) {
            field.classList.add('error');
            if (feedback) {
                feedback.innerHTML = `<span class="error-msg">⚠️ ${errorMessage}</span>`;
            }
        } else if (field.value.trim() && field.required) {
            field.classList.add('success');
            if (feedback) {
                feedback.innerHTML = `<span class="success-msg">✅ Correcto</span>`;
            }
        }

        return isValid;
    }

    /**
     * Maneja el envío del formulario
     * @param {Event} event - Evento de submit
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        // Validar todos los campos requeridos
        let isValid = true;
        const required = this.form.querySelectorAll('[required]');
        required.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            if (this.toastManager) {
                this.toastManager.warning('Por favor, completa todos los campos requeridos.', 'Formulario incompleto');
            }
            return;
        }

        // Recopilar datos
        const formData = new FormData(this.form);
        const data = {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            asunto: formData.get('asunto'),
            mensaje: formData.get('mensaje')
        };

        // Mostrar estado de carga
        const submitBtn = this.form.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Enviando...';
        submitBtn.disabled = true;

        try {
            console.log('📩 Mensaje de contacto:', data);
            
            // Simular envío (reemplazar con llamada a API)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (this.toastManager) {
                this.toastManager.success('¡Tu mensaje ha sido enviado! Te responderemos pronto.', 'Mensaje enviado');
            }
            
            this.form.reset();
            
            // Limpiar estados de validación
            this.form.querySelectorAll('.success, .error').forEach(el => {
                el.classList.remove('success', 'error');
            });
            this.form.querySelectorAll('.field-feedback').forEach(el => {
                el.innerHTML = '';
            });

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            if (this.toastManager) {
                this.toastManager.error('Hubo un error al enviar tu mensaje. Intenta nuevamente.', 'Error');
            }
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Destruye la instancia (limpia recursos)
     */
    destroy() {
        this.isInitialized = false;
        console.log('🗑️ ContactoManager destruido');
    }
}

// Exportar una instancia por defecto
export const contactoManager = new ContactoManager();