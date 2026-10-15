// Centro de notificaciones del Instructor: autorizaciones, rechazos y comentarios.
(() => {
  const lista = document.getElementById("lista-notificaciones-instructor");
  const badge = document.getElementById("badge-notificaciones-instructor");
  if (!lista || !badge) return;
  const escapar = (valor) => String(valor ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const fecha = (valor) => valor ? new Date(valor).toLocaleString("es-MX", {dateStyle:"medium", timeStyle:"short"}) : "";
  let notificaciones = [];
  const botonCampana = document.getElementById("btn-campana-instructor");
  const panelCampana = document.getElementById("panel-campana-instructor");
  const listaCampana = document.getElementById("campana-instructor-lista");
  const badgeCampana = document.getElementById("campana-instructor-badge");
  const resumenCampana = document.getElementById("campana-instructor-resumen");
  let cargando = false;
  function cerrarCampana() {
    panelCampana.hidden = true;
    botonCampana.setAttribute("aria-expanded", "false");
  }
  const cargar = async () => {
    if (cargando || !sesion.activa()) return;
    cargando = true;
    try {
      const avisos = await notificacionesAdmin.listar();
      const propios = (Array.isArray(avisos) ? avisos : []).filter(n => ["curso-aprobado", "curso-rechazado", "curso-observado", "curso-autorizado", "plantilla-aceptada", "plantilla-rechazada", "evaluacion-terminada", "actividad-apartado"].includes(n.tipo));
      notificaciones = propios;
      badge.textContent = String(propios.filter(n => !n.leida).length);
      badge.hidden = !propios.some(n => !n.leida);
      const pendientes = propios.filter(n => !n.leida).length;
      badgeCampana.textContent = pendientes > 99 ? "99+" : String(pendientes);
      badgeCampana.style.display = pendientes ? "inline-flex" : "none";
      botonCampana.setAttribute("aria-label", pendientes ? `Notificaciones: ${pendientes} sin leer` : "Abrir notificaciones: sin avisos nuevos");
      resumenCampana.textContent = pendientes ? `${pendientes} aviso${pendientes === 1 ? "" : "s"} sin leer` : "Sin avisos nuevos";
      lista.innerHTML = propios.length ? propios.map(n => {
        const titulo = n.tipo === "actividad-apartado" ? "Actualización de CICSA" : n.tipo === "evaluacion-terminada" ? "Calificación registrada" : n.tipo === "plantilla-aceptada" ? "Plantilla aceptada" : n.tipo === "plantilla-rechazada" ? "Plantilla rechazada" : n.tipo === "curso-aprobado" ? "Curso autorizado" : n.tipo === "curso-rechazado" ? "Curso rechazado" : n.tipo === "curso-observado" ? "Curso con observaciones" : "Actualización de curso";
        const curso = n.curso?.nombre || "Curso";
        const comentario = n.comentario ? `<p><strong>Comentario del revisor:</strong> ${escapar(n.comentario)}</p>` : "";
        return `<article class="tarjeta notificacion-admin-nueva"><div class="notificacion-admin-contenido"><strong>${escapar(titulo)}: ${escapar(curso)}</strong><small>${escapar(fecha(n.fecha))}</small><p>${escapar(n.detalle || "Consulta el estado de tu solicitud.")}</p>${comentario}${window.destinosNotificaciones.boton(n)}</div><button type="button" class="btn btn-secundario btn-sm" data-quitar-notificacion="${escapar(n.id)}">Quitar</button></article>`;
      }).join("") : '<div class="estado-vacio-admin"><strong>No tienes notificaciones nuevas.</strong><span>Las autorizaciones, rechazos y comentarios aparecerán aquí.</span></div>';
      listaCampana.innerHTML = lista.innerHTML.replaceAll('class="tarjeta notificacion-admin-nueva"', 'class="admin-campana-item"').replaceAll('class="notificacion-admin-contenido"', 'class="admin-campana-texto"');
    } catch (error) {
      resumenCampana.textContent = "No se pudieron actualizar los avisos";
      if (!listaCampana.innerHTML) listaCampana.innerHTML = '<div class="admin-campana-vacia">Cierra y vuelve a abrir la campana para reintentar.</div>';
      lista.innerHTML = '<div class="estado-vacio-admin"><strong>No se pudieron cargar las notificaciones.</strong><span>Actualiza la página e intenta nuevamente.</span></div>';
    } finally { cargando = false; }
  };
  const gestionarAviso = async (evento) => {
    const directo = evento.target.closest("[data-abrir-aviso]");
    if (directo) {
      directo.disabled = true;
      cerrarCampana();
      try { await window.destinosNotificaciones.abrir(notificaciones.find(n => String(n.id) === directo.dataset.abrirAviso)); }
      finally { directo.disabled = false; }
      return;
    }
    const boton = evento.target.closest("[data-quitar-notificacion]");
    if (!boton) return;
    boton.disabled = true;
    try { await notificacionesAdmin.eliminar(boton.dataset.quitarNotificacion); await cargar(); }
    catch (error) { boton.disabled = false; window.CicsaToast?.mostrar("No se pudo quitar la notificaci\u00f3n. Intenta nuevamente.", "error"); }
  };
  lista.addEventListener("click", gestionarAviso);
  listaCampana.addEventListener("click", gestionarAviso);
  botonCampana.addEventListener("click", () => {
    panelCampana.hidden = !panelCampana.hidden;
    botonCampana.setAttribute("aria-expanded", String(!panelCampana.hidden));
    if (!panelCampana.hidden) cargar();
  });
  document.getElementById("btn-ver-notificaciones-instructor").addEventListener("click", () => {
    cerrarCampana();
    window.irASeccionPanel("notificaciones-instructor");
    lista.setAttribute("tabindex", "-1");
    lista.focus({ preventScroll: true });
  });
  document.addEventListener("click", evento => {
    if (!document.getElementById("campana-instructor").contains(evento.target)) cerrarCampana();
  });
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && !panelCampana.hidden) { cerrarCampana(); botonCampana.focus(); }
  });
  setInterval(() => { if (!document.hidden) cargar(); }, 15000);
  cargar();
  window.addEventListener("focus", cargar);
})();
