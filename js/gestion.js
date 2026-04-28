const acceso = sessionStorage.getItem('accesoFET');
const usuarioSesion = sessionStorage.getItem('usuarioFET');
const API_BASE = 'http://localhost:3000/api';

if (acceso !== 'si') {
  window.location.href = 'pagina-login.html';
}

const btnSalir = document.getElementById('btnSalir');
const usuarioInfo = document.getElementById('usuarioInfo');
const tablaBody = document.getElementById('tbodyInventario');
const formulario = document.querySelector('.formulario-elemento');
const btnVerCategorias = document.getElementById('btnVerCategorias');
const btnRegistrarCategoria = document.getElementById('btnRegistrarCategoria');
const btnVerUbicaciones = document.getElementById('btnVerUbicaciones');
const btnRegistrarUbicacion = document.getElementById('btnRegistrarUbicacion');
const formProducto = document.getElementById('formProducto');
const inputNumeroItem = document.getElementById('numeroItem');
const inputElemento = document.getElementById('elemento');
const inputStockMinimo = document.getElementById('stockMinimo');
const inputMarca = document.getElementById('marca');
const inputModelo = document.getElementById('modelo');
const inputCategoria = document.getElementById('categoria');
const inputUbicacion = document.getElementById('ubicacion');
const inputTotal = document.getElementById('total');
const btnGuardar = document.getElementById('btnGuardarProducto');
const btnPrestamo = document.getElementById('btnPrestamo');
const btnDevolucion = document.getElementById('btnDevolucion');
const formBusqueda = document.querySelector('.buscador');
const inputBusqueda = document.getElementById('busqueda');
const resumenNumeros = document.querySelectorAll('.resumen-numero');

let inventario = [];
let categorias = [];
let ubicaciones = [];

const dialogo = crearSistemaDialogos();

function escaparAtributo(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

iniciar();

async function iniciar() {
  pintarUsuario();
  await cargarCategorias();
  await cargarUbicaciones();
  await cargarInventario();
}

function pintarUsuario() {
  if (!usuarioInfo) {
    return;
  }

  if (!usuarioSesion) {
    usuarioInfo.textContent = 'Usuario';
    return;
  }

  try {
    const user = JSON.parse(usuarioSesion);
    usuarioInfo.textContent = user.nombre + ' ' + user.apellido + ' (' + user.rol + ')';
  } catch (error) {
    usuarioInfo.textContent = 'Usuario';
  }
}

if (btnSalir) {
  btnSalir.addEventListener('click', function () {
    sessionStorage.removeItem('accesoFET');
    sessionStorage.removeItem('usuarioFET');
  });
}


if (formProducto) {
  formProducto.addEventListener('submit', function (evento) {
    evento.preventDefault();
    registrarElemento();
  });
}

if (btnVerCategorias) {
  btnVerCategorias.addEventListener('click', mostrarCategorias);
}

if (btnRegistrarCategoria) {
  btnRegistrarCategoria.addEventListener('click', registrarCategoria);
}

if (btnVerUbicaciones) {
  btnVerUbicaciones.addEventListener('click', mostrarUbicaciones);
}

if (btnRegistrarUbicacion) {
  btnRegistrarUbicacion.addEventListener('click', registrarUbicacion);
}

if (btnPrestamo) {
  btnPrestamo.addEventListener('click', function () {
    registrarMovimiento('prestamo');
  });
}

if (btnDevolucion) {
  btnDevolucion.addEventListener('click', function () {
    registrarMovimiento('devolucion');
  });
}

if (formBusqueda) {
  formBusqueda.addEventListener('submit', function (evento) {
    evento.preventDefault();
    buscarInventario();
  });
}

const btnBuscar = document.getElementById('btnBuscar');
if (btnBuscar) {
  btnBuscar.addEventListener('click', buscarInventario);
}

if (inputBusqueda) {
  inputBusqueda.addEventListener('input', function () {
    if (inputBusqueda.value.trim() === '') {
      renderTabla(inventario);
      actualizarResumen(inventario);
    }
  });
}

if (tablaBody) {
  tablaBody.addEventListener('click', function (evento) {
    const boton = evento.target.closest('button');
    if (!boton) {
      return;
    }

    const accion = boton.getAttribute('data-action');
    const id = boton.getAttribute('data-id');

    if (accion === 'editar') {
      editarElemento(id);
    }

    if (accion === 'eliminar') {
      eliminarElemento(id);
    }
  });
}

document.body.addEventListener('click', function (evento) {
  const boton = evento.target.closest('button');
  if (!boton) {
    return;
  }

  const accion = boton.getAttribute('data-action');
  const id = boton.getAttribute('data-id');

  if (accion === 'editar-categoria') {
    editarCategoria(id);
  }

  if (accion === 'eliminar-categoria') {
    eliminarCategoria(id);
  }
  
  if (accion === 'editar-ubicacion') {
    editarUbicacion(id);
  }

  if (accion === 'eliminar-ubicacion') {
    eliminarUbicacion(id);
  }
});

async function cargarInventario() {
  try {
    const respuesta = await fetch(API_BASE + '/inventario');
    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || 'No se pudo cargar inventario');
    }

    inventario = data;
    renderTabla(inventario);
    actualizarResumen(inventario);
  } catch (error) {
    if (tablaBody) {
        tablaBody.innerHTML = '<tr><td colspan="12">Error cargando inventario desde API.</td></tr>';
    }
    await dialogo.alerta('Error de conexion', 'No se pudo conectar con el backend: ' + error.message, 'error');
  }
}

