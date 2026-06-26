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

    isStyleLoaded(styleName, cssPath = 'assets/css/') {
        const href = `${cssPath}${styleName}.css`;
        return this.loadedStyles.has(href);
    }
}