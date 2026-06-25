// ============================================
// DOGGO-APP SPA ROUTER - VERSIÓN FINAL v6.0.2
// ============================================

// 1. Configuración
const ROUTER_CONFIG = {
    defaultView: 'home',
    viewsPath: 'views/',
    cssPath: 'assets/css/',
    titles: {
        home: 'Doggo - Inicio | No es un perro, es una movida',
        pedido: 'Doggo - Haz tu Pedido | No es un perro, es una movida',
        metodospagos: 'Doggo - Métodos de Pago | No es un perro, es una movida',
        contacto: 'Doggo - Contacto | No es un perro, es una movida',
        sobre: 'Doggo - Sobre este proyecto' // ✅ NUEVO
    }
};

console.log('📋 Configuración cargada');

// 2. StyleManager
class StyleManager {
    constructor() {
        console.log('🎨 StyleManager creado');
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
            
            if (viewName === 'home' || viewName === '/home') {
                await this.loadStyle('home');
            } else if (viewName !== 'home') {
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

console.log('✅ StyleManager definido');

// 3. SISTEMA DE MODAL PERSONALIZADO
class ModalManager {
    constructor() {
        this.container = null;
    }

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

const Modal = new ModalManager();

// 4. SISTEMA DE NOTIFICACIONES (TOASTS)
class ToastManager {
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

const Toast = new ToastManager();
console.log('✅ Sistema de notificaciones listo');

// 5. Router Principal
class Router {
    constructor() {
        console.log('🚀 Iniciando Router...');
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
        console.log('🔧 Inicializando Router...');
        window.addEventListener('hashchange', this.handleHashChange);
        document.addEventListener('click', this.handleLinkClick);
        
        const initialHash = window.location.hash || '#/home';
        console.log(`📍 Hash inicial: ${initialHash}`);
        this.processRoute(initialHash);
        this.updateActiveLink(initialHash);
    }

    processRoute(hash) {
        const route = hash.replace('#/', '').split('?')[0] || ROUTER_CONFIG.defaultView;
        const viewName = route || ROUTER_CONFIG.defaultView;
        console.log(`🔄 Procesando ruta: ${viewName}`);
        this.currentView = viewName;
        this.navigate(viewName);
    }

    handleHashChange(event) {
        const newHash = event.newURL.split('#')[1] || '#/home';
        console.log(`🔄 Hash cambiado a: ${newHash}`);
        this.processRoute(newHash);
        this.updateActiveLink(newHash);
    }

    handleLinkClick(event) {
        const link = event.target.closest('a[href^="#/"]');
        if (!link) return;

        event.preventDefault();
        const href = link.getAttribute('href');
        console.log(`🔗 Navegando a: ${href}`);
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
        console.log(`📄 Navegando a vista: ${viewName}`);
        try {
            this.showSkeleton();
            
            const [html] = await Promise.all([
                this.fetchView(viewName),
                this.styleManager.switchToViewStyle(viewName)
            ]);
            
            await this.renderViewSmooth(html, viewName);
            
            this.updateTitle(viewName);
            this.dispatchViewEvent(viewName);
            this.initViewComponents(viewName);
            
            this.hideSkeleton();

            window.scrollTo({ top: 0, behavior: 'smooth' });

            console.log(`✅ Vista "${viewName}" cargada exitosamente`);

        } catch (error) {
            console.error(`❌ Error al cargar la vista "${viewName}":`, error);
            this.showErrorState(viewName);
        }
    }

    showSkeleton() {
        this.appContent.classList.add('loading');
        this.appContent.style.opacity = '1';
    }

    hideSkeleton() {
        this.appContent.classList.remove('loading');
        this.appContent.style.opacity = '1';
    }

    renderViewSmooth(html, viewName) {
        return new Promise((resolve) => {
            this.appContent.style.transition = 'opacity 0.3s ease';
            this.appContent.style.opacity = '0';
            
            setTimeout(() => {
                this.appContent.innerHTML = html;
                
                if (viewName === 'home' || viewName === '/home') {
                    const hero = this.appContent.querySelector('.hero-section');
                    if (hero) {
                        hero.style.minHeight = '100vh';
                        hero.style.display = 'flex';
                    }
                }
                
                this.appContent.offsetHeight;
                this.appContent.style.opacity = '1';
                
                setTimeout(() => {
                    this.appContent.style.transition = '';
                    resolve();
                }, 350);
            }, 200);
        });
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
                this.appContent.offsetHeight;
                
                if (viewName === 'home' || viewName === '/home') {
                    const hero = this.appContent.querySelector('.hero-section');
                    if (hero) {
                        hero.style.minHeight = '100vh';
                        hero.style.display = 'flex';
                    }
                }
                
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
        console.log(`🔍 Inicializando componentes para: ${viewName}`);
        
        const cleanViewName = viewName.replace('/', '');
        
        if (cleanViewName === 'pedido') {
            setTimeout(() => {
                this.initPedidoForm();
            }, 200);
        }
        
        if (cleanViewName === 'home') {
            setTimeout(() => {
                const heroSection = document.querySelector('.hero-section');
                if (!heroSection) {
                    console.warn('⚠️ Hero section no encontrada, reintentando...');
                    setTimeout(() => {
                        this.initHeroImage();
                    }, 200);
                    return;
                }
                this.initHeroImage();
            }, 300);
        }

        if (cleanViewName === 'contacto') {
            setTimeout(() => {
                this.initContactoForm();
            }, 200);
        }

        // ✅ NUEVO: No necesita inicialización especial, solo CSS
        if (cleanViewName === 'sobre') {
            console.log('📄 Página Sobre cargada');
        }

        this.initNavbarToggle();
    }

    // ============================================
    // 6. COMPONENTE DE HOME - IMAGEN
    // ============================================

    initHeroImage() {
        console.log('🖼️ Inicializando hero con imagen...');
        
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) {
            console.warn('⚠️ Hero section no encontrada');
            return;
        }

        heroSection.style.minHeight = '100vh';
        heroSection.style.display = 'flex';
        heroSection.style.alignItems = 'center';
        heroSection.style.justifyContent = 'center';

        const heroImage = document.querySelector('.hero-image');
        if (heroImage) {
            heroImage.style.display = 'block';
            heroImage.style.width = '100%';
            heroImage.style.height = '100%';
            heroImage.style.objectFit = 'cover';
        }

        console.log('✅ Hero con imagen inicializado correctamente');
    }

    // ============================================
    // 7. COMPONENTE DE PEDIDO
    // ============================================

    initPedidoForm() {
        console.log('🔍 initPedidoForm() ejecutado');
        
        const form = document.getElementById('pedido-form');
        if (!form) {
            console.error('❌ Formulario de pedido NO encontrado');
            return;
        }
        console.log('✅ Formulario encontrado');

        this.orderState = {
            currentStep: 1,
            totalSteps: 4,
            doggos: {},
            extras: {},
            bebidas: {},
            delivery: 'pickup',
            direccion: '',
            referencias: '',
            leadData: {
                nombre: '',
                email: '',
                whatsapp: ''
            }
        };

        this.PRICES = {
            doggos: {
                'Clásico': 8000,
                'Americano': 9500,
                'Mexicano': 10000,
                'Bacon': 10500,
                'Veggie': 9000,
                'Hawaiano': 9500
            },
            extras: {
                'Queso extra': 1500,
                'Bacon': 2000,
                'Jalapeños': 1000,
                'Guacamole': 2500,
                'Champiñones': 1500,
                'Cebolla caramelizada': 1000,
                'Pimentón asado': 1000,
                'Queso rallado extra': 1000
            },
            bebidas: {
                'Refresco': 2500,
                'Agua': 1500,
                'Cerveza': 4000,
                'Malteada': 5000,
                'Jugo natural': 3000,
                'Limonada': 2500
            },
            delivery: 1.5
        };

        this.loadOrderState();

        console.log('📦 Estado inicial:', this.orderState);

        this.initStepper(form);
        this.initDoggoQuantities(form);
        this.initExtraQuantities(form);
        this.initBebidasQuantities(form);
        this.initDeliveryOption(form);
        this.initDireccionFields(form);
        this.initLeadFields(form);
        //this.initClearCart(form);//
        this.initFormSubmit(form);
        
        this.updateSummary();
        
        console.log('✅ PedidoForm inicializado correctamente');
    }

    // --- Stepper ---
    initStepper(form) {
        console.log('🔍 initStepper() ejecutado');
        
        const steps = form.querySelectorAll('.step-content');
        const indicators = document.querySelectorAll('.step-indicator');

        const self = this;

        const showStep = (stepNumber) => {
            console.log(`🔄 Mostrando paso ${stepNumber}`);
            
            if (stepNumber > self.orderState.currentStep) {
                const isValid = self.validateCurrentStep(self.orderState.currentStep, form);
                if (!isValid) return;
            }

            self.orderState.currentStep = stepNumber;
            
            steps.forEach(step => {
                const stepNum = parseInt(step.dataset.step);
                step.classList.toggle('active', stepNum === stepNumber);
            });

            indicators.forEach(indicator => {
                const step = parseInt(indicator.dataset.step);
                indicator.classList.remove('active', 'completed');
                if (step === stepNumber) {
                    indicator.classList.add('active');
                } else if (step < stepNumber) {
                    indicator.classList.add('completed');
                }
            });

            document.querySelectorAll('.step-line').forEach((line, index) => {
                line.classList.toggle('completed', index < stepNumber - 1);
            });

            if (stepNumber === 3) {
                self.toggleDireccionFields(form);
            }

            self.saveOrderState();
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        form.addEventListener('click', function(e) {
            const target = e.target.closest('.btn-next');
            if (target) {
                e.preventDefault();
                e.stopPropagation();
                const step = parseInt(target.dataset.next);
                console.log(`🖱️ Click en botón (delegado) -> paso ${step}`);
                if (step <= self.orderState.totalSteps) {
                    showStep(step);
                }
            }
        });

        form.addEventListener('click', function(e) {
            const target = e.target.closest('.btn-prev');
            if (target) {
                e.preventDefault();
                e.stopPropagation();
                const step = parseInt(target.dataset.prev);
                console.log(`🖱️ Click en botón atrás (delegado) -> paso ${step}`);
                if (step >= 1) {
                    showStep(step);
                }
            }
        });

        indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const step = parseInt(indicator.dataset.step);
                if (step < self.orderState.currentStep || indicator.classList.contains('completed')) {
                    showStep(step);
                }
            });
        });

        console.log(`📍 Mostrando paso inicial: ${self.orderState.currentStep}`);
        showStep(self.orderState.currentStep);
    }

    toggleDireccionFields(form) {
        const deliveryOption = this.orderState.delivery;
        const direccionGroup = form.querySelector('.direccion-group');
        
        if (direccionGroup) {
            if (deliveryOption === 'delivery') {
                direccionGroup.style.display = 'block';
                direccionGroup.style.animation = 'fadeSlideIn 0.3s ease';
            } else {
                direccionGroup.style.display = 'none';
            }
        }
    }

    validateCurrentStep(step, form) {
        console.log(`🔍 Validando paso ${step}`);
        switch(step) {
            case 1:
                const result = this.validateLeadFields(form);
                console.log(`📊 Resultado validación paso 1: ${result}`);
                return result;
            case 2:
                return this.validateDoggos();
            case 3:
                return this.validateStep3(form);
            default:
                return true;
        }
    }

    validateStep3(form) {
        if (this.orderState.delivery === 'delivery') {
            const direccion = form.querySelector('#direccion');
            if (!direccion || !direccion.value.trim()) {
                Toast.warning('Por favor, ingresa la dirección de envío.', 'Dirección requerida');
                direccion?.focus();
                return false;
            }
        }
        return true;
    }

    validateLeadFields(form) {
        console.log('🔍 Validando campos de lead');
        
        const inputs = form.querySelectorAll('.step-content[data-step="1"] input[required]');
        console.log(`📊 Campos requeridos: ${inputs.length}`);
        
        let isValid = true;

        inputs.forEach(input => {
            const value = input.value.trim();
            console.log(`📝 Campo ${input.id}: "${value}"`);
            
            if (!value) {
                console.log(`❌ Campo ${input.id} vacío`);
                isValid = false;
                this.validateField(input);
            } else if (input.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    console.log(`❌ Email inválido: ${value}`);
                    isValid = false;
                    this.validateField(input);
                }
            } else if (input.type === 'tel') {
                const phoneRegex = /^(\+?\d{1,3}[-.]?)?\d{10,14}$/;
                if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                    console.log(`❌ Teléfono inválido: ${value}`);
                    isValid = false;
                    this.validateField(input);
                }
            }
        });

