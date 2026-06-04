// Transisción entre interfaces
(function() {
    // Crear el overlay de transición
    const overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: -100%; /* Empieza fuera a la izquierda */
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

    let isTransitioning = false;

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
            !isTransitioning) {
            
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
})();

// ============================================
// USAR "REGRESAR" DEL NAVEGADOR
// ============================================

(function() {
    // Forzar que el body sea visible inmediatamente
    document.body.style.opacity = '1';
    
    // Escuchar el evento de páginashow (se dispara cuando la página se carga desde la caché)
    window.addEventListener('pageshow', function(event) {
        // Si la página viene de la caché (bfcache - back/forward cache)
        if (event.persisted) {
            console.log('Página restaurada desde caché, forzando visibilidad');
            document.body.style.opacity = '1';
            document.body.style.animation = 'none';
            
            // Forzar reflow para reiniciar la animación si es necesario
            void document.body.offsetHeight;
        }
    });
    
    // También escuchar el evento de popstate (cuando se navega con flecha atrás/adelante)
    window.addEventListener('popstate', function() {
        console.log('Navegación con flecha atrás/adelante');
        setTimeout(function() {
            document.body.style.opacity = '1';
            document.body.style.animation = 'none';
        }, 10);
    });
    
    // Escuchar el evento beforeunload para preparar la página antes de salir
    window.addEventListener('beforeunload', function() {
        document.body.style.opacity = '1';
        document.body.style.animation = 'none';
    });
})();
