(() => {
  const acceso = sesion.requerir(["trabajador", "instructor", "admin", "superadmin"]);
  if (!acceso) return;

  const $ = (id) => document.getElementById(id);
  const role = sesion.rol();
  const usuario = sesion.usuario() || {};
  const roleLabels = { superadmin: "Súper administrador", admin: "Administrador", instructor: "Instructor", trabajador: "Trabajador" };
  const labelRole = roleLabels[role] || "Usuario";
  const nombre = usuario.nombre || usuario.nombres || usuario.nombreCompleto || usuario.usuario || "Usuario";
  const iniciales = String(nombre).split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("") || "US";

  // ---------------------------------------------------------------
  // Shell: usa el mismo menú, barra y logotipo que el perfil real.
  // ---------------------------------------------------------------
  function svg(path) { return `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`; }
  const icons = {
    resumen: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    actividad: svg('<path d="M3 12h4l3-8 4 16 3-8h4"/>'),
    notificaciones: svg('<path d="M6 17h12l-2-3V9a4 4 0 0 0-8 0v5l-2 3ZM10 21h4"/>'),
    comunicados: svg('<path d="M4 5h16v14H4zM4 9h16M8 13h8M8 16h5"/>'),
    usuarios: svg('<circle cx="10" cy="8" r="3"/><path d="M3 21v-3a7 7 0 0 1 14 0v3M17 5a3 3 0 0 1 0 6M19 15a5 5 0 0 1 2 4"/>'),
    cursos: svg('<path d="M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3V4ZM12 6v16"/>'),
    calendario: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3M13 14h3M8 17h3"/>'),
    seguimiento: svg('<path d="M4 3v18h17M8 16v-4M13 16V8M18 16V5"/>'),
    solicitudes: svg('<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>'),
    excelencia: svg('<path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6"/>'),
    tutorial: '?',
    inicio: svg('<path d="m3 10 9-7 9 7v11h-6v-8H9v8H3Z"/>'),
    miAprendizaje: svg('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'),
    perfil: svg('<circle cx="12" cy="8" r="4"/><path d="M4 19c1.4-3.2 4.3-4.8 8-4.8s6.6 1.6 8 4.8"/>')
  };
  const adminLink = (href, key, label, active = false, extra = "") => `<a href="${href}" class="${active ? "activo" : ""}" ${extra}><span class="admin-nav-icono" aria-hidden="true">${icons[key] || ""}</span>${label}</a>`;

  function prepararMenu(shell, sidebar, toggle, limite, claseAbierto, claseColapsado) {
    const movil = window.matchMedia(`(max-width: ${limite}px)`);
    const claveColapsado = `cicsa_sidebar_colapsado_${role || "usuario"}`;
    const claveScrollMenu = `cicsa_sidebar_scroll_${role || "usuario"}`;
    const leerEstado = (clave, fallback = "") => { try { return sessionStorage.getItem(clave) ?? fallback; } catch (_) { return fallback; } };
    const guardarEstado = (clave, valor) => { try { sessionStorage.setItem(clave, String(valor)); } catch (_) {} };

    if (!movil.matches && claseColapsado) {
      shell.classList.toggle(claseColapsado, leerEstado(claveColapsado, "0") === "1");
    }

    const scrollGuardado = Number(leerEstado(claveScrollMenu, "0")) || 0;
    if (scrollGuardado > 0) sidebar.scrollTop = scrollGuardado;
    let frameScrollMenu = null;
    sidebar.addEventListener("scroll", () => {
      if (frameScrollMenu !== null) return;
      frameScrollMenu = requestAnimationFrame(() => {
        frameScrollMenu = null;
        guardarEstado(claveScrollMenu, Math.max(0, Math.round(sidebar.scrollTop)));
      });
    }, { passive: true });

    const sincronizar = () => {
      const abierto = movil.matches ? shell.classList.contains(claseAbierto) : !shell.classList.contains(claseColapsado);
      toggle.setAttribute("aria-expanded", String(abierto));
      toggle.setAttribute("aria-label", abierto ? "Cerrar menú de navegación" : "Abrir menú de navegación");
      sidebar.inert = movil.matches && !abierto;
    };
    const cerrar = (devolverFoco = false) => {
      shell.classList.remove(claseAbierto);
      sidebar.classList.remove("abierto");
      sincronizar();
      if (devolverFoco) toggle.focus();
    };
    toggle.addEventListener("click", () => {
      if (movil.matches) {
        const abierto = shell.classList.toggle(claseAbierto);
        if (claseAbierto === "admin-menu-abierto") sidebar.classList.toggle("abierto", abierto);
      } else {
        const colapsado = shell.classList.toggle(claseColapsado);
        guardarEstado(claveColapsado, colapsado ? "1" : "0");
      }
      sincronizar();
    });
    sidebar.querySelector(".admin-menu-cerrar")?.addEventListener("click", () => cerrar(true));
    sidebar.addEventListener("click", evento => {
      if (movil.matches && evento.target.closest("a")) cerrar();
    });
    document.addEventListener("pointerdown", evento => {
      if (movil.matches && shell.classList.contains(claseAbierto) &&
          !sidebar.contains(evento.target) && !toggle.contains(evento.target)) cerrar(true);
    });
    document.addEventListener("keydown", evento => {
      if (evento.key === "Escape" && movil.matches && shell.classList.contains(claseAbierto)) cerrar(true);
    });
    movil.addEventListener("change", () => {
      cerrar();
      if (!movil.matches && claseColapsado) {
        shell.classList.toggle(claseColapsado, leerEstado(claveColapsado, "0") === "1");
      }
      sincronizar();
    });
    window.addEventListener("pageshow", evento => { if (evento.persisted) cerrar(); });
    sincronizar();
  }

  function prepararShell() {
    const template = $("calendar-view-template");
    const contenido = template.content.cloneNode(true);
    const target = role === "trabajador" ? $("calendar-content-worker") : $("calendar-content-admin");
    target.appendChild(contenido);

    if (role === "trabajador") {
      $("avatar-trabajador").textContent = iniciales;
      $("nombre-trabajador").textContent = nombre;
      $("avatar-trabajador-compact").textContent = iniciales;
      $("nombre-trabajador-compact").textContent = String(nombre).split(" ")[0];
      const shell = $("calendar-worker-shell"), sidebar = $("sidebar-trabajador"), toggle = $("btn-toggle-sidebar-trabajador");
      prepararMenu(shell, sidebar, toggle, 1024, "sidebar-abierto", "sidebar-colapsado");
      $("calendar-worker-shell").hidden = false;
      return;
    }

    $("calendar-sidebar-role-label").textContent = role === "instructor" ? "INSTRUCTOR" : "CAPACITACIÓN";
    $("calendar-role-badge").textContent = labelRole;
    $("calendar-admin-name").textContent = String(nombre).split(" ")[0];
    $("calendar-topbar-title").textContent = role === "instructor" ? "Panel del instructor" : "Administración de capacitación";
    $("calendar-panel-link").href = role === "instructor" ? "instructor/cursos.html" : "admin/dashboard.html#resumen-admin";
    $("calendar-panel-link").textContent = "Panel";
    const marca = $("admin-sidebar").querySelector(".admin-sidebar-marca");
    if (marca && role === "instructor") {
      marca.href = "trabajador/inicio.html";
      marca.setAttribute("aria-label", "CICSA - Ir a Inicio");
    }

    const nav = $("calendar-admin-nav");
    if (role === "instructor") {
      nav.innerHTML = `
        <span class="admin-nav-etiqueta">Instructor</span>
        ${adminLink("trabajador/inicio.html", "inicio", "Inicio")}
        ${adminLink("instructor/cursos.html#cursos-instructor", "cursos", "Cursos")}
        ${adminLink("instructor/cursos.html#notificaciones-instructor", "notificaciones", "Notificaciones")}
        ${adminLink("agenda.html", "calendario", "Calendario de cursos", true)}
        ${adminLink("instructor/cursos.html#mis-solicitudes-cursos", "solicitudes", "Mis solicitudes")}
        ${adminLink("trabajador/tutorial.html", "tutorial", "Tutorial de uso")}
        ${adminLink("trabajador/soporte.html", "seguimiento", "Soporte y ayuda")}`;
    } else {
      const superExtra = role === "superadmin" ? adminLink("admin/dashboard.html#aprobacion-cursos-admin", "solicitudes", "Aprobar cursos", false, 'data-solo-superadmin') : "";
      nav.innerHTML = `
        <span class="admin-nav-etiqueta">Vista general</span>
        ${adminLink("admin/dashboard.html#resumen-admin", "resumen", "Resumen")}
        ${adminLink("admin/dashboard.html#actividad-admin", "actividad", "Actividad")}
        ${adminLink("admin/dashboard.html#notificaciones-admin", "notificaciones", "Notificaciones")}
        ${adminLink("admin/dashboard.html#comunicados-admin", "comunicados", "Comunicados")}
        <span class="admin-nav-etiqueta">Gestión</span>
        ${adminLink("admin/dashboard.html#usuarios-admin", "usuarios", "Usuarios")}
        ${adminLink("trabajador/tutorial.html", "tutorial", "Ayuda", false, 'data-asistencia-admin')}
        ${adminLink("trabajador/soporte.html", "seguimiento", "Soporte", false, 'data-asistencia-admin')}
        ${adminLink("admin/dashboard.html#tutorial-admin", "tutorial", "Tutorial de uso")}
        ${adminLink("admin/dashboard.html#cursos-admin", "cursos", "Cursos")}
        ${superExtra}
        ${adminLink("agenda.html", "calendario", "Calendario de cursos", true)}
        <span class="admin-nav-etiqueta">Resultados</span>
        ${adminLink("admin/dashboard.html#seguimiento-admin", "seguimiento", "Seguimiento")}
        <span class="admin-nav-etiqueta">Reconocimientos</span>
        ${adminLink("admin/excelencia.html", "excelencia", "Tabla de excelencia")}`;
    }

    const shell = $("calendar-admin-shell"), sidebar = $("admin-sidebar"), toggle = $("btn-menu-admin");
    prepararMenu(shell, sidebar, toggle, 700, "admin-menu-abierto", "admin-sidebar-colapsado");
    $("btn-cerrar-sesion-admin")?.addEventListener("click", () => sesion.cerrar());
    $("calendar-admin-shell").hidden = false;
  }

  prepararShell();

  // ---------------------------------------------------------------
  // Calendario
  // ---------------------------------------------------------------
  const state = { cursor: new Date(), selected: null, cursos: [] };
  state.cursor = new Date(Date.UTC(state.cursor.getFullYear(), state.cursor.getMonth(), 1));
  state.selected = new Date(Date.UTC(state.cursor.getUTCFullYear(), state.cursor.getUTCMonth(), state.cursor.getUTCDate()));

  const pad = (n) => String(n).padStart(2, "0");
  const dateKey = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  const startOfDay = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return null;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  };
  const fmtDateOnly = (value, options = {}) => {
    const d = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(d.getTime())) return "Sin fecha";
    return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...options }).format(d);
  };
  const fmtTime = (value) => {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return "";
    return new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit" }).format(d);
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;" }[m]));

  function rangoCurso(curso) {
    const inicio = curso.fechaInicio ? new Date(curso.fechaInicio) : null;
    const fin = curso.fechaFin ? new Date(curso.fechaFin) : null;
    if (!inicio || !Number.isFinite(inicio.getTime())) return null;
    const inicioDia = startOfDay(inicio);
    const finDia = fin && Number.isFinite(fin.getTime()) ? startOfDay(fin) : inicioDia;
    if (!inicioDia || !finDia || finDia < inicioDia) return null;
    return { inicio, fin, inicioDia, finDia };
  }
  function cursosDeFecha(key) {
    const dia = new Date(`${key}T00:00:00Z`);
    return state.cursos.filter(curso => { const r = rangoCurso(curso); return r && dia >= r.inicioDia && dia <= r.finDia; })
      .sort((a,b) => (rangoCurso(a)?.inicio?.getTime() || 0) - (rangoCurso(b)?.inicio?.getTime() || 0));
  }
  function estadoParaFecha(key, r) {
    const inicioKey = dateKey(r.inicioDia), finKey = dateKey(r.finDia);
    if (key === inicioKey) return { etiqueta: "INICIO", clase: "" };
    if (key === finKey) return { etiqueta: "CIERRE", clase: "" };
    return { etiqueta: "DISPONIBLE", clase: "available" };
  }
  function tarjetasDeCursos(cursos, key) { return cursos.map(curso=>{const r=rangoCurso(curso),estado=estadoParaFecha(key,r);const hora=key===dateKey(r.inicioDia)?fmtTime(r.inicio):key===dateKey(r.finDia)&&r.fin?`Cierre ${fmtTime(r.fin)}`:"Disponible";const area=curso.area||curso.nombreArea||curso.departamento||"Capacitación CICSA";return `<span class="agenda-course ${estado.clase}"><span class="agenda-course-time">${escapeHtml(hora)}</span><span class="agenda-course-name">${escapeHtml(curso.nombre||"Curso sin nombre")}</span><span class="agenda-course-area">Área: ${escapeHtml(area)}</span><span class="agenda-course-range">${escapeHtml(fmtDateOnly(r.inicioDia,{day:"numeric",month:"short"}))} – ${escapeHtml(fmtDateOnly(r.finDia,{day:"numeric",month:"short"}))}</span><span class="agenda-course-status">${estado.etiqueta}</span></span>`;}).join(""); }
  let detalleDia;
  function abrirCursosDelDia(key, fecha) {
    if (!detalleDia) {
      detalleDia = document.createElement("dialog");
      detalleDia.className = "agenda-day-dialog";
      detalleDia.setAttribute("aria-labelledby", "agenda-day-dialog-title");
      detalleDia.innerHTML = '<header><h2 id="agenda-day-dialog-title"></h2><button type="button" aria-label="Cerrar lista de cursos">Cerrar</button></header><p class="agenda-dialog-count"></p><div class="agenda-dialog-list"></div>';
      document.body.appendChild(detalleDia);
      detalleDia.querySelector("button").addEventListener("click", () => detalleDia.close());
      detalleDia.addEventListener("close", () => {
        document.querySelector('.agenda-day[data-date="' + detalleDia.dataset.date + '"]')?.focus({preventScroll: true});
      });
    }
    const cursos = cursosDeFecha(key);
    detalleDia.dataset.date = key;
    detalleDia.querySelector("h2").textContent = "Cursos del " + fmtDateOnly(fecha, {day: "numeric", month: "long", year: "numeric"});
    detalleDia.querySelector(".agenda-dialog-count").textContent = cursos.length + " cursos · Ordenados por fecha y hora de inicio";
    detalleDia.querySelector(".agenda-dialog-list").innerHTML = tarjetasDeCursos(cursos, key);
    detalleDia.showModal();
  }
  function render() {
    const days = $("agenda-days");
    if (!days) return;
    days.innerHTML = "";
    const y = state.cursor.getUTCFullYear(), m = state.cursor.getUTCMonth();
    $("agenda-month").textContent = new Intl.DateTimeFormat("es-MX", { month:"long", year:"numeric", timeZone:"UTC" }).format(state.cursor).replace(/^./, c => c.toUpperCase());
    const firstDay = new Date(Date.UTC(y,m,1)).getUTCDay(), offset = (firstDay + 6) % 7;
    const monthDays = new Date(Date.UTC(y,m+1,0)).getUTCDate(), prevMonthDays = new Date(Date.UTC(y,m,0)).getUTCDate();
    const now = new Date(), todayKey = dateKey(new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())));
    for (let i=0;i<42;i++) {
      let n=i-offset+1, yy=y, mm=m;
      if(n<1){n=prevMonthDays+n;mm--;if(mm<0){mm=11;yy--;}}
      else if(n>monthDays){n-=monthDays;mm++;if(mm>11){mm=0;yy++;}}
      const d=new Date(Date.UTC(yy,mm,n)), key=dateKey(d), cursos=cursosDeFecha(key);
      const el=document.createElement("button"); el.type="button";
      el.className=`agenda-day${mm!==m?" other-month":""}${cursos.length?" has-course":""}${key===todayKey?" today":""}${state.selected&&key===dateKey(state.selected)?" selected":""}`;
      el.setAttribute("aria-label",`${fmtDateOnly(d,{day:"numeric",month:"long",year:"numeric"})}. ${cursos.length} curso${cursos.length===1?"":"s"}.`);
      const cards=tarjetasDeCursos(cursos.slice(0,3), key);
      el.innerHTML=`<span class="agenda-day-number">${n}</span>${cards}${cursos.length>3?`<span class="agenda-more">+${cursos.length-3} más cursos</span>`:""}`;
      el.dataset.date = key;
      if (cursos.length > 3) {
        el.setAttribute("aria-haspopup", "dialog");
        el.setAttribute("aria-label", el.getAttribute("aria-label") + " Ver todos los cursos del día.");
      }
      el.addEventListener("click",()=>{state.selected=d;render();if(cursos.length>3) abrirCursosDelDia(key,d);}); days.appendChild(el);
    }
  }
  async function cargarCursos(){
    try{
      let cursosAgenda=[];
      if(typeof agenda!=="undefined"&&typeof agenda.listar==="function") cursosAgenda=await agenda.listar(); else cursosAgenda=await cursos.listar();
      const hoyLocal = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const hoyInicio = new Date(`${hoyLocal}T00:00:00Z`);
      state.cursos=(Array.isArray(cursosAgenda)?cursosAgenda:[]).filter(c=>{
        if(!c || c.estado!=="publicado") return false;
        const rango=rangoCurso(c);
        return !!rango && rango.finDia >= hoyInicio;
      });
      $("agenda-total").textContent=state.cursos.length;
      $("calendar-updated").textContent=`Actualizado ${fmtTime(new Date())}`;
      render();
    }catch(error){$("agenda-total").textContent="0";$("agenda-days").innerHTML='<div class="calendar-error">No se pudo cargar el calendario de cursos.</div>';showToast("No se pudo actualizar el calendario.");console.error(error);}
  }
  function showToast(message){window.CicsaToast?.mostrar(message,"error",{intervalo:60000});}
  $("agenda-prev").addEventListener("click",()=>{state.cursor=new Date(Date.UTC(state.cursor.getUTCFullYear(),state.cursor.getUTCMonth()-1,1));render();});
  $("agenda-next").addEventListener("click",()=>{state.cursor=new Date(Date.UTC(state.cursor.getUTCFullYear(),state.cursor.getUTCMonth()+1,1));render();});
  $("agenda-hoy").addEventListener("click",()=>{const now=new Date();state.cursor=new Date(Date.UTC(now.getFullYear(),now.getMonth(),1));state.selected=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));render();});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)cargarCursos();});
  // Reservar la cuadricula antes de recibir los cursos evita un salto de altura.
  render();
  $("calendar-updated").textContent = "Cargando cursos...";
  cargarCursos();
  setInterval(()=>{if(!document.hidden)cargarCursos();},60000);
})();
