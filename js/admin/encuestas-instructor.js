// Las respuestas nunca se solicitan desde perfiles administrativos ordinarios.
(() => {
  const seccion = document.getElementById("encuestas-instructor-admin");
  if (sesion.rol() !== "superadmin") { seccion?.remove(); return; }
  if (!seccion) return;
  seccion.hidden = false;
  document.querySelector('[href="#encuestas-instructor-admin"]')?.removeAttribute("hidden");
  const lista = document.getElementById("lista-encuestas-instructor");
  const filtro = document.getElementById("filtro-encuestas-instructor");
  const resumen = document.getElementById("resumen-encuestas-instructor");
  const boton = document.getElementById("actualizar-encuestas-instructor");
  const modalRespuestas = document.getElementById("modal-respuestas-recibidas");
  const abrirRespuestas = document.getElementById("abrir-respuestas-recibidas");
  abrirRespuestas.addEventListener("click", () => {
    if (sesion.rol() !== "superadmin" || modalRespuestas.open) return;
    modalRespuestas.showModal();
    cargar();
  });
  document.getElementById("cerrar-respuestas-recibidas").addEventListener("click", () => modalRespuestas.close());
  modalRespuestas.addEventListener("close", () => abrirRespuestas.focus());
  let registros = [];
  const criterios = { claridad: "Claridad", dominio: "Dominio del tema", organizacion: "Organizaci\u00f3n", materiales: "Materiales y ejemplos", general: "Valoraci\u00f3n general" };
  function pintar() {
    const consulta = filtro.value.trim().toLocaleLowerCase();
    const visibles = registros.filter(r => [r.trabajador,r.curso].some(v => String(v || "").toLocaleLowerCase().includes(consulta)));
    const notas = visibles.flatMap(r => Object.values(r.puntuaciones)).filter(n => Number.isFinite(n));
    const promedio = notas.length ? (notas.reduce((s,n) => s+n,0) / notas.length).toFixed(1) : "-";
    resumen.textContent = `${visibles.length} evaluaciones. Promedio de las respuestas: ${promedio} / 5.`;
    lista.innerHTML = visibles.map(r => `<article class="encuesta-respuesta-tarjeta"><span class="encuesta-respuesta-etiqueta">Evaluaci\u00f3n recibida</span><h4>${escaparHtml(r.trabajador)}</h4><p class="encuesta-respuesta-curso">${escaparHtml(r.curso)}</p><dl><div><dt>\u00c1rea</dt><dd>${escaparHtml(r.area || "No registrada")}</dd></div><div><dt>Puesto</dt><dd>${escaparHtml(r.puesto || "No registrado")}</dd></div><div><dt>Fecha</dt><dd>${escaparHtml(formatoFecha(r.fecha))}</dd></div></dl><button type="button" class="btn btn-primario" data-ver-respuestas="${escaparHtml(r.id)}" aria-label="Ver respuestas de ${escaparHtml(r.trabajador)}">Ver respuestas</button></article>`).join("") || `<div class="encuesta-respuestas-vacias"><strong>${consulta ? "No hay coincidencias" : "A\u00fan no hay respuestas"}</strong><p>${consulta ? "Prueba con otro nombre de trabajador o curso." : "Las evaluaciones enviadas por los trabajadores aparecer\u00e1n aqu\u00ed en tarjetas."}</p></div>`;
  }
  lista.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-ver-respuestas]");
    if (!boton || sesion.rol() !== "superadmin") return;
    const registro = registros.find(r => String(r.id) === boton.dataset.verRespuestas);
    if (!registro) return;
    const ventana = document.createElement("dialog");
    ventana.className = "encuesta-respuestas-modal";
    ventana.setAttribute("aria-labelledby", "encuesta-respuestas-titulo");
    const preguntas = registro.preguntas || Object.entries(criterios).map(([id,texto]) => ({id,texto}));
    ventana.innerHTML = `<header><h2 id="encuesta-respuestas-titulo">Respuestas del trabajador</h2><button type="button" class="btn btn-secundario" data-cerrar autofocus>Cerrar</button></header><section class="encuesta-datos-trabajador"><h3>${escaparHtml(registro.trabajador)}</h3><dl><div><dt>\u00c1rea</dt><dd>${escaparHtml(registro.area || "No registrada")}</dd></div><div><dt>Puesto</dt><dd>${escaparHtml(registro.puesto || "No registrado")}</dd></div><div><dt>Fecha de respuesta</dt><dd>${escaparHtml(formatoFecha(registro.fecha))}</dd></div><div><dt>Curso</dt><dd>${escaparHtml(registro.curso)}</dd></div><div><dt>Instructor</dt><dd>${escaparHtml(registro.instructor)}</dd></div></dl></section><h3>Preguntas y respuestas</h3><ol>${preguntas.map(p => `<li><p>${escaparHtml(p.texto)}</p><strong>${registro.puntuaciones[p.id] == null ? "Sin respuesta" : escaparHtml(registro.puntuaciones[p.id]) + " / 5"}</strong></li>`).join("")}</ol><div class="encuesta-comentario"><strong>Comentario del trabajador</strong><p>${escaparHtml(registro.comentario || "Sin comentario")}</p></div>`;
    ventana.querySelector("[data-cerrar]").addEventListener("click", () => ventana.close());
    ventana.addEventListener("close", () => { ventana.remove(); if (boton.isConnected) boton.focus(); });
    document.body.append(ventana);
    ventana.showModal();
  });
  async function cargar() {
    if (boton.disabled) return;
    boton.disabled = true;
    try { registros = await encuestasInstructor.listar(); pintar(); }
    catch (error) { resumen.textContent = "No se pudieron actualizar las evaluaciones. Pulsa Actualizar para reintentar."; }
    finally { boton.disabled = false; }
  }

  const form = document.getElementById("form-preguntas-instructor");
  const controles = document.getElementById("controles-preguntas-instructor");
  const editor = document.getElementById("editor-preguntas-instructor");
  const estado = document.getElementById("estado-preguntas-instructor");
  const agregar = document.getElementById("agregar-pregunta-instructor");
  const reintentar = document.getElementById("reintentar-preguntas-instructor");
  const modalPreguntas = document.getElementById("modal-preguntas-instructor");
  const abrirPreguntas = document.getElementById("abrir-preguntas-instructor");
  abrirPreguntas.addEventListener("click", () => {
    if (sesion.rol() !== "superadmin" || modalPreguntas.open) return;
    modalPreguntas.showModal();
  });
  document.getElementById("cerrar-preguntas-instructor").addEventListener("click", () => modalPreguntas.close());
  modalPreguntas.addEventListener("close", () => abrirPreguntas.focus());
  let configuracion = null;
  let cargando = false;
  function fila(pregunta, indice) {
    const fila = document.createElement("div");
    fila.className = "encuesta-config-pregunta";
    fila.dataset.seccion = pregunta.seccion || "";
    const label = document.createElement("label");
    label.htmlFor = `pregunta-instructor-${indice}`;
    label.textContent = `Pregunta ${indice + 1}`;
    const campo = document.createElement("textarea");
    campo.id = label.htmlFor;
    campo.dataset.preguntaId = pregunta.id || "";
    campo.value = pregunta.texto || "";
    campo.required = true;
    campo.maxLength = 300;
    campo.rows = 2;
    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.className = "btn btn-texto peligro";
    eliminar.textContent = "Eliminar pregunta";
    eliminar.addEventListener("click", () => {
      if (editor.querySelectorAll("textarea").length <= 1) {
        estado.textContent = "El cuestionario debe conservar al menos una pregunta.";
        return;
      }
      fila.remove();
      editor.querySelectorAll(".encuesta-config-seccion").forEach(encabezado => {
        if (![...editor.querySelectorAll(".encuesta-config-pregunta")].some(elemento => elemento.dataset.seccion === encabezado.dataset.seccion)) encabezado.remove();
      });
      [...editor.querySelectorAll(".encuesta-config-pregunta")].forEach((elemento, i) => {
        const etiqueta = elemento.querySelector("label");
        const entrada = elemento.querySelector("textarea");
        entrada.id = `pregunta-instructor-${i}`;
        etiqueta.htmlFor = entrada.id;
        etiqueta.textContent = `Pregunta ${i + 1}`;
      });
      agregar.disabled = false;
      estado.textContent = "Pregunta retirada. Guarda para aplicar el cambio. Las respuestas anteriores se conservan.";
      (editor.querySelector("textarea") || agregar).focus();
    });
    fila.append(label, campo, eliminar);
    editor.append(fila);
    return campo;
  }
  function pintarPreguntas() {
    editor.replaceChildren();
    let seccionActual = null;
    configuracion.preguntas.forEach((pregunta, indice) => {
      if (pregunta.seccion && pregunta.seccion !== seccionActual) {
        const encabezado = document.createElement("h3");
        encabezado.className = "encuesta-config-seccion";
        encabezado.dataset.seccion = pregunta.seccion;
        encabezado.textContent = pregunta.seccion;
        editor.append(encabezado);
        seccionActual = pregunta.seccion;
      }
      fila(pregunta, indice);
    });
    agregar.disabled = configuracion.preguntas.length >= 20;
  }
  async function cargarPreguntas() {
    if (cargando) return;
    cargando = true;
    controles.disabled = true;
    reintentar.hidden = true;
    estado.textContent = "Cargando preguntas...";
    try {
      configuracion = await encuestasInstructor.configuracion();
      pintarPreguntas();
      controles.disabled = false;
      estado.textContent = `${configuracion.preguntas.length} preguntas guardadas. Las respuestas anteriores conservan sus preguntas originales.`;
    } catch (error) {
      estado.textContent = error.message || "No se pudieron cargar las preguntas.";
      reintentar.hidden = false;
    } finally { cargando = false; }
  }
  agregar.addEventListener("click", () => {
    const cantidad = editor.querySelectorAll("textarea").length;
    if (cantidad >= 20) return;
    fila({texto:""}, cantidad).focus();
    agregar.disabled = cantidad + 1 >= 20;
    estado.textContent = "Pregunta agregada. Escribe su texto y guarda los cambios.";
  });
  editor.addEventListener("input", () => { estado.textContent = "Hay cambios sin guardar."; });
  document.getElementById("recargar-preguntas-instructor").addEventListener("click", cargarPreguntas);
  reintentar.addEventListener("click", cargarPreguntas);
  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (cargando || !configuracion || !form.reportValidity()) return;
    const preguntas = [...editor.querySelectorAll("textarea")].map(campo => ({ id: campo.dataset.preguntaId || null, texto: campo.value.trim() }));
    if (preguntas.some(p => !p.texto)) { estado.textContent = "Escribe el texto de todas las preguntas."; return; }
    cargando = true;
    controles.disabled = true;
    estado.textContent = "Guardando preguntas...";
    try {
      configuracion = await encuestasInstructor.guardarConfiguracion({version:configuracion.version, preguntas});
      pintarPreguntas();
      estado.textContent = "Preguntas guardadas. Se mostrar\u00e1n al abrir nuevas evaluaciones.";
    } catch (error) { estado.textContent = error.message || "No se pudieron guardar. Tus cambios siguen en el formulario."; }
    finally { cargando = false; controles.disabled = false; }
  });
  cargarPreguntas();

  filtro.addEventListener("input", pintar);
  boton.addEventListener("click", cargar);
  window.addEventListener("panel-datos-listos", cargar);
})();
