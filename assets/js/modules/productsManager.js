// ============================================
// PRODUCTS MANAGER - Lee productos desde Firestore
// ============================================

import { db } from '../firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class ProductsManager {
  constructor() {
    this.products = {
      doggos: [],
      extras: [],
      bebidas: []
    };
    this.config = {};
    this.isLoaded = false;
  }

  /**
   * Carga todos los productos desde Firestore
   */
  async loadProducts() {
    if (this.isLoaded) {
      console.log('✅ Productos ya cargados (cache)');
      return this.products;
    }

    try {
      console.log('🔄 Cargando productos desde Firestore...');

      // Cargar doggos
      const doggosQuery = query(
        collection(db, "products"),
        where("category", "==", "doggos"),
        where("available", "==", true),
        orderBy("order")
      );
      const doggosSnapshot = await getDocs(doggosQuery);
      this.products.doggos = doggosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cargar extras
      const extrasQuery = query(
        collection(db, "products"),
        where("category", "==", "extras"),
        where("available", "==", true),
        orderBy("order")
      );
      const extrasSnapshot = await getDocs(extrasQuery);
      this.products.extras = extrasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cargar bebidas
      const bebidasQuery = query(
        collection(db, "products"),
        where("category", "==", "bebidas"),
        where("available", "==", true),
        orderBy("order")
      );
      const bebidasSnapshot = await getDocs(bebidasQuery);
      this.products.bebidas = bebidasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cargar configuración
      const configDoc = await getDocs(collection(db, "config"));
      configDoc.docs.forEach(doc => {
        this.config[doc.id] = doc.data();
      });

      this.isLoaded = true;
      console.log('✅ Productos cargados:', this.products);
      console.log('✅ Configuración cargada:', this.config);

      return this.products;
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos por categoría
   */
  getByCategory(category) {
    return this.products[category] || [];
  }

  /**
   * Obtiene un producto por ID
   */
  getById(id) {
    for (const category of Object.values(this.products)) {
      const product = category.find(p => p.id === id);
      if (product) return product;
    }
    return null;
  }

  /**
   * Obtiene el precio de un producto por nombre
   */
  getPriceByName(name) {
    for (const category of Object.values(this.products)) {
      const product = category.find(p => p.name === name);
      if (product) return product.price;
    }
    return 0;
  }

  /**
   * Obtiene el costo de delivery
   */
  getDeliveryFee() {
    return this.config.delivery_fee?.fee || 0;
  }
}