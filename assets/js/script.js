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
        this.baseStyles = ['global']; // CSS que siempre debe estar cargado
        this.dynamicStyles = [];
    }

    /**
     * Carga una hoja de estilos CSS dinámicamente
     * @param {string} styleName - Nombre del archivo CSS (sin extensión)
     * @returns {Promise<HTMLLinkElement>}
     */
    loadStyle(styleName) {
        return new Promise((resolve, reject) => {
            const href = `${ROUTER_CONFIG.cssPath}${styleName}.css`;
            
            // Verificar si ya está cargado
            if (this.loadedStyles.has(href)) {
                return resolve(document.querySelector(`link[href="${href}"]`));
            }

            // Crear elemento link
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.dataset.dynamic = 'true';
            link.dataset.styleName = styleName;

            // Eventos de carga/error
            link.onload = () => {
                this.loadedStyles.add(href);
                this.dynamicStyles.push(href);
                resolve(link);
            };
            
            link.onerror = () => {
                console.warn(`Error al cargar el estilo: ${href}`);
                reject(new Error(`Failed to load style: ${href}`));
            };

            // Añadir al head
            document.head.appendChild(link);
        });
    }

    /**
     * Elimina todos los estilos dinámicos excepto los base
     */
    unloadDynamicStyles() {
        const dynamicLinks = document.querySelectorAll('link[data-dynamic="true"]');
        dynamicLinks.forEach(link => {
            const href = link.getAttribute('href');
            this.loadedStyles.delete(href);
            this.dynamicStyles = this.dynamicStyles.filter(h => h !== href);
            link.remove();
        });
    }

    /**
     * Cambia a un nuevo conjunto de estilos
     * @param {string} viewName - Nombre de la vista actual
     */
    async switchToViewStyle(viewName) {
        try {
            // 1. Limpiar estilos dinámicos anteriores
            this.unloadDynamicStyles();

            // 2. Cargar estilo de la nueva vista
            if (viewName !== 'home') {
                await this.loadStyle(viewName);
            }

            return true;
        } catch (error) {
            console.error('Error al cambiar estilos:', error);
            return false;
        }
    }

    /**
     * Verifica si un estilo está cargado
     * @param {string} styleName 
     * @returns {boolean}
     */
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
        
        // Bindear eventos
        this.handleHashChange = this.handleHashChange.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.navigate = this.navigate.bind(this);
        
        // Inicializar
        this.init();
    }

    init() {
        // Escuchar cambios en el hash
        window.addEventListener('hashchange', this.handleHashChange);
        
        // Escuchar clicks en links
        document.addEventListener('click', this.handleLinkClick);
        
        // Cargar vista inicial
        const initialHash = window.location.hash || '#/home';
        this.processRoute(initialHash);
        
        // Marcar enlace activo
        this.updateActiveLink(initialHash);
    }

    /**
     * Procesa el hash de la URL y determina la vista
     * @param {string} hash 
     */
    processRoute(hash) {
        const route = hash.replace('#/', '').split('?')[0] || ROUTER_CONFIG.defaultView;
        const viewName = route || ROUTER_CONFIG.defaultView;
        this.currentView = viewName;
        this.navigate(viewName);
    }

    /**
     * Maneja el evento hashchange
     * @param {HashChangeEvent} event 
     */
    handleHashChange(event) {
        const newHash = event.newURL.split('#')[1] || '#/home';
        this.processRoute(newHash);
        this.updateActiveLink(newHash);
    }

    /**
     * Maneja clicks en links para navegación SPA
     * @param {MouseEvent} event 
     */
    handleLinkClick(event) {
        const link = event.target.closest('a[href^="#/"]');
        if (!link) return;

        // Prevenir comportamiento por defecto
        event.preventDefault();
        
        const href = link.getAttribute('href');
        window.location.hash = href;
    }

    /**
     * Actualiza el enlace activo en el navbar
     * @param {string} hash 
     */
    updateActiveLink(hash) {
        const activeLink = hash.replace('#/', '');
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkHref = link.getAttribute('href').replace('#/', '');
            link.classList.toggle('active', linkHref === activeLink);
        });
    }

    /**
     * Navega a una vista específica
     * @param {string} viewName 
     */
    async navigate(viewName) {
        try {
            // Mostrar estado de carga
            this.showLoadingState();

            // 1. Cargar y renderizar la vista
            const html = await this.fetchView(viewName);
            
            // 2. Cambiar estilos dinámicos
            await this.styleManager.switchToViewStyle(viewName);
            
            // 3. Inyectar contenido
            await this.renderView(html, viewName);
            
            // 4. Actualizar título
            this.updateTitle(viewName);
            
            // 5. Disparar eventos específicos de la vista
            this.dispatchViewEvent(viewName);
            
            // 6. Inicializar componentes de la vista
            this.initViewComponents(viewName);
            
            // 7. Ocultar estado de carga
            this.hideLoadingState();

            // 8. Scroll suave al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });

            console.log(`✅ Vista "${viewName}" cargada exitosamente`);

        } catch (error) {
            console.error(`❌ Error al cargar la vista "${viewName}":`, error);
            this.showErrorState(viewName);
        }
    }

    /**
     * Obtiene el HTML de una vista (con caché)
     * @param {string} viewName 
     * @returns {Promise<string>}
     */
    async fetchView(viewName) {
        const cacheKey = `view_${viewName}`;
        
        // Verificar caché
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
            
            // Guardar en caché
            this.viewCache.set(cacheKey, html);
            
            return html;
        } catch (error) {
            console.error('Error en fetch:', error);
            // Intentar cargar vista 404
            const fallbackHtml = await this.fetch404View();
            return fallbackHtml;
        }
    }

    /**
     * Obtiene el HTML de la vista 404
     * @returns {Promise<string>}
     */
    async fetch404View() {
        try {
            const response = await fetch(`${ROUTER_CONFIG.viewsPath}404.html`);
            if (response.ok) {
                return await response.text();
            }
        } catch (e) {
            // Fallback inline
        }
        
        // Fallback HTML básico
        return `
            <div class="error-container">
                <h1>404 - Página no encontrada</h1>
                <p>Lo sentimos, la sección que buscas no existe.</p>
                <a href="#/home" class="btn btn-primary">Volver al inicio</a>
            </div>
        `;
    }

    /**
     * Renderiza el contenido en el DOM
     * @param {string} html 
     * @param {string} viewName 
     */
    renderView(html, viewName) {
        return new Promise((resolve) => {
            // Transición suave
            this.appContent.style.opacity = '0';
            
            setTimeout(() => {
                this.appContent.innerHTML = html;
                this.appContent.style.opacity = '1';
                resolve();
            }, 150);
        });
    }

    /**
     * Muestra el estado de carga
     */
    showLoadingState() {
        // Añadir clase de carga si existe el loader
        const loader = this.appContent.querySelector('.loader');
        if (loader) {
            loader.style.display = 'block';
        }
        this.appContent.classList.add('loading');
    }

    /**
     * Oculta el estado de carga
     */
    hideLoadingState() {
        this.appContent.classList.remove('loading');
        const loader = this.appContent.querySelector('.loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Muestra el estado de error
     * @param {string} viewName 
     */
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

    /**
     * Actualiza el título de la página
     * @param {string} viewName 
     */
    updateTitle(viewName) {
        document.title = ROUTER_CONFIG.titles[viewName] || 'Doggo - No es un perro, es una movida';
    }

    /**
     * Dispara un evento personalizado para la vista
     * @param {string} viewName 
     */
    dispatchViewEvent(viewName) {
        const event = new CustomEvent('viewLoaded', { 
            detail: { viewName } 
        });
        document.dispatchEvent(event);
    }

    /**
     * Inicializa componentes específicos de la vista
     * @param {string} viewName 
     */
    initViewComponents(viewName) {
        // Si es la vista de pedido, inicializar el formulario
        if (viewName === 'pedido') {
            this.initPedidoForm();
        }
        
        // Si es la vista de home, inicializar video
        if (viewName === 'home') {
            this.initVideoHero();
        }

        // Inicializar navbar toggle para responsive
        this.initNavbarToggle();
    }

    /**
     * Inicializa el formulario de pedido
     */
    initPedidoForm() {
        const form = document.getElementById('pedido-form');
        if (!form) return;

        // Prevenir envío múltiple
        let isSubmitting = false;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isSubmitting) return;
            isSubmitting = true;

            try {
                // Aquí irá la lógica de validación y envío
                // (Lo implementaremos en el Paso 3)
                console.log('📝 Formulario de pedido interceptado');
                
                // Simular procesamiento
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Mostrar mensaje de éxito temporal
                const button = form.querySelector('button[type="submit"]');
                const originalText = button.textContent;
                button.textContent = '✅ ¡Pedido listo!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
                
                // Aquí se abrirá WhatsApp (Paso 3)
                
            } catch (error) {
                console.error('Error al procesar pedido:', error);
                alert('Hubo un error al procesar tu pedido. Intenta nuevamente.');
            } finally {
                isSubmitting = false;
            }
        });

        // Validación en tiempo real
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateField(input);
            });
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    /**
     * Valida un campo individual del formulario
     * @param {HTMLElement} field 
     */
    validateField(field) {
        // Eliminar mensaje de error anterior
        const parent = field.closest('.form-group');
        if (!parent) return;
        
        const oldError = parent.querySelector('.error-message');
        if (oldError) oldError.remove();
        field.classList.remove('error', 'success');

        // Validar según tipo
        let isValid = true;
        let errorMessage = '';

        if (field.required && !field.value.trim()) {
            isValid = false;
            errorMessage = 'Este campo es obligatorio';
        } else if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                isValid = false;
                errorMessage = 'Ingresa un email válido';
            }
        } else if (field.type === 'tel' && field.value) {
            const phoneRegex = /^(\+?\d{1,3}[-.]?)?\d{10,14}$/;
            if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Ingresa un número de WhatsApp válido';
            }
        }

        // Mostrar resultado
        if (!isValid && field.value) {
            field.classList.add('error');
            const errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            errorEl.textContent = errorMessage;
            parent.appendChild(errorEl);
        } else if (isValid && field.value) {
            field.classList.add('success');
        }
    }

    /**
     * Inicializa el video del hero
     */
    initVideoHero() {
        const video = document.querySelector('.hero-video');
        if (video) {
            // Asegurar reproducción
            video.play().catch(() => {
                console.log('Video autoplay prevented, user interaction needed');
            });
        }
    }

    /**
     * Inicializa el toggle del navbar en móvil
     */
    initNavbarToggle() {
        const toggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (toggle && navMenu) {
            toggle.addEventListener('click', () => {
                const isOpen = navMenu.classList.toggle('active');
                toggle.classList.toggle('active');
                toggle.setAttribute('aria-expanded', isOpen);
            });
        }
    }
}

// ============================================
// 3. INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el router
    const app = new Router();
    
    // Exponer funciones globales si es necesario (para debugging)
    window.__DOGGO_APP__ = {
        router: app,
        version: '1.0.0'
    };

    console.log('🐕 ¡Doggo App iniciada!');
    console.log('📱 Versión SPA Profesional');
});

// ============================================
// 4. SERVICIO DE LOGGING (Opcional)
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

// Para activar modo debug: localStorage.setItem('doggo_debug', 'true')