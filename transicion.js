// ============================================
// TRANSICIONES Y NAVEGACIÓN
// ============================================

// Forzar visibilidad inmediata
document.body.style.opacity = '1';

// Función para reiniciar la transición
function reiniciarTransicion() {
    document.body.style.opacity = '1';
    document.body.style.animation = 'none';
    
    // Pequeño truco para forzar reflow
    void document.body.offsetHeight;
}

// Evento pageshow (para cuando la página viene de la caché del navegador)
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        console.log('Página restaurada desde caché');
        reiniciarTransicion();
    }
});

// Evento popstate (para navegación con flecha atrás/adelante)
window.addEventListener('popstate', function() {
    console.log('Navegación con flecha atrás/adelante');
    setTimeout(reiniciarTransicion, 10);
});

// Evento beforeunload (antes de salir de la página)
window.addEventListener('beforeunload', function() {
    document.body.style.opacity = '1';
    document.body.style.animation = 'none';
});

// Si la página ya está cargada, asegurar visibilidad
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reiniciarTransicion);
} else {
    reiniciarTransicion();
}
