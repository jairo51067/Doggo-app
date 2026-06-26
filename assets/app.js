// ============================================
// DOGGO-APP - PUNTO DE ENTRADA
// ============================================

import { StyleManager } from './modules/styleManager.js';
import { ModalManager } from './modules/modalManager.js';
import { ToastManager } from './modules/toastManager.js';
import { PedidoManager } from './modules/pedidoManager.js';
import { Router } from './modules/router.js';

// Configuración del Router
const ROUTER_CONFIG = {
    defaultView: 'home',
    viewsPath: 'views/',
    cssPath: 'assets/css/',
    titles: {
        home: 'Doggo - Inicio | No es un perro, es una movida',
        pedido: 'Doggo - Haz tu Pedido | No es un perro, es una movida',
        metodospagos: 'Doggo - Métodos de Pago | No es un perro, es una movida',
        contacto: 'Doggo - Contacto | No es un perro, es una movida',
        sobre: 'Doggo - Sobre este proyecto'
    }
};

// Inicializar managers
const styleManager = new StyleManager();
const modalManager = new ModalManager();
const toastManager = new ToastManager();

// Inicializar Router con los managers
const app = new Router(ROUTER_CONFIG, styleManager, modalManager, toastManager);

// Exportar para debugging
window.__DOGGO_APP__ = {
    app,
    version: '7.0.0',
    managers: {
        style: styleManager,
        modal: modalManager,
        toast: toastManager
    }
};

console.log('🐕 ¡Doggo App iniciada! v7.0.0 (Modular)');
console.log('💡 Para depuración, ejecuta: __DOGGO_APP__');