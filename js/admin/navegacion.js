// Navegación administrativa: secciones, formularios y menú adaptable.
function activarSeccionAdmin(id) {
  const enlaces = document.querySelectorAll('#admin-sidebar nav a[href^="#"]');
  let titulo = '';
  enlaces.forEach(enlace => {
    const activo = enlace.getAttribute('href') === `#${id}`;
    enlace.classList.toggle('activo', activo);
    if (activo) { enlace.setAttribute('aria-current', 'location'); titulo = enlace.textContent.trim(); }
    else enlace.removeAttribute('aria-current');
  });
  const indicador = document.getElementById('admin-seccion-actual');
  if (titulo && indicador) indicador.textContent = titulo;
}

(() => {
  const shell = document.querySelector('.admin-shell');
  const sidebar = document.getElementById('admin-sidebar');
  const toggle = document.getElementById('btn-menu-admin');
  if (!shell || !sidebar || !toggle) return;
  const movil = window.matchMedia('(max-width: 700px)');
  const claveColapsado = `cicsa_sidebar_colapsado_${sesion.rol() || 'admin'}`;
  const claveScrollMenu = `cicsa_sidebar_scroll_${sesion.rol() || 'admin'}`;
  const calendarioId = 'calendario-admin';
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
  const secciones = [...document.querySelectorAll('.contenedor-admin > section[id]')].filter((el, i, arr) => arr.indexOf(el) === i && !el.hidden);
  const enlaces = [...sidebar.querySelectorAll('nav a')];
  enlaces.forEach(enlace => {
    const nombre = enlace.textContent.trim();
    enlace.title = nombre;
    enlace.setAttribute('aria-label', nombre);
  });

  function sincronizarMenu() {
    const abierto = movil.matches ? sidebar.classList.contains('abierto') : !shell.classList.contains('admin-sidebar-colapsado');
    toggle.setAttribute('aria-expanded', String(abierto));
    toggle.setAttribute('aria-label', abierto ? 'Contraer navegación' : 'Abrir navegación');
    sidebar.inert = movil.matches && !abierto;
  }
  function cerrarMenu(devolverFoco = false) {
    if (!movil.matches) return;
    sidebar.classList.remove('abierto');
    shell.classList.remove('admin-menu-abierto');
    if (devolverFoco) toggle.focus();
    sincronizarMenu();
  }
  toggle.addEventListener('click', () => {
    if (movil.matches) {
      const abierto = sidebar.classList.toggle('abierto');
      shell.classList.toggle('admin-menu-abierto', abierto);
      sincronizarMenu();
      if (abierto) sidebar.querySelector('a').focus();
    } else {
      const colapsado = shell.classList.toggle('admin-sidebar-colapsado');
      guardarEstado(claveColapsado, colapsado ? '1' : '0');
      sincronizarMenu();
    }
  });
  document.getElementById('btn-cerrar-menu-admin')?.addEventListener('click', () => cerrarMenu(true));
  document.addEventListener('pointerdown', event => {
    if (sidebar.classList.contains('abierto') && !event.target.closest('#admin-sidebar, #btn-menu-admin')) cerrarMenu(true);
  });
  document.addEventListener('keydown', event => {
    if (!movil.matches || !sidebar.classList.contains('abierto')) return;
    if (event.key === 'Escape') { cerrarMenu(true); return; }
    if (event.key !== 'Tab') return;
    const controles = [...sidebar.querySelectorAll('a, button')].filter(el => el.getClientRects().length);
    const primero = controles[0], ultimo = controles[controles.length - 1];
    if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo.focus(); }
    else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero.focus(); }
  });
  movil.addEventListener('change', () => {
    sidebar.classList.remove('abierto');
    shell.classList.remove('admin-menu-abierto');
    if (!movil.matches) shell.classList.toggle('admin-sidebar-colapsado', leerEstado(claveColapsado, '0') === '1');
    sincronizarMenu();
  });
  sincronizarMenu();

  function irASeccion(id, formulario, guardarHistorial = true, instantaneo = false) {
    if (guardarHistorial) entradaPendiente = '';
    const seccion = document.getElementById(id);
    if (!seccion) return;

    const esCalendario = id === calendarioId;
    if (!esCalendario && seccion.hidden) return;

    cerrarMenu();
    shell.classList.toggle('admin-vista-altas', id === 'usuarios-admin');
    shell.classList.toggle('admin-vista-organizacion', id === 'puestos-departamentos-admin');

    // El calendario es una vista aislada: no agrega altura ni participa en el
    // flujo vertical del dashboard. Al salir, se restaura el panel normal.
    if (calendarioSeccion) {
      calendarioSeccion.hidden = !esCalendario;
      shell.classList.toggle('admin-vista-calendario', esCalendario);
    }

    const panel = !esCalendario && formulario && document.getElementById(formulario);
    if (panel && seccion.contains(panel)) panel.open = true;
    const destino = panel || seccion;
    if (guardarHistorial && location.hash !== `#${id}`) {
      try { history.pushState(null, '', `#${id}`); }
      catch (error) { location.hash = id; }
    }
    activarSeccionAdmin(id);
    const foco = panel ? panel.querySelector('input:not([type="hidden"]), select') : seccion.querySelector('h2');
    if (foco) { if (!panel) foco.tabIndex = -1; foco.focus({ preventScroll: true }); }
    window.desplazarPanel(destino, { instantaneo: esCalendario ? true : instantaneo });
    if (esCalendario) window.dispatchEvent(new CustomEvent('calendario-panel-visible'));
  }
  document.querySelectorAll('#admin-sidebar a[href^="#"], .admin-acciones-rapidas a[href^="#"], .admin-breadcrumbs a[href^="#"]').forEach(enlace => {
    enlace.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const id = enlace.hash.slice(1);
      if (!document.getElementById(id)) return;
      irASeccion(id, enlace.dataset.abrirForm);
      event.preventDefault();
    });
  });
  window.irASeccionPanel = irASeccion;
  window.addEventListener('hashchange', () => irASeccion(location.hash.slice(1) || secciones[0]?.id, null, false, false));
  // La entrada desde otra pagina se posiciona una sola vez, tras cargar los datos.

  // Recalcular con todas las secciones evita activar entradas aisladas del observador.
  let pendiente = false;
  function actualizarSeccionVisible() {
    pendiente = false;
    if (shell.classList.contains('admin-vista-organizacion')) {
      activarSeccionAdmin('puestos-departamentos-admin');
      return;
    }
    if (shell.classList.contains('admin-vista-altas')) {
      activarSeccionAdmin('usuarios-admin');
      return;
    }
    if (shell.classList.contains('admin-vista-calendario')) {
      activarSeccionAdmin(calendarioId);
      return;
    }
    if (window.desplazarPanel.activo) return;
    const limite = (document.querySelector('.topbar-admin')?.getBoundingClientRect().bottom || 0) + 80;
    let actual = secciones[0];
    for (const seccion of secciones) if (seccion.getClientRects().length && seccion.getBoundingClientRect().top <= limite) actual = seccion;
    if (actual) activarSeccionAdmin(actual.id);
  }
  window.addEventListener('scroll', () => {
    if (!pendiente) { pendiente = true; requestAnimationFrame(actualizarSeccionVisible); }
  }, { passive: true });
  if (location.hash === '#usuarios-admin') irASeccion('usuarios-admin', null, false, true);
  if (location.hash === '#puestos-departamentos-admin') irASeccion('puestos-departamentos-admin', null, false, true);
  actualizarSeccionVisible();

  // Excelencia usa enlaces HTML nativos para no depender de ventanas emergentes.
})();
