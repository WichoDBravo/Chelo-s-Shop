// ============================================
// IMPORTACIÓN (CORREGIDA - AGREGAR updateDoc y getDoc)
// ============================================
import { db } from '../cheloshopDB/firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const productosRef = collection(db, "productos");

// ============================================
// FUNCIÓN PARA AGREGAR PRODUCTO
// ============================================
async function agregarProducto() {
    const nombre = document.getElementById("nombre")?.value;
    const marca = document.getElementById("marca")?.value;
    const precio = parseFloat(document.getElementById("precio")?.value);
    const stock = parseInt(document.getElementById("stock")?.value);
    const imagenURL = document.getElementById("imagenURL")?.value;
    const categoria = document.getElementById("categoria")?.value || "otros";
    
    if (!nombre || isNaN(precio) || isNaN(stock)) {
        alert("⚠️ Completa: Nombre, Precio y Stock");
        return;
    }

    if (!categoria || categoria == "") {
        alert("⚠️ Selecciona una categoría");
        return;
    }
    
    try {
        await addDoc(productosRef, {
            nombre: nombre,
            marca: marca || "",
            precio: precio,
            stock: stock,
            imagenURL: imagenURL || "",
            categoria: categoria
        });
        
        // Limpiar formulario
        document.getElementById("nombre").value = "";
        document.getElementById("marca").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("imagenURL").value = "";
        document.getElementById("categoria").value = "";
        document.getElementById("vistaPrevia").style.display = 'none';
        
        alert("✅ Producto agregado correctamente");
        cargarProductos();
        
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error: " + error.message);
    }
}

// ============================================
// FUNCIÓN PARA EDITAR PRODUCTO
// ============================================
window.editarProducto = async (id) => {
    try {
        // Obtener el documento del producto
        const productoRef = doc(db, "productos", id);
        const productoSnap = await getDoc(productoRef);

        if (productoSnap.exists()) {  // CORREGIDO: .exists() no .exist()
            const data = productoSnap.data();

            // Llenar formulario con los datos del producto
            document.getElementById("nombre").value = data.nombre || '';
            document.getElementById("marca").value = data.marca || '';
            document.getElementById("precio").value = data.precio || '';
            document.getElementById("stock").value = data.stock || '';
            document.getElementById("imagenURL").value = data.imagenURL || '';
            document.getElementById("categoria").value = data.categoria || 'otros';

            // Mostrar vista previa de la imagen si existe
            if (data.imagenURL) {
                const previewImg = document.getElementById("previewImg");
                const vistaPrevia = document.getElementById("vistaPrevia");
                if (previewImg && vistaPrevia) {
                    previewImg.src = data.imagenURL;
                    vistaPrevia.style.display = 'block';
                }
            }

            // Cambiar botón a "Actualizar"
            const btnGuardar = document.getElementById("btnGuardar");
            if (btnGuardar) {
                btnGuardar.textContent = "✏️ Actualizar Producto";
                btnGuardar.onclick = () => actualizarProducto(id);
            }

            // Mostrar botón cancelar
            const btnCancelar = document.getElementById("btnCancelar");
            if (btnCancelar) {
                btnCancelar.style.display = 'inline-block';
                btnCancelar.onclick = cancelarEdicion;
            }

            // CORREGIDO: usar comillas invertidas
            alert(`✏️ Editando producto: ${data.nombre}`);
        } else {
            alert("❌ Producto no encontrado");
        }
    } catch (error) {
        console.error("Error al cargar producto para editar:", error);
        alert("❌ Error al cargar los datos del producto");
    }
};

// ============================================
// FUNCIÓN PARA ACTUALIZAR PRODUCTO
// ============================================
async function actualizarProducto(id) {
    const nombre = document.getElementById("nombre")?.value;
    const marca = document.getElementById("marca")?.value;
    const precio = parseFloat(document.getElementById("precio")?.value);
    const stock = parseInt(document.getElementById("stock")?.value);
    const imagenURL = document.getElementById("imagenURL")?.value;

    if (!nombre || isNaN(precio) || isNaN(stock)) {
        alert("⚠️ Completa: Nombre, Precio y Stock");
        return;
    }

    try {
        const productoRef = doc(db, "productos", id);
        await updateDoc(productoRef, {
            nombre: nombre,
            marca: marca || "",
            precio: precio,
            stock: stock,
            imagenURL: imagenURL || ""
        });

        alert("✅ Producto actualizado correctamente");
        cancelarEdicion();
        cargarProductos();
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("❌ Error al actualizar producto: " + error.message);
    }
}

// ============================================
// FUNCIÓN PARA CANCELAR EDICIÓN
// ============================================
function cancelarEdicion() {
    // Limpiar formulario
    document.getElementById("nombre").value = "";
    document.getElementById("marca").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("imagenURL").value = "";
    document.getElementById("vistaPrevia").style.display = 'none';

    // Restaurar botón a "Agregar"
    const btnGuardar = document.getElementById("btnGuardar");
    if (btnGuardar) {
        btnGuardar.textContent = "➕ Agregar Producto";
        btnGuardar.onclick = agregarProducto;
    }
}