        if (!isValid) {
            console.warn('⚠️ Validación de campos fallida');
            Toast.warning('Por favor, revisa los campos marcados en rojo.', 'Datos incompletos');
            
            const firstError = form.querySelector('.step-content[data-step="1"] .error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
        }

        return isValid;
    }

    validateDoggos() {
        const total = Object.values(this.orderState.doggos).reduce((sum, qty) => sum + qty, 0);
        if (total === 0) {
            Toast.warning('¡Agrega al menos un Doggo a tu pedido!', 'Carrito vacío');
            return false;
        }
        return true;
    }

    initDoggoQuantities(form) {
        const cards = form.querySelectorAll('.doggo-card');
        cards.forEach(card => {
            const value = card.dataset.value;
            const qtyDisplay = card.querySelector('.qty-value');
            const minusBtn = card.querySelector('.qty-btn.minus');
            const plusBtn = card.querySelector('.qty-btn.plus');

            if (this.orderState.doggos[value]) {
                qtyDisplay.textContent = this.orderState.doggos[value];
                card.classList.add('has-items');
            }

            const updateQuantity = (change) => {
                let current = parseInt(qtyDisplay.textContent) || 0;
                let newQty = Math.max(0, current + change);
                
                if (newQty > 0) {
                    this.orderState.doggos[value] = newQty;
                    card.classList.add('has-items');
                    if (change > 0) {
                        Toast.success(`${value} añadido al carrito`, '¡Agregado!', 1500);
                    }
                } else {
                    delete this.orderState.doggos[value];
                    card.classList.remove('has-items');
                }
                
                qtyDisplay.textContent = newQty;
                this.updateSummary();
                this.saveOrderState();
            };

            minusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateQuantity(-1);
            });

            plusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateQuantity(1);
            });
        });
    }

    initExtraQuantities(form) {
        const chips = form.querySelectorAll('.extra-chip');
        chips.forEach(chip => {
            const value = chip.dataset.value;
            const qtyDisplay = chip.querySelector('.qty-value-mini');
            const minusBtn = chip.querySelector('.qty-btn-mini.minus');
            const plusBtn = chip.querySelector('.qty-btn-mini.plus');

            if (this.orderState.extras[value]) {
                qtyDisplay.textContent = this.orderState.extras[value];
                chip.classList.add('has-items');
            }

            const updateQuantity = (change) => {
                let current = parseInt(qtyDisplay.textContent) || 0;
                let newQty = Math.max(0, current + change);
                
                if (newQty > 0) {
                    this.orderState.extras[value] = newQty;
                    chip.classList.add('has-items');
                    if (change > 0) {
                        Toast.info(`${value} añadido (${newQty}x)`, 'Extra agregado', 1500);
                    }
                } else {
                    delete this.orderState.extras[value];
                    chip.classList.remove('has-items');
                }
                
                qtyDisplay.textContent = newQty;
                this.updateSummary();
                this.saveOrderState();
            };

            minusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateQuantity(-1);
            });

            plusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateQuantity(1);
            });
        });
    }

    initBebidasQuantities(form) {
        console.log('🔍 initBebidasQuantities() ejecutado');
        
        const cards = form.querySelectorAll('.bebida-card');
        console.log(`📊 Bebidas encontradas: ${cards.length}`);
        
        cards.forEach(card => {
            const value = card.dataset.value;
            const qtyDisplay = card.querySelector('.qty-value-mini');
            const minusBtn = card.querySelector('.qty-btn-mini.minus');
            const plusBtn = card.querySelector('.qty-btn-mini.plus');

            if (this.orderState.bebidas[value]) {
                qtyDisplay.textContent = this.orderState.bebidas[value];
                card.classList.add('has-items');
            }

            const updateQuantity = (change) => {
                let current = parseInt(qtyDisplay.textContent) || 0;
                let newQty = Math.max(0, current + change);
                
                if (newQty > 0) {
                    this.orderState.bebidas[value] = newQty;
                    card.classList.add('has-items');
                    if (change > 0) {
                        Toast.info(`${value} (${newQty}x) añadida`, 'Bebida agregada', 1500);
                    }
                } else {
                    delete this.orderState.bebidas[value];
                    card.classList.remove('has-items');
                }
                
                qtyDisplay.textContent = newQty;
                this.updateSummary();
                this.saveOrderState();
            };

            minusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateQuantity(-1);
            });

            plusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateQuantity(1);
            });
        });
    }

    initDeliveryOption(form) {
        const cards = form.querySelectorAll('.delivery-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.orderState.delivery = card.dataset.value;
                
                this.toggleDireccionFields(form);
                
                const deliveryText = card.dataset.value === 'pickup' ? 'Recoger en local' : 'Envío a domicilio';
                Toast.info(`Opción seleccionada: ${deliveryText}`, 'Entrega', 2000);
                
                this.updateSummary();
                this.saveOrderState();
            });

            if (this.orderState.delivery === card.dataset.value) {
                card.classList.add('selected');
            }
        });
    }

    initDireccionFields(form) {
        const direccionInput = form.querySelector('#direccion');
        const referenciasInput = form.querySelector('#referencias');

        if (direccionInput) {
            if (this.orderState.direccion) {
                direccionInput.value = this.orderState.direccion;
            }
            direccionInput.addEventListener('input', () => {
                this.orderState.direccion = direccionInput.value.trim();
                this.saveOrderState();
                this.updateSummary();
            });
        }

        if (referenciasInput) {
            if (this.orderState.referencias) {
                referenciasInput.value = this.orderState.referencias;
            }
            referenciasInput.addEventListener('input', () => {
                this.orderState.referencias = referenciasInput.value.trim();
                this.saveOrderState();
                this.updateSummary();
            });
        }
    }

    initLeadFields(form) {
        const fields = ['nombre', 'email', 'whatsapp'];
        fields.forEach(fieldName => {
            const input = form.querySelector(`#${fieldName}`);
            if (input) {
                if (this.orderState.leadData[fieldName]) {
                    input.value = this.orderState.leadData[fieldName];
                }

                input.addEventListener('input', () => {
                    this.orderState.leadData[fieldName] = input.value.trim();
                    this.saveOrderState();
                    this.validateField(input);
                });

                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            }
        });
    }

    initClearCart(form) {
        const clearButtons = form.querySelectorAll('.btn-clear-cart');
        clearButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await Modal.confirm(
                    'Esta acción eliminará todos los items de tu carrito y tus datos de contacto.',
                    '¿Vaciar todo el pedido?',
                    'Sí, vaciar todo',
                    'Cancelar',
                    'danger'
                );
                
                if (confirmed) {
                    this.clearCart();
                }
            });
        });
    }

    clearCart() {
        this.orderState.doggos = {};
        this.orderState.extras = {};
        this.orderState.bebidas = {};
        this.orderState.delivery = 'pickup';
        this.orderState.direccion = '';
        this.orderState.referencias = '';
        this.orderState.leadData = { nombre: '', email: '', whatsapp: '' };
        this.orderState.currentStep = 1;
        
        localStorage.removeItem('doggo_order_state');
        
        const form = document.getElementById('pedido-form');
        if (form) {
            const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
            inputs.forEach(input => {
                input.value = '';
                input.classList.remove('success', 'error');
                const feedback = input.closest('.form-group')?.querySelector('.field-feedback');
                if (feedback) {
                    feedback.innerHTML = '';
                    feedback.className = 'field-feedback';
                }
            });

            const direccionInput = form.querySelector('#direccion');
            if (direccionInput) direccionInput.value = '';
            
            const referenciasInput = form.querySelector('#referencias');
            if (referenciasInput) referenciasInput.value = '';

            form.querySelectorAll('.doggo-card').forEach(card => {
                card.classList.remove('has-items');
                const qty = card.querySelector('.qty-value');
                if (qty) qty.textContent = '0';
            });

            form.querySelectorAll('.extra-chip').forEach(chip => {
                chip.classList.remove('has-items');
                const qty = chip.querySelector('.qty-value-mini');
                if (qty) qty.textContent = '0';
            });

            form.querySelectorAll('.bebida-card').forEach(card => {
                card.classList.remove('has-items');
                const qty = card.querySelector('.qty-value-mini');
                if (qty) qty.textContent = '0';
            });

            form.querySelectorAll('.delivery-card').forEach(card => {
                card.classList.remove('selected');
                if (card.dataset.value === 'pickup') card.classList.add('selected');
            });

            const direccionGroup = form.querySelector('.direccion-group');
            if (direccionGroup) direccionGroup.style.display = 'none';
        }
        
        this.updateSummary();
        const formElement = document.getElementById('pedido-form');
        if (formElement) this.initStepper(formElement);
        
        Toast.success('Todos los datos han sido reiniciados.', 'Carrito vaciado');
    }

     initFormSubmit(form) {
        const submitBtn = document.getElementById('submit-pedido');
        if (!submitBtn) return;

        // ✅ NUEVO: Delegación de eventos para el botón de vaciar carrito
        form.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-clear-cart');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const confirmed = await Modal.confirm(
                    'Esta acción eliminará todos los items de tu carrito y tus datos de contacto.',
                    '¿Vaciar todo el pedido?',
                    'Sí, vaciar todo',
                    'Cancelar',
                    'danger'
                );
                if (confirmed) {
                    this.clearCart();
                }
            }
        });

        // Envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateLeadFields(form)) {
                this.orderState.currentStep = 1;
                this.initStepper(form);
                return;
            }

            if (!this.validateDoggos()) {
                this.orderState.currentStep = 2;
                this.initStepper(form);
                return;
            }

            if (!this.validateStep3(form)) {
                this.orderState.currentStep = 3;
                this.initStepper(form);
                return;
            }

            const nombreInput = form.querySelector('#nombre');
            const emailInput = form.querySelector('#email');
            const whatsappInput = form.querySelector('#whatsapp');
            const direccionInput = form.querySelector('#direccion');
            const referenciasInput = form.querySelector('#referencias');
            
            if (nombreInput) this.orderState.leadData.nombre = nombreInput.value.trim();
            if (emailInput) this.orderState.leadData.email = emailInput.value.trim();
            if (whatsappInput) this.orderState.leadData.whatsapp = whatsappInput.value.trim();
            if (direccionInput) this.orderState.direccion = direccionInput.value.trim();
            if (referenciasInput) this.orderState.referencias = referenciasInput.value.trim();

            let total = 0;
            
            let doggosList = [];
            for (const [tipo, cantidad] of Object.entries(this.orderState.doggos)) {
                if (cantidad > 0) {
                    const price = this.PRICES.doggos[tipo] || 0;
                    const subtotal = price * cantidad;
                    total += subtotal;
                    doggosList.push(`${cantidad}x ${tipo} ($${subtotal.toLocaleString()})`);
                }
            }

            let extrasList = [];
            for (const [extra, cantidad] of Object.entries(this.orderState.extras)) {
                if (cantidad > 0) {
                    const price = this.PRICES.extras[extra] || 0;
                    const subtotal = price * cantidad;
                    total += subtotal;
                    extrasList.push(`${cantidad}x ${extra} ($${subtotal.toLocaleString()})`);
                }
            }

            let bebidasList = [];
            for (const [bebida, cantidad] of Object.entries(this.orderState.bebidas)) {
                if (cantidad > 0) {
                    const price = this.PRICES.bebidas[bebida] || 0;
                    const subtotal = price * cantidad;
                    total += subtotal;
                    bebidasList.push(`${cantidad}x ${bebida} ($${subtotal.toLocaleString()})`);
                }
            }

            const deliveryText = this.orderState.delivery === 'pickup' 
                ? 'Recoger en local' 
                : 'Envío a domicilio';
            
            if (this.orderState.delivery === 'delivery') {
                total += this.PRICES.delivery * 1000;
            }

            const direccionText = this.orderState.delivery === 'delivery' 
                ? `Dirección: ${this.orderState.direccion || 'No especificada'}%0AReferencias: ${this.orderState.referencias || 'No especificadas'}%0A`
                : '';

            const leadData = {
                nombre: this.orderState.leadData.nombre || 'No especificado',
                email: this.orderState.leadData.email || 'No especificado',
                whatsapp: this.orderState.leadData.whatsapp || 'No especificado',
                doggos: doggosList.length > 0 ? doggosList.join(', ') : 'Ninguno',
                extras: extrasList.length > 0 ? extrasList.join(', ') : 'Ninguno',
                bebidas: bebidasList.length > 0 ? bebidasList.join(', ') : 'Ninguna',
                delivery: deliveryText,
                direccion: direccionText,
                total: `$${total.toLocaleString()}`
            };

            const mensaje = this.buildWhatsAppMessage(leadData);

            submitBtn.disabled = true;
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline';

            try {
                console.log('📩 Lead capturado:', leadData);
                this.saveLeadToLocalStorage(leadData);
                
                Toast.success('Tu pedido está en camino a WhatsApp', '¡Pedido enviado!', 4000);
                
                await new Promise(resolve => setTimeout(resolve, 800));
                this.openWhatsApp(mensaje);
                
                this.clearCart();
                this.initPedidoForm();
                
            } catch (error) {
                console.error('Error:', error);
                Toast.error('Hubo un error al procesar tu pedido. Intenta nuevamente.', 'Error');
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                }, 1000);
            }
        });
    }

    updateSummary() {
        console.log('🔄 Actualizando resumen del pedido...');
        
        const clientSummary = document.getElementById('summary-client');
        if (clientSummary) {
            const { nombre, email, whatsapp } = this.orderState.leadData;
            if (nombre || email || whatsapp) {
                clientSummary.innerHTML = `
                    <div class="summary-item">
                        <span class="summary-label">👤 Cliente</span>
                        <span class="summary-value">${nombre || 'No especificado'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">📧 Email</span>
                        <span class="summary-value">${email || 'No especificado'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">📱 WhatsApp</span>
                        <span class="summary-value">${whatsapp || 'No especificado'}</span>
                    </div>
                `;
            } else {
                clientSummary.innerHTML = `<p class="empty-summary">⚠️ Completa tus datos en el paso 1</p>`;
            }
        }

        const doggoSummary = document.getElementById('summary-doggos');
        if (doggoSummary) {
            const entries = Object.entries(this.orderState.doggos).filter(([_, qty]) => qty > 0);
            if (entries.length > 0) {
                let html = '';
                let subtotal = 0;
                entries.forEach(([tipo, cantidad]) => {
                    const price = this.PRICES.doggos[tipo] || 0;
                    const total = price * cantidad;
                    subtotal += total;
                    html += `
                        <div class="summary-item">
                            <span class="summary-label">${cantidad}x ${tipo}</span>
                            <span class="summary-value">$${total.toLocaleString()}</span>
                        </div>
                    `;
                });
                html += `
                    <div class="summary-item subtotal">
                        <span class="summary-label">📊 Subtotal Doggos</span>
                        <span class="summary-value">$${subtotal.toLocaleString()}</span>
                    </div>
                `;
                doggoSummary.innerHTML = html;
            } else {
                doggoSummary.innerHTML = `<p class="empty-summary">⚠️ No has seleccionado ningún Doggo en el paso 2</p>`;
            }
        }

        const extrasSummary = document.getElementById('summary-extras');
        if (extrasSummary) {
            const entries = Object.entries(this.orderState.extras).filter(([_, qty]) => qty > 0);
            if (entries.length > 0) {
                let html = '';
                let subtotal = 0;
                entries.forEach(([extra, cantidad]) => {
                    const price = this.PRICES.extras[extra] || 0;
                    const total = price * cantidad;
                    subtotal += total;
                    html += `
                        <div class="summary-item">
                            <span class="summary-label">${cantidad}x ${extra}</span>
                            <span class="summary-value">$${total.toLocaleString()}</span>
                        </div>
                    `;
                });
                html += `
                    <div class="summary-item subtotal">
                        <span class="summary-label">📊 Subtotal Extras</span>
                        <span class="summary-value">$${subtotal.toLocaleString()}</span>
                    </div>
                `;
                extrasSummary.innerHTML = html;
            } else {
                extrasSummary.innerHTML = `<p class="empty-summary">⚠️ No has seleccionado ningún extra en el paso 3</p>`;
            }
        }

        const bebidasSummary = document.getElementById('summary-bebidas');
        if (bebidasSummary) {
            const entries = Object.entries(this.orderState.bebidas).filter(([_, qty]) => qty > 0);
            if (entries.length > 0) {
                let html = '';
                let subtotal = 0;
                entries.forEach(([bebida, cantidad]) => {
                    const price = this.PRICES.bebidas[bebida] || 0;
                    const total = price * cantidad;
                    subtotal += total;
                    html += `
                        <div class="summary-item">
                            <span class="summary-label">${cantidad}x ${bebida}</span>
                            <span class="summary-value">$${total.toLocaleString()}</span>
                        </div>
                    `;
                });
                html += `
                    <div class="summary-item subtotal">
                        <span class="summary-label">📊 Subtotal Bebidas</span>
                        <span class="summary-value">$${subtotal.toLocaleString()}</span>
                    </div>
                `;
                bebidasSummary.innerHTML = html;
            } else {
                bebidasSummary.innerHTML = `<p class="empty-summary">⚠️ No has seleccionado ninguna bebida en el paso 3</p>`;
            }
        }

        const deliverySummary = document.getElementById('summary-delivery');
        if (deliverySummary) {
            let html = '';
            if (this.orderState.delivery === 'pickup') {
                html = `
                    <div class="summary-item">
                        <span class="summary-label">📦 Opción de entrega</span>
                        <span class="summary-value">🏠 Recoger en local</span>
                    </div>
                    <div class="summary-item" style="color:var(--color-accent);">
                        <span class="summary-label">💰 Costo de envío</span>
                        <span class="summary-value">$0 (Gratis)</span>
                    </div>
                `;
            } else {
                const direccion = this.orderState.direccion || 'No especificada';
                const referencias = this.orderState.referencias || 'Sin referencias';
                html = `
                    <div class="summary-item">
                        <span class="summary-label">📦 Opción de entrega</span>
                        <span class="summary-value">🚀 Envío a domicilio</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">📍 Dirección</span>
                        <span class="summary-value">${direccion}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">📌 Referencias</span>
                        <span class="summary-value">${referencias}</span>
                    </div>
                    <div class="summary-item" style="color:var(--color-accent);">
                        <span class="summary-label">💰 Costo de envío</span>
                        <span class="summary-value">+$${(this.PRICES.delivery * 1000).toLocaleString()}</span>
                    </div>
                `;
            }
            deliverySummary.innerHTML = html;
        }

        const totalElement = document.getElementById('order-total');
        if (totalElement) {
            let total = 0;
            let subtotalDoggos = 0;
            let subtotalExtras = 0;
            let subtotalBebidas = 0;
            let deliveryCost = 0;

            for (const [tipo, cantidad] of Object.entries(this.orderState.doggos)) {
                const price = this.PRICES.doggos[tipo] || 0;
                subtotalDoggos += price * cantidad;
            }

            for (const [extra, cantidad] of Object.entries(this.orderState.extras)) {
                const price = this.PRICES.extras[extra] || 0;
                subtotalExtras += price * cantidad;
            }

            for (const [bebida, cantidad] of Object.entries(this.orderState.bebidas)) {
                const price = this.PRICES.bebidas[bebida] || 0;
                subtotalBebidas += price * cantidad;
            }

            if (this.orderState.delivery === 'delivery') {
                deliveryCost = this.PRICES.delivery * 1000;
            }

            total = subtotalDoggos + subtotalExtras + subtotalBebidas + deliveryCost;

            totalElement.innerHTML = `
                <div class="total-breakdown">
                    <div class="breakdown-item">
                        <span>Doggos</span>
                        <span>$${subtotalDoggos.toLocaleString()}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Extras</span>
                        <span>$${subtotalExtras.toLocaleString()}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Bebidas</span>
                        <span>$${subtotalBebidas.toLocaleString()}</span>
                    </div>
                    ${deliveryCost > 0 ? `
                    <div class="breakdown-item">
                        <span>Envío</span>
                        <span>+$${deliveryCost.toLocaleString()}</span>
                    </div>
                    ` : ''}
                    <div class="breakdown-total">
                        <span>💰 TOTAL A PAGAR</span>
                        <span>$${total.toLocaleString()}</span>
                    </div>
                </div>
            `;
        }

        console.log('✅ Resumen actualizado correctamente');
    }

    saveOrderState() {
        try {
            localStorage.setItem('doggo_order_state', JSON.stringify({
                currentStep: this.orderState.currentStep,
                doggos: this.orderState.doggos,
                extras: this.orderState.extras,
                bebidas: this.orderState.bebidas,
                leadData: this.orderState.leadData,
                delivery: this.orderState.delivery,
                direccion: this.orderState.direccion,
                referencias: this.orderState.referencias
            }));
        } catch (e) {
            console.warn('No se pudo guardar el estado:', e);
        }
    }

    loadOrderState() {
        try {
            const saved = localStorage.getItem('doggo_order_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.orderState.currentStep = parsed.currentStep || 1;
                this.orderState.doggos = parsed.doggos || {};
                this.orderState.extras = parsed.extras || {};
                this.orderState.bebidas = parsed.bebidas || {};
                this.orderState.leadData = parsed.leadData || { nombre: '', email: '', whatsapp: '' };
                this.orderState.delivery = parsed.delivery || 'pickup';
                this.orderState.direccion = parsed.direccion || '';
                this.orderState.referencias = parsed.referencias || '';
            }
        } catch (e) {
            console.warn('No se pudo cargar el estado:', e);
        }
    }

    saveLeadToLocalStorage(leadData) {
        try {
            const leads = JSON.parse(localStorage.getItem('doggo_leads') || '[]');
            leads.push({ ...leadData, timestamp: new Date().toISOString() });
            localStorage.setItem('doggo_leads', JSON.stringify(leads));
        } catch (e) {
            console.warn('No se pudo guardar el lead:', e);
        }
    }

    buildWhatsAppMessage(data) {
        const { nombre, email, whatsapp, doggos, extras, bebidas, delivery, direccion, total } = data;
        
        let mensaje = `[NUEVO PEDIDO DOGGO]%0A%0A`;
        mensaje += `Cliente: ${nombre}%0A`;
        mensaje += `Email: ${email}%0A`;
        mensaje += `WhatsApp: ${whatsapp}%0A%0A`;
        mensaje += `--- PEDIDO ---%0A`;
        mensaje += `Doggos: ${doggos}%0A`;
        mensaje += `Extras: ${extras}%0A`;
        mensaje += `Bebidas: ${bebidas}%0A`;
        mensaje += `Entrega: ${delivery}%0A`;
        if (delivery === 'Envío a domicilio') {
            mensaje += `${direccion}`;
        }
        mensaje += `%0A--- TOTAL ---%0A`;
        mensaje += `Monto a cancelar: ${total}%0A%0A`;
        mensaje += `¡Listo para preparar! 🚀`;

        return mensaje;
    }

    openWhatsApp(mensaje) {
        const phoneNumber = '584245231898';
        window.open(`https://wa.me/${phoneNumber}?text=${mensaje}`, '_blank');
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
                errorMessage = 'Ingresa un email válido';
            }
        } else if (field.type === 'tel' && field.value.trim()) {
            const phoneRegex = /^(\+?\d{1,3}[-.]?)?\d{10,14}$/;
            if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Ingresa un número válido (ej: 584245231898)';
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
    }

    // ============================================
    // 8. COMPONENTE DE NAVBAR
    // ============================================

    initNavbarToggle() {
        const toggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (toggle && navMenu) {
            if (toggle._listenerAdded) return;
            
            const toggleScroll = (disable) => {
                document.body.style.overflow = disable ? 'hidden' : '';
                document.body.style.touchAction = disable ? 'none' : '';
            };

            const handleToggle = (e) => {
                e.stopPropagation();
                const isOpen = navMenu.classList.toggle('active');
                toggle.classList.toggle('active');
                toggle.setAttribute('aria-expanded', isOpen);
                toggleScroll(isOpen);
                
                if (isOpen) {
                    const links = navMenu.querySelectorAll('.nav-link');
                    links.forEach((link, index) => {
                        link.style.transitionDelay = `${0.05 * index}s`;
                    });
                }
            };

            toggle.addEventListener('click', handleToggle);
            toggle._listenerAdded = true;

            const links = navMenu.querySelectorAll('.nav-link');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    toggle.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggleScroll(false);
                });
            });

            document.addEventListener('click', (e) => {
                if (navMenu.classList.contains('active') && 
                    !navMenu.contains(e.target) && 
                    !toggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    toggle.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggleScroll(false);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    toggle.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggleScroll(false);
                }
            });

            console.log('✅ Navbar toggle inicializado');
        }
    }

    // ============================================
    // 9. COMPONENTE DE CONTACTO
    // ============================================

    initContactoForm() {
        console.log('📬 Inicializando formulario de contacto...');
        
        const form = document.getElementById('contacto-form');
        if (!form) {
            console.warn('⚠️ Formulario de contacto no encontrado');
            return;
        }

        // Validación en tiempo real
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateContactField(input);
            });
            input.addEventListener('input', () => {
                this.validateContactField(input);
            });
        });

        // Envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validar todos los campos
            let isValid = true;
            const required = form.querySelectorAll('[required]');
            required.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    this.validateContactField(field);
                }
            });

            if (!isValid) {
                Toast.warning('Por favor, completa todos los campos requeridos.', 'Formulario incompleto');
                return;
            }

            // Recopilar datos
            const formData = new FormData(form);
            const data = {
                nombre: formData.get('nombre'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                asunto: formData.get('asunto'),
                mensaje: formData.get('mensaje')
            };

            // Mostrar estado de carga
            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '⏳ Enviando...';
            submitBtn.disabled = true;

            try {
                console.log('📩 Mensaje de contacto:', data);
                
                // Simular envío
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                Toast.success('¡Tu mensaje ha sido enviado! Te responderemos pronto.', 'Mensaje enviado');
                form.reset();
                
                // Limpiar estados de validación
                form.querySelectorAll('.success, .error').forEach(el => {
                    el.classList.remove('success', 'error');
                });
                form.querySelectorAll('.field-feedback').forEach(el => {
                    el.innerHTML = '';
                });

            } catch (error) {
                console.error('Error al enviar mensaje:', error);
                Toast.error('Hubo un error al enviar tu mensaje. Intenta nuevamente.', 'Error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    validateContactField(field) {
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
    }

} // <-- CIERRE DE LA CLASE Router

// ============================================
// 10. MICRO-INTERACCIONES Y ANIMACIONES
// ============================================

function addMicroInteractions() {
    document.querySelectorAll('button:not(.toast-close)').forEach(btn => {
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    document.querySelectorAll('.doggo-card, .extra-chip, .delivery-card, .bebida-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        });
    });
}

// ============================================
// 11. INICIALIZACIÓN
// ============================================

console.log('📦 Esperando DOM...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM cargado, iniciando app...');
    
    addMicroInteractions();
    
    const app = new Router();
    
    window.__DOGGO_APP__ = {
        router: app,
        version: '6.0.2'
    };

    console.log('🐕 ¡Doggo App iniciada! v6.0.2');
    console.log('💡 Para depuración, ejecuta: __DOGGO_APP__.router');
});