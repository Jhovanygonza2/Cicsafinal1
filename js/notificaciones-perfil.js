// Notificaciones del perfil: mismas claves de descarte que Mi aprendizaje.
(() => {
const trabajadorActual = sesion.usuario();
let itemsCursos = [];
let notificacionesMostradas = false;
const vencimientosMostrados = new Set();
const claveNotificaciones = `cicsa_notificaciones_descartadas_${trabajadorActual?.id || "anonimo"}`;
let notificacionesEliminadas = new Set();
try {
  const guardadas = JSON.parse(localStorage.getItem(claveNotificaciones) || "[]");
  if (Array.isArray(guardadas)) notificacionesEliminadas = new Set(guardadas.map(String));
} catch (error) { console.warn("No se pudieron leer las notificaciones descartadas.", error); }
let focoAntesNotificaciones = null;

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



function formatoProgramacion(iso) { return iso ? new Date(iso).toLocaleString("es-MX", {dateStyle:"short",timeStyle:"short"}) : ""; }
function mostrarToast(mensaje, cursoNombre = "") { window.CicsaToast?.mostrar(mensaje + " " + cursoNombre, "exito"); }
function avisosPersistidosTrabajador() {
  try {
    const usuario = sesion.usuario();
    const guardados = JSON.parse(localStorage.getItem("cicsa_notificaciones_admin") || "[]");
    return (Array.isArray(guardados) ? guardados : []).filter(n => n.destinatarioRol === "trabajador" && String(n.destinatarioId) === String(usuario?.id)).map(n => ({
      id: String(n.id), tipo: n.tipo || "actividad-apartado", destino: n.destino, icono: iconoAviso("comunicado"),
      etiqueta: "Novedad de CICSA", nombre: n.titulo || "Actualización", mensaje: n.detalle || "Hay una novedad para ti.",
    }));
  } catch { return []; }
}
function iconoAviso(tipo) {
  const trazos = {
    completado: '<path d="m5 12 4 4L19 6"/>',
    programado: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cerrado: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    abierto: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    comunicado: '<path d="M4 11v2a2 2 0 0 0 2 2h2l8 4V5l-8 4H6a2 2 0 0 0-2 2ZM8 15l1.5 5H13l-2-4"/><path d="M19 9a4 4 0 0 1 0 6"/>'
  };
  return '<svg class="perfil-icono-lineal" viewBox="0 0 24 24" aria-hidden="true">' + trazos[tipo] + '</svg>';
}
function obtenerNotificacionesTrabajador(items, ahora = new Date()) {
  const avisos = avisosPersistidosTrabajador();
  try {
    const comunicados = JSON.parse(localStorage.getItem("cicsa_comunicados") || "[]");
    if (Array.isArray(comunicados)) comunicados.filter(c => {
      if (!c.fechaLimite) return true;
      const limite = new Date(`${c.fechaLimite}T23:59:59`);
      return Number.isNaN(limite.getTime()) || ahora <= limite;
    }).forEach(c => avisos.push({id:`comunicado-${c.id}`,tipo:"comunicado",icono:iconoAviso("comunicado"),etiqueta:"Nuevo comunicado",nombre:c.titulo || "Comunicado",mensaje:c.categoria || "Hay un nuevo comunicado disponible en Inicio."}));
  } catch (error) { console.warn("No se pudieron leer los comunicados para las notificaciones.", error); }
  items.forEach(({curso, progreso: avance, asignado}) => {
    const permiso = avance?.reapertura;
    if(asignado === true && curso.accesoReautorizado === true && permiso?.inicio && permiso?.fin && ahora < new Date(permiso.fin) && avance.estado !== "completado") {
      avisos.push({id:`repeticion-autorizada-${curso.id}-${permiso.inicio}`, tipo:"repeticion-autorizada", icono:iconoAviso("abierto"), etiqueta:"Ya puedes repetir el curso", nombre:curso.nombre, cursoId:curso.id, asignado:true, mensaje:`Se autorizó una nueva oportunidad. Puedes volver a realizar el curso hasta el ${formatoProgramacion(permiso.fin)}.`});
    }
    if (avance?.estado === "completado") {
      const notaFinal = avance?.resultadoFinal?.nota ?? avance?.nota ?? null;
      avisos.push({id: String(curso.id), tipo: "completado", icono: iconoAviso("completado"), etiqueta: "Curso completado", nombre: curso.nombre, cursoId: curso.id, asignado: true, nota: notaFinal, mensaje: `Terminaste este curso${notaFinal != null ? ` con una calificación de ${notaFinal}/100` : ""}. Consulta tu resultado en tu perfil.`});
    } else if (curso.fechaFin && ahora >= new Date(curso.fechaFin)) {
      avisos.push({id: `cerrado-${curso.id}-${curso.fechaFin}`, tipo: "cerrado", icono: iconoAviso("cerrado"), etiqueta: "Curso cerrado", nombre: curso.nombre, cursoId: curso.id, asignado, mensaje: `El periodo de este curso terminó el ${formatoProgramacion(curso.fechaFin)}.`});
    } else if (curso.fechaInicio && ahora < new Date(curso.fechaInicio)) {
      if (asignado === true) avisos.push({id: `inicio-${curso.id}-${curso.fechaInicio}`, tipo: "programado", icono: iconoAviso("programado"), etiqueta: "Próxima apertura", nombre: curso.nombre, cursoId: curso.id, asignado:true, mensaje: `Tienes este curso asignado. Estará disponible a partir del ${formatoProgramacion(curso.fechaInicio)}.`});
      else avisos.push({id: `nuevo-programado-${curso.id}-${curso.fechaInicio}`, tipo: "programado", icono: iconoAviso("programado"), etiqueta: "Próximo curso", nombre: curso.nombre, cursoId: curso.id, asignado:false, mensaje: `Este curso se publicará próximamente (${formatoProgramacion(curso.fechaInicio)}).`});
    } else {
      const estado = avance?.estado || "no_iniciado";
      if (asignado === true) {
        if (estado !== "completado") {
          avisos.push({id: `pendiente-${curso.id}`, tipo: "abierto", icono: iconoAviso("abierto"), etiqueta: estado === "en_proceso" || estado === "listo_examen" ? "Curso pendiente" : "Curso asignado", nombre: curso.nombre, cursoId: curso.id, asignado:true, estadoCurso:estado, mensaje: estado === "en_proceso" ? "Tienes este curso en proceso. Continúa para completarlo." : estado === "listo_examen" ? "Terminaste el contenido; tienes pendiente presentar el examen." : "Este curso está asignado a tu cuenta y está pendiente de completar."});
        }
      } else {
        avisos.push({id: `nuevo-disponible-${curso.id}`, tipo: "abierto", icono: iconoAviso("abierto"), etiqueta: "Nuevo curso disponible", nombre: curso.nombre, cursoId: curso.id, asignado:false, mensaje: "Este curso ya está publicado. Si no aparece como asignado, consulta con el administrador."});
      }
      if (asignado === true && curso.fechaFin) {
        const restante = new Date(curso.fechaFin).getTime() - ahora.getTime();
        if (restante > 0 && restante <= 7 * 24 * 60 * 60 * 1000 && estado !== "completado") {
          avisos.push({id: `vence-pronto-${curso.id}-${curso.fechaFin}`, tipo: "vencimiento", icono: iconoAviso("programado"), etiqueta: "Tu curso está por terminar", nombre: curso.nombre, cursoId: curso.id, asignado:true, mensaje: `El curso vence el ${formatoProgramacion(curso.fechaFin)}. Completa lo pendiente antes de esa fecha.`});
        }
      }
    }
  });
  return avisos.filter(aviso => !notificacionesEliminadas.has(aviso.id));
}

function actualizarNotificaciones(items) {
  const btn = document.getElementById("btn-notificaciones");
  const badge = document.getElementById("notificaciones-badge");
  if (!btn || !badge) return;
  const avisos = obtenerNotificacionesTrabajador(items);
  btn.style.display = "inline-flex";
  btn.title = avisos.length ? `Tienes ${avisos.length} notificaciones` : "Sin notificaciones";
  btn.setAttribute("aria-label", btn.title);
  badge.textContent = avisos.length;
  badge.style.display = avisos.length ? "flex" : "none";
  const vencimiento = avisos.find(aviso => aviso.tipo === "repeticion-autorizada" && !vencimientosMostrados.has(aviso.id)) || avisos.find(aviso => aviso.tipo === "vencimiento" && !vencimientosMostrados.has(aviso.id));
  if(vencimiento && window.CicsaToast) {
    window.CicsaToast.mostrar(vencimiento.nombre + ": " + vencimiento.mensaje, vencimiento.tipo === "repeticion-autorizada" ? "exito" : "advertencia");
    vencimientosMostrados.add(vencimiento.id);
  }
  const completado = avisos.find(aviso => aviso.tipo === "completado");
  if (completado && !notificacionesMostradas) {
    mostrarToast("¡Curso completado!", completado.nombre);
    notificacionesMostradas = true;
  }
}

function descartarNotificaciones(ids) {
  const siguientes = new Set([...notificacionesEliminadas, ...ids.map(String)]);
  try {
    localStorage.setItem(claveNotificaciones, JSON.stringify([...siguientes]));
  } catch (error) {
    document.getElementById("notificaciones-error").textContent = "No se pudo guardar el cambio. Intenta quitar la notificación de nuevo."; window.CicsaToast?.mostrar("No se pudo guardar el cambio. Intenta quitar la notificación de nuevo.","error");
    return;
  }
  notificacionesEliminadas = siguientes;
  document.getElementById("notificaciones-error").textContent = "";
  actualizarNotificaciones(itemsCursos);
  pintarNotificacionesTrabajador();
  document.getElementById("notificaciones-estado").textContent = ids.length === 1 ? "Notificación eliminada." : "Notificaciones eliminadas.";
  window.CicsaToast?.mostrar(document.getElementById("notificaciones-estado").textContent, "exito");
  const siguiente = document.querySelector("#lista-notificaciones .btn-quitar-notificacion");
  (siguiente || document.querySelector(".modal-notificaciones-close"))?.focus();
}

function rutaAccionTrabajador(aviso) {
  const base = window.location.pathname.includes("/trabajador/") ? "" : "trabajador/";
  if (aviso.destino === "soporte") return { href: `${base}soporte.html`, texto: "Ver solicitud" };
  if (aviso.destino === "perfil-insignias") return { href: `${base}perfil.html#vista-insignias`, texto: "Ver insignias y constancias" };
  if (aviso.tipo === "comunicado") return { href: `${base}inicio.html#comunicados-trabajador`, texto: "Ver comunicado" };
  if (aviso.tipo === "completado") return { href: `${base}perfil.html`, texto: "Ver mi calificación" };
  if (aviso.tipo === "repeticion-autorizada") return { href: `${base}lector.html?id=${encodeURIComponent(aviso.cursoId)}`, texto: "Ir al curso" };
  if (aviso.asignado === true && ["abierto", "vencimiento"].includes(aviso.tipo)) return { href: `${base}lector.html?id=${encodeURIComponent(aviso.cursoId)}`, texto: aviso.estadoCurso === "listo_examen" ? "Presentar evaluación" : "Continuar curso" };
  if (aviso.tipo === "programado" && aviso.asignado === true) return { href: `${base}dashboard.html`, texto: "Ver curso asignado" };
  if (aviso.tipo === "cerrado") return { href: `${base}dashboard.html`, texto: "Consultar cursos" };
  return { href: `${base}dashboard.html`, texto: aviso.asignado === false ? "Consultar cursos disponibles" : "Ver mis cursos" };
}

function pintarNotificacionesTrabajador() {
  const lista = document.getElementById("lista-notificaciones");
  const avisos = obtenerNotificacionesTrabajador(itemsCursos);
  document.getElementById("notificaciones-resumen").textContent = avisos.length ? `${avisos.length} aviso${avisos.length === 1 ? " pendiente" : "s pendientes"}` : "Avisos de tus cursos";
  document.getElementById("btn-quitar-todas-notificaciones").hidden = !avisos.length;
  lista.innerHTML = avisos.length ? avisos.map(aviso => {
    const accion = rutaAccionTrabajador(aviso);
    return `
    <article class="item-notificacion notificacion-${aviso.tipo}">
      <div class="item-notificacion-icono" aria-hidden="true">${aviso.icono}</div>
      <div class="item-notificacion-texto"><small class="notificacion-etiqueta">${escaparHtml(aviso.etiqueta)}</small><strong>${escaparHtml(aviso.nombre)}</strong><span>${escaparHtml(aviso.mensaje)}</span><a class="btn btn-secundario btn-sm" href="${escaparHtml(accion.href)}">${escaparHtml(accion.texto)}</a></div>
      <button type="button" class="btn-quitar-notificacion" data-notificacion-id="${escaparHtml(aviso.id)}" aria-label="Quitar notificación: ${escaparHtml(aviso.nombre)}">Quitar</button>
    </article>`;
  }).join("") : '<div class="notificaciones-vacias"><span class="notificaciones-vacias-icono" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-3-3-9M10 21h4"/><path d="m9 10 2 2 4-4"/></svg></span><div><strong>No tienes avisos pendientes</strong><p>Te avisaremos cuando haya novedades en tus cursos.</p></div></div>';
}

function abrirModalNotificaciones() {
  const modal = document.getElementById("modal-notificaciones");
  if (!modal) return;
  focoAntesNotificaciones = document.activeElement;
  pintarNotificacionesTrabajador();
  modal.classList.remove("oculto");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("notificaciones-abiertas");
  document.getElementById("btn-notificaciones")?.setAttribute("aria-expanded", "true");
  modal.querySelector(".modal-notificaciones-close")?.focus();
}

function cerrarModalNotificaciones() {
  const modal = document.getElementById("modal-notificaciones");
  if (!modal) return;
  modal.classList.add("oculto");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("notificaciones-abiertas");
  document.getElementById("btn-notificaciones")?.setAttribute("aria-expanded", "false");
  if (focoAntesNotificaciones?.isConnected) focoAntesNotificaciones.focus();
}


const modal = document.getElementById("modal-notificaciones");
const boton = document.getElementById("btn-notificaciones");
let consultaEnCurso = false;
async function refrescar(silencioso = false) {
  if (consultaEnCurso || !sesion.activa()) return;
  consultaEnCurso = true;
  const estado = document.getElementById("notificaciones-estado");
  if(!silencioso) estado.textContent = "Actualizando avisos…";
  try {
    const items = await progreso.misCursos();
    window.notificacionesPerfil.actualizar(items);
    document.getElementById("notificaciones-error").textContent = "";
    if(!silencioso) { estado.textContent = "Avisos actualizados."; window.CicsaToast?.mostrar("Avisos actualizados.","info"); }
  } catch (error) {
    if(silencioso) return;
    document.getElementById("notificaciones-error").textContent = "No se pudieron actualizar los avisos. Cierra y vuelve a abrir las notificaciones para reintentar."; window.CicsaToast?.mostrar("No se pudieron actualizar los avisos. Cierra y vuelve a abrir las notificaciones para reintentar.","error");
    estado.textContent = "";
  } finally { consultaEnCurso = false; }
}
window.notificacionesPerfil = {
  actualizar(items) {
    itemsCursos = items;
    actualizarNotificaciones(items);
    if (!modal.classList.contains("oculto")) pintarNotificacionesTrabajador();
  }
};
boton.addEventListener("click", () => { abrirModalNotificaciones(); refrescar(); });
modal.querySelector(".modal-notificaciones-close").addEventListener("click", cerrarModalNotificaciones);
modal.addEventListener("click", e => { if (e.target === modal) cerrarModalNotificaciones(); });
document.getElementById("lista-notificaciones").addEventListener("click", e => {
  const boton = e.target.closest("[data-notificacion-id]");
  if (boton) descartarNotificaciones([boton.dataset.notificacionId]);
});
document.getElementById("btn-quitar-todas-notificaciones").addEventListener("click", () =>
  descartarNotificaciones(obtenerNotificacionesTrabajador(itemsCursos).map(n => n.id)));
document.addEventListener("keydown", e => {
  if (modal.classList.contains("oculto")) return;
  if (e.key === "Escape") { cerrarModalNotificaciones(); return; }
  if (e.key !== "Tab") return;
  const controles = [...modal.querySelectorAll("button")].filter(b => !b.hidden && !b.disabled && b.getClientRects().length);
  const primero = controles[0], ultimo = controles[controles.length - 1];
  if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo?.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero?.focus(); }
});
window.addEventListener("storage", e => {
  if (e.key === claveNotificaciones || e.key === "cicsa_comunicados" || e.key === "cicsa_notificaciones_admin" || e.key === null) {
    if (e.key === "cicsa_comunicados" || e.key === "cicsa_notificaciones_admin") {
      window.notificacionesPerfil.actualizar(itemsCursos);
      const modal = document.getElementById("modal-notificaciones");
      if (modal && !modal.classList.contains("oculto")) pintarNotificacionesTrabajador();
      return;
    }
    try {
      const ids = JSON.parse(localStorage.getItem(claveNotificaciones) || "[]");
      notificacionesEliminadas = new Set(Array.isArray(ids) ? ids.map(String) : []);
      window.notificacionesPerfil.actualizar(itemsCursos);
    } catch {}
  }
});
setInterval(() => { if (!document.hidden && sesion.activa() && sesion.rol() === "trabajador") {
  window.notificacionesPerfil.actualizar(itemsCursos);
  refrescar(true);
} }, 30000);
})();
