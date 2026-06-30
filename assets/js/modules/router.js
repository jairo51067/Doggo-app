// ============================================
// ROUTER - Sistema de enrutamiento SPA
// ============================================
import { LoginManager } from './loginManager.js';
import { ProductsManager } from "./productsManager.js";
import { OrdersManager } from "./ordersManager.js";
// ✅ IMPORTACIONES CORREGIDAS (sin ./modules/ porque ya estamos dentro de modules)
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
  }

  /**
   * Inicializa el router
   */
 init() {
  console.log("🔧 Router.init()");
  
  // ✅ CORREGIDO: Usar arrow functions para mantener el contexto 'this'
  window.addEventListener("hashchange", (event) => this.handleHashChange(event));
  document.addEventListener("click", (event) => this.handleLinkClick(event));

  // Inicializar micro-interacciones globales
  initMicroInteractions();

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
  updateActiveLink(hash) {
    const activeLink = hash.replace("#/", "");
    document.querySelectorAll(".nav-link").forEach((link) => {
      const linkHref = link.getAttribute("href").replace("#/", "");
      link.classList.toggle("active", linkHref === activeLink);
    });
  }

  /**
   * mostrar confirmación
   */



  /**
   * Navega a una vista específica
   * @param {string} viewName - Nombre de la vista
   */
  async navigate(viewName) {
    console.log(`📄 Navegando a vista: ${viewName}`);
    try {
      this.showSkeleton();

      const [html] = await Promise.all([
        this.fetchView(viewName),
        this.styleManager.switchToViewStyle(viewName, this.config.cssPath),
      ]);

      await this.renderViewSmooth(html, viewName);

      this.updateTitle(viewName);

      // Destruir managers anteriores antes de crear nuevos
      this.destroyViewManagers();

      this.initViewComponents(viewName);

      this.hideSkeleton();

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
  }

  /**
   * Muestra el skeleton loader
   */
  showSkeleton() {
    this.appContent.classList.add("loading");
    this.appContent.style.opacity = "1";
  }

  /**
   * Oculta el skeleton loader
   */
  hideSkeleton() {
    this.appContent.classList.remove("loading");
    this.appContent.style.opacity = "1";
  }

  /**
   * Renderiza una vista con transición suave
   */
  renderViewSmooth(html, viewName) {
    return new Promise((resolve) => {
      this.appContent.style.transition = "opacity 0.3s ease";
      this.appContent.style.opacity = "0";

      setTimeout(() => {
        this.appContent.innerHTML = html;

        if (viewName === "home" || viewName === "/home") {
          const hero = this.appContent.querySelector(".hero-section");
          if (hero) {
            hero.style.minHeight = "100vh";
            hero.style.display = "flex";
          }
        }

        this.appContent.offsetHeight;
        this.appContent.style.opacity = "1";

        setTimeout(() => {
          this.appContent.style.transition = "";
          resolve();
        }, 350);
      }, 200);
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

  if (viewName === 'pedido') {
    this.pedidoManager = new PedidoManager(
      this.modalManager,
      this.toastManager,
      this.productsManager,
      this.ordersManager
    );
    this.pedidoManager.init();
  } else if (viewName === 'home') {
    this.homeManager = new HomeManager();
    this.homeManager.init();
  } else if (viewName === 'contacto') {
    this.contactoManager = new ContactoManager(this.toastManager);
    this.contactoManager.init();
  } else if (viewName === 'login') {
    this.loginManager = new LoginManager(this.toastManager);
    this.loginManager.init();
  }
}

  /**
   * Inicializa el toggle del navbar
   */
  initNavbarToggle() {
    const toggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (toggle && navMenu) {
      if (toggle._listenerAdded) return;

      const toggleScroll = (disable) => {
        document.body.style.overflow = disable ? "hidden" : "";
        document.body.style.touchAction = disable ? "none" : "";
      };

      const handleToggle = (e) => {
        e.stopPropagation();
        const isOpen = navMenu.classList.toggle("active");
        toggle.classList.toggle("active");
        toggle.setAttribute("aria-expanded", isOpen);
        toggleScroll(isOpen);

        if (isOpen) {
          const links = navMenu.querySelectorAll(".nav-link");
          links.forEach((link, index) => {
            link.style.transitionDelay = `${0.05 * index}s`;
          });
        }
      };

      toggle.addEventListener("click", handleToggle);
      toggle._listenerAdded = true;

      const links = navMenu.querySelectorAll(".nav-link");
      links.forEach((link) => {
        link.addEventListener("click", () => {
          navMenu.classList.remove("active");
          toggle.classList.remove("active");
          toggle.setAttribute("aria-expanded", "false");
          toggleScroll(false);
        });
      });

      document.addEventListener("click", (e) => {
        if (
          navMenu.classList.contains("active") &&
          !navMenu.contains(e.target) &&
          !toggle.contains(e.target)
        ) {
          navMenu.classList.remove("active");
          toggle.classList.remove("active");
          toggle.setAttribute("aria-expanded", "false");
          toggleScroll(false);
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          toggle.classList.remove("active");
          toggle.setAttribute("aria-expanded", "false");
          toggleScroll(false);
        }
      });

      console.log("✅ Navbar toggle inicializado");
    }
  }
}