async function cargarCategorias() {
  try {
    const respuesta = await fetch(API_BASE + '/categorias');
    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || 'No se pudieron cargar categorias');
    }

    categorias = data;
  } catch (error) {
    await dialogo.alerta('Error de categorias', 'No se pudieron cargar las categorias: ' + error.message, 'error');
  }
}

async function mostrarCategorias() {
  if (!categorias.length) {
    await cargarCategorias();
  }

  const filas = categorias.length
    ? categorias
        .map(function (categoria) {
          return (
            '<tr>' +
            '<td>' + categoria.id_categoria + '</td>' +
            '<td>' + escaparAtributo(categoria.nombre) + '</td>' +
            '<td>' + escaparAtributo(categoria.descripcion || 'Sin descripcion') + '</td>' +
            '<td>' +
            '<button type="button" class="btn-editar" data-action="editar-categoria" data-id="' + categoria.id_categoria + '">Editar</button>' +
            '<button type="button" class="btn-eliminar" data-action="eliminar-categoria" data-id="' + categoria.id_categoria + '">Eliminar</button>' +
            '</td>' +
            '</tr>'
          );
        })
        .join('')
    : '<tr><td colspan="4">No hay categorias registradas.</td></tr>';

  await dialogo.html(
    'Categorias registradas',
    '<div class="modal-tabla-wrapper"><table class="tabla-modal-categorias"><thead><tr><th>ID Categoria</th><th>Nombre</th><th>Descripcion</th><th>Acciones</th></tr></thead><tbody>' +
      filas +
      '</tbody></table></div>',
    'aviso',
    [{ texto: 'Cerrar', valor: true, clase: 'modal-btn-principal' }],
    'modal-categorias-vista'
  );
}

async function editarCategoria(id) {
  const actual = categorias.find(function (categoria) {
    return String(categoria.id_categoria) === String(id);
  });

  if (!actual) {
    await dialogo.alerta('No encontrada', 'No se encontro la categoria seleccionada.', 'aviso');
    return;
  }

  const datos = await dialogo.formulario('Editar categoria', [
    { name: 'nombre', label: 'Nombre de la categoria', type: 'text', value: actual.nombre, required: true },
    { name: 'descripcion', label: 'Descripcion', type: 'text', value: actual.descripcion || '', required: false }
  ]);

  if (!datos) {
    return;
  }

  const nombre = String(datos.nombre || '').trim();
  const descripcion = String(datos.descripcion || '').trim();

  if (!nombre) {
    await dialogo.alerta('Campo requerido', 'El nombre de la categoria es obligatorio.', 'aviso');
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/categorias/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre: nombre, descripcion: descripcion })
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo editar categoria');
    }

    await cargarCategorias();
    await dialogo.alerta('Categoria actualizada', 'La categoria se actualizo correctamente.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error al editar categoria', error.message, 'error');
  }
}

