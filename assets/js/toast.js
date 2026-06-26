class ToastManager {
  constructor() {
    this.container = null;
    this.ensureContainer();
  }

  ensureContainer() {
    this.container = document.querySelector(".toast-container");

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      this.container.setAttribute("aria-live", "polite");
      this.container.setAttribute("aria-atomic", "true");
      document.body.appendChild(this.container);
    }
  }

  createToast({ message, type = "info", title = "", duration = 3000, sticky = false }) {
    const icons = {
      success: "✅",
      error: "❌",
      info: "ℹ️",
      warning: "⚠️",
    };

    const role = type === "error" ? "alert" : "status";
    const ariaLive = type === "error" ? "assertive" : "polite";

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", role);
    toast.setAttribute("aria-live", ariaLive);
    toast.setAttribute("aria-atomic", "true");

    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icons[type] || "ℹ️"}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" type="button" aria-label="Cerrar notificación">✕</button>
    `;

    this.container.appendChild(toast);

    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => this.hide(toast));

    if (!sticky && duration > 0) {
      const timer = setTimeout(() => this.hide(toast), duration);
      toast.dataset.timer = String(timer);
    }

    return toast;
  }

  hide(toast) {
    if (!toast) return;

    const timer = toast.dataset.timer;
    if (timer) clearTimeout(Number(timer));

    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 250);
  }

  show(message, type = "info", title = "", duration = 3000, sticky = false) {
    return this.createToast({ message, type, title, duration, sticky });
  }

  success(message, title = "¡Éxito!", duration = 3000, sticky = false) {
    return this.show(message, "success", title, duration, sticky);
  }

  error(message, title = "Error", duration = 4000, sticky = false) {
    return this.show(message, "error", title, duration, sticky);
  }

  info(message, title = "Información", duration = 3000, sticky = false) {
    return this.show(message, "info", title, duration, sticky);
  }

  warning(message, title = "Atención", duration = 3500, sticky = false) {
    return this.show(message, "warning", title, duration, sticky);
  }
}

window.Toast = new ToastManager();