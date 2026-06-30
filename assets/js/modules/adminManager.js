// ============================================
// ADMIN MANAGER - Panel de administración
// ============================================

import { db } from '../firebase-config.js';
import { AuthManager } from './authManager.js';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class AdminManager {
  constructor(toastManager, modalManager) {
    this.toastManager = toastManager;
    this.modalManager = modalManager;
    this.authManager = new AuthManager();
    this.unsubscribe = null;
    this.allOrders = [];
    this.currentFilter = 'all';
  }

  async init() {
    console.log('👨‍💼 AdminManager.init() ejecutado');

    // Verificar autenticación
    if (!this.authManager.isAuthenticated()) {
      console.log('⚠️ Usuario no autenticado, redirigiendo a login...');
      window.location.hash = '#/login';
      return;
    }

    // Mostrar email del usuario
    const user = this.authManager.getCurrentUser();
    const emailElement = document.getElementById('admin-email');
    if (emailElement && user) {
      emailElement.textContent = user.email;
    }

    // Inicializar componentes
    this.initLogoutButton();
    this.initFilters();
    this.initDetailModal();
    this.loadOrders();

    console.log('✅ AdminManager inicializado');
  }

initLogoutButton() {
  const btnLogout = document.getElementById('btn-logout');
  
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      console.log('🚪 Click en botón de logout');
      
      // Usar confirm nativo del navegador (funciona 100%)
      const confirmed = window.confirm('¿Estás seguro que deseas cerrar sesión?');
      
      console.log('🔍 Resultado del confirm:', confirmed);

      if (confirmed) {
        console.log('✅ Usuario confirmó logout, ejecutando...');
        
        const result = await this.authManager.logout();
        console.log('🔍 Resultado del logout:', result);
        
        if (result.success) {
          if (this.toastManager) {
            this.toastManager.success('Sesión cerrada', 'Hasta pronto!');
          }
          
          console.log('🔄 Redirigiendo a #/home...');
          window.location.hash = '#/home';
        } else {
          console.error('❌ Error en logout:', result.error);
          if (this.toastManager) {
            this.toastManager.error(result.error || 'Error al cerrar sesión', 'Error');
          }
        }
      } else {
        console.log('❌ Usuario canceló logout');
      }
    });
    
    console.log('✅ Event listener de logout configurado');
  }
}

  initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.renderOrders();
      });
    });
  }

  initDetailModal() {
    const modal = document.getElementById('order-detail-modal');
    const closeBtn = document.getElementById('close-detail-modal');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  }

  loadOrders() {
    console.log('📡 Cargando pedidos en tiempo real...');

    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.allOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`✅ ${this.allOrders.length} pedidos cargados`);
      this.updateStats();
      this.renderOrders();

      // Ocultar loading
      const loading = document.getElementById('orders-loading');
      if (loading) loading.style.display = 'none';
    }, (error) => {
      console.error('❌ Error cargando pedidos:', error);
      if (this.toastManager) {
        this.toastManager.error('Error cargando pedidos', 'Error');
      }
    });
  }

  updateStats() {
    const pending = this.allOrders.filter(o => o.status === 'pendiente').length;
    const preparing = this.allOrders.filter(o => o.status === 'preparando').length;
    const ready = this.allOrders.filter(o => o.status === 'listo').length;
    const delivered = this.allOrders.filter(o => o.status === 'entregado').length;

    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-preparing').textContent = preparing;
    document.getElementById('stat-ready').textContent = ready;
    document.getElementById('stat-delivered').textContent = delivered;
  }

  renderOrders() {
    const ordersList = document.getElementById('orders-list');
    const emptyState = document.getElementById('orders-empty');

    if (!ordersList) return;

    // Filtrar pedidos
    const filteredOrders = this.currentFilter === 'all'
      ? this.allOrders
      : this.allOrders.filter(o => o.status === this.currentFilter);

    if (filteredOrders.length === 0) {
      ordersList.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    ordersList.innerHTML = filteredOrders.map(order => this.renderOrderCard(order)).join('');

    // Agregar event listeners
    this.attachOrderListeners();
  }

  renderOrderCard(order) {
    const fecha = order.createdAt?.toDate 
      ? order.createdAt.toDate().toLocaleString('es-CO')
      : 'Fecha no disponible';

    const itemsCount = Object.values(order.items || {}).reduce((a, b) => a + b, 0);
    const deliveryText = order.deliveryType === 'delivery' ? '🚚 Domicilio' : '🏪 Local';

    // Botones de acción según estado
    let actions = '';
    if (order.status === 'pendiente') {
      actions = `
        <button class="btn-action btn-prepare" data-order-id="${order.id}" data-action="preparando">
          <i class="fas fa-fire"></i> Preparar
        </button>
      `;
    } else if (order.status === 'preparando') {
      actions = `
        <button class="btn-action btn-ready" data-order-id="${order.id}" data-action="listo">
          <i class="fas fa-check-circle"></i> Listo
        </button>
      `;
    } else if (order.status === 'listo') {
      actions = `
        <button class="btn-action btn-deliver" data-order-id="${order.id}" data-action="entregado">
          <i class="fas fa-box"></i> Entregado
        </button>
      `;
    }

    actions += `
      <button class="btn-action btn-whatsapp" data-whatsapp="${order.phone}" data-order-id="${order.id}">
        <i class="fab fa-whatsapp"></i> WhatsApp
      </button>
    `;

    return `
      <div class="order-card" data-order-id="${order.id}">
        <div class="order-card-header">
          <span class="order-number">${order.orderNumber}</span>
          <span class="order-status ${order.status}">${order.status}</span>
        </div>
        <div class="order-card-body">
          <div class="order-info">
            <strong>Cliente:</strong> ${order.customerName || 'Sin nombre'}<br>
            <strong>Tel:</strong> ${order.phone || 'Sin teléfono'}<br>
            <strong>Fecha:</strong> ${fecha}
          </div>
          <div class="order-info">
            <strong>Items:</strong> ${itemsCount}<br>
            <strong>Entrega:</strong> ${deliveryText}<br>
            <strong class="order-total">$${(order.total || 0).toLocaleString()}</strong>
          </div>
        </div>
        <div class="order-card-actions">
          ${actions}
        </div>
      </div>
    `;
  }

  attachOrderListeners() {
    // Click en tarjeta para ver detalles
    document.querySelectorAll('.order-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // No abrir detalles si se hizo click en un botón
        if (e.target.closest('.btn-action')) return;
        
        const orderId = card.dataset.orderId;
        this.showOrderDetail(orderId);
      });
    });

    // Botones de cambio de estado
    document.querySelectorAll('.btn-action[data-action]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const orderId = btn.dataset.orderId;
        const newStatus = btn.dataset.action;
        await this.updateOrderStatus(orderId, newStatus);
      });
    });

    // Botones de WhatsApp
    document.querySelectorAll('.btn-whatsapp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const phone = btn.dataset.whatsapp;
        const orderId = btn.dataset.orderId;
        const order = this.allOrders.find(o => o.id === orderId);
        
        if (order && phone) {
          const message = `Hola ${order.customerName}, sobre tu pedido ${order.orderNumber}...`;
          const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
        }
      });
    });
  }

  async updateOrderStatus(orderId, newStatus) {
    try {
      console.log(`🔄 Cambiando estado de ${orderId} a ${newStatus}...`);
      
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });

      if (this.toastManager) {
        const messages = {
          preparando: '🔥 Pedido en preparación',
          listo: '✅ Pedido listo para entrega',
          entregado: '📦 Pedido entregado'
        };
        this.toastManager.success(messages[newStatus] || 'Estado actualizado', 'Éxito');
      }
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      if (this.toastManager) {
        this.toastManager.error('Error actualizando estado', 'Error');
      }
    }
  }

  showOrderDetail(orderId) {
    const order = this.allOrders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('order-detail-modal');
    const title = document.getElementById('detail-order-number');
    const content = document.getElementById('order-detail-content');

    if (!modal || !title || !content) return;

    title.textContent = `Pedido ${order.orderNumber}`;

    const fecha = order.createdAt?.toDate 
      ? order.createdAt.toDate().toLocaleString('es-CO')
      : 'Fecha no disponible';

    // Construir lista de items
    const itemsHtml = Object.entries(order.items || {}).map(([name, qty]) => `
      <div class="detail-item">
        <span>${qty}x ${name}</span>
      </div>
    `).join('');

    const extrasHtml = Object.entries(order.extras || {}).map(([name, qty]) => `
      <div class="detail-item">
        <span>${qty}x ${name}</span>
      </div>
    `).join('') || '<p style="color: #999;">Sin extras</p>';

    const bebidasHtml = Object.entries(order.bebidas || {}).map(([name, qty]) => `
      <div class="detail-item">
        <span>${qty}x ${name}</span>
      </div>
    `).join('') || '<p style="color: #999;">Sin bebidas</p>';

    content.innerHTML = `
      <div class="detail-section">
        <h3><i class="fas fa-user"></i> Cliente</h3>
        <div class="detail-item">
          <span>Nombre:</span>
          <strong>${order.customerName || 'No especificado'}</strong>
        </div>
        <div class="detail-item">
          <span>Email:</span>
          <span>${order.email || 'No especificado'}</span>
        </div>
        <div class="detail-item">
          <span>WhatsApp:</span>
          <span>${order.phone || 'No especificado'}</span>
        </div>
      </div>

      <div class="detail-section">
        <h3><i class="fas fa-clock"></i> Información</h3>
        <div class="detail-item">
          <span>Fecha:</span>
          <span>${fecha}</span>
        </div>
        <div class="detail-item">
          <span>Estado:</span>
          <span class="order-status ${order.status}">${order.status}</span>
        </div>
        <div class="detail-item">
          <span>Entrega:</span>
          <span>${order.deliveryType === 'delivery' ? '🚚 Domicilio' : '🏪 Local'}</span>
        </div>
        ${order.address ? `
          <div class="detail-item">
            <span>Dirección:</span>
            <span>${order.address}</span>
          </div>
        ` : ''}
        ${order.references ? `
          <div class="detail-item">
            <span>Referencias:</span>
            <span>${order.references}</span>
          </div>
        ` : ''}
      </div>

      <div class="detail-section">
        <h3><i class="fas fa-utensils"></i> Productos</h3>
        ${itemsHtml}
      </div>

      <div class="detail-section">
        <h3><i class="fas fa-plus-circle"></i> Extras</h3>
        ${extrasHtml}
      </div>

      <div class="detail-section">
        <h3><i class="fas fa-glass-whiskey"></i> Bebidas</h3>
        ${bebidasHtml}
      </div>

      <div class="detail-total">
        <div class="detail-total-row">
          <span>Subtotal:</span>
          <span>$${(order.subtotal || 0).toLocaleString()}</span>
        </div>
        ${order.deliveryFee > 0 ? `
          <div class="detail-total-row">
            <span>Delivery:</span>
            <span>$${order.deliveryFee.toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="detail-total-row final">
          <span>TOTAL:</span>
          <span>$${(order.total || 0).toLocaleString()}</span>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    console.log('🗑️ AdminManager destruido');
  }
}