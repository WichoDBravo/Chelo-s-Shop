// ============================================
// TRANSICIÓN ENTRE PÁGINAS (CORREGIDO)
// ============================================

(function() {
    // Verificar si ya existe el overlay para no duplicarlo
    let overlay = document.getElementById('page-transition-overlay');
    
    if (!overlay) {
        // Crear el overlay de transición solo si no existe
        overlay = document.createElement('div');
        overlay.id = 'page-transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1e3c72, #d87300);
            z-index: 9999;
            transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 24px;
        `;
        overlay.innerHTML = '<div style="text-align:center">⚡ Cargando...</div>';
        document.body.appendChild(overlay);
    }

    let isTransitioning = false;

    // Función para ocultar el overlay inmediatamente
    function ocultarOverlay() {
        if (overlay) {
            overlay.style.left = '-100%';
        }
        isTransitioning = false;
    }

    // Función para asegurar que el overlay esté oculto al cargar la página
    function resetearOverlay() {
        if (overlay) {
            overlay.style.left = '-100%';
            overlay.style.transition = 'none';
            // Forzar reflow
            void overlay.offsetHeight;
            overlay.style.transition = 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        isTransitioning = false;
        document.body.style.opacity = '1';
        document.body.style.overflow = '';
    }

    // Interceptar todos los clics en enlaces internos
    document.body.addEventListener('click', function(e) {
        // Buscar si el clic fue en un <a> o dentro de uno
        let target = e.target;
        while (target && target.tagName !== 'A') {
            target = target.parentElement;
            if (!target) return;
        }

        if (!target) return;
        
        const href = target.getAttribute('href');
        
        // Solo enlaces internos .html o sin extensión pero internos
        if (href && 
            !href.startsWith('http') && 
            !href.startsWith('#') && 
            !href.startsWith('javascript:') &&
            href !== '' &&
            !isTransitioning &&
            !target.hasAttribute('data-no-transition')) { // Permitir excluir enlaces si es necesario
            
            e.preventDefault();
            isTransitioning = true;
            
            // Deslizar el overlay hacia adentro
            overlay.style.left = '0%';
            
            // Navegar después de medio segundo
            setTimeout(() => {
                window.location.href = href;
            }, 400);
        }
    });

    // ============================================
    // CORREGIR NAVEGACIÓN CON FLECHA ATRÁS
    // ============================================
    
    // Evento pageshow (cuando la página viene de la caché)
    window.addEventListener('pageshow', function(event) {
        console.log('pageshow - persisted:', event.persisted);
        resetearOverlay();
        
        // Si la página viene de la caché, forzar una recarga limpia
        if (event.persisted) {
            // Pequeño retraso para asegurar que todo esté listo
            setTimeout(resetearOverlay, 50);
        }
    });
    
    // Evento popstate (flecha atrás/adelante)
    window.addEventListener('popstate', function() {
        console.log('popstate - navegación con flecha');
        resetearOverlay();
    });
    
    // Evento beforeunload (antes de salir)
    window.addEventListener('beforeunload', function() {
        // No hacer nada complicado aquí, solo asegurar visibilidad
        document.body.style.opacity = '1';
    });
    
    // Evento load (cuando la página termina de cargar completamente)
    window.addEventListener('load', function() {
        resetearOverlay();
    });
    
    // Evento DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        resetearOverlay();
    });
    
    // También escuchar cambios en la URL (para Single Page Apps si las hay)
    if (window.history && window.history.pushState) {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function() {
            originalPushState.apply(this, arguments);
            resetearOverlay();
        };
        
        history.replaceState = function() {
            originalReplaceState.apply(this, arguments);
            resetearOverlay();
        };
    }
    
    // Resetear inmediatamente
    resetearOverlay();
    
    // Agregar estilos para evitar problemas de scroll
    const style = document.createElement('style');
    style.textContent = `
        body {
            opacity: 1 !important;
            transition: none !important;
        }
        #page-transition-overlay {
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
})();
