// worker-dashboard.js — Dashboard del trabajador con cursos asignados

sesion.requerir(["trabajador"]);
sesion.vigilarInactividad(20);

const trabajadorActual = sesion.usuario();
const bienvenidaTrabajador = document.getElementById("bienvenida-trabajador");
if (bienvenidaTrabajador && trabajadorActual?.nombre) {
  bienvenidaTrabajador.textContent = `Bienvenido, ${trabajadorActual.nombre.split(" ")[0]}`;
}

let itemsCursos = [];
let cursosVisibles = [];
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


function tiempoRestanteCurso(curso) {
  const fin = fechaCierreCurso(curso);
  if (!fin) return "⏱ Sin horario configurado";
  if (estadoTemporalCurso(curso) === "programado") return "⏱ Duración: " + curso.horas + " h";
  const seg = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
  return seg === 0 ? "⏱ Tiempo terminado" : "⏱ " + Math.floor(seg / 3600) + "h " + Math.floor(seg % 3600 / 60) + "m restantes";
}

function formatoProgramacion(iso) { return iso ? new Date(iso).toLocaleString("es-MX", {dateStyle:"short",timeStyle:"short"}) : ""; }

function obtenerThumbnailSegura(url) {
  const fallback = "../assets/soldador.avif";
  if (!url) return fallback;
  try {
    const valor = new URL(url, window.location.href);
    const esRutaRelativa = !/^[a-z][a-z0-9+.-]*:/i.test(String(url));
    const esImagenCargada = /^data:image\/[a-z0-9.+-]+;base64,/i.test(String(url));
    return esRutaRelativa || esImagenCargada || ["http:", "https:"].includes(valor.protocol)
      ? escaparHtml(esRutaRelativa ? String(url) : valor.href)
      : fallback;
  } catch (error) {
    return fallback;
  }
}

let solicitudMisCursos = 0;
let cargasMisCursosActivas = 0;
function firmaDatosCursos(items) {
  return items.map(({ curso = {}, progreso: avance = {}, asignado = true }) => [
    curso.id,
    curso.versionActual,
    curso.nombre,
    curso.estado,
    curso.fechaInicio,
    curso.fechaFin,
    curso.horas,
    avance.estado,
    avance.porcentaje,
    avance.bloqueadoPorExamen,
    avance.examenAprobado,
    Array.isArray(avance.completadas) ? avance.completadas.length : 0,
    asignado,
  ].join("\u001f")).join("\u001e");
}
async function cargarMisCursos({ silencioso = false } = {}) {
  if (silencioso && cargasMisCursosActivas > 0) return;
  cargasMisCursosActivas++;
  const solicitudActual = ++solicitudMisCursos;
  const rejilla = document.getElementById("rejilla-cursos-trabajador");
  if (rejilla && !silencioso) {
    rejilla.classList.add("is-loading");
    rejilla.setAttribute("aria-busy", "true");
    rejilla.innerHTML = Array.from({ length: 3 }, () => `
      <article class="skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton-thumbnail"></div>
        <div class="skeleton skeleton-line skeleton-line-title"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line skeleton-line-short"></div>
      </article>
    `).join("");
  }
  try {
    const nuevosCursos = await progreso.misCursos();
    if (solicitudActual !== solicitudMisCursos || sesion.rol() !== "trabajador"
        || Number(sesion.usuario()?.id) !== Number(trabajadorActual?.id)) return;
    if (silencioso && firmaDatosCursos(nuevosCursos) === firmaDatosCursos(itemsCursos)) return;
    itemsCursos = nuevosCursos;
    cursosVisibles = itemsCursos;
    actualizarEstadisticas(itemsCursos);
    actualizarPanelLateral(itemsCursos);
    actualizarNotificaciones(itemsCursos);
    filtrarCursos();
  } catch (error) {
    if (solicitudActual !== solicitudMisCursos) return;
    if (silencioso) { console.warn("No se pudieron actualizar los horarios del curso.", error); return; }
    if (rejilla) {
      rejilla.textContent = error.message || "No se pudieron cargar tus cursos.";
      rejilla.classList.add("estado-error");
    }
  } finally {
    cargasMisCursosActivas--;
    if (solicitudActual === solicitudMisCursos) {
      rejilla?.classList.remove("is-loading");
      rejilla?.setAttribute("aria-busy", "false");
    }
  }
}

