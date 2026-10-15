// Navegación exclusiva del módulo Instructor.
(() => {
  const shell = document.querySelector('.admin-shell');
  const sidebar = document.getElementById('admin-sidebar');
  const toggle = document.getElementById('btn-menu-admin');
  if (!shell || !sidebar || !toggle) return;
  const movil = window.matchMedia('(max-width: 700px)');
  const claveColapsado = `cicsa_sidebar_colapsado_${sesion.rol() || 'instructor'}`;
  const claveScrollMenu = `cicsa_sidebar_scroll_${sesion.rol() || 'instructor'}`;
  const calendarioId = 'calendario-instructor';
  const calendarioSeccion = document.getElementById(calendarioId);
  const leerEstado = (clave, fallback = '') => { try { return sessionStorage.getItem(clave) ?? fallback; } catch (_) { return fallback; } };
  const guardarEstado = (clave, valor) => { try { sessionStorage.setItem(clave, String(valor)); } catch (_) {} };
  if (!movil.matches) shell.classList.toggle('admin-sidebar-colapsado', leerEstado(claveColapsado, '0') === '1');
  const scrollGuardado = Number(leerEstado(claveScrollMenu, '0')) || 0;
  if (scrollGuardado > 0) sidebar.scrollTop = scrollGuardado;
  let frameScrollMenu = null;
  sidebar.addEventListener('scroll', () => {
    if (frameScrollMenu !== null) return;
    frameScrollMenu = requestAnimationFrame(() => {
      frameScrollMenu = null;
      guardarEstado(claveScrollMenu, Math.max(0, Math.round(sidebar.scrollTop)));
    });
  }, { passive: true });
  document.documentElement.style.scrollBehavior = 'auto';
  let entradaPendiente = location.hash;
  const cancelarEntrada = () => { entradaPendiente = ''; };
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(tipo => {
    document.addEventListener(tipo, cancelarEntrada, { passive: true, once: true });
  });
  window.addEventListener('panel-datos-listos', () => {
    const destinoInicial = entradaPendiente;
    entradaPendiente = '';
    if (destinoInicial && location.hash === destinoInicial) {
      requestAnimationFrame(() => {
        if (location.hash === destinoInicial) irASeccion(destinoInicial.slice(1), null, false, false);
      });
    }
  }, { once: true });

  function sincronizarMenu() {
    const abierto = movil.matches ? sidebar.classList.contains('abierto') : !shell.classList.contains('admin-sidebar-colapsado');
    toggle.setAttribute('aria-expanded', String(abierto));
    sidebar.inert = movil.matches && !abierto;
  }
  function cerrarMenu() {
    if (!movil.matches) return;
    sidebar.classList.remove('abierto');
    shell.classList.remove('admin-menu-abierto');
    sincronizarMenu();
  }
  toggle.addEventListener('click', () => {
    if (movil.matches) {
      const abierto = sidebar.classList.toggle('abierto');
      shell.classList.toggle('admin-menu-abierto', abierto);
    } else {
      const colapsado = shell.classList.toggle('admin-sidebar-colapsado');
      guardarEstado(claveColapsado, colapsado ? '1' : '0');
    }
    sincronizarMenu();
  });
  document.getElementById('btn-cerrar-menu-admin')?.addEventListener('click', cerrarMenu);
  movil.addEventListener('change', () => {
    cerrarMenu();
    if (!movil.matches) shell.classList.toggle('admin-sidebar-colapsado', leerEstado(claveColapsado, '0') === '1');
    sincronizarMenu();
  });
  sincronizarMenu();

  function activar(id) {
    sidebar.querySelectorAll('nav a[href^="#"]').forEach((enlace) => {
      const activo = enlace.getAttribute('href') === `#${id}`;
      enlace.classList.toggle('activo', activo);
      if (activo) enlace.setAttribute('aria-current', 'location');
      else enlace.removeAttribute('aria-current');
    });
    const actual = document.getElementById('admin-seccion-actual');
    if (actual) {
      const titulos = {
        'cursos-instructor': 'Cursos',
        'notificaciones-instructor': 'Notificaciones',
        'calendario-instructor': 'Calendario de cursos',
        'mis-solicitudes-cursos': 'Mis solicitudes'
      };
      actual.textContent = titulos[id] || 'Cursos';
    }
  }

  function irASeccion(id, formulario, guardar = true, instantaneo = false) {
    if (guardar) entradaPendiente = '';
    const seccion = document.getElementById(id);
    if (!seccion) return;

    const esCalendario = id === calendarioId;
    if (!esCalendario && seccion.hidden) return;

    cerrarMenu();
    if (calendarioSeccion) {
      calendarioSeccion.hidden = !esCalendario;
      shell.classList.toggle('admin-vista-calendario', esCalendario);
    }

    const panel = !esCalendario && formulario ? document.getElementById(formulario) : null;
    if (panel && seccion.contains(panel)) panel.open = true;
    if (guardar && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    activar(id);
    window.desplazarPanel(panel || seccion, { instantaneo: esCalendario ? true : instantaneo });
    if (esCalendario) window.dispatchEvent(new CustomEvent('calendario-panel-visible'));
  }

  document.querySelectorAll('#admin-sidebar a[href^="#"], .admin-acciones-rapidas a[href^="#"]').forEach((enlace) => {
    enlace.addEventListener('click', (evento) => {
      if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
      const id = enlace.hash.slice(1);
      if (!document.getElementById(id)) return;
      evento.preventDefault();
      irASeccion(id, enlace.dataset.abrirForm);
    });
  });
  window.irASeccionPanel = irASeccion;
  window.addEventListener('hashchange', () => irASeccion(location.hash.slice(1) || 'cursos-instructor', null, false, false));
  // La entrada desde otra pagina se posiciona una sola vez, tras cargar los datos.
})();
