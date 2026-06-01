// ============================================
// IMPORTACIONES
// ============================================
import { db, auth } from '../cheloshopDB/firebase-config.js';
import { collection, getDocs, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const productosRef = collection(db, "productos");

// ============================================
// FUNCIÓN PARA MOSTRAR PRODUCTOS
// ============================================
async function mostrarProductosAlUsuario() {
    const contenedor = document.getElementById("listaProductos");
    if (!contenedor) return;
    
    contenedor.innerHTML = '<div class="loading">🛍️ Cargando productos...</div>';
    
    try {
        const snapshot = await getDocs(productosRef);
        contenedor.innerHTML = "";
        
        if (snapshot.empty) {
            contenedor.innerHTML = '<div class="no-data">✨ No hay productos disponibles por el momento.</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const p = doc.data();
            const stockActual = p.stock || 0;
            const estaAgotado = stockActual <= 0;
            const productoId = doc.id;
            const nombreProducto = p.nombre || 'Producto';
            const precioProducto = p.precio || 0;
            
            contenedor.innerHTML += `
    <div class="producto-card" data-id="${productoId}" data-stock="${stockActual}">
        ${p.imagenURL ? `<img src="${p.imagenURL}" style="max-width:150px; border-radius:8px;" alt="${p.nombre}">` : '<div style="width:150px; height:150px; background:#333; display:flex; align-items:center; justify-content:center; margin:0 auto; border-radius:8px;">📷 Sin imagen</div>'}
        <h3 style="color: white;">${nombreProducto}</h3>
        <p style="color: white;">${p.marca || ''}</p>
        <p class="precio" style="font-size:20px; color:#ff9000; font-weight:bold;">💰 Bs.${precioProducto}</p>
        <p class="stock" style="color:${stockActual > 0 ? '#10b981' : '#ef4444'};">📦 Stock disponible: ${stockActual}</p>
        
        <!-- Selector de cantidad -->
        <div class="cantidad-selector" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 15px 0;">
            <button type="button" class="btn-disminuir" data-id="${productoId}" style="background:#333; color:white; border:none; width:35px; height:35px; border-radius:8px; cursor:pointer; font-size:18px;">-</button>
            <span id="cantidad-${productoId}" class="cantidad-valor" style="color:white; font-size:18px; font-weight:bold; min-width:40px; text-align:center;">1</span>
            <button type="button" class="btn-aumentar" data-id="${productoId}" style="background:#333; color:white; border:none; width:35px; height:35px; border-radius:8px; cursor:pointer; font-size:18px;">+</button>
        </div>
        
        <button class="btn-agregar-carrito" data-id="${productoId}" data-nombre="${nombreProducto}" data-precio="${precioProducto}" data-stock="${stockActual}"
            style="background:${estaAgotado ? '#6b7280' : '#ff9000'}; color:white; border:none; padding:10px 20px; border-radius:25px; cursor:pointer; margin-top:5px; width:100%; transition: all 0.3s ease;"
            ${estaAgotado ? 'disabled' : ''}>
            ${estaAgotado ? '❌ Agotado' : '🛒 Agregar al Carrito'}
        </button>
    </div>
`;
        });
        
        agregarEventosCantidad();
        agregarEventosAgregarCarrito();
        configurarBuscador();
        
    } catch (error) {
        console.error("Error al cargar productos:", error);
        contenedor.innerHTML = '<div class="error">❌ Error al cargar productos.</div>';
    }
}

// ============================================
// FUNCIONES PARA EL SELECTOR DE CANTIDAD
// ============================================
function agregarEventosCantidad() {
    document.querySelectorAll('.btn-aumentar').forEach(btn => {
        btn.removeEventListener('click', aumentarCantidad);
        btn.addEventListener('click', aumentarCantidad);
    });
    
    document.querySelectorAll('.btn-disminuir').forEach(btn => {
        btn.removeEventListener('click', disminuirCantidad);
        btn.addEventListener('click', disminuirCantidad);
    });
}

