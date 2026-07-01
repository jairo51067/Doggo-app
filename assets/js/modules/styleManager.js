// ============================================
// STYLE MANAGER - Gestión de estilos dinámicos
// ============================================

export class StyleManager {
    constructor() {
        console.log('🎨 StyleManager creado');
        this.loadedStyles = new Set();
        this.baseStyles = ['global'];
        this.dynamicStyles = [];
    }

    loadStyle(styleName, cssPath = 'assets/css/') {
        return new Promise((resolve, reject) => {
            const href = `${cssPath}${styleName}.css`;
            
            if (this.loadedStyles.has(href)) {
                return resolve(document.querySelector(`link[href="${href}"]`));
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.dataset.dynamic = 'true';
            link.dataset.styleName = styleName;

            link.onload = () => {
                this.loadedStyles.add(href);
                this.dynamicStyles.push(href);
                resolve(link);
            };
            
            link.onerror = () => {
                console.warn(`Error al cargar el estilo: ${href}`);
                reject(new Error(`Failed to load style: ${href}`));
            };

            document.head.appendChild(link);
        });
    }

    unloadDynamicStyles() {
        const dynamicLinks = document.querySelectorAll('link[data-dynamic="true"]');
        dynamicLinks.forEach(link => {
            const href = link.getAttribute('href');
            this.loadedStyles.delete(href);
            this.dynamicStyles = this.dynamicStyles.filter(h => h !== href);
            link.remove();
        });
    }

   /**
 * Cambia al estilo de una vista específica
 */
async switchToViewStyle(viewName, cssPath) {
  return new Promise((resolve, reject) => {
    // Remover estilos anteriores (excepto global.css)
    document.querySelectorAll('link[data-view-style]').forEach(link => {
      link.remove();
    });

    // Crear nuevo link de estilo
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${cssPath}${viewName}.css`;
    link.dataset.viewStyle = viewName;
    
    // Marcar body como cargando estilos
    document.body.classList.add('style-loading');
    
    // Cuando el CSS esté completamente cargado
    link.onload = () => {
      console.log(`✅ Estilo "${viewName}" cargado`);
      
      // Esperar un momento para que el navegador aplique los estilos
      setTimeout(() => {
        document.body.classList.remove('style-loading');
        document.body.classList.add('style-loaded');
        
        // Limpiar clase después de la animación
        setTimeout(() => {
          document.body.classList.remove('style-loaded');
        }, 300);
        
        resolve();
      }, 50);
    };
    
    // Manejar errores
    link.onerror = () => {
      console.error(`❌ Error cargando estilo: ${link.href}`);
      document.body.classList.remove('style-loading');
      reject(new Error(`Failed to load style: ${link.href}`));
    };
    
    // Agregar al head
    document.head.appendChild(link);
  });
}
}