function pintarCursos(items) {
  const rejilla = document.getElementById("rejilla-cursos-trabajador");
  if (!rejilla) return;
  rejilla.innerHTML = items.length
    ? items.map(({ curso, progreso: p, asignado = true }) => { const temporal=estadoTemporalCurso(curso); const noAsignado=asignado === false; const aprobado=p.estado === "completado" && p.examenAprobado; const bloqueado=noAsignado || (!aprobado && (temporal!=="abierto" || p.bloqueadoPorExamen)); const etiqueta=noAsignado?"Solo visualización · curso no asignado":aprobado?"Curso completado":temporal==="programado"?`Abre ${formatoProgramacion(curso.fechaInicio)}`:temporal==="cerrado"?"Curso cerrado":p.bloqueadoPorExamen?"Bloqueado · examen no aprobado":(p.estado === "no_iniciado" ? "Comenzar" : "Continuar"); return `
      <${bloqueado ? "article" : "a"} class="tarjeta-curso" ${bloqueado ? 'aria-disabled="true"' : `href="lector.html?id=${encodeURIComponent(curso.id)}" aria-label="Abrir curso: ${escaparHtml(curso.nombre)}"`}>
        <div class="tarjeta-curso-thumbnail">
          <img loading="lazy" decoding="async" src="${obtenerThumbnailSegura(curso.thumbnail)}" alt="${escaparHtml(curso.nombre)}" />
        </div>
        <div class="tarjeta-curso-contenido">
          <div class="tarjeta-curso-titulo">${escaparHtml(curso.nombre)}</div>
          <p class="muted">Instructor: ${escaparHtml(curso.instructorNombre || "Sin instructor asignado")}</p>
          <div class="tarjeta-curso-meta"><span>${escaparHtml(curso.categoria || "General")}</span><span class="tarjeta-curso-version">${Number.isInteger(curso.versionActual) && curso.versionActual > 0 ? `Versión ${curso.versionActual}` : "Versión no disponible"}</span><span class="tiempo-card">${tiempoRestanteCurso(curso)}</span></div>
          <p class="muted">${escaparHtml(curso.descripcion || "")}</p>
          <div class="tarjeta-curso-progreso">
            <span>${p.porcentaje}%</span>
            <div class="progreso-barra"><div class="progreso-relleno" style="width:${p.porcentaje}%"></div></div>
          </div>
          ${curso.fechaInicio || curso.fechaFin ? `<div class="tarjeta-curso-horario"><small>📅 ${curso.fechaInicio ? `Abre: ${formatoProgramacion(curso.fechaInicio)}` : "Disponible al publicar"}</small><small>🔒 ${curso.fechaFin ? `Cierra: ${formatoProgramacion(curso.fechaFin)}` : "Sin fecha de cierre"}</small></div>` : ""}
          ${bloqueado || aprobado ? `<p class="curso-disponibilidad">${escaparHtml(etiqueta)}</p>` : ""}
          ${!noAsignado && !aprobado && (temporal === "cerrado" || p.bloqueadoPorExamen) ? `<button type="button" class="btn btn-primario btn-sm" data-solicitar-repeticion="${escaparHtml(String(curso.id))}" data-nombre-curso="${escaparHtml(curso.nombre)}">Solicitar repetir curso</button>` : ""}
          ${noAsignado ? `<button type="button" class="btn btn-secundario btn-sm" data-ver-detalle-curso="${escaparHtml(String(curso.id))}">Ver detalles del curso</button>` : ""}
        </div>
      </${bloqueado ? "article" : "a"}>
    `; }).join("")
    : '<p class="muted">No hay cursos publicados por el momento.</p>';

  rejilla.querySelectorAll("[data-solicitar-repeticion]").forEach(boton => {
    boton.addEventListener("click", async (evento) => {
      evento.preventDefault(); evento.stopPropagation();
      if (boton.disabled) return;
      const cursoId = Number(boton.dataset.solicitarRepeticion);
      const nombre = boton.dataset.nombreCurso || "el curso";
      boton.disabled = true;
      try {
        await soporte.crear({ tipo: "repetir", cursoId, descripcion: `Solicito autorización para repetir el curso ${nombre}.` });
        boton.textContent = "Solicitud enviada";
        boton.title = "La solicitud está pendiente de autorización del Super Admin.";
        window.CicsaToast?.mostrar("Solicitud enviada a Admin y Super Admin.", "exito");
      } catch (error) {
        window.CicsaToast?.mostrar(error.message || "No se pudo enviar la solicitud.", "error");
        boton.disabled = false;
      }
    });
  });

  rejilla.querySelectorAll(".tarjeta-curso-thumbnail img").forEach((imagen) => {
    imagen.addEventListener("error", () => {
      if (imagen.dataset.fallbackAplicado === "true") return;
      imagen.dataset.fallbackAplicado = "true";
      imagen.src = "../assets/soldador.avif";
    });
  });
  rejilla.querySelectorAll("[data-ver-detalle-curso]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const item = items.find(({ curso }) => String(curso.id) === boton.dataset.verDetalleCurso);
      if (item) mostrarVistaPreviaCurso(item.curso);
    });
  });
}

