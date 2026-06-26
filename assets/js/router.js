const ROUTER_CONFIG = {
  defaultView: "home",
  viewsPath: "views/",
  cssPath: "assets/css/",
  titles: {
    home: "Doggo - Inicio | No es un perro, es una movida",
    pedido: "Doggo - Haz tu Pedido | No es un perro, es una movida",
    metodospagos: "Doggo - Métodos de Pago | No es un perro, es una movida",
    contacto: "Doggo - Contacto | No es un perro, es una movida",
    sobre: "Doggo - Sobre este proyecto",
  },
};

class StyleManager {
  constructor() {
    this.loadedStyles = new Set();
  }

  loadStyle(styleName) {
    return new Promise((resolve, reject) => {
      const href = `${ROUTER_CONFIG.cssPath}${styleName}.css`;

      if (this.loadedStyles.has(href)) {
        return resolve(document.querySelector(`link[href="${href}"]`));
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.dynamic = "true";

      link.onload = () => {
        this.loadedStyles.add(href);
        resolve(link);
      };

      link.onerror = () => reject(new Error(`No se pudo cargar ${href}`));
      document.head.appendChild(link);
    });
  }

  unloadDynamicStyles() {
    document.querySelectorAll('link[data-dynamic="true"]').forEach((link) => {
      const href = link.getAttribute("href");
      this.loadedStyles.delete(href);
      link.remove();
    });
  }

  async switchToViewStyle(viewName) {
    this.unloadDynamicStyles();
    await this.loadStyle(viewName === "home" ? "home" : viewName);
  }
}

class Router {
  constructor() {
    this.appContent = document.getElementById("app-content");
    this.viewCache = new Map();
    this.styleManager = new StyleManager();
    this.init();
  }

  init() {
    if (!this.appContent) {
      console.error("No existe #app-content");
      return;
    }

    window.addEventListener("hashchange", () => this.processRoute(window.location.hash || "#/home"));

    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#/"]');
      if (!link) return;
      e.preventDefault();
      window.location.hash = link.getAttribute("href");
    });

    this.processRoute(window.location.hash || "#/home");
  }

  processRoute(hash) {
    const route = hash.replace("#/", "").split("?")[0] || ROUTER_CONFIG.defaultView;
    this.navigate(route);
  }

  async navigate(viewName) {
    try {
      this.showLoading();

      const [html] = await Promise.all([
        this.fetchView(viewName),
        this.styleManager.switchToViewStyle(viewName),
      ]);

      this.appContent.innerHTML = html;
      this.updateTitle(viewName);
      this.updateActiveLink(viewName);
      await this.initViewComponents(viewName);
      this.hideLoading();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error de navegación:", error);
      this.showErrorState(viewName);
      this.hideLoading();
    }
  }

  showLoading() {
    this.appContent.classList.add("loading");
  }

  hideLoading() {
    this.appContent.classList.remove("loading");
  }

  async fetchView(viewName) {
    const cacheKey = `view_${viewName}`;
    if (this.viewCache.has(cacheKey)) return this.viewCache.get(cacheKey);

    const response = await fetch(`${ROUTER_CONFIG.viewsPath}${viewName}.html`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    this.viewCache.set(cacheKey, html);
    return html;
  }

  showErrorState(viewName) {
    this.appContent.innerHTML = `
      <div class="error-container">
        <h1>⚠️ Error al cargar la página</h1>
        <p>No pudimos cargar la sección "${viewName}".</p>
        <a href="#/home" class="btn btn-primary">Ir al inicio</a>
      </div>
    `;
    this.updateTitle(viewName);
    this.updateActiveLink("home");
  }

  updateTitle(viewName) {
    document.title = ROUTER_CONFIG.titles[viewName] || "Doggo - No es un perro, es una movida";
  }

  updateActiveLink(viewName) {
    document.querySelectorAll(".nav-link, .footer-link, .credits-link").forEach((link) => {
      link.classList.remove("active");
    });

    document.querySelectorAll(`a[href="#/${viewName}"]`).forEach((link) => {
      if (link.classList.contains("nav-link") || link.classList.contains("footer-link") || link.classList.contains("credits-link")) {
        link.classList.add("active");
      }
    });
  }

  async initViewComponents(viewName) {
    if (viewName === "pedido") {
      window.initPedidoManager?.();
    }
  }
}

window.Router = new Router();