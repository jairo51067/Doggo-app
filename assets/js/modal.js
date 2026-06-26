class ModalManager {
  constructor() {
    this.activeModal = null;
    this.lastTrigger = null;
    this.keydownHandler = null;
  }

  createModal({
    title = "Confirmar",
    message = "",
    confirmText = "Aceptar",
    cancelText = "Cancelar",
    type = "warning",
  } = {}) {
    const icons = {
      warning: "⚠️",
      danger: "🚨",
      info: "ℹ️",
      success: "✅",
    };

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.setAttribute("role", "presentation");

    const modal = document.createElement("div");
    modal.className = `modal-box modal-${type}`;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "modal-title");
    modal.setAttribute("aria-describedby", "modal-message");
    modal.tabIndex = -1;

    modal.innerHTML = `
      <div class="modal-icon" aria-hidden="true">${icons[type] || "❓"}</div>
      <h3 class="modal-title" id="modal-title">${title}</h3>
      <p class="modal-message" id="modal-message">${message}</p>
      <div class="modal-actions">
        <button type="button" class="modal-btn cancel" data-action="cancel">${cancelText}</button>
        <button type="button" class="modal-btn confirm ${type === "danger" ? "danger" : ""}" data-action="confirm">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(modal);
    return { overlay, modal };
  }

  open(options = {}) {
    this.close(false);

    return new Promise((resolve) => {
      const { overlay, modal } = this.createModal(options);
      this.lastTrigger = document.activeElement;

      document.body.appendChild(overlay);
      this.activeModal = overlay;

      document.body.style.overflow = "hidden";

      const confirmBtn = modal.querySelector('[data-action="confirm"]');
      const cancelBtn = modal.querySelector('[data-action="cancel"]');
      const focusable = () =>
        modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

      const focusFirst = () => {
        const items = focusable();
        (cancelBtn || confirmBtn || items[0] || modal).focus();
      };

      const trapFocus = (e) => {
        if (!this.activeModal || !modal.contains(e.target) && e.target !== overlay) return;

        if (e.key === "Escape") {
          e.preventDefault();
          resolve(false);
          this.close(true);
          return;
        }

        if (e.key !== "Tab") return;

        const items = [...focusable()];
        if (!items.length) {
          e.preventDefault();
          modal.focus();
          return;
        }

        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };

      const onCancel = () => {
        resolve(false);
        this.close(true);
      };

      const onConfirm = () => {
        resolve(true);
        this.close(true);
      };

      const onBackdrop = (e) => {
        if (e.target === overlay) {
          resolve(false);
          this.close(true);
        }
      };

      confirmBtn?.addEventListener("click", onConfirm);
      cancelBtn?.addEventListener("click", onCancel);
      overlay.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", trapFocus);

      this.keydownHandler = trapFocus;

      requestAnimationFrame(() => focusFirst());
    });
  }

  close(restoreFocus = true) {
    if (!this.activeModal) return;

    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }

    this.activeModal.remove();
    this.activeModal = null;
    document.body.style.overflow = "";

    if (restoreFocus && this.lastTrigger && typeof this.lastTrigger.focus === "function") {
      this.lastTrigger.focus();
    }
  }

  confirm(
    message,
    title = "Confirmar",
    confirmText = "Sí, continuar",
    cancelText = "Cancelar",
    type = "warning"
  ) {
    return this.open({
      title,
      message,
      confirmText,
      cancelText,
      type,
    });
  }

  alert(message, title = "Aviso", confirmText = "Entendido", type = "info") {
    return this.open({
      title,
      message,
      confirmText,
      cancelText: "",
      type,
    });
  }
}

window.Modal = new ModalManager();