async function eliminarCategoria(id) {
  const confirmar = await dialogo.confirmacion('Eliminar categoria', 'Si eliminas esta categoria, no debe tener productos asociados. Deseas continuar?');
  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/categorias/' + id, {
      method: 'DELETE'
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo eliminar categoria');
    }

    await cargarCategorias();
    await dialogo.alerta('Categoria eliminada', 'La categoria se elimino correctamente.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error al eliminar categoria', error.message, 'error');
  }
}

// ---------- Ubicaciones (bodegas) - frontend handlers ----------
async function cargarUbicaciones() {
  try {
    const respuesta = await fetch(API_BASE + '/ubicaciones');
    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || 'No se pudieron cargar ubicaciones');
    }

    ubicaciones = data;
  } catch (error) {
    await dialogo.alerta('Error de ubicaciones', 'No se pudieron cargar las ubicaciones: ' + error.message, 'error');
  }
}

async function mostrarUbicaciones() {
  if (!ubicaciones.length) {
    await cargarUbicaciones();
  }

  const filas = ubicaciones.length
    ? ubicaciones
        .map(function (u) {
          return (
            '<tr>' +
            '<td>' + u.id_ubicacion + '</td>' +
            '<td>' + escaparAtributo(u.nombre) + '</td>' +
            '<td>' + escaparAtributo(u.descripcion || 'Sin descripcion') + '</td>' +
            '<td>' +
            '<button type="button" class="btn-editar" data-action="editar-ubicacion" data-id="' + u.id_ubicacion + '">Editar</button>' +
            '<button type="button" class="btn-eliminar" data-action="eliminar-ubicacion" data-id="' + u.id_ubicacion + '">Eliminar</button>' +
            '</td>' +
            '</tr>'
          );
        })
        .join('')
    : '<tr><td colspan="4">No hay ubicaciones registradas.</td></tr>';

  await dialogo.html(
    'Ubicaciones registradas',
    '<div class="modal-tabla-wrapper"><table class="tabla-modal-categorias"><thead><tr><th>ID Ubicacion</th><th>Nombre</th><th>Descripcion</th><th>Acciones</th></tr></thead><tbody>' +
      filas +
      '</tbody></table></div>',
    'aviso',
    [{ texto: 'Cerrar', valor: true, clase: 'modal-btn-principal' }],
    'modal-categorias-vista'
  );
}

async function editarUbicacion(id) {
  const actual = ubicaciones.find(function (u) {
    return String(u.id_ubicacion) === String(id);
  });

  if (!actual) {
    await dialogo.alerta('No encontrada', 'No se encontro la ubicacion seleccionada.', 'aviso');
    return;
  }

  const datos = await dialogo.formulario('Editar ubicacion', [
    { name: 'nombre', label: 'Nombre de la ubicacion', type: 'text', value: actual.nombre, required: true },
    { name: 'descripcion', label: 'Descripcion', type: 'text', value: actual.descripcion || '', required: false }
  ]);

  if (!datos) {
    return;
  }

  const nombre = String(datos.nombre || '').trim();
  const descripcion = String(datos.descripcion || '').trim();

  if (!nombre) {
    await dialogo.alerta('Campo requerido', 'El nombre de la ubicacion es obligatorio.', 'aviso');
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/ubicaciones/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre, descripcion: descripcion })
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo editar ubicacion');
    }

    await cargarUbicaciones();
    await dialogo.alerta('Ubicacion actualizada', 'La ubicacion se actualizo correctamente.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error al editar ubicacion', error.message, 'error');
  }
}

async function eliminarUbicacion(id) {
  const confirmar = await dialogo.confirmacion('Eliminar ubicacion', 'Si eliminas esta ubicacion, no debe tener productos asociados. Deseas continuar?');
  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/ubicaciones/' + id, { method: 'DELETE' });
    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo eliminar ubicacion');
    }

    await cargarUbicaciones();
    await dialogo.alerta('Ubicacion eliminada', 'La ubicacion se elimino correctamente.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error al eliminar ubicacion', error.message, 'error');
  }
}

