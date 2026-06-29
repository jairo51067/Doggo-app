// ============================================
// PEDIDO MANAGER - Lógica del formulario de pedidos
// ============================================

import { ProductsManager } from "./productsManager.js";

/**
 * Gestiona toda la lógica del formulario de pedidos
 */
export class PedidoManager {
  /**
   * @param {ModalManager} modalManager - Instancia del gestor de modales
   * @param {ToastManager} toastManager - Instancia del gestor de toasts
   * @param {ProductsManager} productsManager - Instancia del gestor de productos
   * @param {OrdersManager} ordersManager - Instancia del gestor de órdenes
   */
  constructor(modalManager, toastManager, productsManager, ordersManager) {
    this.modalManager = modalManager;
    this.toastManager = toastManager;
    this.productsManager = productsManager;
    this.ordersManager = ordersManager;
    this.form = null;
    this.orderState = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa el formulario de pedidos
   */
  async init() {
    console.log("🔍 PedidoManager.init() ejecutado");

    this.form = document.getElementById("pedido-form");
    if (!this.form) {
      console.error("❌ Formulario de pedido NO encontrado");
      return;
    }
    console.log("✅ Formulario encontrado");

    // Cargar productos desde Firestore
    try {
      await this.productsManager.loadProducts();
      console.log("✅ Productos cargados desde Firestore");
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
      if (this.toastManager) {
        this.toastManager.error(
          "Error cargando el menú. Recarga la página.",
          "Error"
        );
      }
      return;
    }

    // Estado del pedido
    this.orderState = {
      currentStep: 1,
      totalSteps: 4,
      doggos: {},
      extras: {},
      bebidas: {},
      delivery: "pickup",
      direccion: "",
      referencias: "",
      leadData: {
        nombre: "",
        email: "",
        whatsapp: "",
      },
    };

    // Cargar estado desde localStorage
    this.loadOrderState();

    // Inicializar componentes
    this.initStepper();
    this.initQuantities(".doggo-card", "doggos", ".qty-value", "has-items");
    this.initQuantities(".extra-chip", "extras", ".qty-value-mini", "has-items");
    this.initQuantities(".bebida-card", "bebidas", ".qty-value-mini", "has-items");
    this.initDeliveryOption();
    this.initDireccionFields();
    this.initLeadFields();
    this.initClearCart();
    this.initFormSubmit();

    // Actualizar resumen inicial
    this.updateSummary();

    this.isInitialized = true;
    console.log("✅ PedidoManager inicializado correctamente");
  }

  /**
   * Inicializa el stepper (pasos del formulario)
   */
  initStepper() {
    const showStep = (stepNumber) => {
      if (stepNumber > this.orderState.currentStep) {
        const isValid = this.validateCurrentStep(this.orderState.currentStep);
        if (!isValid) return;
      }

      this.orderState.currentStep = stepNumber;
      this.updateStepperUI(stepNumber);
      this.toggleDireccionFields();
      this.saveOrderState();
      this.updateSummary();
      this.form.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Botones Siguiente
    this.form.querySelectorAll(".btn-next").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const step = parseInt(btn.dataset.next);
        if (step <= this.orderState.totalSteps) {
          showStep(step);
        }
      });
    });

    // Botones Atrás
    this.form.querySelectorAll(".btn-prev").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const step = parseInt(btn.dataset.prev);
        if (step >= 1) {
          showStep(step);
        }
      });
    });

    // Indicadores de pasos (click para ir a pasos completados)
    this.form.querySelectorAll(".step-indicator").forEach((indicator) => {
      indicator.addEventListener("click", () => {
        const step = parseInt(indicator.dataset.step);
        if (
          step < this.orderState.currentStep ||
          indicator.classList.contains("completed")
        ) {
          showStep(step);
        }
      });
    });

    // Mostrar el paso inicial
    this.updateStepperUI(this.orderState.currentStep);
  }

  /**
   * Actualiza la UI del stepper
   */
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

  /**
   * Inicializa los controles de cantidad para un tipo de item
   */
  initQuantities(selector, stateKey, qtySelector, activeClass) {
    this.form.querySelectorAll(selector).forEach((card) => {
      const value = card.dataset.value;
      const qtyDisplay = card.querySelector(qtySelector);
      const minusBtn = card.querySelector(".minus");
      const plusBtn = card.querySelector(".plus");

      // Restaurar cantidad desde el estado
      if (this.orderState[stateKey][value]) {
        const qty = this.orderState[stateKey][value];
        if (qtyDisplay) qtyDisplay.textContent = String(qty);
        card.classList.add(activeClass);
      }

      const updateQuantity = (change) => {
        const current = parseInt(qtyDisplay?.textContent || "0", 10) || 0;
        const next = Math.max(0, current + change);
        if (qtyDisplay) qtyDisplay.textContent = String(next);

        if (next > 0) {
          this.orderState[stateKey][value] = next;
          card.classList.add(activeClass);
          if (change > 0 && this.toastManager) {
            this.toastManager.info(
              `${value} añadido (${next}x)`,
              "Agregado",
              1500
            );
          }
        } else {
          delete this.orderState[stateKey][value];
          card.classList.remove(activeClass);
        }

        this.updateSummary();
        this.saveOrderState();
      };

      minusBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        updateQuantity(-1);
      });

      plusBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        updateQuantity(1);
      });
    });
  }

  /**
   * Inicializa la opción de delivery
   */
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

        if (this.toastManager) {
          const text =
            card.dataset.value === "pickup"
              ? "Recoger en local"
              : "Envío a domicilio";
          this.toastManager.info(
            `Opción seleccionada: ${text}`,
            "Entrega",
            2000
          );
        }
      });

      if (this.orderState.delivery === card.dataset.value) {
        card.classList.add("selected");
      }
    });
  }

  /**
   * Muestra/oculta los campos de dirección
   */
  toggleDireccionFields() {
    const group = this.form.querySelector(".direccion-group");
    if (!group) return;
    group.style.display =
      this.orderState.delivery === "delivery" ? "block" : "none";
  }

  /**
   * Inicializa los campos de dirección
   */
  initDireccionFields() {
    const direccion = this.form.querySelector("#direccion");
    const referencias = this.form.querySelector("#referencias");

    if (direccion) {
      if (this.orderState.direccion) direccion.value = this.orderState.direccion;
      direccion.addEventListener("input", () => {
        this.orderState.direccion = direccion.value.trim();
        this.saveOrderState();
        this.updateSummary();
      });
    }

    if (referencias) {
      if (this.orderState.referencias)
        referencias.value = this.orderState.referencias;
      referencias.addEventListener("input", () => {
        this.orderState.referencias = referencias.value.trim();
        this.saveOrderState();
        this.updateSummary();
      });
    }
  }

  /**
   * Inicializa los campos de lead (cliente)
   */
  initLeadFields() {
    ["nombre", "email", "whatsapp"].forEach((name) => {
      const input = this.form.querySelector(`#${name}`);
      if (!input) return;

      if (this.orderState.leadData[name]) {
        input.value = this.orderState.leadData[name];
      }

      input.addEventListener("input", () => {
        this.orderState.leadData[name] = input.value.trim();
        this.saveOrderState();
        this.validateField(input);
      });

      input.addEventListener("blur", () => {
        this.validateField(input);
      });
    });
  }

  /**
   * Inicializa el botón "Vaciar carrito"
   */
  initClearCart() {
    this.form.querySelectorAll(".btn-clear-cart").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const confirmed = this.modalManager
          ? await this.modalManager.confirm(
              "Esta acción eliminará todos los items del carrito y tus datos de contacto.",
              "¿Vaciar todo el pedido?",
              "Sí, vaciar todo",
              "Cancelar",
              "danger"
            )
          : true;
        if (confirmed) {
          this.clearCart();
        }
      });
    });
  }

  /**
   * Vaciar carrito - versión original corregida
   */
  clearCart() {
    console.log("🗑️ Vaciar carrito ejecutado");

    // 1. Reiniciar estado completo
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

    // 2. Limpiar localStorage
    localStorage.removeItem("doggo_order_state");

    // 3. Obtener el formulario
    const form = this.form;
    if (!form) {
      if (this.toastManager) {
        this.toastManager.success(
          "Todos los datos han sido reiniciados.",
          "Carrito vaciado"
        );
      }
      return;
    }

    // 4. Limpiar TODOS los inputs
    form.querySelectorAll("input").forEach((input) => {
      input.value = "";
      input.classList.remove("error", "success");
      const feedback = input
        .closest(".form-group")
        ?.querySelector(".field-feedback");
      if (feedback) feedback.innerHTML = "";
    });

    // 5. Limpiar TODAS las cantidades
    form.querySelectorAll(".qty-value, .qty-value-mini").forEach((el) => {
      el.textContent = "0";
    });

    // 6. Limpiar TODAS las tarjetas con clase 'has-items'
    form
      .querySelectorAll(".doggo-card, .extra-chip, .bebida-card")
      .forEach((card) => {
        card.classList.remove("has-items");
      });

    // 7. Resetear opción de delivery
    form.querySelectorAll(".delivery-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.value === "pickup");
    });

    // 8. Ocultar dirección
    const direccionGroup = form.querySelector(".direccion-group");
    if (direccionGroup) direccionGroup.style.display = "none";

    // 9. Resetear el select de bebida si existe
    const bebidaSelect = form.querySelector("#bebida");
    if (bebidaSelect) bebidaSelect.value = "Sin bebida";

    // 10. Actualizar resumen
    this.updateSummary();

    // 11. Reiniciar stepper (volver al paso 1 visualmente)
    this.updateStepperUI(1);

    // 12. Notificación
    if (this.toastManager) {
      this.toastManager.success(
        "Todos los datos han sido reiniciados.",
        "Carrito vaciado"
      );
    }
  }

  /**
   * Inicializa el envío del formulario - VERSIÓN MODIFICADA
   */
  initFormSubmit() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.submitOrder();
    });
  }

  /**
   * 🆕 NUEVO MÉTODO - Envía el pedido y lo guarda en Firestore
   */
  async submitOrder() {
    console.log("📤 Enviando pedido...");

    // Validar formulario completo
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

    // Construir resumen del pedido
    const summary = this.buildOrderSummary();

    // Preparar URL de WhatsApp
    const whatsappUrl = this.buildWhatsAppUrl(summary);

    // Preparar datos del pedido
    const orderData = {
      customerName: this.orderState.leadData.nombre,
      phone: this.orderState.leadData.whatsapp,
      email: this.orderState.leadData.email,
      items: this.orderState.doggos,
      extras: this.orderState.extras,
      bebidas: this.orderState.bebidas,
      deliveryType: this.orderState.delivery,
      address: this.orderState.direccion,
      references: this.orderState.referencias,
      paymentMethod: "WhatsApp",
      subtotal: summary.total - summary.deliveryCost,
      deliveryFee: summary.deliveryCost,
      total: summary.total,
      whatsappUrl: whatsappUrl,
      notes: null,
    };

    // Mostrar loading
    if (this.toastManager) {
      this.toastManager.info("Guardando pedido...", "Procesando");
    }

    // GUARDAR EN FIRESTORE ANTES DE ABRIR WHATSAPP
    try {
      const result = await this.ordersManager.saveOrder(orderData);

      if (!result.success) {
        if (this.toastManager) {
          this.toastManager.error(
            "Error al guardar el pedido. Intenta de nuevo.",
            "Error"
          );
        }
        return;
      }

      // ÉXITO - Mostrar confirmación con número de pedido
      console.log("✅ Pedido guardado:", result.orderNumber);

      if (this.toastManager) {
        this.toastManager.success(
          `¡Pedido ${result.orderNumber} confirmado! Abriendo WhatsApp...`,
          "¡Listo!"
        );
      }

      // Mostrar modal de confirmación con el número de pedido
      this.showOrderConfirmation(result.orderNumber, result.order.total);

      // Limpiar carrito
      this.clearCart();

      // Esperar 2 segundos para que el usuario vea la confirmación
      setTimeout(() => {
        // Abrir WhatsApp
        window.open(whatsappUrl, "_blank");
      }, 2000);
    } catch (error) {
      console.error("❌ Error en submitOrder:", error);
      if (this.toastManager) {
        this.toastManager.error(
          "Error al procesar el pedido. Intenta de nuevo.",
          "Error"
        );
      }
    }
  }

  /**
   * Construye el resumen del pedido
   */
  buildOrderSummary() {
    let total = 0;

    const addItems = (items, category) =>
      Object.entries(items).map(([name, qty]) => {
        const price = this.productsManager.getPriceByName(name);
        const subtotal = price * qty;
        total += subtotal;
        return `${qty}x ${name} ($${subtotal.toLocaleString()})`;
      });

    const doggosList = addItems(this.orderState.doggos, "doggos");
    const extrasList = addItems(this.orderState.extras, "extras");
    const bebidasList = addItems(this.orderState.bebidas, "bebidas");

    const deliveryFee = this.productsManager.getDeliveryFee();
    if (this.orderState.delivery === "delivery") total += deliveryFee;

    return {
      total,
      doggosList,
      extrasList,
      bebidasList,
      deliveryText:
        this.orderState.delivery === "pickup"
          ? "Recoger en local"
          : "Envío a domicilio",
      deliveryCost: this.orderState.delivery === "delivery" ? deliveryFee : 0,
    };
  }

  /**
   * Construye el mensaje para WhatsApp
   */
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
${
  this.orderState.delivery === "delivery"
    ? `Dirección: ${this.orderState.direccion || "No especificada"}\nReferencias: ${this.orderState.referencias || "No especificadas"}\n`
    : ""
}

