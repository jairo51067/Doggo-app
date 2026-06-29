// ============================================
// ORDERS MANAGER - Gestiona pedidos en Firestore
// ============================================

import { db } from '../firebase-config.js';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class OrdersManager {
  constructor() {
    this.collectionName = "orders";
  }

  /**
   * Genera el próximo número de pedido
   * Formato: DOG-0001, DOG-0002, etc.
   */
  async getNextOrderNumber() {
    try {
      // Obtener el último pedido para saber qué número sigue
      const q = query(
        collection(db, this.collectionName),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return "DOG-0001"; // Primer pedido
      }
      
      const lastOrder = snapshot.docs[0].data();
      const lastNumber = parseInt(lastOrder.orderNumber.replace("DOG-", ""));
      const nextNumber = lastNumber + 1;
      
      // Formatear con ceros a la izquierda (4 dígitos)
      return `DOG-${String(nextNumber).padStart(4, '0')}`;
      
    } catch (error) {
      console.error('❌ Error obteniendo número de pedido:', error);
      // En caso de error, generar uno basado en timestamp
      const timestamp = Date.now().toString().slice(-4);
      return `DOG-${timestamp}`;
    }
  }

  /**
   * Guarda un nuevo pedido en Firestore
   */
  async saveOrder(orderData) {
    try {
      console.log('💾 Guardando pedido en Firestore...');
      
      // Generar número de pedido
      const orderNumber = await this.getNextOrderNumber();
      
      // Preparar datos del pedido
      const order = {
        orderNumber: orderNumber,
        customerName: orderData.customerName,
        phone: orderData.phone,
        email: orderData.email,
        items: orderData.items,
        extras: orderData.extras,
        bebidas: orderData.bebidas,
        deliveryType: orderData.deliveryType,
        address: orderData.address || null,
        references: orderData.references || null,
        paymentMethod: orderData.paymentMethod,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        total: orderData.total,
        status: "pendiente", // pendiente, preparando, listo, entregado
        whatsappUrl: orderData.whatsappUrl,
        createdAt: serverTimestamp(),
        notes: orderData.notes || null
      };

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, this.collectionName), order);
      
      console.log('✅ Pedido guardado exitosamente');
      console.log('📋 Número de pedido:', orderNumber);
      console.log('🆔 ID Firestore:', docRef.id);
      
      return {
        success: true,
        orderId: docRef.id,
        orderNumber: orderNumber,
        order: order
      };
      
    } catch (error) {
      console.error('❌ Error guardando pedido:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene un pedido por su número
   */
  async getOrderByNumber(orderNumber) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("orderNumber", "==", orderNumber)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo pedido:', error);
      return null;
    }
  }
}