async function registrarUbicacion() {
  const datos = await dialogo.formulario('Registrar ubicacion', [
    { name: 'nombre', label: 'Nombre de la ubicacion', type: 'text', placeholder: 'Ejemplo: Bodega central', required: true },
    { name: 'descripcion', label: 'Descripcion', type: 'text', placeholder: 'Detalle de la ubicacion', required: false }
  ]);

  if (!datos) {
    return;
  }

  const nombre = String(datos.nombre || '').trim();
  const descripcion = String(datos.descripcion || '').trim();

  if (!nombre) {
    await dialogo.alerta('Campo requerido', 'Escribe el nombre de la ubicacion.', 'aviso');
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/ubicaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre, descripcion: descripcion })
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo registrar ubicacion');
    }

    await cargarUbicaciones();
    await dialogo.alerta('Ubicacion registrada', 'La ubicacion se guardo correctamente.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error al registrar ubicacion', error.message, 'error');
  }
}

function renderTabla(data) {
  if (!tablaBody) {
    return;
  }

  if (!data.length) {
    tablaBody.innerHTML = '<tr><td colspan="12">No hay elementos para mostrar.</td></tr>';
    return;
  }

  tablaBody.innerHTML = '';

  data.forEach(function (item) {
    const estadoClass = item.estado === 'Pocas unidades' ? 'bajo' : 'bueno';

    const fila = document.createElement('tr');
    fila.innerHTML =
      '<td>' + item.id_producto + '</td>' +
      '<td>' + (item.nombre || 'Sin nombre') + '</td>' +
      '<td>' + (item.marca || 'Sin marca') + '</td>' +
      '<td>' + item.stock_total + '</td>' +
      '<td>' + item.stock_minimo + '</td>' +
      '<td>' + item.id_categoria + '</td>' +
      '<td>' + (item.categoria || 'Sin categoría') + '</td>' +
      '<td>' + item.id_ubicacion + '</td>' +
      '<td>' + item.prestamos_activos + '</td>' +
      '<td>' + item.disponibles + '</td>' +
      '<td><span class="estado ' + estadoClass + '">' + item.estado + '</span></td>' +
      '<td>' +
      '<button type="button" class="btn-editar" data-action="editar" data-id="' + item.id_producto + '" title="Editar" aria-label="Editar producto ' + item.id_producto + '">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
      '</button>' +
      '<button type="button" class="btn-eliminar" data-action="eliminar" data-id="' + item.id_producto + '" title="Eliminar" aria-label="Eliminar producto ' + item.id_producto + '">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>' +
      '</button>' +
      '</td>';

    tablaBody.appendChild(fila);
  });
}

async function registrarElemento() {
  const numeroItem = Number(inputNumeroItem ? inputNumeroItem.value : 0);
  const nombre = inputElemento ? inputElemento.value.trim() : '';
  const stockTotal = Number(inputTotal ? inputTotal.value : 0);
  const stockMinimo = Number(inputStockMinimo ? inputStockMinimo.value : 0);
  const marca = inputMarca ? inputMarca.value.trim() : '';
  const modelo = inputModelo ? inputModelo.value.trim() : '';
  const idCategoria = Number(inputCategoria ? inputCategoria.value : 0);
  const idUbicacion = Number(inputUbicacion ? inputUbicacion.value : 0);

  if (!numeroItem || !nombre || stockTotal < 1 || stockMinimo < 0 || !marca || !modelo || !idCategoria || !idUbicacion) {
    await dialogo.alerta('Campos requeridos', 'Completa todos los campos del producto antes de guardar.', 'aviso');
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/inventario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        numero_item: numeroItem,
        nombre: nombre,
        stock_total: stockTotal,
        stock_minimo: stockMinimo,
        marca: marca,
        modelo: modelo,
        id_categoria: idCategoria,
        id_ubicacion: idUbicacion
      })
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo registrar');
    }

    if (formulario) {
      formulario.reset();
    }

    await cargarInventario();
    await dialogo.alerta('Registro exitoso', 'Elemento registrado correctamente.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error al registrar', error.message, 'error');
  }
}

