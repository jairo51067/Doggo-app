// ============================================
// HOME MANAGER - Lógica de la página de inicio
// ============================================

/**
 * Gestiona los componentes de la página de inicio
 */
export class HomeManager {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Inicializa los componentes del home
     */
    init() {
        console.log('🏠 HomeManager.init()');
        this.initHeroImage();
        this.initVideoHero();
        this.isInitialized = true;
    }

    /**
     * Inicializa la imagen del hero
     */
    initHeroImage() {
        console.log('🖼️ Inicializando hero con imagen...');
        
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) {
            console.warn('⚠️ Hero section no encontrada');
            return;
        }

        // Asegurar altura
        heroSection.style.minHeight = '100vh';
        heroSection.style.display = 'flex';
        heroSection.style.alignItems = 'center';
        heroSection.style.justifyContent = 'center';

        // Forzar que la imagen se muestre
        const heroImage = document.querySelector('.hero-image');
        if (heroImage) {
            heroImage.style.display = 'block';
            heroImage.style.width = '100%';
            heroImage.style.height = '100%';
            heroImage.style.objectFit = 'cover';
        }

        console.log('✅ Hero con imagen inicializado correctamente');
    }

    /**
     * Inicializa el video del hero (si existe)
     */
    initVideoHero() {
        const video = document.querySelector('.hero-video');
        if (!video) return;

        console.log('🎬 Inicializando video hero...');
        
        const playVideo = () => {
            video.play()
                .then(() => {
                    console.log('✅ Video reproduciéndose correctamente');
                })
                .catch(err => {
                    console.log('⏳ Error al reproducir:', err.message);
                    video.style.opacity = '0.5';
                });
        };

        // Si el video ya está cargado, reproducir
        if (video.readyState >= 2) {
            playVideo();
            return;
        }

        // Esperar a que el video cargue
        video.addEventListener('loadeddata', playVideo);
        video.addEventListener('loadedmetadata', playVideo);

        // Timeout de seguridad
        setTimeout(() => {
            if (video.paused) {
                console.log('⏳ Timeout: forzando reproducción...');
                playVideo();
            }
        }, 2000);

        // Si el usuario interactúa con la página, intentar reproducir
        const playOnInteraction = () => {
            if (video.paused) {
                video.play().catch(() => {});
            }
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('touchstart', playOnInteraction);
    }

    /**
     * Destruye la instancia (limpia recursos)
     */
    destroy() {
        this.isInitialized = false;
        console.log('🗑️ HomeManager destruido');
    }
}

// Exportar una instancia por defecto
export const homeManager = new HomeManager();