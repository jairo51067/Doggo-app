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
    return true;
  }
}

class ModalManager {
  confirm(message, title = "Confirmar", confirmText = "Sí, continuar", cancelText = "Cancelar", type = "warning") {
    return new Promise((resolve) => {
      const icons = { warning: "⚠️", danger: "🚨", info: "ℹ️" };
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.innerHTML = `
        <div class="modal-box">
          <div class="modal-icon">${icons[type] || "❓"}</div>
          <h3 class="modal-title">${title}</h3>
          <p class="modal-message">${message}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" data-action="cancel">${cancelText}</button>
            <button class="modal-btn ${type === "danger" ? "danger" : "confirm"}" data-action="confirm">${confirmText}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const finish = (value) => {
        overlay.remove();
        resolve(value);
      };

      overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => finish(false));
      overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => finish(true));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) finish(false);
      });
      document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") {
          finish(false);
          document.removeEventListener("keydown", esc);
        }
      }, { once: true });
    });
  }
}

class ToastManager {
  constructor() {
    this.container = document.querySelector(".toast-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
  }

  show(message, type = "info", title = "", duration = 3000) {
    const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || "ℹ️"}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Cerrar notificación">✕</button>
    `;
    this.container.appendChild(toast);
    toast.querySelector(".toast-close").addEventListener("click", () => this.hide(toast));
    if (duration > 0) setTimeout(() => this.hide(toast), duration);
    return toast;
  }

  hide(toast) {
    if (!toast) return;
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 350);
  }

  success(message, title = "¡Éxito!", duration = 3000) {
    return this.show(message, "success", title, duration);
  }

  error(message, title = "Error", duration = 4000) {
    return this.show(message, "error", title, duration);
  }

  info(message, title = "Información", duration = 3000) {
    return this.show(message, "info", title, duration);
  }

  warning(message, title = "Atención", duration = 3500) {
    return this.show(message, "warning", title, duration);
  }
}

class Router {
  constructor() {
    this.appContent = document.getElementById("app-content");
    this.styleManager = new StyleManager();
    this.viewCache = new Map();
    this.currentView = null;
    this.orderState = null;
    this.PRICES = null;
    this.init();
  }

  init() {
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
      this.initViewComponents(viewName);
      this.hideLoading();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      this.appContent.innerHTML = `
        <div class="error-container">
          <h1>⚠️ Error al cargar la página</h1>
          <p>No pudimos cargar la sección "${viewName}".</p>
          <a href="#/home" class="btn btn-primary">Ir al inicio</a>
        </div>
      `;
      this.hideLoading();
    }
  }

  showLoading() {
    if (this.appContent) this.appContent.classList.add("loading");
  }