async function registrarCategoria() {
  const datos = await dialogo.formulario('Registrar categoria', [
    { name: 'nombre', label: 'Nombre de la categoria', type: 'text', placeholder: 'Ejemplo: Balones', required: true },
    { name: 'descripcion', label: 'Descripcion', type: 'text', placeholder: 'Describe la categoria', required: false }
  ]);

  if (!datos) {
    return;
  }

  const nombre = String(datos.nombre || '').trim();
  const descripcion = String(datos.descripcion || '').trim();

  if (!nombre) {
    await dialogo.alerta('Campo requerido', 'Escribe el nombre de la categoria.', 'aviso');
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/categorias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre: nombre, descripcion: descripcion })
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo registrar categoria');
    }

    await cargarCategorias();
    await dialogo.alerta('Categoria registrada', 'La categoria se guardo correctamente.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error al registrar categoria', error.message, 'error');
  }
}

async function registrarMovimiento(tipo) {
  const titulo = tipo === 'prestamo' ? 'Registrar prestamo' : 'Registrar devolucion';
  const datos = await dialogo.formulario(titulo, [
    { name: 'id_producto', label: 'ID del producto', type: 'number', placeholder: 'Ejemplo: 1', required: true },
    { name: 'cantidad', label: 'Cantidad', type: 'number', placeholder: 'Ejemplo: 2', required: true, min: 1 },
    { name: 'responsable', label: 'Responsable', type: 'text', placeholder: 'Tu nombre', required: true }
  ]);

  if (!datos) {
    return;
  }

  const idProducto = Number(datos.id_producto);
  const cantidad = Number(datos.cantidad);
  const responsable = String(datos.responsable || '').trim();

  if (!idProducto || cantidad < 1 || !responsable) {
    await dialogo.alerta('Datos invalidos', 'Revisa ID, cantidad y responsable.', 'aviso');
    return;
  }

  const ruta = tipo === 'prestamo' ? '/prestamos' : '/devoluciones';

  try {
    const respuesta = await fetch(API_BASE + ruta, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id_producto: idProducto, cantidad: cantidad, responsable: responsable })
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo guardar el movimiento');
    }

    await cargarInventario();
    await dialogo.alerta('Operacion exitosa', data.mensaje || 'Movimiento registrado.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error en movimiento', error.message, 'error');
  }
}

async function buscarInventario() {
  const texto = inputBusqueda ? inputBusqueda.value.trim() : '';

  if (!texto) {
    renderTabla(inventario);
    actualizarResumen(inventario);
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/inventario/buscar?q=' + encodeURIComponent(texto));
    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || 'No se pudo buscar');
    }

    renderTabla(data);
    actualizarResumen(data);
  } catch (error) {
    await dialogo.alerta('Error en busqueda', error.message, 'error');
  }
}

async function editarElemento(id) {
  const actual = inventario.find(function (item) {
    return String(item.id_producto) === String(id);
  });

  if (!actual) {
    await dialogo.alerta('No encontrado', 'No se encontro el elemento seleccionado.', 'aviso');
    return;
  }

  const datos = await dialogo.formulario('Editar elemento', [
    { name: 'numero_item', label: 'Número de item', type: 'number', value: String(actual.numero_item), required: true, min: 1 },
    { name: 'nombre', label: 'Nombre', type: 'text', value: actual.nombre, required: true },
    { name: 'stock_total', label: 'Stock total', type: 'number', value: String(actual.stock_total), required: true, min: 1 },
    { name: 'stock_minimo', label: 'Stock mínimo', type: 'number', value: String(actual.stock_minimo || 0), required: true, min: 0 },
    { name: 'marca', label: 'Marca', type: 'text', value: actual.marca || '', required: true },
    { name: 'modelo', label: 'Modelo', type: 'text', value: actual.modelo || '', required: true },
    { name: 'id_categoria', label: 'ID de categoría', type: 'number', value: String(actual.id_categoria || 0), required: true, min: 1 },
    { name: 'id_ubicacion', label: 'ID de ubicación', type: 'number', value: String(actual.id_ubicacion || 0), required: true, min: 1 }
  ]);

  if (!datos) {
    return;
  }

  const numeroItem = Number(datos.numero_item);
  const nuevoNombre = String(datos.nombre || '').trim();
  const nuevoTotal = Number(datos.stock_total);
  const nuevoStockMinimo = Number(datos.stock_minimo);
  const nuevaMarca = String(datos.marca || '').trim();
  const nuevoModelo = String(datos.modelo || '').trim();
  const nuevaCategoria = Number(datos.id_categoria);
  const nuevaUbicacion = Number(datos.id_ubicacion);

  if (!numeroItem || !nuevoNombre || nuevoTotal < 1 || nuevoStockMinimo < 0 || !nuevaMarca || !nuevoModelo || !nuevaCategoria || !nuevaUbicacion) {
    await dialogo.alerta('Datos invalidos', 'Todos los campos del producto son obligatorios.', 'aviso');
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/inventario/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        numero_item: numeroItem,
        nombre: nuevoNombre,
        stock_total: nuevoTotal,
        stock_minimo: nuevoStockMinimo,
        marca: nuevaMarca,
        modelo: nuevoModelo,
        id_categoria: nuevaCategoria,
        id_ubicacion: nuevaUbicacion
      })
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo editar');
    }

    await cargarInventario();
    await dialogo.alerta('Edicion exitosa', 'Elemento actualizado correctamente.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error al editar', error.message, 'error');
  }
}

