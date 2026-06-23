/* Doggo App - SPA Router + WhatsApp Conversion (SDD) */

const ROUTES = {
  "#/home": { view: "views/home.html", css: "assets/css/home.css" },
  "#/pedido": { view: "views/pedido.html", css: "assets/css/pedido.css" },
  "#/metodospagos": {
    view: "views/metodospagos.html",
    css: "assets/css/metodospagos.css",
  },
  "#/contacto": { view: "views/contacto.html", css: "assets/css/contacto.css" },
};

const DEFAULT_ROUTE = "#/home";

let activeViewEl = null;
let activeCssEl = document.getElementById("active-view-css");

function normalizeHash(hash) {
  if (!hash) return DEFAULT_ROUTE;
  if (hash.startsWith("#/")) return hash;
  return `#/${hash.replace(/^#/, "")}`;
}

async function loadView(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar la vista: ${path}`);
  return await res.text();
}

function setActiveCss(cssPath) {
  if (!activeCssEl) {
    activeCssEl = document.createElement("link");
    activeCssEl.id = "active-view-css";
    activeCssEl.rel = "stylesheet";
    document.head.appendChild(activeCssEl);
  }

  // Evita conflictos: solo dejamos activo el CSS de la vista actual
  activeCssEl.href = cssPath;
}

function renderNavActive(hash) {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((a) => {
    const isActive = a.getAttribute("href") === hash;
    a.classList.toggle("active", isActive);
  });
}

function showLoading() {
  const app = document.getElementById("app-content");
  if (!app) return;
  app.innerHTML = `
    <div class="d-flex align-items-center justify-content-center" style="min-height:50vh">
      <div class="text-center">
        <div class="spinner-border text-warning" role="status"></div>
        <div class="mt-3 small" style="color: rgba(255,255,255,0.85)">Cargando...</div>
      </div>
    </div>
  `;
}

function getWhatsappNumber() {
  // Cambiar a tu número real en formato internacional sin +
  // Ej: 573001112233
  return "5804245231898";
}

function buildWhatsAppMessage({
  nombre,
  email,
  whatsapp,
  items,
  total,
  notas,
  tipoDespacho,
  costoDespacho,
  envioDireccion,
  envioReferencias,
}) {

  const lines = [];
  lines.push(`🛵 *Nuevo pedido desde Doggo App*`);
  lines.push("");
  lines.push(`👤 *Cliente:* ${nombre}`);
  lines.push(`📧 *Email:* ${email}`);
  lines.push(`📱 *WhatsApp:* ${whatsapp}`);
  lines.push("");

  if (!items || items.length === 0) {
    lines.push("(Sin productos) ");
  } else {
    lines.push("🧾 *Productos:* ");
    items.forEach((it) => {
      lines.push(`• ${it.nombre}: ${it.cantidad} x $${it.precio.toFixed(2)} = $${it.subtotal.toFixed(2)}`);
    });
  }

  lines.push("");
  lines.push(`💰 *Total:* $${total.toFixed(2)}`);
  if (notas) lines.push(`🗒️ *Notas:* ${notas}`);

  return lines.join("\n");
}

function validateLead({ nombre, email, whatsapp }) {
  const errors = [];

  if (!nombre || nombre.trim().length < 3) errors.push("Nombre completo es obligatorio.");

  const emailTrim = (email || "").trim();
  const emailOk = /^[^\s@]+@gmail\.com$/i.test(emailTrim);
  if (!emailOk) errors.push("Email debe ser de Gmail y es obligatorio.");

  const phone = (whatsapp || "").replace(/\D/g, "");
  if (!phone || phone.length < 10) errors.push("Número de WhatsApp es obligatorio (con al menos 10 dígitos)." );

  return { ok: errors.length === 0, errors };
}

function getOrderFromDOM() {
  // Compatible con los ids usados en src/pedido.html
  const pizzas = [
    { id: "margarita-qty", nombre: "Pizza Margarita", precio: 10.0 },
    { id: "pepperoni-qty", nombre: "Pizza Pepperoni", precio: 12.0 },
    { id: "cuatro-quesos-qty", nombre: "Pizza Cuatro Quesos", precio: 14.0 },
    { id: "vegetariana-qty", nombre: "Pizza Vegetariana", precio: 11.0 },
  ];

  const bebidas = [
    { id: "coca-cola-qty", nombre: "Coca-Cola", precio: 3.0 },
    { id: "fanta-qty", nombre: "Fanta", precio: 3.0 },
    { id: "agua-qty", nombre: "Agua Mineral", precio: 1.5 },
  ];

  const items = [];
  let total = 0;

  function addItem({ categoria, nombre, qty, precio }) {
    if (!qty || qty <= 0) return;
    const subtotal = qty * precio;
    total += subtotal;
    items.push({ categoria, nombre, cantidad: qty, precio, subtotal });
  }

  pizzas.forEach((p) => {
    const qty = parseInt(document.getElementById(p.id)?.value, 10) || 0;
    // checkbox asociado: el qty también suele venir en 0 si no se selecciona
    addItem({ categoria: "Pizza", ...p, qty });
  });

  bebidas.forEach((b) => {
    const qty = parseInt(document.getElementById(b.id)?.value, 10) || 0;
    addItem({ categoria: "Bebida", ...b, qty });
  });

  const additionalChecks = document.querySelectorAll(
    '#additional-ingredients input[type="checkbox"]'
  );

  additionalChecks.forEach((chk) => {
    if (!chk.checked) return;
    const qtyInput = document.getElementById(`${chk.id}-qty`);
    const qty = parseInt(qtyInput?.value, 10) || 0;
    const precio = parseFloat(chk.value);
    const labelEl = chk.closest("label") || chk.nextElementSibling;
    const nombre = chk.nextElementSibling?.innerText?.trim() || chk.id;
    if (!Number.isFinite(precio)) return;

    addItem({ categoria: "Extra", nombre, qty, precio });
  });

  const notas = (document.getElementById("notas")?.value || "").trim();

  // Despacho: delivery ($1.5) o tienda ($0)
  const tipoDespacho = (document.querySelector('input[name="tipo-despacho"]:checked')?.value || 'delivery');
  const costoDespacho = tipoDespacho === 'delivery' ? 1.5 : 0;

  // total incluye costo de despacho
  total += costoDespacho;

  const envioDireccion = (document.getElementById('envio-direccion')?.value || '').trim();
  const envioReferencias = (document.getElementById('envio-referencias')?.value || '').trim();

  return {
    items,
    total,
    notas,
    tipoDespacho,
    costoDespacho,
    envioDireccion,
    envioReferencias,
  };
}


function setupPedidoFormOnce() {
  const form = document.getElementById("pedido-lead-form");
  if (!form) return;

  // Evita doble listener si se re-renderiza la vista
  if (form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  // Listener para mantener cálculo de total si está en la vista
  const recompute = () => {
    const { items, total } = getOrderFromDOM();
    const precioTotal = document.getElementById("precioTotal");
    if (precioTotal) precioTotal.textContent = total.toFixed(2);
    return { items, total };
  };

  // Bind en inputs qty/checkbox para recalcular
  document.querySelectorAll("#app-content input").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const type = el.type;
    if (tag === "input" && (type === "number" || type === "checkbox")) {
      el.addEventListener("change", recompute);
      el.addEventListener("input", recompute);
    }
  });

  recompute();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nombre = document.getElementById("lead-nombre")?.value;
    const email = document.getElementById("lead-email")?.value;
    const whatsapp = document.getElementById("lead-whatsapp")?.value;

    const lead = validateLead({ nombre, email, whatsapp });
    if (!lead.ok) {
      alert(lead.errors.join("\n"));
      return;
    }

    const order = getOrderFromDOM();
    if (!order.items || order.items.length === 0 || order.total <= 0) {
      alert("Selecciona al menos un producto para continuar.");
      return;
    }

    // Validaciones de despacho
    if (order.tipoDespacho === 'delivery') {
      const dirOk = (order.envioDireccion || '').trim().length >= 5;
      const refOk = (order.envioReferencias || '').trim().length >= 2;
      if (!dirOk || !refOk) {
        alert('Para Delivery debes colocar Dirección y Referencias.');
        return;
      }
    }


    const message = buildWhatsAppMessage({
      nombre: nombre.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      items: order.items,
      total: order.total,
    notas: order.notas,
    tipoDespacho: order.tipoDespacho,
    costoDespacho: order.costoDespacho,
    envioDireccion: order.envioDireccion,
    envioReferencias: order.envioReferencias,
  });


    const number = getWhatsappNumber();
    const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    // SDD: abre en nueva pestaña para que el usuario termine el envío en WhatsApp
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    // Feedback inmediato
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Abriendo WhatsApp...";
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class=\"fas fa-bolt me-2\"></i>Confirmar Pedido`;
      }
    }, 2500);
  });
}

