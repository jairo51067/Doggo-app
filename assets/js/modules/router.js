// ============================================
// ROUTER - Sistema de enrutamiento SPA
// ============================================
import { AdminManager } from "./adminManager.js";
import { LoginManager } from "./loginManager.js";
import { ProductsManager } from "./productsManager.js";
import { OrdersManager } from "./ordersManager.js";
import { StyleManager } from "./styleManager.js";
import { ModalManager } from "./modalManager.js";
import { ToastManager } from "./toastManager.js";
import { PedidoManager } from "./pedidoManager.js";
import { HomeManager } from "./homeManager.js";
import { ContactoManager } from "./contactoManager.js";
import { initMicroInteractions } from "./microInteractions.js";

export class Router {
  /**
   * @param {Object} config - Configuración del router
   * @param {StyleManager} styleManager - Instancia del gestor de estilos
   * @param {ModalManager} modalManager - Instancia del gestor de modales
   * @param {ToastManager} toastManager - Instancia del gestor de toasts
   */
  constructor(config, styleManager, modalManager, toastManager) {
    this.config = config;
    this.styleManager = styleManager;
    this.modalManager = modalManager;
    this.toastManager = toastManager;

    this.appContent = document.getElementById("app-content");
    this.currentView = null;
    this.viewCache = new Map();

    // Managers de vistas
    this.productsManager = new ProductsManager();
    this.ordersManager = new OrdersManager();
    this.pedidoManager = null;
    this.homeManager = null;
    this.contactoManager = null;
    this.loginManager = null;
    this.adminManager = null;
  }

  /**
   * Inicializa el router
   */
init() {
  console.log("🔧 Router.init()");
  
  // Event listeners existentes
  window.addEventListener("hashchange", (event) => this.handleHashChange(event));
  document.addEventListener("click", (event) => this.handleLinkClick(event));

  // Inicializar micro-interacciones globales
  initMicroInteractions();

  // ⬇️ NUEVAS INICIALIZACIONES - FASE 1
  this.initScheduleButton();
  this.initMiniCart();
  this.initSecretAdminAccess();
  
  // ⬇️ AGREGAR ESTA LÍNEA - Menú hamburguesa
  this.initNavbarToggle();

  const initialHash = window.location.hash || "#/home";
  console.log(`📍 Hash inicial: ${initialHash}`);
  this.processRoute(initialHash);
  this.updateActiveLink(initialHash);
}

  /**
   * Procesa una ruta
   * @param {string} hash - Hash de la URL
   */
  processRoute(hash) {
    const route =
      hash.replace("#/", "").split("?")[0] || this.config.defaultView;
    const viewName = route || this.config.defaultView;
    console.log(`🔄 Procesando ruta: ${viewName}`);
    this.currentView = viewName;
    this.navigate(viewName);
  }

  /**
   * Maneja cambios en el hash
   */
  handleHashChange(event) {
    const newHash = event.newURL.split("#")[1] || "#/home";
    console.log(`🔄 Hash cambiado a: ${newHash}`);
    this.processRoute(newHash);
    this.updateActiveLink(newHash);
  }

