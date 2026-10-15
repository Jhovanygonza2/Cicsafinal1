// Calendario integrado para Admin, Súper Admin e Instructor.
// Mantiene al usuario dentro de su panel para evitar reconstruir/cambiar el menú lateral.
(() => {
  const panel = document.querySelector('[data-calendario-panel]');
  if (!panel) return;

  const $ = (selector) => panel.querySelector(selector);
  const state = { cursor: new Date(), selected: null, cursos: [], cargando: false };
  state.cursor = new Date(Date.UTC(state.cursor.getFullYear(), state.cursor.getMonth(), 1));
  const ahora = new Date();
  state.selected = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));

  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));

  function startOfDay(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(d.getTime())) return null;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  function fmtDateOnly(value, options = {}) {
    const d = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(d.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', ...options }).format(d);
  }

  function fmtTime(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit'
    }).format(d);
  }

  function rangoCurso(curso) {
    const inicio = curso?.fechaInicio ? new Date(curso.fechaInicio) : null;
    const fin = curso?.fechaFin ? new Date(curso.fechaFin) : null;
    if (!inicio || !Number.isFinite(inicio.getTime())) return null;
    const inicioDia = startOfDay(inicio);
    const finDia = fin && Number.isFinite(fin.getTime()) ? startOfDay(fin) : inicioDia;
    if (!inicioDia || !finDia || finDia < inicioDia) return null;
    return { inicio, fin, inicioDia, finDia };
  }

  function cursosDeFecha(key) {
    const dia = new Date(`${key}T00:00:00Z`);
    return state.cursos
      .filter((curso) => {
        const rango = rangoCurso(curso);
        return rango && dia >= rango.inicioDia && dia <= rango.finDia;
      })
      .sort((a, b) => (rangoCurso(a)?.inicio?.getTime() || 0) - (rangoCurso(b)?.inicio?.getTime() || 0));
  }

  function estadoParaFecha(key, rango) {
    if (key === dateKey(rango.inicioDia)) return { etiqueta: 'INICIO', clase: '' };
    if (key === dateKey(rango.finDia)) return { etiqueta: 'CIERRE', clase: '' };
    return { etiqueta: 'DISPONIBLE', clase: 'available' };
  }

  function render() {
    const days = $('[data-agenda-days]');
    const month = $('[data-agenda-month]');
    if (!days || !month) return;

    days.replaceChildren();
    const y = state.cursor.getUTCFullYear();
    const m = state.cursor.getUTCMonth();
    month.textContent = new Intl.DateTimeFormat('es-MX', {
      month: 'long', year: 'numeric', timeZone: 'UTC'
    }).format(state.cursor).replace(/^./, (c) => c.toUpperCase());

    const firstDay = new Date(Date.UTC(y, m, 1)).getUTCDay();
    const offset = (firstDay + 6) % 7;
    const monthDays = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const prevMonthDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const hoy = new Date();
    const todayKey = dateKey(new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())));

    for (let i = 0; i < 42; i += 1) {
      let n = i - offset + 1;
      let yy = y;
      let mm = m;
      if (n < 1) {
        n = prevMonthDays + n;
        mm -= 1;
        if (mm < 0) { mm = 11; yy -= 1; }
      } else if (n > monthDays) {
        n -= monthDays;
        mm += 1;
        if (mm > 11) { mm = 0; yy += 1; }
      }

      const d = new Date(Date.UTC(yy, mm, n));
      const key = dateKey(d);
      const cursosDia = cursosDeFecha(key);
      const celda = document.createElement('button');
      celda.type = 'button';
      celda.className = `agenda-day${mm !== m ? ' other-month' : ''}${cursosDia.length ? ' has-course' : ''}${key === todayKey ? ' today' : ''}${state.selected && key === dateKey(state.selected) ? ' selected' : ''}`;
      celda.setAttribute('aria-label', `${fmtDateOnly(d, { day: 'numeric', month: 'long', year: 'numeric' })}. ${cursosDia.length} curso${cursosDia.length === 1 ? '' : 's'}.`);

      const tarjetas = cursosDia.slice(0, 3).map((curso) => {
        const rango = rangoCurso(curso);
        const estado = estadoParaFecha(key, rango);
        const hora = key === dateKey(rango.inicioDia)
          ? fmtTime(rango.inicio)
          : key === dateKey(rango.finDia) && rango.fin
            ? `Cierre ${fmtTime(rango.fin)}`
            : 'Disponible';
        const area = curso.area || curso.nombreArea || curso.departamento || 'Capacitación CICSA';
        return `<span class="agenda-course ${estado.clase}">
          <span class="agenda-course-time">${escapeHtml(hora)}</span>
          <span class="agenda-course-name">${escapeHtml(curso.nombre || 'Curso sin nombre')}</span>
          <span class="agenda-course-area">Área: ${escapeHtml(area)}</span>
          <span class="agenda-course-range">${escapeHtml(fmtDateOnly(rango.inicioDia, { day: 'numeric', month: 'short' }))} – ${escapeHtml(fmtDateOnly(rango.finDia, { day: 'numeric', month: 'short' }))}</span>
          <span class="agenda-course-status">${estado.etiqueta}</span>
        </span>`;
      }).join('');

      celda.innerHTML = `<span class="agenda-day-number">${n}</span>${tarjetas}${cursosDia.length > 3 ? `<span class="agenda-more">+${cursosDia.length - 3} más cursos</span>` : ''}`;
      celda.addEventListener('click', () => { state.selected = d; render(); });
      days.appendChild(celda);
    }
  }

  async function cargarCursos() {
    if (state.cargando) return;
    state.cargando = true;
    try {
      let data = [];
      if (typeof agenda !== 'undefined' && agenda && typeof agenda.listar === 'function') data = await agenda.listar();
      else if (typeof cursos !== 'undefined' && cursos && typeof cursos.listar === 'function') data = await cursos.listar();
      state.cursos = (Array.isArray(data) ? data : []).filter((curso) => curso && curso.estado === 'publicado' && rangoCurso(curso));
      const total = $('[data-agenda-total]');
      const updated = $('[data-calendar-updated]');
      if (total) total.textContent = String(state.cursos.length);
      if (updated) updated.textContent = `Actualizado ${fmtTime(new Date())}`;
      render();
    } catch (error) {
      const total = $('[data-agenda-total]');
      const days = $('[data-agenda-days]');
      if (total) total.textContent = '0';
      if (days) days.innerHTML = '<div class="calendar-error">No se pudo cargar el calendario de cursos.</div>';
      window.CicsaToast?.mostrar("No se pudo cargar el calendario de cursos.", "error", {intervalo:60000});
      console.error("Calendario integrado:", error);
    } finally {
      state.cargando = false;
    }
  }

  $('[data-agenda-prev]')?.addEventListener('click', () => {
    state.cursor = new Date(Date.UTC(state.cursor.getUTCFullYear(), state.cursor.getUTCMonth() - 1, 1));
    render();
  });
  $('[data-agenda-next]')?.addEventListener('click', () => {
    state.cursor = new Date(Date.UTC(state.cursor.getUTCFullYear(), state.cursor.getUTCMonth() + 1, 1));
    render();
  });
  $('[data-agenda-hoy]')?.addEventListener('click', () => {
    const now = new Date();
    state.cursor = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    state.selected = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    render();
  });

  // Se actualiza cuando el panel termina de cargar y al volver a la pestaña.
  window.addEventListener('panel-datos-listos', cargarCursos);
  window.addEventListener('calendario-panel-visible', cargarCursos);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) cargarCursos(); });
  cargarCursos();
})();
