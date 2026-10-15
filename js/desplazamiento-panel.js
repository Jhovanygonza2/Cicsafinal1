// Desplazamiento breve y cancelable para los paneles de administracion e instructor.
(() => {
  let frame = null;
  let entrada = null;
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  function cancelar() {
    entrada?.cancel();
    entrada = null;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    window.desplazarPanel.activo = false;
  }
  window.desplazarPanel = function (destino, opciones = {}) {
    cancelar();
    if (!destino) return;
    if (!reducirMovimiento.matches && typeof destino.animate === 'function') {
      entrada = destino.animate([{opacity:0.55}, {opacity:1}], {duration:280, easing:'ease-out'});
    }
    const inicio = window.scrollY;
    const margen = parseFloat(getComputedStyle(destino).scrollMarginTop) || 0;
    const maximo = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const final = Math.min(maximo, Math.max(0, inicio + destino.getBoundingClientRect().top - margen));
    const distancia = final - inicio;
    const instantaneo = Boolean(opciones && opciones.instantaneo);
    if (instantaneo || reducirMovimiento.matches || Math.abs(distancia) < 2) {
      window.scrollTo({ top: final, behavior: 'instant' });
      return;
    }
    window.desplazarPanel.activo = true;
    let comienzo = null;
    function avanzar(tiempo) {
      if (comienzo === null) comienzo = tiempo;
      const progreso = Math.min(1, (tiempo - comienzo) / 280);
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      window.scrollTo({ top: inicio + distancia * suavizado, behavior: 'instant' });
      if (progreso < 1) frame = requestAnimationFrame(avanzar);
      else { frame = null; window.desplazarPanel.activo = false; }
    }
    frame = requestAnimationFrame(avanzar);
  };
  window.desplazarPanel.activo = false;
  ['wheel', 'touchstart', 'pointerdown'].forEach(tipo => {
    document.addEventListener(tipo, cancelar, { passive: true });
  });
  document.addEventListener('keydown', evento => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Escape'].includes(evento.key)) cancelar();
  });
  reducirMovimiento.addEventListener('change', () => { if (reducirMovimiento.matches) cancelar(); });
  window.addEventListener('pagehide', cancelar);
})();