function aumentarCantidad(event) {
    const btn = event.currentTarget;
    const productoId = btn.getAttribute('data-id');
    const spanCantidad = document.getElementById(`cantidad-${productoId}`);
    const productoCard = btn.closest('.producto-card');
    const stockDisponible = parseInt(productoCard.getAttribute('data-stock')) || 0;
    
    let cantidadActual = parseInt(spanCantidad.textContent);
    if (cantidadActual < stockDisponible) {
        spanCantidad.textContent = cantidadActual + 1;
    } else {
        mostrarNotificacion(`⚠️ Solo hay ${stockDisponible} unidades disponibles`, "error");
    }
}

function disminuirCantidad(event) {
    const btn = event.currentTarget;
    const productoId = btn.getAttribute('data-id');
    const spanCantidad = document.getElementById(`cantidad-${productoId}`);
    
    let cantidadActual = parseInt(spanCantidad.textContent);
    if (cantidadActual > 1) {
        spanCantidad.textContent = cantidadActual - 1;
    }
}

// ============================================
// AGREGAR AL CARRITO
// ============================================
function agregarEventosAgregarCarrito() {
    document.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
        btn.removeEventListener('click', manejarAgregarAlCarrito);
        btn.addEventListener('click', manejarAgregarAlCarrito);
    });
}

async function manejarAgregarAlCarrito(event) {
    const btn = event.currentTarget;
    const productoId = btn.getAttribute('data-id');
    const nombre = btn.getAttribute('data-nombre');
    const precio = parseFloat(btn.getAttribute('data-precio'));
    const stockDisponible = parseInt(btn.getAttribute('data-stock'));
    
    const spanCantidad = document.getElementById(`cantidad-${productoId}`);
    const cantidadSeleccionada = parseInt(spanCantidad.textContent);
    
    if (!auth?.currentUser) {
        mostrarNotificacion("⚠️ Debes iniciar sesión para agregar productos al carrito", "error");
        setTimeout(() => {
            window.location.href = '/inicio-registro/registro-inicio.html';
        }, 2000);
        return;
    }
    
    const user = auth.currentUser;
    
    if (cantidadSeleccionada > stockDisponible) {
        mostrarNotificacion(`⚠️ Solo hay ${stockDisponible} unidades disponibles de ${nombre}`, "error");
        return;
    }
    
    const stockActualFirestore = await obtenerStockActual(productoId);
    if (cantidadSeleccionada > stockActualFirestore) {
        mostrarNotificacion(`⚠️ El stock ha cambiado. Solo quedan ${stockActualFirestore} unidades`, "error");
        mostrarProductosAlUsuario();
        return;
    }
    
    const nuevoStock = stockActualFirestore - cantidadSeleccionada;
    const actualizado = await actualizarStockEnFirestore(productoId, nuevoStock);
    
    if (!actualizado) {
        mostrarNotificacion("❌ Error al actualizar stock", "error");
        return;
    }
    
    let carrito = JSON.parse(localStorage.getItem(`carrito_${user.uid}`)) || [];
    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        itemExistente.cantidad += cantidadSeleccionada;
    } else {
        carrito.push({
            id: productoId,
            nombre: nombre,
            precio: precio,
            cantidad: cantidadSeleccionada
        });
    }
    
    localStorage.setItem(`carrito_${user.uid}`, JSON.stringify(carrito));
    mostrarNotificacion(`✅ ${cantidadSeleccionada}x ${nombre} agregado al carrito`);
    
    mostrarProductosAlUsuario();
    actualizarVistaCarrito();
    actualizarContadorCarrito();
}

// ============================================
// ACTUALIZAR STOCK EN FIRESTORE
// ============================================
async function actualizarStockEnFirestore(productoId, nuevoStock) {
    try {
        const productoRef = doc(db, "productos", productoId);
        await updateDoc(productoRef, { stock: nuevoStock });
        console.log(`✅ Stock actualizado: ${productoId} -> ${nuevoStock}`);
        return true;
    } catch (error) {
        console.error("Error al actualizar stock:", error);
        return false;
    }
}

async function obtenerStockActual(productoId) {
    try {
        const productoRef = doc(db, "productos", productoId);
        const docSnap = await getDoc(productoRef);
        return docSnap.exists() ? (docSnap.data().stock || 0) : 0;
    } catch (error) {
        console.error("Error al obtener stock:", error);
        return 0;
    }
}

