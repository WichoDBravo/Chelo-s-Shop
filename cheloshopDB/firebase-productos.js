// firebase-productos.js
import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Referencia a la colección de productos
const productosRef = collection(db, "productos");

// ============ VARIABLE GLOBAL DEL CARRITO ============
let carritoActual = [];

// ============ FUNCIONES PARA CLIENTE ============
export function cargarProductosCliente() {
    const contenedor = document.getElementById('listaProductos');
    if (!contenedor) {
        console.error('No se encontró el contenedor #listaProductos');
        return;
    }
    
    onSnapshot(productosRef, (snapshot) => {
        if (snapshot.empty) {
            contenedor.innerHTML = '<div class="loading">📦 No hay productos disponibles</div>';
            return;
        }
        
        contenedor.innerHTML = '';
        snapshot.forEach((doc) => {
            const producto = { id: doc.id, ...doc.data() };
            contenedor.appendChild(crearTarjetaProducto(producto));
        });
    });
}

function crearTarjetaProducto(producto) {
    const div = document.createElement('div');
    div.className = 'producto-card';
    const agotado = producto.stock <= 0;
    
    div.innerHTML = `
        <div class="producto-titulo">${producto.nombre}</div>
        <div class="producto-marca">${producto.marca}</div>
        <div class="producto-precio">$${producto.precio.toFixed(2)}</div>
        <div class="producto-stock ${agotado ? 'agotado' : 'disponible'}">
            ${agotado ? '❌ AGOTADO' : `📦 Stock: ${producto.stock} unidades`}
        </div>
        <button class="btn-agregar" ${agotado ? 'disabled' : ''} data-id="${producto.id}" data-nombre="${producto.nombre} ${producto.marca}" data-precio="${producto.precio}">
            ${agotado ? 'No disponible' : '🛒 Agregar al carrito'}
        </button>
    `;
    
    if (!agotado) {
        const btn = div.querySelector('.btn-agregar');
        btn.addEventListener('click', () => agregarAlCarrito({
            id: producto.id,
            nombre: `${producto.nombre} ${producto.marca}`,
            precio: producto.precio
        }));
    }
    
    return div;
}

// Funciones del carrito
function agregarAlCarrito(producto) {
    const existente = carritoActual.find(item => item.id === producto.id);
    if (existente) {
        existente.cantidad++;
    } else {
        carritoActual.push({ ...producto, cantidad: 1 });
    }
    actualizarVistaCarrito();
    guardarCarritoLocal();
}

