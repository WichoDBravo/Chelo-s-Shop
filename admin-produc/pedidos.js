// ============================================
// IMPORTACIONES
// ============================================
import { db } from '../cheloshopDB/firebase-config.js';
import { collection, getDocs, updateDoc, doc, query, orderBy, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const pedidosRef = collection(db, "pedidos");
let filtroActual = "todos";

// ============================================
// CARGAR PEDIDOS
// ============================================
async function cargarPedidos() {
    const contenedor = document.getElementById("listaPedidos");
    if (!contenedor) {
        console.error("No se encontró el contenedor 'listaPedidos'");
        return;
    }
    
    contenedor.innerHTML = '<div class="loading">📦 Cargando pedidos...</div>';
    
    try {
        let q;
        
        // Aplicar filtro según selección
        if (filtroActual === "pendiente") {
            q = query(pedidosRef, where("estado", "==", "pendiente"), orderBy("fecha", "desc"));
        } else if (filtroActual === "completado") {
            q = query(pedidosRef, where("estado", "==", "completado"), orderBy("fecha", "desc"));
        } else {
            // "todos" - mostrar todos
            q = query(pedidosRef, orderBy("fecha", "desc"));
        }
        
        const snapshot = await getDocs(q);
        contenedor.innerHTML = "";
        
        if (snapshot.empty) {
            let mensaje = "";
            if (filtroActual === "pendiente") mensaje = "No hay pedidos pendientes";
            else if (filtroActual === "completado") mensaje = "No hay pedidos completados";
            else mensaje = "✨ No hay pedidos registrados";
            contenedor.innerHTML = `<div class="no-data">${mensaje}</div>`;
            return;
        }
        
        console.log(`📦 Encontrados ${snapshot.size} pedidos (filtro: ${filtroActual})`);
        
        snapshot.forEach(docPedido => {
            const pedido = docPedido.data();
            const pedidoId = docPedido.id;
            
            // Convertir fecha
            let fecha;
            if (pedido.fecha?.toDate) {
                fecha = pedido.fecha.toDate();
            } else if (pedido.fecha) {
                fecha = new Date(pedido.fecha);
            } else {
                fecha = new Date();
            }
            
            // Determinar color del estado
            let estadoColor = "#ff9000";
            let estadoTexto = "⏳ Pendiente";
            if (pedido.estado === "completado") {
                estadoColor = "#10b981";
                estadoTexto = "✅ Completado";
            } else if (pedido.estado === "procesando") {
                estadoColor = "#3b82f6";
                estadoTexto = "🔄 Procesando";
            } else if (pedido.estado === "cancelado") {
                estadoColor = "#ef4444";
                estadoTexto = "❌ Cancelado";
            }
            
            // Mostrar botón cancelar solo si NO está completado
            const mostrarBotonCancelar = (pedido.estado !== "completado" && pedido.estado !== "cancelado");
            
            contenedor.innerHTML += `
                <div class="pedido-card" data-id="${pedidoId}" style="background: rgba(0,0,0,0.5); border-radius:16px; padding:20px; margin-bottom:20px; border-left: 4px solid ${estadoColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 15px;">
                        <div>
                            <h3 style="color: white;">🧾 Pedido #${pedidoId.slice(0,8)}</h3>
                            <p style="color: #9ca3af;">📅 ${fecha.toLocaleString()}</p>
                            <p style="color: #ff9000;">👤 ${pedido.usuarioNombre || pedido.usuarioEmail}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 24px; color: #ff9000; font-weight: bold;">Bs.${pedido.total}</p>
                            <div style="display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end;">
                                <select id="estado-${pedidoId}" class="select-estado" data-id="${pedidoId}" style="padding: 8px 15px; border-radius: 8px; background: #1f2937; color: white; border: 1px solid ${estadoColor};">
                                    <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                                    <option value="procesando" ${pedido.estado === 'procesando' ? 'selected' : ''}>🔄 Procesando</option>
                                    <option value="completado" ${pedido.estado === 'completado' ? 'selected' : ''}>✅ Completado</option>
                                    <option value="cancelado" ${pedido.estado === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
                                </select>
                                ${mostrarBotonCancelar ? `<button class="btn-cancelar-pedido" data-id="${pedidoId}" style="background: #ef4444; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer;">🗑️ Cancelar Pedido</button>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                        <h4 style="color: white; margin-bottom: 10px;">📦 Productos:</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                                    <th style="text-align: left; padding: 8px; color: #ff9000;">Producto</th>
                                    <th style="text-align: left; padding: 8px; color: #ff9000;">Precio</th>
                                    <th style="text-align: left; padding: 8px; color: #ff9000;">Cantidad</th>
                                    <th style="text-align: left; padding: 8px; color: #ff9000;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pedido.productos.map(p => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                        <td style="padding: 8px; color: white;">${p.nombre}</td>
                                        <td style="padding: 8px; color: white;">Bs.${p.precio}</td>
                                        <td style="padding: 8px; color: white;">${p.cantidad}</td>
                                        <td style="padding: 8px; color: white;">Bs.${p.subtotal}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        // Eventos para los selects de estado
        document.querySelectorAll('.select-estado').forEach(select => {
            select.addEventListener('change', async (e) => {
                const pedidoId = e.target.getAttribute('data-id');
                const nuevoEstado = e.target.value;
                await actualizarEstadoPedido(pedidoId, nuevoEstado);
            });
        });
        
        // Eventos para los botones de cancelar pedido
        document.querySelectorAll('.btn-cancelar-pedido').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const pedidoId = btn.getAttribute('data-id');
                await eliminarPedidoDefinitivamente(pedidoId);
            });
        });
        
    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        contenedor.innerHTML = `<div class="error">❌ Error al cargar pedidos: ${error.message}</div>`;
    }
}