  hideLoading() {
    if (this.appContent) this.appContent.classList.remove("loading");
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

  updateTitle(viewName) {
    document.title = ROUTER_CONFIG.titles[viewName] || "Doggo - No es un perro, es una movida";
  }

  initViewComponents(viewName) {
    const clean = viewName.replace("/", "");
    if (clean === "pedido") setTimeout(() => this.initPedidoForm(), 100);
  }

  initPedidoForm() {
    const form = document.getElementById("pedido-form");
    if (!form || form.dataset.initialized === "true") return;
    form.dataset.initialized = "true";

    this.orderState = {
      currentStep: 1,
      totalSteps: 4,
      doggos: {},
      extras: {},
      bebidas: {},
      delivery: "pickup",
      direccion: "",
      referencias: "",
      leadData: { nombre: "", email: "", whatsapp: "" },
    };

    this.PRICES = {
      doggos: {
        "Clásico": 8000,
        "Americano": 9500,
        "Mexicano": 10000,
        "Bacon": 10500,
        "Veggie": 9000,
        "Hawaiano": 9500,
      },
      extras: {
        "Queso extra": 1500,
        "Bacon": 2000,
        "Jalapeños": 1000,
        "Guacamole": 2500,
        "Champiñones": 1500,
        "Cebolla caramelizada": 1000,
        "Pimentón asado": 1000,
        "Queso rallado extra": 1000,
      },
      bebidas: {
        "Refresco": 2500,
        "Agua": 1500,
        "Cerveza": 4000,
        "Malteada": 5000,
        "Jugo natural": 3000,
        "Limonada": 2500,
      },
      delivery: 1500,
    };

    this.initStepper(form);
    this.initQuantities(form, ".doggo-card", "doggos", ".qty-value", "has-items", "success");
    this.initQuantities(form, ".extra-chip", "extras", ".qty-value-mini", "has-items", "info");
    this.initQuantities(form, ".bebida-card", "bebidas", ".qty-value-mini", "has-items", "info");
    this.initDeliveryOption(form);
    this.initDireccionFields(form);
    this.initLeadFields(form);
    this.initClearCart(form);
    this.initFormSubmit(form);
    this.updateSummary();
  }

  initStepper(form) {
    const steps = form.querySelectorAll(".step-content");
    const indicators = form.querySelectorAll(".step-indicator");

    const showStep = (stepNumber) => {
      if (stepNumber > this.orderState.currentStep) {
        if (!this.validateCurrentStep(this.orderState.currentStep, form)) return;
      }

      this.orderState.currentStep = stepNumber;

      steps.forEach((step) => {
        step.classList.toggle("active", parseInt(step.dataset.step, 10) === stepNumber);
      });

      indicators.forEach((indicator) => {
        const step = parseInt(indicator.dataset.step, 10);
        indicator.classList.remove("active", "completed");
        if (step === stepNumber) indicator.classList.add("active");
        if (step < stepNumber) indicator.classList.add("completed");
      });

      form.querySelectorAll(".step-line").forEach((line, index) => {
        line.classList.toggle("completed", index < stepNumber - 1);
      });

      if (stepNumber === 3) this.toggleDireccionFields(form);
      this.saveOrderState();
    };

    form.querySelectorAll(".btn-next").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showStep(parseInt(btn.dataset.next, 10));
      });
    });

    form.querySelectorAll(".btn-prev").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showStep(parseInt(btn.dataset.prev, 10));
      });
    });

    indicators.forEach((indicator) => {
      indicator.addEventListener("click", () => {
        const step = parseInt(indicator.dataset.step, 10);
        if (step <= this.orderState.currentStep) showStep(step);
      });
    });

    showStep(this.orderState.currentStep);
  }

  validateCurrentStep(step, form) {
    if (step === 1) return this.validateLeadFields(form);
    if (step === 2) return this.validateDoggos();
    if (step === 3) return this.validateStep3(form);
    return true;
  }

  validateLeadFields(form) {
    const inputs = form.querySelectorAll('.step-content[data-step="1"] input[required]');
    let ok = true;

    inputs.forEach((input) => {
      const value = input.value.trim();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validPhone = /^(\+?\d{1,3}[-.]?)?\d{10,14}$/;

      if (!value) ok = false;
      if (input.type === "email" && value && !validEmail.test(value)) ok = false;
      if (input.type === "tel" && value && !validPhone.test(value.replace(/\s/g, ""))) ok = false;
      this.validateField(input);
    });

    if (!ok) Toast.warning("Por favor, revisa tus datos.", "Datos incompletos");
    return ok;
  }

  validateField(input) {
    const feedback = input.closest(".form-group")?.querySelector(".field-feedback");
    if (!feedback) return true;

    const value = input.value.trim();
    input.classList.remove("error", "success");
    feedback.innerHTML = "";

    if (input.required && !value) {
      input.classList.add("error");
      feedback.innerHTML = `<span class="error-msg">Este campo es obligatorio.</span>`;
      return false;
    }

    if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      input.classList.add("error");
      feedback.innerHTML = `<span class="error-msg">Ingresa un email válido.</span>`;
      return false;
    }

    if (input.type === "tel" && value && !/^(\+?\d{1,3}[-.]?)?\d{10,14}$/.test(value.replace(/\s/g, ""))) {
      input.classList.add("error");
      feedback.innerHTML = `<span class="error-msg">Ingresa un WhatsApp válido.</span>`;
      return false;
    }

    if (value) {
      input.classList.add("success");
      feedback.innerHTML = `<span class="success-msg">Correcto.</span>`;
    }
    return true;
  }

  validateDoggos() {
    return Object.values(this.orderState.doggos).reduce((a, b) => a + b, 0) > 0;
  }

  validateStep3(form) {
    if (this.orderState.delivery === "delivery") {
      const direccion = form.querySelector("#direccion");
      if (!direccion || !direccion.value.trim()) {
        Toast.warning("Por favor, ingresa la dirección de envío.", "Dirección requerida");
        direccion?.focus();
        return false;
      }
    }
    return true;
  }

  initQuantities(form, selector, stateKey, qtySelector, activeClass) {
    form.querySelectorAll(selector).forEach((card) => {
      const value = card.dataset.value;
      const qtyDisplay = card.querySelector(qtySelector);
      const minusBtn = card.querySelector(".minus");
      const plusBtn = card.querySelector(".plus");

      const update = (delta) => {
        const current = parseInt(qtyDisplay.textContent, 10) || 0;
        const next = Math.max(0, current + delta);

        qtyDisplay.textContent = next;

        if (next > 0) {
          this.orderState[stateKey][value] = next;
          card.classList.add(activeClass);
        } else {
          delete this.orderState[stateKey][value];
          card.classList.remove(activeClass);
        }

        this.updateSummary();
        this.saveOrderState();
      };

      minusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        update(-1);
      });

      plusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        update(1);
      });
    });
  }

  initDeliveryOption(form) {
    const cards = form.querySelectorAll(".delivery-card");
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        cards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        this.orderState.delivery = card.dataset.value;
        this.toggleDireccionFields(form);
        this.updateSummary();
        this.saveOrderState();
      });
    });
  }

  toggleDireccionFields(form) {
    const group = form.querySelector(".direccion-group");
    if (!group) return;
    group.style.display = this.orderState.delivery === "delivery" ? "block" : "none";
  }

  initDireccionFields(form) {
    const direccion = form.querySelector("#direccion");
    const referencias = form.querySelector("#referencias");

    if (direccion) {
      direccion.addEventListener("input", () => {
        this.orderState.direccion = direccion.value.trim();
        this.saveOrderState();
        this.updateSummary();
      });
    }

    if (referencias) {
      referencias.addEventListener("input", () => {
        this.orderState.referencias = referencias.value.trim();
        this.saveOrderState();
        this.updateSummary();
      });
    }
  }

  initLeadFields(form) {
    ["nombre", "email", "whatsapp"].forEach((name) => {
      const input = form.querySelector(`#${name}`);
      if (!input) return;

      input.addEventListener("input", () => {
        this.orderState.leadData[name] = input.value.trim();
        this.saveOrderState();
      });

      input.addEventListener("blur", () => this.validateField(input));
    });
  }

  initClearCart(form) {
    form.querySelectorAll(".btn-clear-cart").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const confirmed = await Modal.confirm(
          "Esta acción eliminará todos los items del carrito y tus datos de contacto.",
          "¿Vaciar todo el pedido?",
          "Sí, vaciar todo",
          "Cancelar",
          "danger"
        );
        if (confirmed) this.clearCart();
      });
    });
  }

  clearCart() {
    this.orderState = {
      currentStep: 1,
      totalSteps: 4,
      doggos: {},
      extras: {},
      bebidas: {},
      delivery: "pickup",
      direccion: "",
      referencias: "",
      leadData: { nombre: "", email: "", whatsapp: "" },
    };

    localStorage.removeItem("doggo_order_state");

    const form = document.getElementById("pedido-form");
    if (!form) return;

    form.querySelectorAll("input").forEach((input) => {
      input.value = "";
      input.classList.remove("error", "success");
      const fb = input.closest(".form-group")?.querySelector(".field-feedback");
      if (fb) fb.innerHTML = "";
    });

    form.querySelectorAll(".qty-value, .qty-value-mini").forEach((el) => (el.textContent = "0"));
    form.querySelectorAll(".doggo-card, .extra-chip, .bebida-card").forEach((card) => card.classList.remove("has-items"));

    form.querySelectorAll(".delivery-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.value === "pickup");
    });

    this.toggleDireccionFields(form);
    this.updateSummary();
    this.initStepper(form);
    Toast.success("Todos los datos han sido reiniciados.", "Carrito vaciado");
  }

  initFormSubmit(form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!this.validateLeadFields(form)) {
        this.orderState.currentStep = 1;
        this.initStepper(form);
        return;
      }

      if (!this.validateDoggos()) {
        Toast.warning("Agrega al menos un Doggo a tu pedido.", "Carrito vacío");
        this.orderState.currentStep = 2;
        this.initStepper(form);
        return;
      }

      if (!this.validateStep3(form)) {
        this.orderState.currentStep = 3;
        this.initStepper(form);
        return;
      }

      const summary = this.buildOrderSummary();
      const message = this.buildWhatsAppMessage(summary);
      const phone = this.formatWhatsApp(this.orderState.leadData.whatsapp);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    });
  }

  buildOrderSummary() {
    let total = 0;

    const addItems = (items, prices) => {
      return Object.entries(items).map(([name, qty]) => {
        const subtotal = (prices[name] || 0) * qty;
        total += subtotal;
        return `${qty}x ${name} ($${subtotal.toLocaleString()})`;
      });
    };

    const doggosList = addItems(this.orderState.doggos, this.PRICES.doggos);
    const extrasList = addItems(this.orderState.extras, this.PRICES.extras);
    const bebidasList = addItems(this.orderState.bebidas, this.PRICES.bebidas);

    if (this.orderState.delivery === "delivery") total += this.PRICES.delivery;

    return {
      total,
      doggosList,
      extrasList,
      bebidasList,
      deliveryText: this.orderState.delivery === "pickup" ? "Recoger en local" : "Envío a domicilio",
    };
  }

  buildWhatsAppMessage(data) {
    return `
Nuevo pedido Doggo

Nombre: ${this.orderState.leadData.nombre || "No especificado"}
Email: ${this.orderState.leadData.email || "No especificado"}
WhatsApp: ${this.orderState.leadData.whatsapp || "No especificado"}

Doggos:
${data.doggosList.join("\n") || "Sin doggos"}

Extras:
${data.extrasList.join("\n") || "Sin extras"}

Bebidas:
${data.bebidasList.join("\n") || "Sin bebidas"}

Entrega: ${data.deliveryText}
${this.orderState.delivery === "delivery" ? `Dirección: ${this.orderState.direccion || "No especificada"}\nReferencias: ${this.orderState.referencias || "No especificadas"}\n` : ""}

Total: $${data.total.toLocaleString()}
    `.trim();
  }

  formatWhatsApp(phone) {
    return phone.replace(/\D/g, "");
  }

  updateSummary() {
    const client = document.getElementById("summary-client");
    const doggos = document.getElementById("summary-doggos");
    const extras = document.getElementById("summary-extras");
    const bebidas = document.getElementById("summary-bebidas");
    const delivery = document.getElementById("summary-delivery");
    const totalBox = document.getElementById("order-total");
    if (!client || !doggos || !extras || !bebidas || !delivery || !totalBox) return;

    client.innerHTML = `
      <p><strong>${this.orderState.leadData.nombre || "Sin nombre"}</strong></p>
      <p>${this.orderState.leadData.email || "Sin email"}</p>
      <p>${this.orderState.leadData.whatsapp || "Sin WhatsApp"}</p>
    `;

    const renderItems = (obj, prices) => {
      const entries = Object.entries(obj);
      if (!entries.length) return `<p class="empty-summary">Sin selección</p>`;
      return entries.map(([name, qty]) => {
        const subtotal = (prices[name] || 0) * qty;
        return `
          <div class="summary-item">
            <span class="summary-label">${qty}x ${name}</span>
            <span class="summary-value">$${subtotal.toLocaleString()}</span>
          </div>
        `;
      }).join("");
    };

    doggos.innerHTML = renderItems(this.orderState.doggos, this.PRICES.doggos);
    extras.innerHTML = renderItems(this.orderState.extras, this.PRICES.extras);
    bebidas.innerHTML = renderItems(this.orderState.bebidas, this.PRICES.bebidas);

    const deliveryCost = this.orderState.delivery === "delivery" ? this.PRICES.delivery : 0;
    delivery.innerHTML = `
      <div class="summary-item">
        <span class="summary-label">${this.orderState.delivery === "pickup" ? "Recoger en local" : "Envío a domicilio"}</span>
        <span class="summary-value">${deliveryCost ? `$${deliveryCost.toLocaleString()}` : "Gratis"}</span>
      </div>
      ${this.orderState.delivery === "delivery" ? `
        <div class="summary-item">
          <span class="summary-label">Dirección</span>
          <span class="summary-value">${this.orderState.direccion || "Pendiente"}</span>
        </div>
      ` : ""}
    `;

    const summary = this.buildOrderSummary();
    totalBox.innerHTML = `
      <div class="total-breakdown">
        <div class="breakdown-item"><span>Subtotal</span><span>$${(summary.total - deliveryCost).toLocaleString()}</span></div>
        <div class="breakdown-item"><span>Delivery</span><span>${deliveryCost ? `$${deliveryCost.toLocaleString()}` : "Gratis"}</span></div>
        <div class="breakdown-total"><span>Total</span><span>$${summary.total.toLocaleString()}</span></div>
      </div>
    `;
  }

  saveOrderState() {
    localStorage.setItem("doggo_order_state", JSON.stringify(this.orderState));
  }
}

const Modal = new ModalManager();
const Toast = new ToastManager();
new Router();