async function eliminarElemento(id) {
  const confirmar = await dialogo.confirmacion('Eliminar producto', 'Esta accion borrara el producto y sus movimientos. Deseas continuar?');
  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(API_BASE + '/inventario/' + id, {
      method: 'DELETE'
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || 'No se pudo eliminar');
    }

    await cargarInventario();
    await dialogo.alerta('Eliminado', 'Producto eliminado correctamente.', 'exito');
  } catch (error) {
    await dialogo.alerta('Error al eliminar', error.message, 'error');
  }
}

function actualizarResumen(data) {
  if (resumenNumeros.length < 3) {
    return;
  }

  const totalElementos = data.length;
  const prestamosActivos = data.reduce(function (total, item) {
    return total + Number(item.prestamos_activos || 0);
  }, 0);

  const categorias = new Set(
    data.map(function (item) {
      return String(item.categoria || '').toLowerCase();
    })
  );

  resumenNumeros[0].textContent = String(totalElementos).padStart(2, '0');
  resumenNumeros[1].textContent = String(prestamosActivos).padStart(2, '0');
  resumenNumeros[2].textContent = String(categorias.size).padStart(2, '0');
}

function crearSistemaDialogos() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal-caja" role="dialog" aria-modal="true" aria-labelledby="modalTitulo">' +
    '<div class="modal-encabezado">' +
    '<h3 id="modalTitulo" class="modal-titulo"></h3>' +
    '<button type="button" class="modal-cerrar" aria-label="Cerrar">x</button>' +
    '</div>' +
    '<div class="modal-contenido"></div>' +
    '<div class="modal-acciones"></div>' +
    '</div>';

  document.body.appendChild(overlay);

  const caja = overlay.querySelector('.modal-caja');
  const titulo = overlay.querySelector('.modal-titulo');
  const contenido = overlay.querySelector('.modal-contenido');
  const acciones = overlay.querySelector('.modal-acciones');
  const cerrarBtn = overlay.querySelector('.modal-cerrar');

  function abrir(config) {
    overlay.classList.remove('cerrando');
    titulo.textContent = config.titulo || 'Mensaje';
    contenido.innerHTML = '';
    acciones.innerHTML = '';
    caja.classList.remove('modal-exito', 'modal-error', 'modal-aviso', 'modal-categorias-vista');

    if (config.tipo) {
      caja.classList.add('modal-' + config.tipo);
    }

    if (config.claseCaja) {
      caja.classList.add(config.claseCaja);
    }

    if (config.contenidoHTML) {
      contenido.innerHTML = config.contenidoHTML;
    } else {
      const p = document.createElement('p');
      p.textContent = config.mensaje || '';
      contenido.appendChild(p);
    }

    const botones = Array.isArray(config.botones) && config.botones.length > 0 ? config.botones : [{ texto: 'Aceptar', valor: true, clase: 'modal-btn-principal' }];

    botones.forEach(function (btn) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = btn.clase || 'modal-btn-principal';
      boton.textContent = btn.texto;
      boton.addEventListener('click', function () {
        cerrar(btn.valor);
      });
      acciones.appendChild(boton);
    });

    overlay.classList.add('activo');
    document.body.classList.add('modal-abierto');
    setTimeout(function () {
      const primerInput = contenido.querySelector('input, select, textarea');
      if (primerInput) {
        primerInput.focus();
      }
    }, 40);

    return new Promise(function (resolve) {
      overlay.dataset.resolve = 'si';
      overlay._resolver = resolve;
    });
  }

  function cerrar(valor) {
    if (!overlay.classList.contains('activo')) {
      return;
    }

    overlay.classList.add('cerrando');

    setTimeout(function () {
      overlay.classList.remove('activo');
      overlay.classList.remove('cerrando');
      document.body.classList.remove('modal-abierto');

      if (overlay.dataset.resolve === 'si' && typeof overlay._resolver === 'function') {
        const resolver = overlay._resolver;
        overlay.dataset.resolve = '';
        overlay._resolver = null;
        resolver(valor);
      }
    }, 180);
  }

  cerrarBtn.addEventListener('click', function () {
    cerrar(null);
  });

  overlay.addEventListener('click', function (evento) {
    if (evento.target === overlay) {
      cerrar(null);
    }
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && overlay.classList.contains('activo')) {
      cerrar(null);
    }
  });

  async function alerta(tituloTexto, mensajeTexto, tipo) {
    await abrir({
      titulo: tituloTexto,
      mensaje: mensajeTexto,
      tipo: tipo || 'aviso',
      botones: [{ texto: 'Aceptar', valor: true, clase: 'modal-btn-principal' }]
    });
  }

  async function confirmacion(tituloTexto, mensajeTexto) {
    const resultado = await abrir({
      titulo: tituloTexto,
      mensaje: mensajeTexto,
      tipo: 'aviso',
      botones: [
        { texto: 'Cancelar', valor: false, clase: 'modal-btn-secundario' },
        { texto: 'Continuar', valor: true, clase: 'modal-btn-principal' }
      ]
    });

    return resultado === true;
  }

  async function formulario(tituloTexto, campos) {
    let html = '<form class="modal-form" id="modalForm">';

    campos.forEach(function (campo) {
      const valor = campo.value ? escaparAtributo(campo.value) : '';
      const placeholder = campo.placeholder ? ' placeholder="' + escaparAtributo(campo.placeholder) + '"' : '';
      const min = typeof campo.min !== 'undefined' ? ' min="' + campo.min + '"' : '';
      const required = campo.required ? ' required' : '';
      const nombreCampo = escaparAtributo(campo.name || 'campo');
      const tipoCampo = escaparAtributo(campo.type || 'text');
      html +=
        '<label class="modal-label" for="modal_' + nombreCampo + '">' + campo.label + '</label>' +
        '<input class="modal-input" id="modal_' + nombreCampo + '" name="' + nombreCampo + '" type="' + tipoCampo + '" value="' + valor + '"' + placeholder + min + required + '>';
    });

    html += '</form>';

    const resultado = await abrir({
      titulo: tituloTexto,
      contenidoHTML: html,
      tipo: 'aviso',
      botones: [
        { texto: 'Cancelar', valor: null, clase: 'modal-btn-secundario' },
        { texto: 'Guardar', valor: 'submit', clase: 'modal-btn-principal' }
      ]
    });

    if (resultado !== 'submit') {
      return null;
    }

    const form = contenido.querySelector('#modalForm');
    if (!form || !form.reportValidity()) {
      return null;
    }

    const formData = new FormData(form);
    const salida = {};

    campos.forEach(function (campo) {
      salida[campo.name] = String(formData.get(campo.name) || '').trim();
    });

    return salida;
  }

  async function html(tituloTexto, contenidoHTML, tipo, botones, claseCaja) {
    await abrir({
      titulo: tituloTexto,
      contenidoHTML: contenidoHTML,
      tipo: tipo || 'aviso',
      botones: botones || [{ texto: 'Cerrar', valor: true, clase: 'modal-btn-principal' }],
      claseCaja: claseCaja || ''
    });
  }

  return {
    alerta: alerta,
    confirmacion: confirmacion,
    formulario: formulario,
    html: html
  };
}

