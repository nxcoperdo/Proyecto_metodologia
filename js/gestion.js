const acceso = sessionStorage.getItem('accesoFET');

if (acceso !== 'si') {
  window.location.href = 'pagina-login.html';
}

const btnSalir = document.getElementById('btnSalir');
if (btnSalir) {
  btnSalir.addEventListener('click', function () {
    sessionStorage.removeItem('accesoFET');
  });
}

const STORAGE_KEY = 'inventarioFET';

const tablaBody = document.querySelector('.tabla-inventario tbody');
const formulario = document.querySelector('.formulario-elemento');
const inputElemento = document.getElementById('elemento');
const inputCategoria = document.getElementById('categoria');
const inputTotal = document.getElementById('total');
const inputPrestados = document.getElementById('prestados');
const inputEstado = document.getElementById('estado');
const btnGuardar = document.querySelector('.btn-principal');

const botonesSecundarios = document.querySelectorAll('.btn-secundario');
const btnPrestamo = botonesSecundarios[0];
const btnDevolucion = botonesSecundarios[1];

const formBusqueda = document.querySelector('.buscador');
const inputBusqueda = document.getElementById('busqueda');
const btnBuscar = formBusqueda ? formBusqueda.querySelector('button') : null;

const resumenNumeros = document.querySelectorAll('.resumen-numero');

let inventario = cargarInventario();
let inventarioFiltrado = inventario.slice();

renderTabla(inventarioFiltrado);
actualizarResumen();