// ============================================
// ELIMINAR DEL CARRITO
// ============================================
window.eliminarDelCarrito = async (id) => {
    if (!auth?.currentUser) return;
    
    const user = auth.currentUser;
    let carrito = JSON.parse(localStorage.getItem(`carrito_${user.uid}`)) || [];
    const item = carrito.find(item => item.id === id);
    
    if (!item) return;
    
    const stockActual = await obtenerStockActual(id);
    const nuevoStock = stockActual + item.cantidad;
    await actualizarStockEnFirestore(id, nuevoStock);
    
    carrito = carrito.filter(item => item.id !== id);
    localStorage.setItem(`carrito_${user.uid}`, JSON.stringify(carrito));
    
    mostrarNotificacion(`✅ Se devolvieron ${item.cantidad} unidad(es) de ${item.nombre} al stock`);
    
    mostrarProductosAlUsuario();
    actualizarVistaCarrito();
    actualizarContadorCarrito();
};

// ============================================
// VACIAR CARRITO
// ============================================
window.vaciarCarritoCompleto = async () => {
    if (!auth?.currentUser) return;
    
    const user = auth.currentUser;
    let carrito = JSON.parse(localStorage.getItem(`carrito_${user.uid}`)) || [];
    
    if (carrito.length === 0) {
        mostrarNotificacion("🛒 El carrito ya está vacío");
        return;
    }
    
    const totalProductos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    if (!confirm(`⚠️ ¿Vaciar todo el carrito? Se devolverán ${totalProductos} producto(s) al stock.`)) return;
    
    for (const item of carrito) {
        const stockActual = await obtenerStockActual(item.id);
        const nuevoStock = stockActual + item.cantidad;
        await actualizarStockEnFirestore(item.id, nuevoStock);
    }
    
    localStorage.removeItem(`carrito_${user.uid}`);
    mostrarNotificacion(`✅ Carrito vaciado. Se devolvieron ${totalProductos} producto(s) al stock`);
    
    mostrarProductosAlUsuario();
    actualizarVistaCarrito();
    actualizarContadorCarrito();
};

