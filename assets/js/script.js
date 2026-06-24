// ============================================
// DOGGO-APP SPA ROUTER - Versión Profesional
// ============================================

// Configuración del Router
const ROUTER_CONFIG = {
    defaultView: 'home',
    viewsPath: 'views/',
    cssPath: 'assets/css/',
    titles: {
        home: 'Doggo - Inicio | No es un perro, es una movida',
        pedido: 'Doggo - Haz tu Pedido | No es un perro, es una movida',
        metodospagos: 'Doggo - Métodos de Pago | No es un perro, es una movida',
        contacto: 'Doggo - Contacto | No es un perro, es una movida'
    }
};

// ============================================
// 1. GESTOR DE ESTILOS DINÁMICOS
// ============================================

class StyleManager {
    constructor() {
        this.loadedStyles = new Set();
        this.baseStyles = ['global'];
        this.dynamicStyles = [];
    }

    loadStyle(styleName) {
        return new Promise((resolve, reject) => {
            const href = `${ROUTER_CONFIG.cssPath}${styleName}.css`;
            
            if (this.loadedStyles.has(href)) {
                return resolve(document.querySelector(`link[href="${href}"]`));
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.dataset.dynamic = 'true';
            link.dataset.styleName = styleName;

            link.onload = () => {
                this.loadedStyles.add(href);
                this.dynamicStyles.push(href);
                resolve(link);
            };
            
            link.onerror = () => {
                console.warn(`Error al cargar el estilo: ${href}`);
                reject(new Error(`Failed to load style: ${href}`));
            };

            document.head.appendChild(link);
        });
    }

    unloadDynamicStyles() {
        const dynamicLinks = document.querySelectorAll('link[data-dynamic="true"]');
        dynamicLinks.forEach(link => {
            const href = link.getAttribute('href');
            this.loadedStyles.delete(href);
            this.dynamicStyles = this.dynamicStyles.filter(h => h !== href);
            link.remove();
        });
    }

    async switchToViewStyle(viewName) {
        try {
            this.unloadDynamicStyles();
            if (viewName !== 'home') {
                await this.loadStyle(viewName);
            }
            return true;
        } catch (error) {
            console.error('Error al cambiar estilos:', error);
            return false;
        }
    }

    isStyleLoaded(styleName) {
        const href = `${ROUTER_CONFIG.cssPath}${styleName}.css`;
        return this.loadedStyles.has(href);
    }
}

// ============================================
// 2. SISTEMA DE RUTAS Y NAVEGACIÓN
// ============================================

class Router {
    constructor() {
        this.appContent = document.getElementById('app-content');
        this.styleManager = new StyleManager();
        this.currentView = null;
        this.viewCache = new Map();
        
        this.handleHashChange = this.handleHashChange.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.navigate = this.navigate.bind(this);
        
        this.init();
    }

    init() {
        window.addEventListener('hashchange', this.handleHashChange);
        document.addEventListener('click', this.handleLinkClick);
        
        const initialHash = window.location.hash || '#/home';
        this.processRoute(initialHash);
        this.updateActiveLink(initialHash);
    }

    processRoute(hash) {
        const route = hash.replace('#/', '').split('?')[0] || ROUTER_CONFIG.defaultView;
        const viewName = route || ROUTER_CONFIG.defaultView;
        this.currentView = viewName;
        this.navigate(viewName);
    }

    handleHashChange(event) {
        const newHash = event.newURL.split('#')[1] || '#/home';
        this.processRoute(newHash);
        this.updateActiveLink(newHash);
    }

    handleLinkClick(event) {
        const link = event.target.closest('a[href^="#/"]');
        if (!link) return;

        event.preventDefault();
        const href = link.getAttribute('href');
        window.location.hash = href;
    }

