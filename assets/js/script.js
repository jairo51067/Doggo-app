// ============================================
// DOGGO-APP SPA ROUTER - Versión Final con Limpieza y Emojis
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
    // 3. COMPONENTE DE PEDIDO (Carrito + Cantidades + Delivery + Limpieza)
    // ============================================

    initPedidoForm() {
        const form = document.getElementById('pedido-form');
        if (!form) {
            console.warn('Formulario de pedido no encontrado');
            return;
        }

        // Estado del pedido como propiedad de la instancia
        this.orderState = {
            currentStep: 1,
            totalSteps: 4,
            doggos: {},
            extras: {},
            bebida: 'Sin bebida',
            delivery: 'pickup',
            leadData: {
                nombre: '',
                email: '',
                whatsapp: ''
            }
        };

        // Precios
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
            delivery: 1.5
        };

        // Cargar estado desde localStorage
        this.loadOrderState();

        // Inicializar componentes
        this.initStepper(form);
        this.initDoggoQuantities(form);
        this.initExtraQuantities(form);
        this.initDeliveryOption(form);
        this.initBebidaSelection(form);
        this.initLeadFields(form);
        this.initClearCartButtons(form);
        this.initFormSubmit(form);
        
        // Actualizar resumen inicial
        this.updateSummary();
    }

    // --- Stepper ---
    initStepper(form) {
        const steps = form.querySelectorAll('.step-content');
        const indicators = document.querySelectorAll('.step-indicator');
        const nextBtns = form.querySelectorAll('.btn-next');
        const prevBtns = form.querySelectorAll('.btn-prev');

        const showStep = (stepNumber) => {
            if (stepNumber > this.orderState.currentStep) {
                if (!this.validateCurrentStep(this.orderState.currentStep, form)) {
                    return;
                }
            }

            this.orderState.currentStep = stepNumber;
            
            steps.forEach(step => {
                step.classList.toggle('active', parseInt(step.dataset.step) === stepNumber);
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

            this.saveOrderState();
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const nextStep = parseInt(btn.dataset.next);
                if (nextStep <= this.orderState.totalSteps) {
                    showStep(nextStep);
                }
            });
        });

        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const prevStep = parseInt(btn.dataset.prev);
                if (prevStep >= 1) {
                    showStep(prevStep);
                }
            });
        });

        indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const step = parseInt(indicator.dataset.step);
                if (step < this.orderState.currentStep || indicator.classList.contains('completed')) {
                    showStep(step);
                }
            });
        });

        showStep(this.orderState.currentStep);
    }

    // --- Validación por pasos ---
    validateCurrentStep(step, form) {
        switch(step) {
            case 1:
                return this.validateLeadFields(form);
            case 2:
                return this.validateDoggos();
            case 3:
                return true;
            default:
                return true;
        }
    }

    validateLeadFields(form) {
        const inputs = form.querySelectorAll('.step-content[data-step="1"] input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                this.validateField(input);
            } else if (input.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    isValid = false;
                    this.validateField(input);
                }
            } else if (input.type === 'tel') {
                const phoneRegex = /^(\+?\d{1,3}[-.]?)?\d{10,14}$/;
                if (!phoneRegex.test(input.value.replace(/\s/g, ''))) {
                    isValid = false;
                    this.validateField(input);
                }
            }
        });

        if (!isValid) {
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
            alert('¡Agrega al menos un Doggo a tu pedido! 🌭');
            return false;
        }
        return true;
    }

    // --- Cantidades de Doggos ---
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

    // --- Cantidades de Extras ---
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

    // --- Opción de Delivery ---
    initDeliveryOption(form) {
        const cards = form.querySelectorAll('.delivery-card');

        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.orderState.delivery = card.dataset.value;
                this.updateSummary();
                this.saveOrderState();
            });

            if (this.orderState.delivery === card.dataset.value) {
                card.classList.add('selected');
            }
        });
    }

    // --- Bebida ---
    initBebidaSelection(form) {
        const select = form.querySelector('#bebida');
        if (select) {
            select.addEventListener('change', () => {
                this.orderState.bebida = select.value;
                this.updateSummary();
                this.saveOrderState();
            });

            if (this.orderState.bebida) {
                select.value = this.orderState.bebida;
            }
        }
    }

    // --- Campos de Lead ---
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

    // --- Botón Vaciar Carrito ---
    initClearCartButtons(form) {
        const clearButtons = form.querySelectorAll('.btn-clear-cart');
        
        clearButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('¿Seguro que quieres vaciar todo tu pedido? Esta acción no se puede deshacer.')) {
                    this.clearCart();
                    // Recargar la vista para actualizar la UI
                    this.initPedidoForm();
                }
            });
        });
    }

    clearCart() {
        // Limpiar estado
        this.orderState.doggos = {};
        this.orderState.extras = {};
        this.orderState.bebida = 'Sin bebida';
        this.orderState.delivery = 'pickup';
        this.orderState.leadData = {
            nombre: '',
            email: '',
            whatsapp: ''
        };
        this.orderState.currentStep = 1;
        
        // Limpiar localStorage
        localStorage.removeItem('doggo_order_state');
        
        // Actualizar resumen
        this.updateSummary();
        
        console.log('🗑️ Carrito vaciado correctamente');
        alert('✅ Carrito vaciado. Puedes comenzar un nuevo pedido.');
    }

    // --- Envío del Formulario ---
    initFormSubmit(form) {
        const submitBtn = document.getElementById('submit-pedido');
        if (!submitBtn) return;

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

            // Construir mensaje sin emojis para máxima compatibilidad
            let doggosList = [];
            for (const [tipo, cantidad] of Object.entries(this.orderState.doggos)) {
                doggosList.push(`${cantidad}x ${tipo}`);
            }

            let extrasList = [];
            for (const [extra, cantidad] of Object.entries(this.orderState.extras)) {
                extrasList.push(`${cantidad}x ${extra}`);
            }

            const deliveryText = this.orderState.delivery === 'pickup' 
                ? 'Recoger en local' 
                : 'Envio a domicilio (+$1.5 USD)';

            const leadData = {
                nombre: this.orderState.leadData.nombre,
                email: this.orderState.leadData.email,
                whatsapp: this.orderState.leadData.whatsapp,
                doggos: doggosList.join(', '),
                extras: extrasList.length > 0 ? extrasList.join(', ') : 'Ninguno',
                bebida: this.orderState.bebida,
                delivery: deliveryText
            };

            const mensaje = this.buildWhatsAppMessage(leadData);

            // Mostrar estado de carga
            submitBtn.disabled = true;
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline';

            try {
                console.log('📩 Lead capturado:', leadData);
                this.saveLeadToLocalStorage(leadData);
                
                await new Promise(resolve => setTimeout(resolve, 800));
                this.openWhatsApp(mensaje);
                
                // ✅ LIMPIAR CARRITO DESPUÉS DE ENVIAR
                this.clearCart();
                // Recargar la vista para actualizar la UI
                this.initPedidoForm();
                
                alert('✅ ¡Pedido enviado! El carrito ha sido vaciado. ¿Quieres hacer otro pedido?');
                
            } catch (error) {
                console.error('Error al procesar pedido:', error);
                alert('Hubo un error al procesar tu pedido. Intenta nuevamente.');
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                }, 1000);
            }
        });
    }

    // --- Actualizar Resumen ---
    updateSummary() {
        // Cliente
        const clientSummary = document.getElementById('summary-client');
        if (clientSummary) {
            const { nombre, email, whatsapp } = this.orderState.leadData;
            if (nombre || email || whatsapp) {
                clientSummary.innerHTML = `
                    <div class="summary-item"><span>👤 ${nombre || 'No especificado'}</span></div>
                    <div class="summary-item"><span>📧 ${email || 'No especificado'}</span></div>
                    <div class="summary-item"><span>📱 ${whatsapp || 'No especificado'}</span></div>
                `;
            } else {
                clientSummary.innerHTML = `<p class="empty-summary">Completa tus datos en el paso 1</p>`;
            }
        }

        // Doggos
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
                    html += `<div class="summary-item">
                        <span>${cantidad}x ${tipo}</span>
                        <span>$${total.toLocaleString()}</span>
                    </div>`;
                });
                html += `<div class="summary-item" style="font-weight:700;color:var(--color-accent);">
                    <span>Subtotal Doggos</span>
                    <span>$${subtotal.toLocaleString()}</span>
                </div>`;
                doggoSummary.innerHTML = html;
            } else {
                doggoSummary.innerHTML = `<p class="empty-summary">Añade Doggos en el paso 2</p>`;
            }
        }

        // Extras
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
                    html += `<div class="summary-item">
                        <span>${cantidad}x ${extra}</span>
                        <span>$${total.toLocaleString()}</span>
                    </div>`;
                });
                html += `<div class="summary-item" style="font-weight:700;color:var(--color-accent);">
                    <span>Subtotal Extras</span>
                    <span>$${subtotal.toLocaleString()}</span>
                </div>`;
                extrasSummary.innerHTML = html;
            } else {
                extrasSummary.innerHTML = `<p class="empty-summary">Añade extras en el paso 3</p>`;
            }
        }

        // Bebida
        const bebidaSummary = document.getElementById('summary-bebida');
        if (bebidaSummary) {
            bebidaSummary.innerHTML = `<div class="summary-item"><span>🥤 ${this.orderState.bebida || 'Sin bebida'}</span></div>`;
        }

        // Delivery
        const deliverySummary = document.getElementById('summary-delivery');
        if (deliverySummary) {
            const text = this.orderState.delivery === 'pickup' 
                ? '🏠 Recoger en local (sin costo)' 
                : '🚀 Envío a domicilio (+$1.5 USD)';
            deliverySummary.innerHTML = `<div class="summary-item"><span>${text}</span></div>`;
        }

        // Total
        const totalElement = document.getElementById('order-total');
        if (totalElement) {
            let total = 0;
            
            for (const [tipo, cantidad] of Object.entries(this.orderState.doggos)) {
                total += (this.PRICES.doggos[tipo] || 0) * cantidad;
            }
            
            for (const [extra, cantidad] of Object.entries(this.orderState.extras)) {
                total += (this.PRICES.extras[extra] || 0) * cantidad;
            }

            if (this.orderState.delivery === 'delivery') {
                total += this.PRICES.delivery * 1000;
            }
            
            totalElement.textContent = `$${total.toLocaleString()}`;
        }
    }

    // --- Guardar y Cargar Estado ---
    saveOrderState() {
        try {
            const stateToSave = {
                currentStep: this.orderState.currentStep,
                doggos: this.orderState.doggos,
                extras: this.orderState.extras,
                leadData: this.orderState.leadData,
                bebida: this.orderState.bebida,
                delivery: this.orderState.delivery
            };
            localStorage.setItem('doggo_order_state', JSON.stringify(stateToSave));
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
                this.orderState.leadData = parsed.leadData || { nombre: '', email: '', whatsapp: '' };
                this.orderState.bebida = parsed.bebida || 'Sin bebida';
                this.orderState.delivery = parsed.delivery || 'pickup';
            }
        } catch (e) {
            console.warn('No se pudo cargar el estado:', e);
        }
    }

    saveLeadToLocalStorage(leadData) {
        try {
            const leads = JSON.parse(localStorage.getItem('doggo_leads') || '[]');
            leads.push({
                ...leadData,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('doggo_leads', JSON.stringify(leads));
            console.log('💾 Lead guardado en localStorage');
        } catch (e) {
            console.warn('No se pudo guardar el lead:', e);
        }
    }

    // --- WhatsApp con Emojis Compatibles ---
    buildWhatsAppMessage(data) {
        const { nombre, email, whatsapp, doggos, extras, bebida, delivery } = data;
        
        let mensaje = `[NUEVO PEDIDO DOGGO]%0A%0A`;
        mensaje += `Cliente: ${nombre}%0A`;
        mensaje += `Email: ${email}%0A`;
        mensaje += `WhatsApp: ${whatsapp}%0A%0A`;
        mensaje += `Pedido:%0A`;
        mensaje += `- Doggos: ${doggos}%0A`;
        mensaje += `- Extras: ${extras}%0A`;
        mensaje += `- Bebida: ${bebida}%0A`;
        mensaje += `- Entrega: ${delivery}%0A%0A`;
        mensaje += `Listo para preparar!`;

        return mensaje;
    }

    openWhatsApp(mensaje) {
        // ✅ Número actualizado
        const phoneNumber = '584245231898';
        const url = `https://wa.me/${phoneNumber}?text=${mensaje}`;
        window.open(url, '_blank');
    }

    // --- Validación de Campos ---
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
                errorMessage = 'Ingresa un número de WhatsApp válido (ej: 584245231898)';
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
        version: '1.4.0'
    };

    console.log('🐕 ¡Doggo App iniciada!');
    console.log('📱 Versión SPA Profesional v1.4.0 (Carrito + Cantidades + Delivery + Limpieza)');
});

// ============================================
// 7. SERVICIO DE LOGGING
// ============================================

const Logger = {
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
    debug: (message, ...args) => {
        if (localStorage.getItem('doggo_debug') === 'true') {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
};