  // ============================================
// MÉTODOS AGREGADOS - FASE 1
// ============================================

/**
 * Inicializa el botón de horario (abierto/cerrado)
 */
initScheduleButton() {
  const btnSchedule = document.getElementById('btn-schedule');
  const businessModal = document.getElementById('business-info-modal');
  const closeModal = document.getElementById('close-business-modal');
  
  if (!btnSchedule) return;
  
  // Verificar horario actual
  this.updateScheduleStatus();
  
  // Actualizar cada minuto
  setInterval(() => {
    this.updateScheduleStatus();
  }, 60000);
  
  // Click para abrir modal
  btnSchedule.addEventListener('click', () => {
    if (businessModal) {
      businessModal.style.display = 'flex';
    }
  });
  
  // Cerrar modal
  if (closeModal && businessModal) {
    closeModal.addEventListener('click', () => {
      businessModal.style.display = 'none';
    });
    
    businessModal.addEventListener('click', (e) => {
      if (e.target === businessModal) {
        businessModal.style.display = 'none';
      }
    });
  }
  
  console.log('✅ Botón de horario inicializado');
}

/**
 * Actualiza el estado del botón de horario según la hora actual
 */
updateScheduleStatus() {
  const btnSchedule = document.getElementById('btn-schedule');
  const scheduleText = btnSchedule?.querySelector('.schedule-text');
  const statusModal = document.getElementById('business-status-modal');
  
  if (!btnSchedule) return;
  
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute; // Minutos desde medianoche
  
  // Horario: 11am (660 min) - 10pm (1320 min)
  const openTime = 11 * 60; // 660
  const closeTime = 22 * 60; // 1320
  const closingSoonTime = closeTime - 30; // 30 min antes de cerrar
  
  let status, text, modalStatus;
  
  if (currentTime >= openTime && currentTime < closingSoonTime) {
    // Abierto
    status = 'open';
    text = 'Abierto';
    modalStatus = 'Abierto ahora';
    btnSchedule.classList.remove('closed', 'closing-soon');
  } else if (currentTime >= closingSoonTime && currentTime < closeTime) {
    // Por cerrar
    status = 'closing-soon';
    text = 'Por cerrar';
    modalStatus = 'Por cerrar pronto';
    btnSchedule.classList.remove('closed');
    btnSchedule.classList.add('closing-soon');
  } else {
    // Cerrado
    status = 'closed';
    text = 'Cerrado';
    modalStatus = 'Cerrado ahora';
    btnSchedule.classList.remove('closing-soon');
    btnSchedule.classList.add('closed');
  }
  
  if (scheduleText) {
    scheduleText.textContent = text;
  }
  
  if (statusModal) {
    statusModal.className = `business-status ${status}`;
    const statusText = statusModal.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = modalStatus;
    }
  }
}

/**
 * Inicializa el mini-carrito
 */
initMiniCart() {
  const cartBtn = document.getElementById('btn-cart');
  const cartCount = document.getElementById('cart-count');
  
  if (!cartBtn || !cartCount) return;
  
  // Verificar si hay pedido en localStorage
  const updateCart = () => {
    const orderState = localStorage.getItem('doggo_order_state');
    
    if (orderState) {
      try {
        const order = JSON.parse(orderState);
        const totalItems = 
          Object.values(order.doggos || {}).reduce((a, b) => a + b, 0) +
          Object.values(order.extras || {}).reduce((a, b) => a + b, 0) +
          Object.values(order.bebidas || {}).reduce((a, b) => a + b, 0);
        
        if (totalItems > 0) {
          cartBtn.style.display = 'flex';
          cartCount.textContent = totalItems;
        } else {
          cartBtn.style.display = 'none';
        }
      } catch (error) {
        console.error('Error leyendo estado del pedido:', error);
        cartBtn.style.display = 'none';
      }
    } else {
      cartBtn.style.display = 'none';
    }
  };
  
  // Actualizar al cargar
  updateCart();
  
  // Actualizar cada 2 segundos
  setInterval(updateCart, 2000);
  
  console.log('✅ Mini-carrito inicializado');
}

/**
 * Inicializa el acceso secreto al admin
 */
initSecretAdminAccess() {
  // Combinación de teclas: Ctrl + Shift + A
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      console.log('🔐 Acceso secreto al admin activado');
      window.location.hash = '#/login';
    }
  });
  
  // URL secreta: #/admin-8f7k2
  const hash = window.location.hash;
  if (hash === '#/admin-8f7k2') {
    console.log('🔐 URL secreta detectada');
    window.location.hash = '#/login';
  }
  
  // 5 clicks en el logo para abrir admin (móvil)
  let clickCount = 0;
  let clickTimer = null;
  
  const logo = document.querySelector('.nav-logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      clickCount++;
      
      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 2000);
      }
      
      if (clickCount >= 5) {
        e.preventDefault();
        clearTimeout(clickTimer);
        clickCount = 0;
        console.log('🔐 Acceso secreto por clicks activado');
        window.location.hash = '#/login';
      }
    });
  }
  
  console.log('✅ Acceso secreto al admin inicializado');
}

  /**
   * Maneja clics en enlaces internos
   */
  handleLinkClick(event) {
    const link = event.target.closest('a[href^="#/"]');
    if (!link) return;

    event.preventDefault();
    const href = link.getAttribute("href");
    console.log(`🔗 Navegando a: ${href}`);
    window.location.hash = href;
  }

  /**
   * Actualiza el enlace activo en el navbar
   */
 /**
 * Actualiza el enlace activo en el navbar
 */