// ============================================
// FUNCIÓN PARA CARGAR PRODUCTOS
// ============================================
async function cargarProductos() {
    const lista = document.getElementById("listaProductosAdmin");
    if (!lista) return;
    
    lista.innerHTML = '<div class="loading">📦 Cargando productos...</div>';
    
    try {
        const snapshot = await getDocs(productosRef);
        lista.innerHTML = "";
        
        if (snapshot.empty) {
            lista.innerHTML = '<div class="no-data">✨ No hay productos. ¡Agrega uno nuevo!</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const nombreCategoria = obtenerNombreCategoria(data.categoria || 'otros');
            lista.innerHTML += `
                <div class="producto-card">
                    ${data.imagenURL ? `<img src="${data.imagenURL}" alt="${data.nombre}">` : '<div style="width:100%; height:120px; background:#333; border-radius:8px; display:flex; align-items:center; justify-content:center;">📷</div>'}
                    <h4>${data.nombre || 'Sin nombre'}</h4>
                    <p class="precio">💰 Precio: Bs.${data.precio || 0}</p>
                    <p class="stock">📦 Stock: ${data.stock || 0}</p>
                    <p class="marca">🏷️ Marca: ${data.marca || 'Sin marca'}</p>
                    <p class="categoria-admin"> ${nombreCategoria}</p>
                    <div class="producto-botones">
                        <button class="btn-editar" onclick="window.editarProducto('${doc.id}')">✏️ Editar</button>
                        <button class="btn-eliminar" onclick="window.eliminarProducto('${doc.id}')">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
        });
        
        // Configurar buscador después de cargar productos
        configurarBuscadorAdmin();
        
    } catch (error) {
        console.error("Error al cargar productos:", error);
        lista.innerHTML = '<div class="error">❌ Error al cargar productos. Verifica Firestore.</div>';
    }
}

// Obtener nombre de categoria
function obtenerNombreCategoria(categoria) {
    const categorias = {
        'lacteos': '🥛 Lácteos',
        'liquidos': '💧 Líquidos',
        'charcuteria': '🍖 Charcutería',
        'herramientas': '🔧 Herramientas',
        'enlatados': '🥫 Enlatados',
        'escolares': '📚 Útiles Escolares',
        'legumbres': '🥔 Legumbres / Verduras',
        'otros': '🎲 Otros',
    };
    return categorias[categoria] || '📦 Producto'
}

// ============================================
// FUNCIÓN DE BÚSQUEDA
// ============================================
function configurarBuscadorAdmin() {
    const inputBusqueda = document.getElementById('buscadorProductosAdmin');
    if (!inputBusqueda) return;

    inputBusqueda.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim();
        const productos = document.querySelectorAll('.producto-card');
        let contador = 0;

        productos.forEach(producto => {
            const nombre = producto.querySelector('h4')?.textContent.toLowerCase() || '';
            const marca = producto.querySelector('.marca')?.textContent.toLowerCase() || '';
            
            if (termino === '' || nombre.includes(termino) || marca.includes(termino)) {
                producto.style.display = 'block';
                contador++;
            } else {
                producto.style.display = 'none';
            }
        });

        const resultadosDiv = document.getElementById('resultadosBusquedaAdmin');
        if (resultadosDiv) {
            if (termino === '') {
                resultadosDiv.innerHTML = '';
            } else {
                resultadosDiv.innerHTML = `🔍 ${contador} producto(s) encontrado(s)`;
            }
        }
    });
}

// ============================================
// FUNCIÓN PARA ELIMINAR
// ============================================
window.eliminarProducto = async (id) => {
    if (confirm("¿Eliminar este producto?")) {
        try {
            await deleteDoc(doc(db, "productos", id));
            cargarProductos();
            alert("✅ Producto eliminado");
        } catch (error) {
            alert("❌ Error al eliminar");
        }
    }
};

// ============================================
// FUNCIÓN DEL CARRITO
// ============================================
function configurarCarrito() {
    const submenu = document.getElementById('submenu-carrito');
    const carritoDiv = document.getElementById('carrito');
    if (!submenu || !carritoDiv) return;
    
    let timeoutId;
    let isMouseOnSubmenu = false;
    let isMouseOnCarrito = false;
    
    function mostrarCarrito() {
        if (timeoutId) clearTimeout(timeoutId);
        carritoDiv.classList.add('mostrar');
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
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    configurarCarrito();
    
    const btnGuardar = document.getElementById("btnGuardar");
    if (btnGuardar) {
        btnGuardar.onclick = agregarProducto;
    }
    
    cargarProductos();
    console.log("✅ Admin.js funcionando con buscador y edición");
});