function mostrarVistaPreviaCurso(curso) {
  document.getElementById("vista-previa-curso-publicado")?.remove();
  const modulos = (curso.modulos || []).map((modulo, i) => {
    const temas = modulo.temas?.length ? modulo.temas : [{ nombre: "Contenido", subtemas: modulo.lecciones || [] }];
    return `<section style="padding:12px 0;border-bottom:1px solid var(--borde-suave,#eee)"><h3>Tema ${i + 1}: ${escaparHtml(modulo.nombre || "Sin título")}</h3>${temas.map((tema, j) => `<div style="margin:10px 0"><strong>${escaparHtml(tema.nombre || `Unidad ${j + 1}`)}</strong><ul>${(tema.subtemas || []).map(sub => `<li>${escaparHtml(sub.nombre || "Subtema")}</li>`).join("") || "<li>Contenido del tema</li>"}</ul></div>`).join("")}</section>`;
  }).join("") || '<p class="muted">El curso todavía no tiene temas publicados.</p>';
  const modal = document.createElement("section");
  modal.id = "vista-previa-curso-publicado";
  modal.className = "perfil-trabajador-modal";
  modal.innerHTML = `<div class="perfil-trabajador-fondo" data-cerrar-vista-previa></div><article class="perfil-trabajador-card" role="dialog" aria-modal="true" aria-labelledby="vista-previa-curso-titulo"><button type="button" class="perfil-trabajador-cerrar" data-cerrar-vista-previa aria-label="Cerrar">×</button><span class="admin-bloque-kicker">Solo visualización</span><h2 id="vista-previa-curso-titulo">${escaparHtml(curso.nombre)}</h2><p>Instructor: ${escaparHtml(curso.instructorNombre || "Sin instructor asignado")}</p><p>${escaparHtml(curso.descripcion || "Información del curso")}</p><p class="muted">${escaparHtml(curso.categoria || "General")} · ${escaparHtml(String(curso.horas || "—"))} horas</p><div style="max-height:55vh;overflow:auto">${modulos}</div><p class="curso-disponibilidad">Este curso no está asignado a tu cuenta. Puedes consultar su información, pero no iniciar actividades ni evaluaciones.</p></article>`;
  document.body.appendChild(modal);
  document.body.classList.add("admin-modal-abierto");
  const cerrar = () => { modal.remove(); document.body.classList.remove("admin-modal-abierto"); };
  modal.querySelectorAll("[data-cerrar-vista-previa]").forEach(el => el.addEventListener("click", cerrar));
  modal.querySelector(".perfil-trabajador-cerrar")?.focus();
}

function filtrarCursos() {
  const consulta = document.getElementById("buscar-curso")?.value.trim().toLowerCase() || "";
  cursosVisibles = itemsCursos.filter(({ curso }) => {
    const texto = [curso.nombre, curso.descripcion, curso.categoria, curso.academia].join(" ").toLowerCase();
    return !consulta || texto.includes(consulta);
  });
  pintarCursos(cursosVisibles);
}