// ========================
// ELIMINAR PEDIDO
// ========================
async function eliminarPedidoDefinitivamente(pedidoId) {
    // confirmar eliminacion
    const confirmar = confirm(`⚠️ ¿Estás seguro de que deseas CANCELAR y ELIMINAR este pedido?\n\nEsta acción es irreversible y el pedido se borrará permanentemente de la base de datos.\n\n¿Continuar?`)
    
    if (!confirmar) return;

    try {
        const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js")
    
        // Eliminar de firebase
        const  pedidoRef = doc(db, "pedidos", pedidoId);
        await deleteDoc(pedidoRef);

        mostrarNotificacion(`✅ Pedido #${pedidoId.slice(0,8)} ha sido cancelado y eliminado permanentemente`, "success");

        // Recargar la lista de pedidos
        cargarPedidos();
    } catch (error) {
        console.error("Error al eliminar pedido:", error);
        mostrarNotificacion("❌ Error al eliminar el pedido: " + error.message, "error");
    }
};

async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
    try {
        const pedidoRef = doc(db, "pedidos", pedidoId);
        await updateDoc(pedidoRef, {
            estado: nuevoEstado,
            fechaActualizacion: new Date()
        });
        mostrarNotificacion(`✅ Pedido actualizado a: ${nuevoEstado}`, "success");
        cargarPedidos();
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        mostrarNotificacion("❌ Error al actualizar estado", "error");
    }
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

function configurarFiltros() {
    const btnPendientes = document.getElementById('btnFiltrarPendientes');
    const btnTodos = document.getElementById('btnFiltrarTodos');
    const btnCompletados = document.getElementById('btnFiltrarCompletados');
    
    if (btnPendientes) btnPendientes.addEventListener('click', () => { filtroActual = "pendiente"; cargarPedidos(); });
    if (btnTodos) btnTodos.addEventListener('click', () => { filtroActual = "todos"; cargarPedidos(); });
    if (btnCompletados) btnCompletados.addEventListener('click', () => { filtroActual = "completado"; cargarPedidos(); });
}

function actualizarBotonAdmin() {
    const authContainer = document.getElementById('admin-auth-container');
    if (!authContainer) return;
    
    const adminLogueado = localStorage.getItem('adminLogueado');
    const adminNombre = localStorage.getItem('adminNombre');
    
    if (adminLogueado === 'true') {
        authContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: #ff9000;">👑 ${adminNombre || 'Admin'}</span>
                <a href="#" id="cerrar-sesion-admin-btn" style="background: #dc2626; padding: 8px 18px; border-radius: 40px; color: white; text-decoration: none;">Cerrar Sesión</a>
            </div>
        `;
        
        const cerrarBtn = document.getElementById('cerrar-sesion-admin-btn');
        if (cerrarBtn) {
            cerrarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('adminLogueado');
                localStorage.removeItem('adminNombre');
                localStorage.removeItem('adminEmail');
                localStorage.removeItem('adminUID');
                localStorage.removeItem('adminRol');
                mostrarNotificacion("👑 Sesión de administrador cerrada", "success");
                setTimeout(() => {
                    window.location.href = '/admin-ini-regist/admin-logn.html';
                }, 1000);
            });
        }
    } else {
        authContainer.innerHTML = `<a href="/admin-ini-regist/admin-logn.html" style="background: #dc2626; padding: 8px 20px; border-radius: 25px; color: white; text-decoration: none;">👑 Admin</a>`;
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    actualizarBotonAdmin();
    configurarFiltros();
    cargarPedidos();
    console.log("✅ pedidos.js inicializado");
});