// ============================================
// ACTUALIZAR VISTA DEL CARRITO
// ============================================
function actualizarVistaCarrito() {
    const tbody = document.querySelector('#lista-carrito tbody');
    if (!tbody) return;
    
    // Si no hay usuario logueado
    if (!auth?.currentUser) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 20px;">
                    🔒 <strong>Inicia sesión para usar el carrito</strong><br>
                    <small>Regístrate o inicia sesión para agregar productos y realizar pedidos</small>
                </td>
            </tr>
        `;
        return;
    }
    
    const user = auth.currentUser;
    const carrito = JSON.parse(localStorage.getItem(`carrito_${user.uid}`)) || [];
    tbody.innerHTML = '';
    
    if (carrito.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">🛒 Carrito vacío</td></tr>';
        return;
    }
    
    let total = 0;
    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        tbody.innerHTML += `
            <tr>
                <td>${item.nombre}</td>
                <td>Bs.${item.precio}</td>
                <td>${item.cantidad}</td>
                <td>Bs.${subtotal}</td>
                <td><button onclick="eliminarDelCarrito('${item.id}')" style="background:#f44336; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">🗑️</button></td>
            </tr>
        `;
    });
    
    tbody.innerHTML += `
        <tr>
            <td colspan="3" style="text-align:right; font-weight:bold;">Total:</td>
            <td colspan="2" style="font-weight:bold; color:#ff9000;">Bs.${total}</td>
        </tr>
        <tr>
            <td colspan="5" style="text-align:center; padding-top:15px;">
                <button onclick="hacerPedido()" style="background: linear-gradient(90deg, #10b981, #059669); color:white; border:none; padding:12px 24px; border-radius:25px; cursor:pointer; font-size:16px; font-weight:bold; width:100%;">
                    📦 HACER PEDIDO
                </button>
            </td>
        </tr>
    `;
}

function actualizarContadorCarrito() {
    const contador = document.getElementById('contador-carrito');
    if (!contador) return;

    // Si no hay usuario, no muestra el contador
    if (!auth?.currentUser) {
        contador.style.display = 'none';
        return;
    }
    
    const user = auth.currentUser;
    const carrito = JSON.parse(localStorage.getItem(`carrito_${user.uid}`)) || [];
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    
    contador.textContent = totalItems;
    contador.style.display = totalItems > 0 ? 'inline-block' : 'none';
}

function mostrarNotificacion(mensaje, tipo = "success") {
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = tipo === "error" ? '#f44336' : '#4CAF50';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '9999';
    toast.style.fontWeight = 'bold';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// ============================================
// CONFIGURAR CARRITO DESPLEGABLE
// ============================================
function configurarCarritoDesplegable() {
    const submenu = document.getElementById('submenu-carrito');
    const carritoDiv = document.getElementById('carrito');
    if (!submenu || !carritoDiv) return;
    
    let timeoutId;
    let isMouseOnSubmenu = false;
    let isMouseOnCarrito = false;
    
    function mostrarCarrito() {
        if (timeoutId) clearTimeout(timeoutId);
        carritoDiv.classList.add('mostrar');
        actualizarVistaCarrito();
    }
    
    function ocultarCarritoConDelay() {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            if (!isMouseOnSubmenu && !isMouseOnCarrito) {
                carritoDiv.classList.remove('mostrar');
            }
        }, 2000);
    }
    
    submenu.addEventListener('mouseenter', () => { isMouseOnSubmenu = true; mostrarCarrito(); });
    submenu.addEventListener('mouseleave', () => { isMouseOnSubmenu = false; ocultarCarritoConDelay(); });
    carritoDiv.addEventListener('mouseenter', () => { isMouseOnCarrito = true; if (timeoutId) clearTimeout(timeoutId); mostrarCarrito(); });
    carritoDiv.addEventListener('mouseleave', () => { isMouseOnCarrito = false; ocultarCarritoConDelay(); });
}

// ============================================
// VERIFICAR AUTENTICACIÓN
// ============================================
function verificarAutenticacion() {
    if (!auth) {
        console.error("❌ auth no disponible")
        return;
    }

    mostrarProductosAlUsuario();

    onAuthStateChanged(auth, (user) => {
        console.log("onAuthStateChanged - Usuario", user ? user.email : "No logueado");
        actualizarBotonNavegacion(user);

        // Vista del carrito si está loguado
        if (user) {
            actualizarVistaCarrito();
            actualizarContadorCarrito();
        } else {
            // Limpiar carrito visual para visitantes
            const tbody = document.querySelector('#lista-carrito tbody')
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">🔒 Inicia sesión para ver tu carrito</td></tr>';
        }
    });
}

// =============================
// Cambio de bton de navegacion
// =============================
function actualizarBotonNavegacion(user) {
    const authContainer = document.getElementById('auth-button-container');
    if (!authContainer) return;
    
    authContainer.innerHTML = '';
    
    if (user) {
        let nombreMostrar = user.email?.split('@')[0] || user.email;
        const nombreLocal = localStorage.getItem("usuarioNombre");
        if (nombreLocal) nombreMostrar = nombreLocal;
        
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '12px';
        
        const span = document.createElement('span');
        span.style.color = '#ff9000';
        span.style.fontSize = '14px';
        span.style.fontWeight = '500';
        span.textContent = `👤 Hola, ${nombreMostrar}`;
        
        const button = document.createElement('button');
        button.textContent = 'Cerrar Sesión';
        button.className = 'btn-cerrar-sesion';
        button.onclick = async () => {
            try {
                await signOut(auth);
                localStorage.removeItem("usuarioLogueado");
                localStorage.removeItem("usuarioNombre");
                localStorage.removeItem("usuarioEmail");
                localStorage.removeItem("usuarioUID");
                mostrarNotificacion("👋 Sesión cerrada correctamente");
                setTimeout(() => window.location.reload(), 500);
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
                mostrarNotificacion("❌ Error al cerrar sesión", "error");
            }
        };
        
        div.appendChild(span);
        div.appendChild(button);
        authContainer.appendChild(div);
    } else {
        const link = document.createElement('a');
        link.href = '/inicio-registro/registro-inicio.html';
        link.textContent = 'Iniciar Sesión';
        link.className = 'btn-iniciar-sesion';
        authContainer.appendChild(link);
    }
}

// ============================================
// HACER PEDIDO
// ============================================
window.hacerPedido = async () => {
    console.log("🔍 Iniciando función hacerPedido...");
    
    if (!auth?.currentUser) {
        mostrarNotificacion("⚠️ Debes iniciar sesión para hacer un pedido", "error");
        setTimeout(() => {
            window.location.href = '/inicio-registro/registro-inicio.html';
        }, 2000);
        return;
    }

    const user = auth.currentUser;
    const carrito = JSON.parse(localStorage.getItem(`carrito_${user.uid}`)) || [];
    
    if (carrito.length === 0) {
        mostrarNotificacion("🛒 No hay productos en el carrito", "error");
        return;
    }

    // Obtener nombre del usuario desde Realtime Database
    let nombreUsuario = user.email?.split('@')[0] || "Usuario";

    try {
        const { getDatabase, ref, get } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js");
        const dbRealtime = getDatabase();
        const usuarioRef = ref(dbRealtime, `usuarios/${user.uid}`);
        const snapshot = await get(usuarioRef);

        if (snapshot.exists()) {
            const userData = snapshot.val();
            nombreUsuario = userData.nombre || nombreUsuario;
            console.log("✅ Nombre obtenido desde Realtime DB:", nombreUsuario);
        }
    } catch (error) {
        console.warn("⚠️ Error al obtener nombre:", error);
        const nombreLocal = localStorage.getItem("usuarioNombre");
        if (nombreLocal) nombreUsuario = nombreLocal;
    }

    const totalPedido = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const confirmar = confirm(`📦 ¿Confirmar pedido?\n\nTotal: Bs.${totalPedido}\nProductos: ${carrito.length}\n\n¿Deseas realizar este pedido?`);

    if (!confirmar) return;

    mostrarNotificacion("📦 Procesando pedido...", "info");
    
    try {
        const { addDoc, collection } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const pedidosRef = collection(db, "pedidos");

        const nuevoPedido = {
            usuarioId: user.uid,
            usuarioEmail: user.email,
            usuarioNombre: nombreUsuario,
            fecha: new Date(),
            estado: "pendiente",
            total: totalPedido,
            productos: carrito.map(item => ({
                id: item.id,
                nombre: item.nombre,
                precio: item.precio,
                cantidad: item.cantidad,
                subtotal: item.precio * item.cantidad
            }))
        };

        console.log("📝 Enviando pedido a Firestore:", nuevoPedido);

        const docRef = await addDoc(pedidosRef, nuevoPedido);
        localStorage.removeItem(`carrito_${user.uid}`);

        mostrarNotificacion(`✅ Pedido #${docRef.id.slice(0,8)} realizado con éxito!`, "success");

        mostrarProductosAlUsuario();
        actualizarVistaCarrito();
        actualizarContadorCarrito();

    } catch (error) {
        console.error("❌ Error al hacer pedido:", error);
        mostrarNotificacion("❌ Error al procesar el pedido: " + error.message, "error");
    }
};