Total: $${data.total.toLocaleString()}
    `.trim();
  }

  /**
   * 🆕 NUEVO MÉTODO - Construye la URL de WhatsApp
   */
  buildWhatsAppUrl(summary) {
    const message = this.buildWhatsAppMessage(summary);
    const phone = this.formatWhatsApp(this.orderState.leadData.whatsapp);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Formatea el número de WhatsApp
   */
  formatWhatsApp(phone) {
    return phone.replace(/\D/g, "");
  }

  /**
   * Valida un campo
   */
  validateField(input) {
    const feedback = input
      .closest(".form-group")
      ?.querySelector(".field-feedback");
    if (!feedback) return true;

    const value = input.value.trim();
    input.classList.remove("error", "success");
    feedback.innerHTML = "";

    if (input.required && !value) {
      input.classList.add("error");
      feedback.innerHTML =
        '<span class="error-msg">Este campo es obligatorio.</span>';
      return false;
    }

    if (
      input.type === "email" &&
      value &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      input.classList.add("error");
      feedback.innerHTML =
        '<span class="error-msg">Ingresa un email válido.</span>';
      return false;
    }

    if (
      input.type === "tel" &&
      value &&
      !/^(\+?\d{1,3}[-.]?)?\d{10,14}$/.test(value.replace(/\s/g, ""))
    ) {
      input.classList.add("error");
      feedback.innerHTML =
        '<span class="error-msg">Ingresa un WhatsApp válido.</span>';
      return false;
    }

    if (value) {
      input.classList.add("success");
      feedback.innerHTML = '<span class="success-msg">Correcto.</span>';
    }

    return true;
  }

  /**
   * Valida los campos de lead
   */
  validateLeadFields() {
    const inputs = this.form.querySelectorAll(
      '.step-content[data-step="1"] input[required]'
    );
    let ok = true;

    inputs.forEach((input) => {
      if (!this.validateField(input)) ok = false;
    });

    if (!ok && this.toastManager) {
      this.toastManager.warning(
        "Por favor, revisa tus datos.",
        "Datos incompletos"
      );
    }

    return ok;
  }

  /**
   * Valida que haya al menos un Doggo seleccionado
   */
  validateDoggos() {
    const total = Object.values(this.orderState.doggos).reduce(
      (a, b) => a + b,
      0
    );
    if (total <= 0) {
      if (this.toastManager) {
        this.toastManager.warning(
          "Agrega al menos un Doggo para continuar.",
          "Carrito vacío"
        );
      }
      return false;
    }
    return true;
  }

  /**
   * Valida el paso 3 (dirección si es delivery)
   */
  validateStep3() {
    if (this.orderState.delivery === "delivery") {
      const direccion = this.form.querySelector("#direccion");
      const value = direccion?.value.trim() || "";

      if (!value) {
        if (this.toastManager) {
          this.toastManager.warning(
            "Por favor, ingresa la dirección de envío.",
            "Dirección requerida"
          );
        }
        direccion?.focus();
        return false;
      }
    }
    return true;
  }

  /**
   * Valida el paso actual
   */
  validateCurrentStep(step) {
    if (step === 1) return this.validateLeadFields();
    if (step === 2) return this.validateDoggos();
    if (step === 3) return this.validateStep3();
    return true;
  }

  /**
   * Actualiza el resumen del pedido
   */
  updateSummary() {
    console.log("🔄 Actualizando resumen del pedido...");

    const summary = this.buildOrderSummary();

    // Usar los IDs correctos del HTML original
    const client = document.getElementById("summary-client");
    const doggos = document.getElementById("summary-doggos");
    const extras = document.getElementById("summary-extras");
    const bebidas = document.getElementById("summary-bebidas");
    const delivery = document.getElementById("summary-delivery");
    const totalBox = document.getElementById("order-total");

    // Verificar si todos los elementos existen
    if (!client || !doggos || !extras || !bebidas || !delivery || !totalBox) {
      console.warn(
        "⚠️ Algunos elementos del resumen no están en el DOM todavía (esto es normal en pasos iniciales)"
      );
      return;
    }

    // Función auxiliar para renderizar items
    const renderItems = (obj) => {
      const entries = Object.entries(obj);
      if (!entries.length) return `<p class="summary-empty">Sin selección</p>`;
      return entries
        .map(([name, qty]) => {
          const price = this.productsManager.getPriceByName(name);
          const subtotal = price * qty;
          return `
          <div class="summary-item">
            <span>${qty}x ${name}</span>
            <span>$${subtotal.toLocaleString()}</span>
          </div>
        `;
        })
        .join("");
    };

    // Cliente
    client.innerHTML = `
    <div class="summary-item">
      <strong>${this.orderState.leadData.nombre || "Sin nombre"}</strong>
    </div>
    <div class="summary-item">
      <span>${this.orderState.leadData.email || "Sin email"}</span>
    </div>
    <div class="summary-item">
      <span>${this.orderState.leadData.whatsapp || "Sin WhatsApp"}</span>
    </div>
  `;

    // Items
    doggos.innerHTML = renderItems(this.orderState.doggos);
    extras.innerHTML = renderItems(this.orderState.extras);
    bebidas.innerHTML = renderItems(this.orderState.bebidas);

    // Delivery
    delivery.innerHTML = `
    <div class="summary-item">
      <span>${summary.deliveryText}</span>
      <span>${
        summary.deliveryCost
          ? `$${summary.deliveryCost.toLocaleString()}`
          : "Gratis"
      }</span>
    </div>
    ${
      this.orderState.delivery === "delivery"
        ? `
      <div class="summary-item">
        <span>Dirección:</span>
        <span>${this.orderState.direccion || "Pendiente"}</span>
      </div>
    `
        : ""
    }
  `;

    // Total
    totalBox.innerHTML = `
    <div class="summary-item">
      <span>Subtotal</span>
      <span>$${(summary.total - summary.deliveryCost).toLocaleString()}</span>
    </div>
    <div class="summary-item">
      <span>Delivery</span>
      <span>${
        summary.deliveryCost
          ? `$${summary.deliveryCost.toLocaleString()}`
          : "Gratis"
      }</span>
    </div>
    <div class="summary-item total-final">
      <strong>Total</strong>
      <strong>$${summary.total.toLocaleString()}</strong>
    </div>
  `;

    console.log("✅ Resumen actualizado - Total:", summary.total);
  }

  /**
   * Guarda el estado en localStorage
   */
  saveOrderState() {
    localStorage.setItem("doggo_order_state", JSON.stringify(this.orderState));
  }

  /**
   * Carga el estado desde localStorage
   */
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

  /**
   * 🆕 NUEVO MÉTODO - Muestra modal de confirmación de pedido
   */
showOrderConfirmation(orderNumber, total) {
  if (!this.modalManager) {
    // Fallback si no hay modalManager
    alert(`¡Pedido ${orderNumber} confirmado! Total: $${total.toLocaleString()}`);
    return;
  }

  const message = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
      <h2 style="color: #ff6b35; margin-bottom: 10px;">¡Pedido Confirmado!</h2>
      <p style="font-size: 18px; margin-bottom: 20px;">
        Tu número de pedido es:
      </p>
      <div style="background: #ff6b35; color: white; padding: 15px; border-radius: 10px; font-size: 32px; font-weight: bold; margin-bottom: 20px;">
        ${orderNumber}
      </div>
      <p style="font-size: 16px; margin-bottom: 10px;">
        Total: <strong>$${total.toLocaleString()}</strong>
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Te contactaremos por WhatsApp para confirmar los detalles.
      </p>
    </div>
  `;

  this.modalManager.show({
    title: 'Pedido Guardado',
    content: message,
    confirmText: 'Entendido',
    showCancel: false
  });
}}