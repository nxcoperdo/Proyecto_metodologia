const formularioLogin = document.getElementById('loginForm');
const mensajeLogin = document.getElementById('mensajeLogin');

formularioLogin.addEventListener('submit', function (evento) {
  evento.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value.trim();

  if (usuario === 'admin' && password === 'admin123') {
    sessionStorage.setItem('accesoFET', 'si');
    mensajeLogin.textContent = 'Acceso correcto. Entrando al sistema...';
    mensajeLogin.className = 'mensaje-login exito';

    setTimeout(function () {
      window.location.href = 'pagina-gestion.html';
    }, 800);
  } else {
    sessionStorage.removeItem('accesoFET');
    mensajeLogin.textContent = 'Usuario o contraseña incorrectos.';
    mensajeLogin.className = 'mensaje-login error';
  }
});

