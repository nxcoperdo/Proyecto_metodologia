const formularioLogin = document.getElementById('loginForm');
const mensajeLogin = document.getElementById('mensajeLogin');
const API_BASE = 'http://localhost:3000/api';

if (formularioLogin) {
  formularioLogin.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!usuario || !password) {
      mensajeLogin.textContent = 'Completa usuario y contrasena.';
      mensajeLogin.className = 'mensaje-login error';
      return;
    }

    try {
      const respuesta = await fetch(API_BASE + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario: usuario, password: password })
      });

      const data = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        sessionStorage.removeItem('accesoFET');
        sessionStorage.removeItem('usuarioFET');
        mensajeLogin.textContent = data.mensaje || 'Usuario o contrasena incorrectos.';
        mensajeLogin.className = 'mensaje-login error';
        return;
      }

      sessionStorage.setItem('accesoFET', 'si');
      sessionStorage.setItem('usuarioFET', JSON.stringify(data.usuario));
      mensajeLogin.textContent = 'Acceso correcto. Entrando al sistema...';
      mensajeLogin.className = 'mensaje-login exito';

      setTimeout(function () {
        window.location.href = 'pagina-gestion.html';
      }, 600);
    } catch (error) {
      sessionStorage.removeItem('accesoFET');
      sessionStorage.removeItem('usuarioFET');
      mensajeLogin.textContent = 'No hay conexion con el servidor. Verifica el backend.';
      mensajeLogin.className = 'mensaje-login error';
    }
  });
}