function setupGenericLinkScroll() {
  // No-op por ahora. SPA usa hash para vistas.
}

async function router() {
  const app = document.getElementById("app-content");
  if (!app) return;

  let hash = normalizeHash(window.location.hash);
  const route = ROUTES[hash] || ROUTES[DEFAULT_ROUTE];

  renderNavActive(hash);
  showLoading();

  try {
    setActiveCss(route.css);

    const html = await loadView(route.view);
    app.innerHTML = html;

    // Eventos específicos por vista
    setupPedidoFormOnce();

    // Si home usa video o otros: nada especial.
    setupGenericLinkScroll();

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    app.innerHTML = `
      <div class="card-doggo p-4">
        <h3 class="mb-2">Error cargando la vista</h3>
        <p class="muted" style="color: rgba(255,255,255,0.75)">${err.message}</p>
      </div>
    `;
    console.error(err);
  }
}

window.addEventListener("hashchange", router);

// Inicial
window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash) window.location.hash = DEFAULT_ROUTE;
  // Asegura la ruta correcta inicial
  router();

  // Cierra el menú móvil al navegar.
  const links = document.querySelectorAll('#mobile-nav a');
  links.forEach((a) => {
    a.addEventListener('click', () => {
      const mobile = document.getElementById('mobile-nav');
      const btn = document.getElementById('nav-toggle');
      if (mobile) mobile.classList.add('d-none');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  });
});


