// ============================================
// DOGGO-APP - PUNTO DE ENTRADA (MODULAR)
// ============================================

console.log('🚀 Cargando Doggo App...');

// Importar módulos
import { Router } from './modules/router.js';
import { StyleManager } from './modules/styleManager.js';
import { ModalManager } from './modules/modalManager.js';
import { ToastManager } from './modules/toastManager.js';

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

console.log('📋 Configuración cargada');

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM cargado, iniciando app...');
    
    // Crear instancias de los managers
    const styleManager = new StyleManager();
    const modalManager = new ModalManager();
    const toastManager = new ToastManager();
    
    // Crear instancia del Router con los managers
    const app = new Router(ROUTER_CONFIG, styleManager, modalManager, toastManager);
    
    // Exponer para debugging
    window.__DOGGO_APP__ = {
        app,
        version: '7.0.0',
        managers: {
            style: styleManager,
            modal: modalManager,
            toast: toastManager
        }
    };

    console.log('🐕 ¡Doggo App iniciada! v7.0.0');
    console.log('💡 Para depuración, ejecuta: __DOGGO_APP__');
});