function mostrarMensajeBienvenida(mensaje) {
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.position = 'fixed';
    toast.style.top = '100px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#4CAF50';
    toast.style.color = 'white';
    toast.style.padding = '15px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '9999';
    toast.style.fontWeight = 'bold';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    toast.style.animation = 'slideInRight 0.3s ease';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Función para actualizar el botón según estado de sesión
function actualizarBotonSesion() {
    const authContainer = document.getElementById('auth-button-container');
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    const usuarioNombre = localStorage.getItem('usuarioNombre');
    
    if (usuarioLogueado === 'true') {
        // Usuario logueado: mostrar "Cerrar Sesión"
        authContainer.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <span style="position: relative;top: 10px; left: 30px; color: white; font-size: 20px;">Hola, ${usuarioNombre || 'Usuario'}</span>
                <a href="/index.html" id="cerrar-sesion-btn" class="btn-cerrar-sesion">Cerrar Sesión</a>
            </div>
        `;
        
        // Agregar evento al botón de cerrar sesión
        const cerrarBtn = document.getElementById('cerrar-sesion-btn');
        if (cerrarBtn) {
            cerrarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Limpiar localStorage
                localStorage.removeItem('usuarioLogueado');
                localStorage.removeItem('usuarioNombre');
                localStorage.removeItem('usuarioEmail');
                localStorage.removeItem('usuarioUID');
                
                // Mostrar mensaje
                mostrarMensajeBienvenida('👋 Sesión cerrada correctamente');
                
                // Actualizar botón inmediatamente
                actualizarBotonSesion();
                
                // Opcional: Recargar la página después de 1 segundo
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            });
        }
    } else {
        // Usuario no logueado: mostrar "Iniciar Sesión"
        authContainer.innerHTML = `
            <a href="/inicio-registro/registro-inicio.html" class="btn-iniciar-sesion">Iniciar Sesión</a>
        `;
    }
}

// Verificar sesión al cargar la página y mostrar bienvenida si corresponde
function verificarSesionAlCargar() {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    const usuarioNombre = localStorage.getItem('usuarioNombre');
    
    if (usuarioLogueado === 'true' && usuarioNombre) {
        mostrarMensajeBienvenida(`✨ ¡Bienvenido de vuelta, ${usuarioNombre}! ✨`);
    }
}

// Agregar animaciones CSS para el toast
const estiloAnimaciones = document.createElement('style');
estiloAnimaciones.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(estiloAnimaciones);

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    actualizarBotonSesion();
    verificarSesionAlCargar();
});