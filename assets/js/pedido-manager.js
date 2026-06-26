class PedidoManager {
  constructor() {
    this.form = null;
    this.orderState = null;
    this.PRICES = null;
  }

  init() {
    this.form = document.getElementById("pedido-form");
    if (!this.form) return;

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

    this.loadOrderState();
    this.syncUIFromState();
    this.initStepper();
    this.initQuantities(".doggo-card", "doggos", ".qty-value", "has-items");
    this.initQuantities(".extra-chip", "extras", ".qty-value-mini", "has-items");
    this.initQuantities(".bebida-card", "bebidas", ".qty-value-mini", "has-items");
    this.initDeliveryOption();
    this.initDireccionFields();
    this.initLeadFields();
    this.initClearCart();
    this.initFormSubmit();
    this.updateSummary();
  }

  loadOrderState() {
    const saved = localStorage.getItem("doggo_order_state");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      this.orderState = {
        ...this.orderState,
        ...parsed,
        leadData: {
          ...(this.orderState?.leadData || {}),
          ...(parsed.leadData || {}),
        },
        doggos: parsed.doggos || {},
        extras: parsed.extras || {},
        bebidas: parsed.bebidas || {},
        delivery: parsed.delivery || "pickup",
        direccion: parsed.direccion || "",
        referencias: parsed.referencias || "",
        currentStep: parsed.currentStep || 1,
      };
    } catch (error) {
      console.error("Error cargando estado guardado:", error);
    }
  }

  syncUIFromState() {
    if (!this.form || !this.orderState) return;

    const nombre = this.form.querySelector("#nombre");
    const email = this.form.querySelector("#email");
    const whatsapp = this.form.querySelector("#whatsapp");
    const direccion = this.form.querySelector("#direccion");
    const referencias = this.form.querySelector("#referencias");

    if (nombre) nombre.value = this.orderState.leadData.nombre || "";
    if (email) email.value = this.orderState.leadData.email || "";
    if (whatsapp) whatsapp.value = this.orderState.leadData.whatsapp || "";
    if (direccion) direccion.value = this.orderState.direccion || "";
    if (referencias) referencias.value = this.orderState.referencias || "";

    this.form.querySelectorAll(".delivery-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.value === this.orderState.delivery);
    });

    this.toggleDireccionFields();
    this.applyQuantities(".doggo-card", this.orderState.doggos, ".qty-value", "has-items");
    this.applyQuantities(".extra-chip", this.orderState.extras, ".qty-value-mini", "has-items");
    this.applyQuantities(".bebida-card", this.orderState.bebidas, ".qty-value-mini", "has-items");
    this.updateStepperUI(Number(this.orderState.currentStep) || 1);
    this.updateSummary();
  }

  applyQuantities(selector, stateObj, qtySelector, activeClass) {
    this.form.querySelectorAll(selector).forEach((card) => {
      const value = card.dataset.value;
      const qtyDisplay = card.querySelector(qtySelector);
      const qty = stateObj[value] || 0;
      if (qtyDisplay) qtyDisplay.textContent = String(qty);
      card.classList.toggle(activeClass, qty > 0);
    });
  }

  initStepper() {
    const showStep = (stepNumber) => {
      const nextStep = Number(stepNumber);
      if (Number.isNaN(nextStep)) return;

      if (nextStep > this.orderState.currentStep) {
        const valid = this.validateCurrentStep(this.orderState.currentStep);
        if (!valid) return;
      }

      this.orderState.currentStep = nextStep;
      this.updateStepperUI(nextStep);
      this.toggleDireccionFields();
      this.saveOrderState();
      this.updateSummary();
    };

    this.form.querySelectorAll(".btn-next").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showStep(btn.dataset.next);
      });
    });

    this.form.querySelectorAll(".btn-prev").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showStep(btn.dataset.prev);
      });
    });

    this.form.querySelectorAll(".step-indicator").forEach((indicator) => {
      indicator.addEventListener("click", () => {
        const step = Number(indicator.dataset.step);
        if (step <= this.orderState.currentStep) showStep(step);
      });
    });

    this.updateStepperUI(Number(this.orderState.currentStep) || 1);
  }

  updateStepperUI(stepNumber) {
    const current = Number(stepNumber) || 1;
    const steps = this.form.querySelectorAll(".step-content");
    const indicators = this.form.querySelectorAll(".step-indicator");

    steps.forEach((step) => {
      step.classList.toggle("active", Number(step.dataset.step) === current);
    });

    indicators.forEach((indicator) => {
      const step = Number(indicator.dataset.step);
      indicator.classList.remove("active", "completed");
      if (step === current) indicator.classList.add("active");
      if (step < current) indicator.classList.add("completed");
    });

    this.form.querySelectorAll(".step-line").forEach((line, index) => {
      line.classList.toggle("completed", index < current - 1);
    });
  }

  validateCurrentStep(step) {
    if (step === 1) return this.validateLeadFields();

    if (step === 2) {
      return this.validateDoggos();
    }

    if (step === 3) {
      return this.validateStep3();
    }

    return true;
  }

  validateLeadFields() {
    const inputs = this.form.querySelectorAll('.step-content[data-step="1"] input[required]');
    let ok = true;

    inputs.forEach((input) => {
      const value = input.value.trim();
      if (!value) ok = false;
      if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ok = false;
      if (input.type === "tel" && value && !/^(\+?\d{1,3}[-.]?)?\d{10,14}$/.test(value.replace(/\s/g, ""))) ok = false;
      this.validateField(input);
    });

    if (!ok && window.Toast) {
      Toast.warning("Por favor, revisa tus datos.", "Datos incompletos");
    }

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
      feedback.innerHTML = '<span class="error-msg">Este campo es obligatorio.</span>';
      return false;
    }

    if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      input.classList.add("error");
      feedback.innerHTML = '<span class="error-msg">Ingresa un email válido.</span>';
      return false;
    }

    if (input.type === "tel" && value && !/^(\+?\d{1,3}[-.]?)?\d{10,14}$/.test(value.replace(/\s/g, ""))) {
      input.classList.add("error");
      feedback.innerHTML = '<span class="error-msg">Ingresa un WhatsApp válido.</span>';
      return false;
    }

    if (value) {
      input.classList.add("success");
      feedback.innerHTML = '<span class="success-msg">Correcto.</span>';
    }

    return true;
  }

  validateDoggos() {
    const total = Object.values(this.orderState.doggos).reduce((a, b) => a + b, 0);
    if (total <= 0) {
      if (window.Toast) {
        Toast.warning("Agrega al menos un Doggo para continuar.", "Carrito vacío");
      }
      return false;
    }
    return true;
  }

  validateStep3() {
    if (this.orderState.delivery === "delivery") {
      const direccion = this.form.querySelector("#direccion");
      const value = direccion?.value.trim() || "";

      if (!value) {
        if (window.Toast) {
          Toast.warning("Por favor, ingresa la dirección de envío.", "Dirección requerida");
        }
        direccion?.focus();
        return false;
      }
    }
    return true;
  }

  initQuantities(selector, stateKey, qtySelector, activeClass) {
    this.form.querySelectorAll(selector).forEach((card) => {
      const value = card.dataset.value;
      const qtyDisplay = card.querySelector(qtySelector);
      const minusBtn = card.querySelector(".minus");
      const plusBtn = card.querySelector(".plus");

      const update = (delta) => {
        const current = parseInt(qtyDisplay?.textContent || "0", 10) || 0;
        const next = Math.max(0, current + delta);
        if (qtyDisplay) qtyDisplay.textContent = String(next);

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

      minusBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        update(-1);
      });

      plusBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        update(1);
      });
    });
  }

  initDeliveryOption() {
    const cards = this.form.querySelectorAll(".delivery-card");
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        cards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        this.orderState.delivery = card.dataset.value;
        this.toggleDireccionFields();
        this.updateSummary();
        this.saveOrderState();
      });
    });
  }

  toggleDireccionFields() {
    const group = this.form.querySelector(".direccion-group");
    if (!group) return;
    group.style.display = this.orderState.delivery === "delivery" ? "block" : "none";
  }

  initDireccionFields() {
    const direccion = this.form.querySelector("#direccion");
    const referencias = this.form.querySelector("#referencias");

    direccion?.addEventListener("input", () => {
      this.orderState.direccion = direccion.value.trim();
      this.saveOrderState();
      this.updateSummary();
    });

    referencias?.addEventListener("input", () => {
      this.orderState.referencias = referencias.value.trim();
      this.saveOrderState();
      this.updateSummary();
    });
  }

  initLeadFields() {
    ["nombre", "email", "whatsapp"].forEach((name) => {
      const input = this.form.querySelector(`#${name}`);
      if (!input) return;

      input.addEventListener("input", () => {
        this.orderState.leadData[name] = input.value.trim();
        this.saveOrderState();
      });

      input.addEventListener("blur", () => this.validateField(input));
    });
  }

  initClearCart() {
    this.form.querySelectorAll(".btn-clear-cart").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const confirmed = window.Modal
          ? await Modal.confirm(
              "Esta acción eliminará todos los items del carrito y tus datos de contacto.",
              "¿Vaciar todo el pedido?",
              "Sí, vaciar todo",
              "Cancelar",
              "danger"
            )
          : true;
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

    this.form.querySelectorAll("input").forEach((input) => {
      input.value = "";
      input.classList.remove("error", "success");
      const fb = input.closest(".form-group")?.querySelector(".field-feedback");
      if (fb) fb.innerHTML = "";
    });

    this.form.querySelectorAll(".qty-value, .qty-value-mini").forEach((el) => {
      el.textContent = "0";
    });

    this.form.querySelectorAll(".doggo-card, .extra-chip, .bebida-card").forEach((card) => {
      card.classList.remove("has-items");
    });

    this.form.querySelectorAll(".delivery-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.value === "pickup");
    });

    this.toggleDireccionFields();
    this.updateSummary();
    this.updateStepperUI(1);

    if (window.Toast) {
      Toast.success("Todos los datos han sido reiniciados.", "Carrito vaciado");
    }
  }

  initFormSubmit() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!this.validateLeadFields()) {
        this.orderState.currentStep = 1;
        this.updateStepperUI(1);
        return;
      }

      if (!this.validateDoggos()) {
        this.orderState.currentStep = 2;
        this.updateStepperUI(2);
        return;
      }

      if (!this.validateStep3()) {
        this.orderState.currentStep = 3;
        this.updateStepperUI(3);
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

    const addItems = (items, prices) =>
      Object.entries(items).map(([name, qty]) => {
        const subtotal = (prices[name] || 0) * qty;
        total += subtotal;
        return `${qty}x ${name} ($${subtotal.toLocaleString()})`;
      });

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

    client.innerHTML = `<p><strong>${this.orderState.leadData.nombre || "Sin nombre"}</strong></p><p>${this.orderState.leadData.email || "Sin email"}</p><p>${this.orderState.leadData.whatsapp || "Sin WhatsApp"}</p>`;

    const renderItems = (obj, prices) => {
      const entries = Object.entries(obj);
      if (!entries.length) return `<p class="empty-summary">Sin selección</p>`;
      return entries
        .map(([name, qty]) => {
          const subtotal = (prices[name] || 0) * qty;
          return `<div class="summary-item"><span class="summary-label">${qty}x ${name}</span><span class="summary-value">$${subtotal.toLocaleString()}</span></div>`;
        })
        .join("");
    };

    doggos.innerHTML = renderItems(this.orderState.doggos, this.PRICES.doggos);
    extras.innerHTML = renderItems(this.orderState.extras, this.PRICES.extras);
    bebidas.innerHTML = renderItems(this.orderState.bebidas, this.PRICES.bebidas);

    const deliveryCost = this.orderState.delivery === "delivery" ? this.PRICES.delivery : 0;
    delivery.innerHTML = `
      <div class="summary-item"><span class="summary-label">${this.orderState.delivery === "pickup" ? "Recoger en local" : "Envío a domicilio"}</span><span class="summary-value">${deliveryCost ? `$${deliveryCost.toLocaleString()}` : "Gratis"}</span></div>
      ${this.orderState.delivery === "delivery" ? `<div class="summary-item"><span class="summary-label">Dirección</span><span class="summary-value">${this.orderState.direccion || "Pendiente"}</span></div>` : ""}
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

window.PedidoManager = PedidoManager;
window.initPedidoManager = function () {
  window.pedidoManagerInstance = new window.PedidoManager();
  window.pedidoManagerInstance.init();
};