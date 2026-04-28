const acceso = sessionStorage.getItem('accesoFET');
const usuarioSesion = sessionStorage.getItem('usuarioFET');
const API_BASE = 'http://localhost:3000/api';

if (acceso !== 'si') {
  window.location.href = 'pagina-login.html';
}

const usuarioInfo = document.getElementById('usuarioInfo');
const btnSalir = document.getElementById('btnSalir');
const tbodyInventario = document.getElementById('tbodyInventario');
const formBusqueda = document.getElementById('formBusqueda');
const inputBusqueda = document.getElementById('busqueda');
const filtroCategoria = document.getElementById('filtroCategoria');
const formSolicitud = document.getElementById('formSolicitud');
const inputIdProducto = document.getElementById('idProducto');
const inputCantidad = document.getElementById('cantidad');
const inputResponsable = document.getElementById('responsable');
const totalProductos = document.getElementById('totalProductos');
const totalPrestamos = document.getElementById('totalPrestamos');
const totalCategorias = document.getElementById('totalCategorias');

let inventario = [];
let categorias = [];
let inventarioFiltrado = [];

iniciar();

async function iniciar() {
  pintarUsuario();
  if (btnSalir) {
    btnSalir.addEventListener('click', salir);
  }
  if (formBusqueda) {
    formBusqueda.addEventListener('submit', function (evento) {
      evento.preventDefault();
      buscarInventario();
    });
  }
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', function () {
      if (!inputBusqueda.value.trim()) {
        aplicarFiltros();
      }
    });
  }
  if (filtroCategoria) {
    filtroCategoria.addEventListener('change', aplicarFiltros);
  }
  if (formSolicitud) {
    formSolicitud.addEventListener('submit', registrarSolicitud);
  }

  await cargarCategorias();
  await cargarInventario();
}

function pintarUsuario() {
  if (!usuarioInfo) return;
  if (!usuarioSesion) {
    usuarioInfo.textContent = '👤 Estudiante';
    return;
  }

  try {
    const user = JSON.parse(usuarioSesion);
    const nombreCompleto = [user.nombre, user.apellido].filter(Boolean).join(' ');
    usuarioInfo.textContent = nombreCompleto ? `${nombreCompleto} (${user.rol || 'estudiante'})` : '👤 Estudiante';
  } catch (error) {
    usuarioInfo.textContent = '👤 Estudiante';
  }
}

function salir() {
  sessionStorage.removeItem('accesoFET');
  sessionStorage.removeItem('usuarioFET');
}

async function cargarCategorias() {
  try {
    const respuesta = await fetch(API_BASE + '/categorias');
    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || 'No se pudieron cargar las categorías');
    }

    categorias = Array.isArray(data) ? data : [];
    pintarFiltroCategorias(categorias);
  } catch (error) {
    categorias = [];
    pintarFiltroCategorias([]);
  }
}

function pintarFiltroCategorias(lista) {
  if (!filtroCategoria) return;

  const actual = filtroCategoria.value;
  filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>';

  lista.forEach(function (categoria) {
    const option = document.createElement('option');
    option.value = String(categoria.id_categoria);
    option.textContent = categoria.nombre || `Categoría ${categoria.id_categoria}`;
    filtroCategoria.appendChild(option);
  });

  if (actual) {
    filtroCategoria.value = actual;
  }
}

async function cargarInventario() {
  try {
    const respuesta = await fetch(API_BASE + '/inventario');
    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || 'No se pudo cargar inventario');
    }

    inventario = Array.isArray(data) ? data : [];
    inventarioFiltrado = inventario.slice();
    aplicarFiltros();
    actualizarResumen(inventario);
  } catch (error) {
    if (tbodyInventario) {
      tbodyInventario.innerHTML = '<tr><td colspan="8">Error cargando inventario.</td></tr>';
    }
  }
}

function aplicarFiltros() {
  const texto = inputBusqueda ? inputBusqueda.value.trim().toLowerCase() : '';
  const idCategoria = filtroCategoria ? filtroCategoria.value : '';

  inventarioFiltrado = inventario.filter(function (item) {
    const coincideTexto = !texto || [item.nombre, item.marca, item.categoria, item.ubicacion, item.estado]
      .filter(Boolean)
      .some(function (valor) {
        return String(valor).toLowerCase().includes(texto);
      });

    const coincideCategoria = !idCategoria || String(item.id_categoria) === String(idCategoria);

    return coincideTexto && coincideCategoria;
  });

  renderTabla(inventarioFiltrado);
  actualizarResumen(inventarioFiltrado);
}

async function buscarInventario() {
  aplicarFiltros();
}

function renderTabla(data) {
  if (!tbodyInventario) return;

  if (!data.length) {
    tbodyInventario.innerHTML = '<tr><td colspan="8">No hay productos para mostrar.</td></tr>';
    return;
  }

  tbodyInventario.innerHTML = data.map(function (item) {
    const estadoClass = item.estado === 'Pocas unidades' ? 'bajo' : 'bueno';
    return (
      '<tr>' +
      '<td>' + (item.id_producto ?? '') + '</td>' +
      '<td>' + (item.nombre || 'Sin nombre') + '</td>' +
      '<td>' + (item.marca || 'Sin marca') + '</td>' +
      '<td>' + (item.categoria || 'Sin categoría') + '</td>' +
      '<td>' + (item.stock_total ?? 0) + '</td>' +
      '<td>' + (item.prestamos_activos ?? 0) + '</td>' +
      '<td>' + (item.disponibles ?? 0) + '</td>' +
      '<td><span class="estado ' + estadoClass + '">' + (item.estado || 'Disponible') + '</span></td>' +
      '</tr>'
    );
  }).join('');
}

function actualizarResumen(data) {
  const totalElementos = data.length;
  const prestamosActivos = data.reduce(function (total, item) {
    return total + Number(item.prestamos_activos || 0);
  }, 0);
  const categoriasUnicas = new Set(data.map(function (item) {
    return String(item.categoria || '').toLowerCase();
  })).size;

  if (totalProductos) totalProductos.textContent = String(totalElementos).padStart(2, '0');
  if (totalPrestamos) totalPrestamos.textContent = String(prestamosActivos).padStart(2, '0');
  if (totalCategorias) totalCategorias.textContent = String(categoriasUnicas).padStart(2, '0');
}

async function registrarSolicitud(evento) {
  evento.preventDefault();

  const idProducto = Number(inputIdProducto ? inputIdProducto.value : 0);
  const cantidad = Number(inputCantidad ? inputCantidad.value : 0);
  const responsable = String(inputResponsable ? inputResponsable.value : '').trim();

  if (!idProducto || cantidad < 1 || !responsable) {
    alert('Completa el ID del producto, la cantidad y tu nombre.');
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/prestamos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_producto: idProducto,
        cantidad: cantidad,
        responsable: responsable
      })
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo registrar el préstamo');
    }

    if (formSolicitud) formSolicitud.reset();
    await cargarInventario();
    alert('Solicitud registrada correctamente.');
  } catch (error) {
    alert(error.message);
  }
}