updateActiveLink(hash) {
  const activeLink = hash.replace("#/", "");
  
  // Links del menú central (desktop)
  document.querySelectorAll(".nav-btn-elegant").forEach((link) => {
    const linkHref = link.getAttribute("href").replace("#/", "");
    link.classList.toggle("active", linkHref === activeLink);
  });
  
  // Links del menú móvil
  document.querySelectorAll(".mobile-menu-link").forEach((link) => {
    const linkHref = link.getAttribute("href").replace("#/", "");
    link.classList.toggle("active", linkHref === activeLink);
  });
}

  /**
   * Navega a una vista específica
   * @param {string} viewName - Nombre de la vista
   */

  /**
 * Navega a una vista específica
 */
async navigate(viewName) {
  console.log(`📄 Navegando a vista: ${viewName}`);
  
  try {
    // 1. Mostrar skeleton inmediatamente
    this.showSkeleton();
    
    // 2. Cargar HTML y CSS en paralelo
    const [html] = await Promise.all([
      this.fetchView(viewName),
      this.styleManager.switchToViewStyle(viewName, this.config.cssPath),
    ]);
    
    // 3. Esperar un momento extra para que el CSS se aplique completamente
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 4. Renderizar con transición suave
    await this.renderViewSmooth(html, viewName);
    
    // 5. Actualizar título
    this.updateTitle(viewName);
    
    // 6. Destruir managers anteriores
    this.destroyViewManagers();
    
    // 7. Inicializar nuevos componentes
    this.initViewComponents(viewName);
    
    // 8. Ocultar skeleton
    this.hideSkeleton();
    
    // 9. Scroll al inicio
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    console.log(`✅ Vista "${viewName}" cargada exitosamente`);
    
  } catch (error) {
    console.error(`❌ Error al cargar la vista "${viewName}":`, error);
    this.showErrorState(viewName);
  }
}

  /**
   * Destruye todos los managers de vistas
   */
  destroyViewManagers() {
    if (this.pedidoManager) {
      this.pedidoManager.destroy?.();
      this.pedidoManager = null;
    }
    if (this.homeManager) {
      this.homeManager.destroy?.();
      this.homeManager = null;
    }
    if (this.contactoManager) {
      this.contactoManager.destroy?.();
      this.contactoManager = null;
    }
    if (this.loginManager) {
      this.loginManager.destroy?.();
      this.loginManager = null;
    }
    if (this.adminManager) {
      this.adminManager.destroy?.();
      this.adminManager = null;
    }
  }

  /**
 * Muestra el skeleton loader
 */
showSkeleton() {
  this.appContent.classList.add("loading");
  this.appContent.style.opacity = "1";
  this.appContent.style.visibility = "visible";
  
  // Asegurar que el skeleton sea visible inmediatamente
  const skeleton = this.appContent.querySelector('.skeleton-loader');
  if (skeleton) {
    skeleton.style.display = 'block';
  }
}

/**
 * Oculta el skeleton loader
 */
hideSkeleton() {
  this.appContent.classList.remove("loading");
  
  // Ocultar skeleton completamente
  const skeleton = this.appContent.querySelector('.skeleton-loader');
  if (skeleton) {
    skeleton.style.display = 'none';
  }
}

 /**
 * Renderiza una vista con transición suave (SIN FLASH)
 */
