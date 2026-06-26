// ============================================
// STYLE MANAGER - Gestión de estilos dinámicos
// ============================================

/**
 * Gestiona la carga y descarga de estilos CSS dinámicos
 */
export class StyleManager {
    constructor() {
        console.log('🎨 StyleManager creado');
        this.loadedStyles = new Set();
        this.baseStyles = ['global'];
        this.dynamicStyles = [];
    }

    /**
     * Carga una hoja de estilos CSS
     * @param {string} styleName - Nombre del archivo CSS (sin extensión)
     * @param {string} cssPath - Ruta base de los CSS
     * @returns {Promise<HTMLLinkElement>}
     */
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

    /**
     * Descarga todas las hojas de estilos dinámicos
     */
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
     * @param {string} viewName - Nombre de la vista
     * @param {string} cssPath - Ruta base de los CSS
     * @returns {Promise<boolean>}
     */
    async switchToViewStyle(viewName, cssPath = 'assets/css/') {
        try {
            this.unloadDynamicStyles();
            
            if (viewName === 'home' || viewName === '/home') {
                await this.loadStyle('home', cssPath);
            } else if (viewName !== 'home') {
                await this.loadStyle(viewName, cssPath);
            }
            
            return true;
        } catch (error) {
            console.error('Error al cambiar estilos:', error);
            return false;
        }
    }

    /**
     * Verifica si un estilo está cargado
     * @param {string} styleName - Nombre del estilo
     * @param {string} cssPath - Ruta base de los CSS
     * @returns {boolean}
     */
    isStyleLoaded(styleName, cssPath = 'assets/css/') {
        const href = `${cssPath}${styleName}.css`;
        return this.loadedStyles.has(href);
    }
}

// Exportar una instancia por defecto
export const styleManager = new StyleManager();