function actualizarVistaCarrito() {
    const carritoTbody = document.querySelector('#lista-carrito tbody');
    if (!carritoTbody) return;
    
    carritoTbody.innerHTML = '';
    let total = 0;
    
    carritoActual.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><img src="/Gestion-Inventario/images/car.svg" width="30"></td>
            <td>${item.nombre}</td>
            <td>$${subtotal.toFixed(2)}</td>
            <td>
                <div class="carrito-item-cantidad">
                    <button class="cantidad-btn" data-index="${index}" data-cambio="-1">-</button>
                    <span>${item.cantidad}</span>
                    <button class="cantidad-btn" data-index="${index}" data-cambio="1">+</button>
                    <button class="btn-eliminar" data-index="${index}">🗑️</button>
                </div>
            </td>
        `;
        carritoTbody.appendChild(fila);
    });
    
    // Agregar fila de total si hay items
    if (carritoActual.length > 0) {
        const totalFila = document.createElement('tr');
        totalFila.innerHTML = `
            <td colspan="2"><strong>Total:</strong></td>
            <td colspan="2"><strong>$${total.toFixed(2)}</strong></td>
        `;
        carritoTbody.appendChild(totalFila);
    }
    
    // Agregar eventos a los botones del carrito
    document.querySelectorAll('.cantidad-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            const cambio = parseInt(btn.dataset.cambio);
            cambiarCantidad(index, cambio);
        });
    });
    
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            eliminarDelCarrito(index);
        });
    });
}

function cambiarCantidad(index, cambio) {
    const item = carritoActual[index];
    if (!item) return;
    
    const nuevaCantidad = item.cantidad + cambio;
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(index);
    } else {
        item.cantidad = nuevaCantidad;
        actualizarVistaCarrito();
        guardarCarritoLocal();
    }
}

function eliminarDelCarrito(index) {
    carritoActual.splice(index, 1);
    actualizarVistaCarrito();
    guardarCarritoLocal();
}

function guardarCarritoLocal() {
    localStorage.setItem('carritoChelos', JSON.stringify(carritoActual));
}

function cargarCarritoLocal() {
    const guardado = localStorage.getItem('carritoChelos');
    if (guardado) {
        carritoActual = JSON.parse(guardado);
        actualizarVistaCarrito();
    }
}

// Finalizar pedido
export async function finalizarPedido(usuarioActual) {
    if (!usuarioActual) {
        alert('❌ Debes iniciar sesión para hacer un pedido');
        return false;
    }
    
    if (carritoActual.length === 0) {
        alert('🛒 El carrito está vacío');
        return false;
    }
    
    // Verificar stock
    for (const item of carritoActual) {
        const productoDoc = await getDoc(doc(db, "productos", item.id));
        if (!productoDoc.exists()) {
            alert(`❌ ${item.nombre} ya no está disponible`);
            return false;
        }
        const stockActual = productoDoc.data().stock;
        if (stockActual < item.cantidad) {
            alert(`❌ Stock insuficiente para ${item.nombre}. Disponible: ${stockActual}`);
            return false;
        }
    }
    
    // Calcular total
    const total = carritoActual.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const comprobante = `CHELO-${Date.now()}-${usuarioActual.email.split('@')[0]}`;
    
    try {
        // Guardar pedido
        await addDoc(collection(db, "pedidos"), {
            usuarioId: usuarioActual.uid,
            usuarioEmail: usuarioActual.email,
            fecha: new Date(),
            items: carritoActual,
            total: total,
            comprobante: comprobante,
            estado: "pendiente"
        });
        
        // Reducir stock
        for (const item of carritoActual) {
            const productoDoc = doc(db, "productos", item.id);
            const productoData = await getDoc(productoDoc);
            const nuevoStock = productoData.data().stock - item.cantidad;
            await updateDoc(productoDoc, { stock: nuevoStock });
        }
        
        // Mostrar comprobante
        alert(`✅ ¡PEDIDO REALIZADO!\n\n📋 Comprobante: ${comprobante}\n💰 Total: $${total.toFixed(2)}\n\n📧 Te enviaremos notificaciones a ${usuarioActual.email}`);
        
        // Vaciar carrito
        carritoActual = [];
        actualizarVistaCarrito();
        guardarCarritoLocal();
        
        return true;
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al procesar el pedido');
        return false;
    }
}

// Inicializar carrito y botón finalizar
export function inicializarCarritoCliente() {
    cargarCarritoLocal();
    
    const vaciarBtn = document.getElementById('vaciar-carrito');
    if (vaciarBtn) {
        vaciarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            carritoActual = [];
            actualizarVistaCarrito();
            guardarCarritoLocal();
        });
    }
}

// ============ FUNCIONES PARA ADMIN ============
export function cargarProductosAdmin() {
    const contenedor = document.getElementById('listaProductosAdmin');
    if (!contenedor) {
        console.error('No se encontró #listaProductosAdmin');
        return;
    }
    
    onSnapshot(productosRef, (snapshot) => {
        if (snapshot.empty) {
            contenedor.innerHTML = '<div class="loading">📦 No hay productos. ¡Agrega tu primer producto!</div>';
            return;
        }
        
        contenedor.innerHTML = '';
        snapshot.forEach((doc) => {
            const producto = { id: doc.id, ...doc.data() };
            contenedor.appendChild(crearTarjetaAdmin(producto));
        });
    });
}

function crearTarjetaAdmin(producto) {
    const div = document.createElement('div');
    div.className = 'producto-admin-card';
    div.innerHTML = `
        <div class="producto-admin-info">
            <h3>${producto.nombre} ${producto.marca}</h3>
            <p class="producto-admin-precio">$${producto.precio.toFixed(2)}</p>
            <p class="producto-admin-stock">📦 Stock: ${producto.stock} unidades</p>
            <div>
                <button class="btn-editar" data-id="${producto.id}">✏️ Editar</button>
                <button class="btn-eliminar" data-id="${producto.id}">🗑️ Eliminar</button>
            </div>
        </div>
    `;
    
    div.querySelector('.btn-editar').addEventListener('click', () => editarProducto(producto));
    div.querySelector('.btn-eliminar').addEventListener('click', () => eliminarProducto(producto.id));
    
    return div;
}

let productoEditandoId = null;

function editarProducto(producto) {
    productoEditandoId = producto.id;
    document.getElementById('productoId').value = producto.id;
    document.getElementById('nombre').value = producto.nombre;
    document.getElementById('marca').value = producto.marca;
    document.getElementById('precio').value = producto.precio;
    document.getElementById('stock').value = producto.stock;
    
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
    btnGuardar.textContent = '✏️ Actualizar Producto';
    btnCancelar.style.display = 'block';
    
    // Guardar función original
    const originalClick = btnGuardar.onclick;
    btnGuardar.onclick = async () => {
        const productoDoc = doc(db, "productos", producto.id);
        await updateDoc(productoDoc, {
            nombre: document.getElementById('nombre').value,
            marca: document.getElementById('marca').value,
            precio: parseFloat(document.getElementById('precio').value),
            stock: parseInt(document.getElementById('stock').value)
        });
        alert('✅ Producto actualizado');
        limpiarFormularioAdmin();
        btnGuardar.textContent = '➕ Agregar Producto';
        btnCancelar.style.display = 'none';
        btnGuardar.onclick = originalClick;
        productoEditandoId = null;
    };
}

async function eliminarProducto(id) {
    if (confirm('¿Eliminar este producto permanentemente?')) {
        const productoDoc = doc(db, "productos", id);
        await deleteDoc(productoDoc);
        alert('✅ Producto eliminado');
    }
}

function limpiarFormularioAdmin() {
    document.getElementById('productoId').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('marca').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '';
}

export function setupAdminForm() {
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
    
    if (btnGuardar) {
        btnGuardar.onclick = async () => {
            const nombre = document.getElementById('nombre').value;
            const marca = document.getElementById('marca').value;
            const precio = parseFloat(document.getElementById('precio').value);
            const stock = parseInt(document.getElementById('stock').value);
            
            if (!nombre || !marca || isNaN(precio) || isNaN(stock)) {
                alert('❌ Completa todos los campos correctamente');
                return;
            }
            
            if (productoEditandoId) {
                // Ya se maneja en editarProducto
                return;
            }
            
            await addDoc(productosRef, { nombre, marca, precio, stock });
            alert('✅ Producto agregado');
            limpiarFormularioAdmin();
        };
    }
    
    if (btnCancelar) {
        btnCancelar.onclick = () => {
            limpiarFormularioAdmin();
            btnCancelar.style.display = 'none';
            const btnGuardar = document.getElementById('btnGuardar');
            btnGuardar.textContent = '➕ Agregar Producto';
            productoEditandoId = null;
        };
    }
}