renderViewSmooth(html, viewName) {
  return new Promise((resolve) => {
    // 1. Ocultar completamente el contenido (visibility + opacity)
    this.appContent.style.transition = "opacity 0.25s ease, visibility 0.25s ease";
    this.appContent.style.opacity = "0";
    this.appContent.style.visibility = "hidden";
    
    // 2. Esperar a que se oculte completamente
    setTimeout(() => {
      // 3. Inyectar el HTML (aún oculto)
      this.appContent.innerHTML = html;
      
      // 4. Aplicar estilos específicos del hero si es home
      if (viewName === "home" || viewName === "/home") {
        const hero = this.appContent.querySelector(".hero-section");
        if (hero) {
          hero.style.minHeight = "100vh";
          hero.style.display = "flex";
        }
      }
      
      // 5. Forzar reflow para asegurar que los estilos se apliquen
      void this.appContent.offsetHeight;
      
      // 6. Esperar un momento más para que el CSS se aplique completamente
      setTimeout(() => {
        // 7. Hacer visible el contenido con fade in
        this.appContent.style.visibility = "visible";
        this.appContent.style.opacity = "1";
        
        // 8. Limpiar transiciones después de completar
        setTimeout(() => {
          this.appContent.style.transition = "";
          resolve();
        }, 100);
      }, 80); // ⬅️ Tiempo extra para que el CSS se aplique
      
    }, 150); // Tiempo para el fade out
  });
}
  /**
   * Obtiene el HTML de una vista (con caché)
   */
  async fetchView(viewName) {
    const cacheKey = `view_${viewName}`;

    if (this.viewCache.has(cacheKey)) {
      return this.viewCache.get(cacheKey);
    }

    const url = `${this.config.viewsPath}${viewName}.html`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      this.viewCache.set(cacheKey, html);
      return html;
    } catch (error) {
      console.error("Error en fetch:", error);
      return await this.fetch404View();
    }
  }

  /**
   * Obtiene la vista 404
   */
  async fetch404View() {
    try {
      const response = await fetch(`${this.config.viewsPath}404.html`);
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

  /**
   * Muestra el estado de error
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
   */
  updateTitle(viewName) {
    document.title =
      this.config.titles[viewName] || "Doggo - No es un perro, es una movida";
  }

  /**
   * Inicializa los componentes de una vista
   */
  initViewComponents(viewName) {
    console.log(`🔧 Inicializando componentes para: ${viewName}`);

    if (viewName === "pedido") {
      this.pedidoManager = new PedidoManager(
        this.modalManager,
        this.toastManager,
        this.productsManager,
        this.ordersManager,
      );
      this.pedidoManager.init();
    } else if (viewName === "home") {
      this.homeManager = new HomeManager();
      this.homeManager.init();
    } else if (viewName === "contacto") {
      this.contactoManager = new ContactoManager(this.toastManager);
      this.contactoManager.init();
    } else if (viewName === "login") {
      this.loginManager = new LoginManager(this.toastManager);
      this.loginManager.init();
    } else if (viewName === "admin" || viewName === "/admin") {
      console.log("🔍 Creando instancia de AdminManager...");
      this.adminManager = new AdminManager(
        this.toastManager,
        this.modalManager,
      );
      this.adminManager.init();
    }
  }

  /**
   * Inicializa el toggle del navbar
   */
/**
 * Inicializa el toggle del navbar (menú hamburguesa)
 */
/**
 * Inicializa el toggle del navbar (menú hamburguesa)
 */
initNavbarToggle() {
  const toggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  const overlay = document.getElementById('nav-mobile-overlay');
  const closeBtn = document.getElementById('mobile-menu-close');
  const mobileLinks = mobileMenu?.querySelectorAll('.mobile-menu-link');

  console.log('🔍 initNavbarToggle() ejecutado');
  console.log('🔍 toggle existe?', !!toggle);
  console.log('🔍 mobileMenu existe?', !!mobileMenu);
  console.log('🔍 overlay existe?', !!overlay);

  if (!toggle || !mobileMenu || !overlay) {
    console.warn('⚠️ Elementos del menú móvil no encontrados');
    return;
  }

  // Prevenir múltiples listeners
  if (toggle._listenerAdded) {
    console.log('⚠️ Listener ya agregado, saltando...');
    return;
  }

  const openMenu = () => {
    console.log('📂 Abriendo menú móvil');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('menu-open');
  };

  const closeMenu = () => {
    console.log('📁 Cerrando menú móvil');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('menu-open');
  };

  // Abrir/cerrar menú con botón hamburguesa
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mobileMenu.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Cerrar con botón X
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
    });
  }

  // Cerrar al hacer click en overlay
  overlay.addEventListener('click', closeMenu);

  // Cerrar al hacer click en un link del menú
  mobileLinks?.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMenu();
    }
  });

  toggle._listenerAdded = true;
  console.log('✅ Menú hamburguesa inicializado correctamente');
}
}