    updateActiveLink(hash) {
        const activeLink = hash.replace('#/', '');
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkHref = link.getAttribute('href').replace('#/', '');
            link.classList.toggle('active', linkHref === activeLink);
        });
    }

    async navigate(viewName) {
        try {
            this.showLoadingState();

            const html = await this.fetchView(viewName);
            await this.styleManager.switchToViewStyle(viewName);
            await this.renderView(html, viewName);
            this.updateTitle(viewName);
            this.dispatchViewEvent(viewName);
            this.initViewComponents(viewName);
            this.hideLoadingState();

            window.scrollTo({ top: 0, behavior: 'smooth' });

            console.log(`✅ Vista "${viewName}" cargada exitosamente`);

        } catch (error) {
            console.error(`❌ Error al cargar la vista "${viewName}":`, error);
            this.showErrorState(viewName);
        }
    }

    async fetchView(viewName) {
        const cacheKey = `view_${viewName}`;
        
        if (this.viewCache.has(cacheKey)) {
            return this.viewCache.get(cacheKey);
        }

        const url = `${ROUTER_CONFIG.viewsPath}${viewName}.html`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            this.viewCache.set(cacheKey, html);
            return html;
        } catch (error) {
            console.error('Error en fetch:', error);
            return await this.fetch404View();
        }
    }

    async fetch404View() {
        try {
            const response = await fetch(`${ROUTER_CONFIG.viewsPath}404.html`);
            if (response.ok) {
                return await response.text();
            }
        } catch (e) {}

        return `
            <div class="error-container">
                <h1>404 - Página no encontrada</h1>
                <p>Lo sentimos, la sección que buscas no existe.</p>
                <a href="#/home" class="btn btn-primary">Volver al inicio</a>
            </div>
        `;
    }

    renderView(html, viewName) {
        return new Promise((resolve) => {
            this.appContent.style.opacity = '0';
            
            setTimeout(() => {
                this.appContent.innerHTML = html;
                this.appContent.style.opacity = '1';
                resolve();
            }, 150);
        });
    }

    showLoadingState() {
        const loader = this.appContent.querySelector('.loader');
        if (loader) {
            loader.style.display = 'block';
        }
        this.appContent.classList.add('loading');
    }

    hideLoadingState() {
        this.appContent.classList.remove('loading');
        const loader = this.appContent.querySelector('.loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showErrorState(viewName) {
        this.appContent.innerHTML = `
            <div class="error-container">
                <h1>⚠️ Error al cargar la página</h1>
                <p>No pudimos cargar la sección "${viewName}".</p>
                <button onclick="location.hash='#/home'" class="btn btn-primary">
                    Ir al inicio
                </button>
            </div>
        `;
    }

    updateTitle(viewName) {
        document.title = ROUTER_CONFIG.titles[viewName] || 'Doggo - No es un perro, es una movida';
    }

    dispatchViewEvent(viewName) {
        const event = new CustomEvent('viewLoaded', { 
            detail: { viewName } 
        });
        document.dispatchEvent(event);
    }

    initViewComponents(viewName) {
        if (viewName === 'pedido') {
            this.initPedidoForm();
        }
        
        if (viewName === 'home') {
            this.initVideoHero();
        }

        this.initNavbarToggle();
    }

    // ============================================
    // 3. COMPONENTE DE PEDIDO
    // ============================================

    initPedidoForm() {
        const form = document.getElementById('pedido-form');
        if (!form) {
            console.warn('Formulario de pedido no encontrado');
            return;
        }

        const submitBtn = document.getElementById('submit-pedido');
        if (!submitBtn) {
            console.warn('Botón de envío no encontrado');
            return;
        }

        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        let isSubmitting = false;

        // --- Validación en tiempo real ---
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateField(input));
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('change', () => {
                this.validateField(input);
                this.updateOrderSummary(form);
            });
        });

        // Extras: actualizar resumen al cambiar
        form.querySelectorAll('input[name="extras"]').forEach(cb => {
            cb.addEventListener('change', () => this.updateOrderSummary(form));
        });

        // --- Envío del formulario ---
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isSubmitting) return;

            // 1. Validar todos los campos
            let isValid = true;
            const allInputs = form.querySelectorAll('input, select');
            allInputs.forEach(input => {
                if (input.required && !input.value.trim()) {
                    isValid = false;
                    this.validateField(input);
                }
                if (input.type === 'email' && input.value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(input.value)) {
                        isValid = false;
                        this.validateField(input);
                    }
                }
                if (input.type === 'tel' && input.value) {
                    const phoneRegex = /^(\+?\d{1,3}[-.]?)?\d{10,14}$/;
                    if (!phoneRegex.test(input.value.replace(/\s/g, ''))) {
                        isValid = false;
                        this.validateField(input);
                    }
                }
            });

            if (!isValid) {
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
                return;
            }

            // 2. Recopilar datos
            const formData = new FormData(form);
            const leadData = {
                nombre: formData.get('nombre').trim(),
                email: formData.get('email').trim(),
                whatsapp: formData.get('whatsapp').trim(),
                tipo: formData.get('tipo'),
                extras: formData.getAll('extras'),
                bebida: formData.get('bebida')
            };

            // 3. Construir mensaje de WhatsApp
            const mensaje = this.buildWhatsAppMessage(leadData);

            // 4. Mostrar estado de carga
            isSubmitting = true;
            submitBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline';

            // 5. Procesar y abrir WhatsApp
            try {
                console.log('📩 Lead capturado:', leadData);
                
                // Aquí iría la llamada a tu CRM/API
                await new Promise(resolve => setTimeout(resolve, 500));
                
                this.openWhatsApp(mensaje);
                
            } catch (error) {
                console.error('Error al procesar pedido:', error);
                alert('Hubo un error al procesar tu pedido. Intenta nuevamente.');
            } finally {
                setTimeout(() => {
                    isSubmitting = false;
                    submitBtn.disabled = false;
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                }, 1000);
            }
        });

        // Actualizar resumen inicial
        this.updateOrderSummary(form);
    }

    buildWhatsAppMessage(data) {
        const { nombre, email, whatsapp, tipo, extras, bebida } = data;
        
        let mensaje = `🍔 *NUEVO PEDIDO DOGGO*%0A%0A`;
        mensaje += `👤 *Cliente:* ${nombre}%0A`;
        mensaje += `📧 *Email:* ${email}%0A`;
        mensaje += `📱 *WhatsApp:* ${whatsapp}%0A%0A`;
        mensaje += `🌭 *Pedido:*%0A`;
        mensaje += `- Tipo: *${tipo}*%0A`;
        
        if (extras && extras.length > 0) {
            mensaje += `- Extras: ${extras.join(', ')}%0A`;
        } else {
            mensaje += `- Extras: Ninguno%0A`;
        }
        
        mensaje += `- Bebida: ${bebida || 'Sin bebida'}%0A%0A`;
        mensaje += `_¡Listo para preparar!_ 🚀`;

        return mensaje;
    }

    openWhatsApp(mensaje) {
        // Reemplaza con el número real de WhatsApp del negocio
        const phoneNumber = '584245231898'; 
        const url = `https://wa.me/${phoneNumber}?text=${mensaje}`;
        window.open(url, '_blank');
    }

    updateOrderSummary(form) {
        const summaryContainer = document.getElementById('order-summary');
        if (!summaryContainer) return;

        const formData = new FormData(form);
        const tipo = formData.get('tipo');
        const extras = formData.getAll('extras');
        const bebida = formData.get('bebida');

        if (!tipo) {
            summaryContainer.innerHTML = `<p class="empty-summary">Aún no has seleccionado nada. ¡Arma tu movida!</p>`;
            return;
        }

        let html = `<div class="summary-item"><strong>🌭 Tipo:</strong> ${tipo}</div>`;
        
        if (extras.length > 0) {
            html += `<div class="summary-item"><strong>🧩 Extras:</strong> ${extras.join(', ')}</div>`;
        }
        
        html += `<div class="summary-item"><strong>🥤 Bebida:</strong> ${bebida || 'Sin bebida'}</div>`;
        html += `<div class="summary-total">🔥 ¡Tu Doggo está listo para pedir!</div>`;

        summaryContainer.innerHTML = html;
    }

    validateField(field) {
        const parent = field.closest('.form-group');
        if (!parent) return;
        
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
                errorMessage = 'Ingresa un email válido (ej: usuario@dominio.com)';
            }
        } else if (field.type === 'tel' && field.value.trim()) {
            const phoneRegex = /^(\+?\d{1,3}[-.]?)?\d{10,14}$/;
            if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Ingresa un número de WhatsApp válido (ej: 584141234567)';
            }
        } else if (field.tagName === 'SELECT' && field.required && !field.value) {
            isValid = false;
            errorMessage = 'Selecciona una opción';
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
    }

    // ============================================
    // 4. COMPONENTE DE HOME
    // ============================================

    initVideoHero() {
        const video = document.querySelector('.hero-video');
        if (video) {
            video.play().catch(() => {
                console.log('Video autoplay prevented, user interaction needed');
            });
        }
    }

    // ============================================
    // 5. COMPONENTE DE NAVBAR
    // ============================================

    initNavbarToggle() {
        const toggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (toggle && navMenu) {
            // Remover listeners anteriores para evitar duplicados
            toggle.replaceWith(toggle.cloneNode(true));
            const newToggle = document.querySelector('.nav-toggle');
            
            newToggle.addEventListener('click', () => {
                const isOpen = navMenu.classList.toggle('active');
                newToggle.classList.toggle('active');
                newToggle.setAttribute('aria-expanded', isOpen);
            });
        }
    }
}

// ============================================
// 6. INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const app = new Router();
    
    window.__DOGGO_APP__ = {
        router: app,
        version: '1.0.1'
    };

    console.log('🐕 ¡Doggo App iniciada!');
    console.log('📱 Versión SPA Profesional v1.0.1');
});

// ============================================
// 7. SERVICIO DE LOGGING
// ============================================

const Logger = {
    info: (message, ...args) => console.info(`🐕 [INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`🐕 [WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`🐕 [ERROR] ${message}`, ...args),
    debug: (message, ...args) => {
        if (localStorage.getItem('doggo_debug') === 'true') {
            console.debug(`🐕 [DEBUG] ${message}`, ...args);
        }
    }
};