// ============================================
// FUNCIÓN DE BÚSQUEDA
// ============================================
function configurarBuscador() {
    const inputBusqueda = document.getElementById('buscadorProductos');
    if (!inputBusqueda) return;

    inputBusqueda.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim();
        const productos = document.querySelectorAll('.producto-card');
        let contador = 0;

        productos.forEach(producto => {
            const nombre = producto.querySelector('h3')?.textContent.toLowerCase() || '';
            
            let marca = '';
            const parrafos = producto.querySelectorAll('p');
            for (let i = 0; i < parrafos.length; i++) {
                if (!parrafos[i].classList.contains('precio') && !parrafos[i].classList.contains('stock')) {
                    marca = parrafos[i].textContent.toLowerCase();
                    break;
                }
            }

            if (termino === '' || nombre.includes(termino) || marca.includes(termino)) {
                producto.style.display = 'flex';
                contador++;
            } else {
                producto.style.display = 'none';
            }
        });

        const resultadosDiv = document.getElementById('resultadosBusqueda');
        if (resultadosDiv) {
            resultadosDiv.innerHTML = termino === '' ? '' : `🔍 ${contador} producto(s) encontrado(s)`;
        }
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    configurarCarritoDesplegable();
    
    const btnVaciar = document.getElementById('vaciar-carrito');
    if (btnVaciar) {
        btnVaciar.onclick = (e) => {
            e.preventDefault();
            window.vaciarCarritoCompleto();
        };
    }
    
    verificarAutenticacion();
    console.log("✅ product.js funcionando correctamente");
});