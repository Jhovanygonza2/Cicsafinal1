// campana-admin.js — Centro rápido de alertas del administrador

function construirAlertasAdmin() {
  const solicitudesPendientes = listaSolicitudes.filter((s) => s.estado === "pendiente");
  const alertasPassword = solicitudesPendientes.map((s) => {
    const usuario = listaUsuarios.find((u) => u.id === s.usuarioId);
    return { tipo: "password", fecha: s.fecha, usuario, solicitud: s };
  });
  const alertasCursos = listaNotificaciones
    .filter((n) => ["repetir-solicitado", "instructor-modificado", "actividad-apartado", "comunicado-publicado", "curso-completado", "curso-listo", "curso-revision", "curso-vencimiento", "usuario-nuevo", "usuarios-nuevos", "curso-autorizado", "curso-observado", "curso-aprobado", "curso-rechazado", "evaluacion-terminada"].includes(n.tipo))
    .map((n) => ({ tipo: n.tipo, fecha: n.fecha, usuario: n.usuario, curso: n.curso, notificacion: n }));
  return [...alertasPassword, ...alertasCursos]
    .filter((a) => a.usuario || a.notificacion)
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
}

function pintarCampanaAdmin() {
  const boton = document.getElementById("btn-campana-admin");
  const badge = document.getElementById("campana-admin-badge");
  const lista = document.getElementById("campana-admin-lista");
  const resumen = document.getElementById("campana-admin-resumen");
  if (!boton || !badge || !lista || !resumen) return;
  const alertas = construirAlertasAdmin();
  const cantidad = alertas.length;
  badge.textContent = cantidad > 99 ? "99+" : String(cantidad);
  badge.style.display = cantidad ? "inline-flex" : "none";
  resumen.textContent = cantidad ? `${cantidad} alerta${cantidad === 1 ? "" : "s"} pendiente${cantidad === 1 ? "" : "s"}` : "Avisos de capacitación";
  lista.innerHTML = alertas.length ? alertas.slice(0, 8).map((a) => {
    const nombre = escaparHtml(a.usuario?.nombre || "Un usuario");
    if (a.tipo === "password") {
      return `<article class="admin-campana-item campana-password"><div class="admin-campana-icono">${iconoNotificacionAdmin("password")}</div><div class="admin-campana-texto"><strong>${nombre} pidió restablecer su contraseña</strong><small>${formatoFecha(a.fecha)}</small><button type="button" class="btn btn-primario btn-sm" data-campana-password="${a.usuario.id}">Editar contraseña</button></div></article>`;
    }
    if (a.tipo === "curso-revision") {
      return `<article class="admin-campana-item campana-curso"><div class="admin-campana-icono">${iconoNotificacionAdmin("curso")}</div><div class="admin-campana-texto"><strong>${nombre} envió «${escaparHtml(a.curso?.nombre || "un curso")}» para revisión</strong><small>${formatoFecha(a.fecha)}</small>${window.destinosNotificaciones.boton(a.notificacion)}</div></article>`;
    }
    const textoAviso = a.tipo === "repetir-solicitado" ? (a.notificacion.detalle || `${a.usuario?.nombre || "Un trabajador"} solicitó repetir ${a.curso?.nombre || "un curso"}.`) : ["instructor-modificado", "actividad-apartado", "comunicado-publicado"].includes(a.tipo) ? a.notificacion.detalle : a.tipo === "curso-vencimiento" ? `El curso «${a.curso?.nombre || "Curso"}» está próximo a vencer.`
      : a.tipo === "usuario-nuevo" ? `Nuevo usuario: ${nombre}.`
      : a.tipo === "usuarios-nuevos" ? (a.notificacion?.detalle || "Se agregaron usuarios nuevos.")
      : a.tipo === "evaluacion-terminada" ? (a.notificacion?.detalle || "Se registró una calificación.")
      : ["curso-autorizado", "curso-observado", "curso-aprobado", "curso-rechazado"].includes(a.tipo) ? (a.notificacion?.detalle || "Se actualizó el estado de un curso.")
      : a.tipo === "curso-completado" ? `${nombre} terminó y aprobó «${a.curso?.nombre || "un curso"}»${a.notificacion?.nota != null ? ` con ${a.notificacion.nota}/100` : ""}.`
      : a.tipo === "curso-listo" ? `${nombre} terminó el contenido de «${a.curso?.nombre || "un curso"}» y tiene evaluación pendiente.`
      : `${nombre} terminó ${a.curso?.nombre || "un curso"}.`;
    return `<article class="admin-campana-item campana-curso"><div class="admin-campana-icono">${iconoNotificacionAdmin("curso")}</div><div class="admin-campana-texto"><strong>${escaparHtml(textoAviso)}</strong><small>${formatoFecha(a.fecha)}</small>${window.destinosNotificaciones.boton(a.notificacion)}</div></article>`;
  }).join("") : '<div class="admin-campana-vacia aviso-admin-vacio">' + avisoVacioAdmin() + '</div>';
}

function abrirCampanaAdmin() {
  const panel = document.getElementById("panel-campana-admin");
  const boton = document.getElementById("btn-campana-admin");
  if (!panel || !boton) return;
  const abierto = !panel.hidden;
  panel.hidden = abierto;
  boton.setAttribute("aria-expanded", String(!abierto));
}

function irASolicitudPassword(idUsuario) {
  return window.destinosNotificaciones.abrir({ tipo: "password", usuarioId: idUsuario });
}

document.getElementById("btn-campana-admin")?.addEventListener("click", (e) => { e.stopPropagation(); abrirCampanaAdmin(); });
document.getElementById("panel-campana-admin")?.addEventListener("click", (e) => {
  const password = e.target.closest("[data-campana-password]");
  if (password) { e.stopPropagation(); irASolicitudPassword(password.dataset.campanaPassword); return; }
  const directo = e.target.closest("[data-abrir-aviso]");
  if (directo) {
    e.stopPropagation();
    directo.disabled = true;
    window.destinosNotificaciones.abrir(listaNotificaciones.find(n => String(n.id) === directo.dataset.abrirAviso)).finally(() => { directo.disabled = false; });
    return;
  }

});
document.getElementById("btn-ver-notificaciones")?.addEventListener("click", () => {
  const panel = document.getElementById("panel-campana-admin");
  if (panel) panel.hidden = true;
  document.getElementById("notificaciones-admin")?.scrollIntoView({ behavior: "smooth", block: "start" });
});
document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".admin-campana-wrap");
  const panel = document.getElementById("panel-campana-admin");
  const boton = document.getElementById("btn-campana-admin");
  if (wrap && panel && boton && !wrap.contains(e.target)) { panel.hidden = true; boton.setAttribute("aria-expanded", "false"); }
});

// El panel administrativo consulta alertas periódicamente para detectar nuevas solicitudes
// y cursos terminados mientras el administrador mantiene la página abierta.
setInterval(async () => {
  if (!sesion.activa() || !permisos.tiene("usuarios") || cargaDashboardEnCurso) return;
  try {
    const [solicitudes, notificaciones] = await Promise.all([permisos.tiene("password") ? solicitudesReset.listar() : Promise.resolve([]), notificacionesAdmin.listar()]);
    listaSolicitudes = solicitudes;
    listaNotificaciones = notificaciones;
    pintarNotificaciones();
    pintarCampanaAdmin();
  } catch (error) { /* el panel seguirá funcionando con los últimos datos */ }
}, 15000);
