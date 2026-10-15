// Destinos compartidos por la campana y los centros de notificaciones.
(() => {
  const iguales = (a, b) => a != null && b != null && String(a) === String(b);
  function destino(n) {
    const rol = sesion.rol();
    if (!["admin", "superadmin", "instructor"].includes(rol)) return null;
    if (n.tipo === "actividad-apartado" && n.destino === "soporte") return { accion: "soporte", texto: "Ver solicitud" };
    if (n.tipo === "actividad-apartado" && n.seccion) return { accion: "seccion", seccion: n.seccion, texto: "Abrir apartado" };
    const instructor = rol === "instructor";
    if (instructor) {
      if (["curso-rechazado", "curso-observado"].includes(n.tipo)) return { accion: "editar", seccion: "cursos-instructor", texto: "Corregir curso", permiso: "editarCursos" };
      if (["curso-aprobado", "curso-autorizado"].includes(n.tipo)) return { accion: "solicitud", seccion: "mis-solicitudes-cursos", texto: "Ver solicitud" };
      if (n.tipo === "evaluacion-terminada") return { accion: "solicitud", seccion: "mis-solicitudes-cursos", texto: "Ver resultado del curso" };
      return null;
    }
    if (["admin", "superadmin"].includes(rol) && n.tipo === "evaluacion-terminada") {
      // Tanto la evaluación del curso como el examen final se consultan
      // desde el perfil académico del trabajador, donde aparecen sus notas.
      return { accion: "perfil", seccion: "usuarios-admin", texto: "Ver perfil y calificación", permiso: "usuarios" };
    }
    if (rol === "admin") {
      const consultasCursos = {
        "curso-revision": "Ver curso y estado",
        "curso-vencimiento": "Ver fechas del curso",
        "curso-observado": "Ver observaciones",
        "curso-rechazado": "Ver observaciones",
        "curso-aprobado": "Ver curso y asignaciones",
        "curso-autorizado": "Ver curso y asignaciones"
      };
      if (consultasCursos[n.tipo]) return { accion: "curso", seccion: "cursos-admin", texto: consultasCursos[n.tipo], permiso: "usuarios" };
    }
    if(n.tipo==="instructor-modificado")return rol==="superadmin"?{accion:"usuario",seccion:"usuarios-admin",texto:"Ver instructor en Altas",permiso:"usuarios"}:null;
    if(n.tipo === "repetir-solicitado") return {accion:"soporte", texto:"Ver solicitud", permiso:"usuarios"};
    const mapa = {
      password: ["password", "usuarios-admin", "Restablecer contraseña", "password"],
      "usuario-nuevo": ["usuario", "usuarios-admin", "Ver usuario", "usuarios"],
      "usuarios-nuevos": ["usuarios", "usuarios-admin", "Ver usuarios agregados", "usuarios"],
      "curso-revision": rol === "superadmin" ? ["revision", "aprobacion-cursos-admin", "Revisar curso", "aprobarCursos"] : ["curso", "cursos-admin", "Ver curso", "editarCursos"],
      "curso-vencimiento": ["editar", "cursos-admin", "Modificar fechas", "editarCursos"],
      "curso-observado": ["editar", "cursos-admin", "Ver observaciones", "editarCursos"],
      "curso-rechazado": ["editar", "cursos-admin", "Ver observaciones", "editarCursos"],
      "curso-aprobado": ["curso", "cursos-admin", "Administrar curso", "editarCursos"],
      "curso-autorizado": ["curso", "cursos-admin", "Administrar curso", "editarCursos"],
      "curso-listo": ["seguimiento", "seguimiento-admin", "Ver evaluación pendiente", "reportes"],
      "curso-completado": ["seguimiento", "seguimiento-admin", "Ver resultado", "reportes"]
    };
    const d = mapa[n.tipo];
    return d ? { accion: d[0], seccion: d[1], texto: d[2], permiso: d[3] } : null;
  }
  function boton(n) {
    const d = destino(n);
    if (!d || (d.permiso && !permisos.tiene(d.permiso))) return "";
    return `<button type="button" class="btn btn-primario btn-sm" data-abrir-aviso="${escaparHtml(n.id)}">${d.texto}</button>`;
  }
  function enfocar(el) {
    if (!el) throw new Error("El registro ya no está disponible en este apartado.");
    if (!el.matches("button, input, select, textarea, a")) el.tabIndex = -1;
    el.focus({ preventScroll: true });
    window.desplazarPanel(el, { instantaneo: true });
  }
  const porDato = (nombre, id, contenedor = document) => [...contenedor.querySelectorAll(`[${nombre}]`)].find(el => iguales(el.getAttribute(nombre), id));
  function valor(id, contenido) { const el = document.getElementById(id); if (el) el.value = contenido; }
  async function abrir(n) {
    try {
      const d = n && destino(n);
      if (!d || (d.permiso && !permisos.tiene(d.permiso))) throw new Error("No tienes permiso para atender este aviso.");
      if(d.accion === "soporte") {
        window.location.href = "../trabajador/soporte.html" + (n.ticketId != null ? "?ticket=" + encodeURIComponent(n.ticketId) : "");
        return;
      }
      const usuarioId = n.usuarioId ?? n.usuario?.id;
      const cursoId = n.cursoId ?? n.curso?.id;
      if (typeof cargaDashboardEnCurso !== "undefined" && cargaDashboardEnCurso) await cargaDashboardEnCurso;
      if (typeof cargaInstructorEnCurso !== "undefined" && cargaInstructorEnCurso) await cargaInstructorEnCurso;
      let curso;
      if (["editar", "curso", "revision", "solicitud", "seguimiento"].includes(d.accion)) {
        curso = await cursos.obtener(cursoId);
        if (!curso || (sesion.rol() === "instructor" && !iguales(curso.solicitudCurso?.usuarioId, sesion.usuario()?.id))) throw new Error("El curso ya no está disponible para tu cuenta.");
        const indice = listaCursos.findIndex(c => iguales(c.id, curso.id));
        if (indice < 0) listaCursos.push(curso); else listaCursos[indice] = curso;
      }
      if (["password", "usuario", "usuarios", "seguimiento", "perfil"].includes(d.accion)) listaUsuarios = await usuarios.listar();
      const usuario = listaUsuarios.find(u => iguales(u.id, usuarioId));
      if (["password", "usuario", "seguimiento", "perfil"].includes(d.accion) && !usuario) throw new Error("El trabajador de este aviso ya no está disponible.");
      const seccion = document.getElementById(d.seccion);
      if (!seccion || seccion.hidden) throw new Error("Este apartado no está disponible para tu cuenta.");
      const panel = document.getElementById("panel-campana-admin");
      if (panel) panel.hidden = true;
      document.getElementById("btn-campana-admin")?.setAttribute("aria-expanded", "false");
      window.irASeccionPanel(d.seccion, null, true, true);
      if(d.accion==="ficha"){await window.abrirFichaInstructor(usuarioId);}
      else if (d.accion === "perfil") {
        if (usuario.rol !== "trabajador") throw new Error("Este aviso no corresponde a un perfil de trabajador.");
        await window.abrirPerfilTrabajador(usuario.id, document.querySelector(`[data-abrir-aviso="${CSS.escape(String(n.id))}"]`));
      } else if (d.accion === "password") {
        valor("buscar-usuarios", "");
        window.filtroUsuariosAviso = [usuario.id];
        estadoDashboard.usuarios.pagina = 1;
        pintarUsuarios();
        await abrirRestablecerPassword(usuario.id);
      } else if (["usuario", "usuarios"].includes(d.accion)) {
        valor("buscar-usuarios", "");
        window.filtroUsuariosAviso = d.accion === "usuario" ? [usuario.id] : (Array.isArray(n.usuarioIds) ? n.usuarioIds : null);
        estadoDashboard.usuarios.pagina = 1;
        pintarUsuarios();
        enfocar(d.accion === "usuario" ? porDato("data-rol-usuario", usuario.id)?.closest("tr") : document.getElementById("tabla-usuarios"));
        if (d.accion === "usuarios" && !n.usuarioIds) mostrarToastAdmin("Este aviso anterior no conserva el lote importado. Se muestra el listado de usuarios.", "info");
      } else if (d.accion === "editar") {
        await editarCursoEnFormulario(curso);
        if (iguales(cursoEnEdicionId, curso.id)) enfocar(document.getElementById(n.tipo === "curso-vencimiento" ? "nc-fecha-fin" : "nc-nombre"));
      } else if (d.accion === "curso") {
        pintarCursos();
        enfocar(porDato("data-curso-admin", curso.id));
      } else if (d.accion === "solicitud") {
        pintarMisSolicitudesCursos();
        enfocar(porDato("data-solicitud-curso", curso.id));
      } else if (d.accion === "revision") {
        pintarAprobacionesCursos();
        const tarjeta = document.getElementById(`revision-curso-${curso.id}`);
        if (!tarjeta) throw new Error("El curso ya no tiene una revisión pendiente. Consulta su estado en Cursos.");
        enfocar(tarjeta.querySelector("textarea") || tarjeta);
      } else if (d.accion === "seguimiento") {
        ["reporte-filtro-area", "buscar-seguimiento", "filtro-estado-seguimiento", "reporte-fecha-desde", "reporte-fecha-hasta"].forEach(id => valor(id, ""));
        inicializarFiltrosReporte();
        const trabajadores = document.getElementById("reporte-filtro-trabajador");
        [...trabajadores.options].forEach(o => o.selected = iguales(o.value, usuario.id));
        valor("reporte-filtro-curso", curso.nombre);
        construirSelectorTrabajadoresReporte();
        pintarSeguimiento();
        enfocar(document.getElementById("tabla-vista-previa-reporte"));
      }
    } catch (error) {
      mostrarToastAdmin(error.message || "No se pudo abrir el destino del aviso.", "error");
    }
  }
  window.destinosNotificaciones = { destino, boton, abrir };
})();
