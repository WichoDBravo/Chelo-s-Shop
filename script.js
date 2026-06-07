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
// Función para actualizar el botón según estado de sesión
function actualizarBotonSesion() {
    const authContainer = document.getElementById('auth-button-container');
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    let usuarioNombre = localStorage.getItem('usuarioNombre');
    
    if (usuarioLogueado === 'true') {
        // Limitar nombre largo en escritorio
        if (usuarioNombre && usuarioNombre.length > 18) {
            usuarioNombre = usuarioNombre.substring(0, 16) + '...';
        }
        
        // Usuario logueado: mostrar nombre y botón "Cerrar Sesión"
        authContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: #ff9000; font-size: 14px; font-weight: 500; white-space: nowrap;">👤 Hola, ${usuarioNombre || 'Usuario'}</span>
                <a href="#" id="cerrar-sesion-btn" class="btn-cerrar-sesion" style="background: linear-gradient(90deg, #dc2626, #ef4444); padding: 6px 18px; border-radius: 25px; color: white; text-decoration: none; font-size: 13px; transition: all 0.3s ease;">Cerrar Sesión</a>
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
                
                // Recargar la página después de 1 segundo
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            });
        }
    } else {
        // Usuario no logueado: mostrar "Iniciar Sesión"
        authContainer.innerHTML = `
            <a href="/inicio-registro/registro-inicio.html" class="btn-iniciar-sesion" style="background: linear-gradient(90deg, #ff9000, #f8991d); padding: 6px 18px; border-radius: 25px; color: white; text-decoration: none; font-size: 13px; transition: all 0.3s ease;">Iniciar Sesión</a>
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

// ============================================
// CIERRE AUTOMÁTICO DEL MENÚ MÓVIL
// ============================================

function configurarCierreMenuMovil() {
    const menuCheckbox = document.getElementById('menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuLinks = document.querySelectorAll('.navbar a, .navbar button, .btn-cerrar-sesion, .btn-iniciar-sesion');
    let timeoutId = null;

    if (!menuCheckbox) return;

    // Función para cerrar el menú
    function cerrarMenu() {
        if (menuCheckbox.checked) {
            menuCheckbox.checked = false;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }

    // Cerrar menú después de 2 segundos si está abierto
    function iniciarTemporizadorCierre() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (menuCheckbox.checked) {
            timeoutId = setTimeout(() => {
                cerrarMenu();
            }, 2000); // 2 segundos
        }
    }

    // Detectar cuando se abre el menú
    menuCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // Si se abre, iniciar temporizador
            iniciarTemporizadorCierre();
        } else {
            // Si se cierra, cancelar temporizador
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    });

    // Cerrar menú al hacer clic en el overlay
    if (menuOverlay) {
        menuOverlay.addEventListener('click', cerrarMenu);
    }

    // Cerrar menú al hacer clic en cualquier enlace o botón del menú
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Pequeño retraso para permitir la navegación
            setTimeout(() => {
                cerrarMenu();
            }, 100);
        });
    });
}

// Ejecutar la función cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    configurarCierreMenuMovil();
});