function actualizarPanelLateral(items) {
  const logros = document.getElementById("logros-container");
  const tareas = document.getElementById("tareas-container");
  if (!logros || !tareas) return;
  const completados = items.filter(({ progreso }) => progreso.estado === "completado");
  logros.innerHTML = completados.length
    ? completados.slice(0, 3).map(({ curso }) => `
      <div class="logro-item"><span class="logro-icono">✓</span><div><strong>${escaparHtml(curso.nombre)}</strong><small>Curso completado</small></div></div>
    `).join("")
    : '<div class="panel-vacio">No hay logros todavía</div>';
  const pendientes = items.filter(({ progreso }) => progreso.estado !== "completado");
  tareas.innerHTML = pendientes.length
    ? pendientes.slice(0, 3).map(({ curso, progreso }) => `
      <div class="tarea-item"><strong>${progreso.estado === "no_iniciado" ? "Comenzar curso" : "Continuar curso"}</strong><span>${escaparHtml(curso.nombre)}</span></div>
    `).join("")
    : '<div class="panel-vacio">No tienes tareas pendientes</div>';
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
    document.getElementById("notificaciones-error").textContent = "No se pudo guardar el cambio. Intenta quitar la notificación de nuevo.";
    window.CicsaToast?.mostrar(document.getElementById("notificaciones-error").textContent, "error");
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

function mostrarToast(mensaje, cursoNombre = "Curso") {
  window.CicsaToast?.mostrar(mensaje + " " + cursoNombre, "exito");
}

function actualizarEstadisticas(items) {
  const completados = items.filter((i) => i.progreso.estado === "completado").length;
  const enProceso = items.filter((i) => i.progreso.estado === "en_proceso").length;
  const noIniciados = items.filter((i) => i.progreso.estado === "no_iniciado").length;

  document.getElementById("stat-completados").textContent = completados;
  document.getElementById("stat-progreso").textContent = enProceso;
  document.getElementById("stat-noIniciados").textContent = noIniciados;
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  const btnNotificaciones = document.getElementById("btn-notificaciones");
  const modalNotificaciones = document.getElementById("modal-notificaciones");
  const btnCerrarNotificaciones = document.querySelector(".modal-notificaciones-close");

  document.getElementById("lista-notificaciones")?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-notificacion-id]");
    if (boton) descartarNotificaciones([boton.dataset.notificacionId]);
  });
  document.getElementById("btn-quitar-todas-notificaciones")?.addEventListener("click", () => {
    descartarNotificaciones(obtenerNotificacionesTrabajador(itemsCursos).map(aviso => aviso.id));
  });
  if (btnNotificaciones) {
    btnNotificaciones.addEventListener("click", abrirModalNotificaciones);
  }

  if (btnCerrarNotificaciones) {
    btnCerrarNotificaciones.addEventListener("click", cerrarModalNotificaciones);
  }

  ["buscar-curso"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", filtrarCursos);
    document.getElementById(id)?.addEventListener("change", filtrarCursos);
  });

  document.querySelector(".help-btn")?.addEventListener("click", () => { window.location.href = "tutorial.html"; });


  if (modalNotificaciones) {
    modalNotificaciones.addEventListener("click", (event) => {
      if (event.target === modalNotificaciones) {
        cerrarModalNotificaciones();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && modalNotificaciones && !modalNotificaciones.classList.contains("oculto")) {
      const controles = [...modalNotificaciones.querySelectorAll("button")].filter(b => !b.hidden && !b.disabled && b.getClientRects().length);
      const primero = controles[0], ultimo = controles[controles.length - 1];
      if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo?.focus(); }
      else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero?.focus(); }
    }
    if (event.key === "Escape" && modalNotificaciones && !modalNotificaciones.classList.contains("oculto")) {
      cerrarModalNotificaciones();
    }
  });

  // Cargar cursos
  cargarMisCursos();
});


// Actualiza las tarjetas al cambiar de minuto o alcanzar apertura/cierre.
let firmaHorariosCursos = "";
let minutoAvisos = -1;
function refrescarHorariosCursos() {
  if (!sesion.activa() || !itemsCursos.length) return;
  const minuto = Math.floor(Date.now() / 60000);
  if(minuto !== minutoAvisos) {
    minutoAvisos = minuto;
    actualizarNotificaciones(itemsCursos);
    const modal = document.getElementById("modal-notificaciones");
    if(modal && !modal.classList.contains("oculto")) pintarNotificacionesTrabajador();
  }
  const firma = itemsCursos.map(({curso}) => curso.id + ":" + estadoTemporalCurso(curso) + ":" + tiempoRestanteCurso(curso)).join("|");
  if (firma === firmaHorariosCursos) return;
  firmaHorariosCursos = firma;
  filtrarCursos();
}
setInterval(refrescarHorariosCursos, 1000);
function consultarHorariosActualizados() {
  if (document.hidden || !sesion.activa() || sesion.rol() !== "trabajador"
      || Number(sesion.usuario()?.id) !== Number(trabajadorActual?.id)) return;
  return cargarMisCursos({ silencioso: true });
}
window.addEventListener("focus", consultarHorariosActualizados);
window.addEventListener("pageshow", (evento) => {
  if (evento.persisted) consultarHorariosActualizados();
});
document.addEventListener("visibilitychange", consultarHorariosActualizados);
window.addEventListener("storage", (evento) => {
  if (["cicsa_cursos", "cicsa_progreso", "cicsa_comunicados", "cicsa_notificaciones_admin"].includes(evento.key) || evento.key === null) {
    consultarHorariosActualizados();
    const modal = document.getElementById("modal-notificaciones");
    if (evento.key === "cicsa_comunicados" && modal && !modal.classList.contains("oculto")) pintarNotificacionesTrabajador();
  }
});

// En modo demo, la sincronización entre pestañas usa el evento `storage`.
// Evita volver a descargar y clonar videos/imágenes cada cinco segundos.
if (!MOCK_MODE) setInterval(consultarHorariosActualizados, 60000);