if (btnGuardar) {
  btnGuardar.addEventListener('click', registrarElemento);
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

if (btnBuscar) {
  btnBuscar.addEventListener('click', aplicarBusqueda);
}

if (formBusqueda) {
  formBusqueda.addEventListener('submit', function (evento) {
    evento.preventDefault();
    aplicarBusqueda();
  });
}

if (inputBusqueda) {
  inputBusqueda.addEventListener('input', function () {
    if (inputBusqueda.value.trim() === '') {
      inventarioFiltrado = inventario.slice();
      renderTabla(inventarioFiltrado);
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

    if (accion === 'eliminar') {
      eliminarElemento(id);
    }

    if (accion === 'editar') {
      editarElemento(id);
    }
  });
}

function cargarInventario() {
  const guardado = localStorage.getItem(STORAGE_KEY);

  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const filas = document.querySelectorAll('.tabla-inventario tbody tr');
  const inicial = [];

  filas.forEach(function (fila) {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length < 8) {
      return;
    }

    const id = celdas[0].textContent.trim();
    const elemento = celdas[1].textContent.trim();
    const categoria = celdas[2].textContent.trim();
    const total = Number(celdas[3].textContent.trim());
    const prestados = Number(celdas[4].textContent.trim());
    const disponibles = Number(celdas[5].textContent.trim());
    const estado = celdas[6].textContent.trim();

    inicial.push({
      id: id,
      elemento: elemento,
      categoria: categoria,
      total: total,
      prestados: prestados,
      disponibles: disponibles,
      estado: estado
    });
  });

  guardarInventario(inicial);
  return inicial;
}

function guardarInventario(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function renderTabla(data) {
  if (!tablaBody) {
    return;
  }

  tablaBody.innerHTML = '';

  data.forEach(function (item) {
    const estadoClass = item.disponibles <= 5 ? 'bajo' : 'bueno';
    const estadoTexto = item.disponibles <= 5 ? 'Pocas unidades' : 'Disponible';

    const fila = document.createElement('tr');
    fila.innerHTML =
      '<td>' + item.id + '</td>' +
      '<td>' + item.elemento + '</td>' +
      '<td>' + item.categoria + '</td>' +
      '<td>' + item.total + '</td>' +
      '<td>' + item.prestados + '</td>' +
      '<td>' + item.disponibles + '</td>' +
      '<td><span class="estado ' + estadoClass + '">' + estadoTexto + '</span></td>' +
      '<td>' +
      '<button type="button" class="btn-editar" data-action="editar" data-id="' + item.id + '">Editar</button>' +
      '<button type="button" class="btn-eliminar" data-action="eliminar" data-id="' + item.id + '">Eliminar</button>' +
      '</td>';

    tablaBody.appendChild(fila);
  });
}

function registrarElemento() {
  const elemento = inputElemento ? inputElemento.value.trim() : '';
  const categoria = inputCategoria ? inputCategoria.value.trim() : '';
  const total = Number(inputTotal ? inputTotal.value : 0);
  const prestados = Number(inputPrestados && inputPrestados.value ? inputPrestados.value : 0);

  if (!elemento || !categoria || !total) {
    alert('Completa nombre, categoría y cantidad total.');
    return;
  }

  if (total < 1 || prestados < 0 || prestados > total) {
    alert('Revisa cantidades: total >= 1 y prestados entre 0 y total.');
    return;
  }

  const nuevo = {
    id: generarNuevoId(),
    elemento: elemento,
    categoria: categoria,
    total: total,
    prestados: prestados,
    disponibles: total - prestados,
    estado: inputEstado && inputEstado.value.trim() ? inputEstado.value.trim() : 'Disponible'
  };

  inventario.push(nuevo);
  guardarInventario(inventario);

  inventarioFiltrado = inventario.slice();
  renderTabla(inventarioFiltrado);
  actualizarResumen();

  if (formulario) {
    formulario.reset();
  }

  alert('Elemento registrado correctamente.');
}

function registrarMovimiento(tipo) {
  const idIngresado = prompt('Ingresa el ID del elemento (ejemplo: 001):');
  if (!idIngresado) {
    return;
  }

  const id = idIngresado.trim();
  const item = inventario.find(function (el) {
    return el.id === id;
  });

  if (!item) {
    alert('No existe ese ID.');
    return;
  }

  const cantidad = Number(prompt('Cantidad:'));
  if (!cantidad || cantidad < 1) {
    alert('Cantidad inválida.');
    return;
  }

  if (tipo === 'prestamo') {
    if (cantidad > item.disponibles) {
      alert('No hay suficientes unidades disponibles.');
      return;
    }
    item.prestados = item.prestados + cantidad;
    item.disponibles = item.disponibles - cantidad;
  }

  if (tipo === 'devolucion') {
    if (cantidad > item.prestados) {
      alert('No puedes devolver más de lo prestado.');
      return;
    }
    item.prestados = item.prestados - cantidad;
    item.disponibles = item.disponibles + cantidad;
  }

  guardarInventario(inventario);
  aplicarBusqueda();
  actualizarResumen();

  alert('Movimiento registrado correctamente.');
}

function aplicarBusqueda() {
  const texto = inputBusqueda ? inputBusqueda.value.trim().toLowerCase() : '';

  if (!texto) {
    inventarioFiltrado = inventario.slice();
  } else {
    inventarioFiltrado = inventario.filter(function (item) {
      return (
        item.id.toLowerCase().indexOf(texto) !== -1 ||
        item.elemento.toLowerCase().indexOf(texto) !== -1 ||
        item.categoria.toLowerCase().indexOf(texto) !== -1 ||
        String(item.total).indexOf(texto) !== -1 ||
        String(item.prestados).indexOf(texto) !== -1 ||
        String(item.disponibles).indexOf(texto) !== -1
      );
    });
  }

  renderTabla(inventarioFiltrado);
}

function eliminarElemento(id) {
  const confirmar = confirm('¿Seguro que quieres eliminar el elemento con ID ' + id + '?');
  if (!confirmar) {
    return;
  }

  inventario = inventario.filter(function (item) {
    return item.id !== id;
  });

  guardarInventario(inventario);
  aplicarBusqueda();
  actualizarResumen();
}

function editarElemento(id) {
  const item = inventario.find(function (el) {
    return el.id === id;
  });

  if (!item) {
    return;
  }

  const nuevoNombre = prompt('Nuevo nombre del elemento:', item.elemento);
  if (!nuevoNombre) {
    return;
  }

  const nuevaCategoria = prompt('Nueva categoría:', item.categoria);
  if (!nuevaCategoria) {
    return;
  }

  const nuevoTotal = Number(prompt('Nueva cantidad total:', String(item.total)));
  if (!nuevoTotal || nuevoTotal < item.prestados) {
    alert('Total inválido. Debe ser mayor o igual a prestados.');
    return;
  }

  item.elemento = nuevoNombre.trim();
  item.categoria = nuevaCategoria.trim();
  item.total = nuevoTotal;
  item.disponibles = item.total - item.prestados;

  guardarInventario(inventario);
  aplicarBusqueda();
  actualizarResumen();
}

function actualizarResumen() {
  if (resumenNumeros.length < 3) {
    return;
  }

  const totalElementos = inventario.length;
  const prestamosActivos = inventario.reduce(function (acumulado, item) {
    return acumulado + item.prestados;
  }, 0);

  const categorias = new Set(
    inventario.map(function (item) {
      return item.categoria.toLowerCase();
    })
  );

  resumenNumeros[0].textContent = String(totalElementos).padStart(2, '0');
  resumenNumeros[1].textContent = String(prestamosActivos).padStart(2, '0');
  resumenNumeros[2].textContent = String(categorias.size).padStart(2, '0');
}

function generarNuevoId() {
  let maximo = 0;

  inventario.forEach(function (item) {
    const numero = Number(item.id);
    if (numero > maximo) {
      maximo = numero;
    }
  });

  const siguiente = maximo + 1;
  return String(siguiente).padStart(3, '0');
}

