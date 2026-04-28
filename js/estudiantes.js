const acceso = sessionStorage.getItem('accesoFET');
const usuarioSesion = sessionStorage.getItem('usuarioFET');
const API_BASE = 'http://localhost:3000/api';

if (acceso !== 'si') {
  window.location.href = 'pagina-login.html';
}

function escaparAtributo(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
const tbodyHistorial = document.getElementById('tbodyHistorial');
const btnRefrescarHistorial = document.getElementById('btnRefrescarHistorial');

let inventario = [];
let categorias = [];
let inventarioFiltrado = [];
let intervalNotificaciones = null;

const DURACION_POLLING_MS = 15000;

const dialogo = crearSistemaDialogos();
iniciar();

async function iniciar() {
   pintarUsuario();
   configurarResponsablePorSesion();
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
   if (btnRefrescarHistorial) {
     btnRefrescarHistorial.addEventListener('click', cargarHistorial);
   }

   await cargarCategorias();
   await cargarInventario();
   await cargarHistorial();
   await revisarNotificacionesAprobacion();
   iniciarPollingNotificaciones();
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
  detenerPollingNotificaciones();
  sessionStorage.removeItem('accesoFET');
  sessionStorage.removeItem('usuarioFET');
}

function configurarResponsablePorSesion() {
  if (!inputResponsable || !usuarioSesion) {
    return;
  }

  try {
    const user = JSON.parse(usuarioSesion);
    const nombreCompleto = [user.nombre, user.apellido].filter(Boolean).join(' ').trim();
    if (nombreCompleto) {
      inputResponsable.value = nombreCompleto;
    }
  } catch (error) {
    // Si no se puede parsear usuario, se deja el campo para ingreso manual.
  }
}

function obtenerResponsableNotificacion() {
  const valorInput = String(inputResponsable ? inputResponsable.value : '').trim();
  if (valorInput) {
    return valorInput;
  }

  if (!usuarioSesion) {
    return '';
  }

  try {
    const user = JSON.parse(usuarioSesion);
    return [user.nombre, user.apellido].filter(Boolean).join(' ').trim();
  } catch (error) {
    return '';
  }
}

function obtenerClaveNotificaciones() {
  const responsable = obtenerResponsableNotificacion();
  return 'fet_notifs_aprobadas_' + (responsable || 'anonimo').toLowerCase();
}

function obtenerIdsNotificados() {
  try {
    const clave = obtenerClaveNotificaciones();
    const valor = localStorage.getItem(clave);
    const lista = valor ? JSON.parse(valor) : [];
    return Array.isArray(lista) ? lista.map(Number).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function guardarIdsNotificados(listaIds) {
  try {
    const clave = obtenerClaveNotificaciones();
    localStorage.setItem(clave, JSON.stringify(listaIds));
  } catch (error) {
    // Si localStorage no está disponible, simplemente no se persiste.
  }
}

function iniciarPollingNotificaciones() {
  detenerPollingNotificaciones();
  intervalNotificaciones = setInterval(function () {
    revisarNotificacionesAprobacion();
  }, DURACION_POLLING_MS);
}

function detenerPollingNotificaciones() {
  if (!intervalNotificaciones) {
    return;
  }

  clearInterval(intervalNotificaciones);
  intervalNotificaciones = null;
}

async function revisarNotificacionesAprobacion() {
   const responsable = obtenerResponsableNotificacion();
   if (!responsable) {
     return;
   }

   try {
     const respuesta = await fetch(API_BASE + '/solicitudes-estudiante?responsable=' + encodeURIComponent(responsable));
     const data = await respuesta.json();

     if (!respuesta.ok || !data.ok) {
       return;
     }

     const solicitudes = Array.isArray(data.solicitudes) ? data.solicitudes : [];
     const idsNotificados = obtenerIdsNotificados();
     const setNotificados = new Set(idsNotificados);

     const aprobadasNuevas = solicitudes.filter(function (item) {
       return String(item.tipo_salida || '').toLowerCase() === 'prestamo' && !setNotificados.has(Number(item.id_salida));
     });

     if (!aprobadasNuevas.length) {
       return;
     }

     const lineas = aprobadasNuevas.slice(0, 3).map(function (item) {
       return '- Solicitud #' + item.id_salida + ': ' + (item.producto || ('Producto ' + item.id_producto)) + ' x' + item.cantidad;
     }).join('\n');

     const mensajeBase = aprobadasNuevas.length === 1
       ? 'Tu solicitud fue aprobada:\n' + lineas
       : 'Tienes ' + aprobadasNuevas.length + ' solicitudes aprobadas:\n' + lineas;

     await dialogo.alerta('Solicitud aprobada', mensajeBase, 'exito');

     const nuevosIds = aprobadasNuevas.map(function (item) {
       return Number(item.id_salida);
     });
     const idsActualizados = Array.from(new Set(idsNotificados.concat(nuevosIds))).slice(-200);
     guardarIdsNotificados(idsActualizados);
     await cargarInventario();
     await cargarHistorial();
   } catch (error) {
     // Fallo silencioso para no interrumpir la experiencia del estudiante.
   }
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

async function cargarHistorial() {
   const responsable = obtenerResponsableNotificacion();
   if (!responsable) {
     if (tbodyHistorial) {
       tbodyHistorial.innerHTML = '<tr><td colspan="5">No hay datos disponibles.</td></tr>';
     }
     return;
   }

   try {
     const respuesta = await fetch(API_BASE + '/solicitudes-estudiante?responsable=' + encodeURIComponent(responsable));
     const data = await respuesta.json();

     if (!respuesta.ok || !data.ok) {
       throw new Error(data.mensaje || 'No se pudo cargar el historial');
     }

     const solicitudes = Array.isArray(data.solicitudes) ? data.solicitudes : [];
     renderHistorial(solicitudes);
   } catch (error) {
     if (tbodyHistorial) {
       tbodyHistorial.innerHTML = '<tr><td colspan="5">Error cargando historial: ' + error.message + '</td></tr>';
     }
   }
 }

function renderHistorial(datos) {
   if (!tbodyHistorial) return;

   if (!datos.length) {
     tbodyHistorial.innerHTML = '<tr><td colspan="5">No tienes préstamos o solicitudes registradas.</td></tr>';
     return;
   }

   tbodyHistorial.innerHTML = datos.map(function (item) {
     const tipo_salida = String(item.tipo_salida || 'Solicitud Pendiente').toLowerCase();
     const esPendiente = tipo_salida === 'solicitud pendiente';
     const estadoClass = esPendiente ? 'pendiente' : 'activo';
     const estadoTexto = esPendiente ? 'Pendiente por aprobar' : 'Activo';
     
     const fecha = item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
     
     return (
       '<tr>' +
       '<td>#' + (item.id_salida || '--') + '</td>' +
       '<td>' + (item.producto || 'Producto ' + item.id_producto || 'Desconocido') + '</td>' +
       '<td>' + (item.cantidad || 0) + '</td>' +
       '<td>' + fecha + '</td>' +
       '<td><span class="estado-historial ' + estadoClass + '">' + estadoTexto + '</span></td>' +
       '</tr>'
     );
   }).join('');
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
     await dialogo.alerta('Datos incompletos', 'Completa el ID del producto, la cantidad y tu nombre.', 'aviso');
     return;
   }

   const confirmar = await dialogo.confirmacion('Confirmar solicitud', '¿Deseas enviar esta solicitud de préstamo?');
   if (!confirmar) return;

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

     if (formSolicitud) {
       formSolicitud.reset();
       configurarResponsablePorSesion();
     }
     await cargarInventario();
     await cargarHistorial();
     await dialogo.alerta('Solicitud registrada', data.mensaje || 'Solicitud registrada correctamente. Espera aprobación del administrador.', 'exito');
     await revisarNotificacionesAprobacion();
   } catch (error) {
     await dialogo.alerta('Error', error.message, 'error');
   }
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

