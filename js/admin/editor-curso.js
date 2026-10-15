async function cargarInsigniasCurso(valorActual = "") {
  const select = document.getElementById("nc-insignia");
  if (!select) return;
  try {
    const catalogo = await solicitar("GET", "/catalogos/curso");
    const insignias = Array.isArray(catalogo?.insignias) ? catalogo.insignias : [];
    const conservar=valorActual||select.value;
    select.replaceChildren(new Option("Sin insignia", ""), ...insignias.filter(i => i.activa !== false && !i.eliminada).map(i => new Option(i.nombre, String(i.id))));
    select.value = conservar ? String(conservar) : "";
  } catch (_) { /* Mantiene disponible la creación de cursos si el catálogo no responde. */ }
}

cargarInsigniasCurso();

async function cargarPlantillasConstanciaCurso(valorActual = "") {
  const select=document.getElementById("nc-plantilla-constancia");
  if(!select||sesion.rol()!=="instructor")return;
  const estado=document.getElementById("nc-plantilla-constancia-estado"),boton=document.getElementById("nc-plantilla-constancia-vista");
  try{
    const formatos=await solicitar("GET","/formatos-constancia");
    select.replaceChildren(new Option("Sin plantilla propuesta", ""),...formatos.filter(f=>f.activo!==false&&f.mime==="application/pdf").map(f=>new Option(f.nombre,f.id)));
    if(valorActual&&formatos.some(f=>f.id===valorActual&&f.activo!==false))select.value=valorActual;
    if(estado)estado.textContent=select.value?"La plantilla seleccionada se enviará a revisión de Administración y requerirá la aprobación final del Superadministrador.":"Opcional: selecciona un PDF de la biblioteca para enviarlo a revisión junto con el curso.";
    if(boton)boton.disabled=!select.value;
  }catch(error){if(estado)estado.textContent="No se pudieron cargar las plantillas PDF: "+error.message;}
}

async function previsualizarPlantillaConstancia(id,nombre="Plantilla PDF") {
  if(!id)return;
  const dialog=document.createElement("dialog");dialog.className="constancia-generacion constancias-formato-vista-modal";
  const cabecera=document.createElement("header");cabecera.className="constancia-modal-cabecera";
  const titulo=document.createElement("h3");titulo.textContent=nombre;
  const cerrar=document.createElement("button");cerrar.type="button";cerrar.className="btn btn-secundario";cerrar.textContent="Cerrar";
  const estado=document.createElement("p");estado.className="constancias-plantilla-preview-estado";estado.setAttribute("role","status");estado.textContent="Cargando la plantilla seleccionada…";
  const iframe=document.createElement("iframe");iframe.title=`Vista previa de la plantilla ${nombre}`;iframe.hidden=true;
  cabecera.append(titulo,cerrar);dialog.append(cabecera,estado,iframe);document.body.append(dialog);
  let url="";const limpiar=()=>{if(url)URL.revokeObjectURL(url);dialog.remove();};cerrar.addEventListener("click",()=>dialog.close());dialog.addEventListener("close",limpiar,{once:true});dialog.showModal();
  try{
    const respuesta=await solicitar("GET",`/formatos-constancia/${id}/archivo`);
    if(!respuesta?.archivo)throw new Error("No se encontró el archivo PDF de esta plantilla.");
    const blob=await (await fetch(respuesta.archivo)).blob();if(blob.type&&blob.type!=="application/pdf")throw new Error("El archivo asociado no es un PDF.");
    url=URL.createObjectURL(blob);iframe.src=url+"#toolbar=1&view=FitH";iframe.hidden=false;estado.hidden=true;
  }catch(error){estado.textContent="No se pudo abrir la plantilla seleccionada: "+(error.message||"Error al cargar el PDF.");estado.classList.add("error");}
}
window.previsualizarPlantillaConstancia=previsualizarPlantillaConstancia;
document.getElementById("nc-plantilla-constancia")?.addEventListener("change",event=>{
  const estado=document.getElementById("nc-plantilla-constancia-estado"),boton=document.getElementById("nc-plantilla-constancia-vista");
  if(boton)boton.disabled=!event.target.value;
  if(estado)estado.textContent=event.target.value?"La plantilla se enviará a revisión de Administración y requerirá la aprobación final del Superadministrador.":"Opcional: selecciona un PDF de la biblioteca para enviarlo a revisión junto con el curso.";
  if(event.isTrusted&&event.target.value){const nombre=event.target.selectedOptions[0]?.textContent||"Plantilla PDF";window.CicsaToast?.mostrar(`Seleccionaste «${nombre}». Se enviará junto con el curso para revisión.`,"info");}
});
document.getElementById("nc-plantilla-constancia-vista")?.addEventListener("click",()=>{
  const select=document.getElementById("nc-plantilla-constancia"),opcion=select?.selectedOptions[0];
  if(select?.value)previsualizarPlantillaConstancia(select.value,opcion?.textContent||"Plantilla PDF");
});
if(sesion.rol()==="instructor")cargarPlantillasConstanciaCurso();

// datetime-local requiere fecha y hora locales, sin sufijo UTC.
function fechaParaEditorCurso(valor) {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  const dos = n => String(n).padStart(2, "0");
  return fecha.getFullYear() + "-" + dos(fecha.getMonth() + 1) + "-" + dos(fecha.getDate())
    + "T" + dos(fecha.getHours()) + ":" + dos(fecha.getMinutes());
}

let solicitudEditorCurso = 0;
let guardandoCursoAdmin = false;
let quitarImagenCurso = false;
let quitarVideoCurso = false;
const campoInstructorCurso = document.getElementById("nc-instructor");
CatalogosCurso.seleccionar();
  ClasificacionCursos.seleccionar();

// editor-curso.js — Constructor de unidades/temas/subtemas del curso, vista previa de media y formulario de curso


function limpiarFormularioCurso() {
  quitarImagenCurso = false;
  quitarVideoCurso = false;
  document.getElementById("nc-quitar-imagen")?.setAttribute("hidden", "");
  document.getElementById("nc-quitar-video")?.setAttribute("hidden", "");
  document.getElementById("curso-comentario-revision")?.remove();
  solicitudEditorCurso += 1;
  const formulario = document.getElementById("form-curso");
  formulario.reset();
  const plantillaCurso=document.getElementById("nc-plantilla-constancia");if(plantillaCurso){plantillaCurso.value="";plantillaCurso.dispatchEvent(new Event("change"));}
  CatalogosCurso.seleccionar();
  ClasificacionCursos.seleccionar();
  cargarInsigniasCurso();
  cursoEnEdicionId = null;
  examenPendiente = null;
  evaluacionPendiente = null;
  document.getElementById("btn-agregar-examen-estructura").textContent = "+ Configurar examen final";
  document.getElementById("btn-guardar-curso").textContent = "+ Agregar curso";
  document.getElementById("btn-cancelar-edicion").classList.add("oculto");
  document.getElementById("curso-editor-titulo").textContent = "Crear nuevo curso";
  document.getElementById("curso-editor-estado").textContent = "Borrador nuevo";
  document.getElementById("nc-imagen-preview").textContent = "Sin imagen seleccionada";
  document.getElementById("nc-video-preview").textContent = "Sin video seleccionado";
  document.querySelectorAll(".curso-media-preview").forEach((preview) => preview.classList.remove("tiene-archivo"));
  document.getElementById("constructor-modulos").replaceChildren();
  pintarAsignacionTrabajadores([]);
  actualizarResumenEditor();
}

function numerarEstructuraAprendizaje() {
  const etiquetar = (contenedor, selectorEtiqueta, selectorCampo, nombre, id) => {
    const etiqueta = contenedor.querySelector(selectorEtiqueta);
    const campo = contenedor.querySelector(selectorCampo);
    if (!etiqueta || !campo) return;
    etiqueta.textContent = nombre;
    etiqueta.htmlFor = id;
    campo.id = id;
    campo.placeholder = nombre;
  };
  document.querySelectorAll("#constructor-modulos > .editor-modulo").forEach((unidad, i) => {
    etiquetar(unidad, "[data-indice-unidad]", ".editor-modulo-nombre", `Tema ${i + 1}`, `unidad-${i + 1}-nombre`);
    unidad.querySelectorAll(":scope > .editor-temas > .editor-tema").forEach((tema, j) => {
      etiquetar(tema, "[data-indice-tema]", ".editor-tema-nombre", `Unidad ${j + 1}`, `unidad-${i + 1}-tema-${j + 1}-nombre`);
      tema.querySelectorAll(":scope > .editor-subtemas > .editor-subtema").forEach((subtema, k) => {
        etiquetar(subtema, "[data-indice-subtema]", ".editor-subtema-nombre", `Subtema ${k + 1}`, `unidad-${i + 1}-tema-${j + 1}-subtema-${k + 1}-nombre`);
      });
    });
  });
}
function actualizarResumenEditor() {
  numerarEstructuraAprendizaje();
  const resumen = document.getElementById("curso-editor-resumen");
  const modulos = document.querySelectorAll("#constructor-modulos > .editor-modulo").length;
  const asignacion = document.getElementById("nc-asignacion-trabajadores");
  const seleccion = asignacion?._obtenerSeleccion?.();
  if (sesion.rol() === "instructor") {
    if (resumen) resumen.textContent = `${modulos} tema${modulos === 1 ? "" : "s"} · pendiente de aprobación`;
    return;
  }
  const todos = seleccion?.todos;
  const trabajadores = todos
    ? "todos los trabajadores"
    : `${seleccion?.ids.length || 0} trabajadores asignados`;
  if (resumen) resumen.textContent = `${modulos} tema${modulos === 1 ? "" : "s"} · ${trabajadores}`;
}

function pintarAsignacionTrabajadores(asignados, todosExplicito) {
  const contenedor = document.getElementById("nc-asignacion-trabajadores");
  const selectorArea = document.getElementById("nc-asignacion-area");
  if (!contenedor || !selectorArea) return;

  // Actualiza los trabajadores sin perder la selección ni los filtros del editor.
  const conservar = asignados === undefined && !!contenedor._obtenerSeleccion;
  const anterior = conservar ? contenedor._obtenerSeleccion() : null;
  const areaAnterior = conservar ? selectorArea.value : "";
  const consultaAnterior = conservar ? contenedor.querySelector(".asignacion-buscador")?.value || "" : "";
  asignados = anterior ? anterior.ids : asignados || [];
  if (anterior) todosExplicito = anterior.todos;
  const trabajadores = listaUsuarios
    .filter((usuario) => usuario.rol === "trabajador")
    .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));

  const areas = [...new Set(trabajadores.map((u) => String(u.area || "Sin asignar").trim() || "Sin asignar"))]
    .sort((a, b) => a.localeCompare(b, "es"));

  const seleccionados = new Set(
    (Array.isArray(asignados) ? asignados : [])
      .filter((id) => id !== "Todos")
      .map((id) => String(id))
  );
  let todosGlobal = todosExplicito ?? (!asignados.length || asignados.includes("Todos"));
  const disponibles = new Set(trabajadores.map(u => String(u.id)));
  for (const id of seleccionados) if (!disponibles.has(id)) seleccionados.delete(id);
  if (todosGlobal) trabajadores.forEach(u => seleccionados.add(String(u.id)));
  let consulta = consultaAnterior;
  contenedor._obtenerSeleccion = () => ({ todos: todosGlobal, ids: [...seleccionados].map(Number).filter(Number.isFinite) });

  selectorArea.innerHTML = `<option value="">Selecciona un área</option>${areas.map((area) =>
    `<option value="${escaparHtml(area)}">${escaparHtml(area)}</option>`
  ).join("")}`;

  // Al editar un curso, si los trabajadores asignados pertenecen a una sola área,
  // la mostramos automáticamente. Si pertenecen a varias, dejamos el filtro vacío.
  const areasAsignados = [...new Set(trabajadores
    .filter((u) => seleccionados.has(String(u.id)))
    .map((u) => String(u.area || "Sin asignar").trim() || "Sin asignar"))];
  if (areasAsignados.length === 1 && !todosGlobal) selectorArea.value = areasAsignados[0];
  if (conservar) selectorArea.value = areas.includes(areaAnterior) ? areaAnterior : "";

  const obtenerFiltrados = () => {
    const area = selectorArea.value;
    return trabajadores.filter((usuario) => {
      const coincideArea = !area || (String(usuario.area || "Sin asignar").trim() || "Sin asignar") === area;
      const coincideBusqueda = !consulta || String(usuario.nombre || "").toLowerCase().includes(consulta);
      return coincideArea && coincideBusqueda;
    });
  };

  const renderizar = (mostrarForzado = false) => {
    const areaSeleccionada = selectorArea.value;
    const mostrar = Boolean(areaSeleccionada) || Boolean(consulta);
    const trabajadoresVisibles = obtenerFiltrados();
    const todosVisiblesSeleccionados = trabajadoresVisibles.length > 0 && trabajadoresVisibles.every((u) => seleccionados.has(String(u.id)));
    contenedor.classList.toggle("selector-asignacion-oculto", !mostrar);

    contenedor.innerHTML = `
      <div class="asignacion-cabecera-lista">
        <input class="asignacion-buscador" type="search" placeholder="Buscar trabajador..." aria-label="Buscar trabajador para asignar" autocomplete="off" value="${escaparHtml(consulta)}" />
        <span class="asignacion-contador">${mostrar ? `${trabajadoresVisibles.length} trabajador${trabajadoresVisibles.length === 1 ? "" : "es"}` : "Selecciona un área o busca"}</span>
      </div>
      <div class="asignacion-lista-contenido" ${mostrar ? "" : "hidden"}>
        <label class="opcion-asignacion opcion-asignacion-todos">
          <input type="checkbox" value="Todos" ${todosVisiblesSeleccionados || (todosGlobal && !areaSeleccionada) ? "checked" : ""} data-asignacion-todos />
          <strong>${areaSeleccionada ? "Todos los trabajadores de esta área" : "Todos los trabajadores"}</strong>
        </label>
        <div class="lista-opciones-asignacion">
          ${trabajadoresVisibles.map((usuario) => `
            <label class="opcion-asignacion" data-trabajador="${escaparHtml(String(usuario.id))}">
              <input type="checkbox" value="${escaparHtml(String(usuario.id))}" ${seleccionados.has(String(usuario.id)) ? "checked" : ""} data-asignacion-trabajador />
              <span>${escaparHtml(usuario.nombre)}</span>
            </label>
          `).join("") || `<div class="asignacion-estado-vacio"><strong>No hay trabajadores</strong><small>No hay trabajadores que coincidan con el área o la búsqueda.</small></div>`}
        </div>
      </div>
      ${!mostrar ? `<div class="asignacion-hint-oculto"><span>👥</span><span>Los trabajadores se mostrarán al seleccionar un área o escribir una búsqueda.</span></div>` : ""}`;

    const buscador = contenedor.querySelector(".asignacion-buscador");
    buscador?.addEventListener("input", (evento) => {
      consulta = evento.target.value.trim().toLowerCase();
      renderizar(true);
      contenedor.querySelector(".asignacion-buscador")?.focus();
      const input = contenedor.querySelector(".asignacion-buscador");
      if (input) input.setSelectionRange(input.value.length, input.value.length);
    });

    contenedor.querySelector("[data-asignacion-todos]")?.addEventListener("change", (evento) => {
      const visibles = obtenerFiltrados();
      visibles.forEach((usuario) => {
        if (evento.target.checked) seleccionados.add(String(usuario.id));
        else seleccionados.delete(String(usuario.id));
      });
      todosGlobal = !selectorArea.value && evento.target.checked && seleccionados.size === trabajadores.length;
      renderizar(true);
      actualizarResumenEditor();
    });

    contenedor.querySelectorAll("[data-asignacion-trabajador]").forEach((input) => {
      input.addEventListener("change", (evento) => {
        if (evento.target.checked) seleccionados.add(String(evento.target.value));
        else seleccionados.delete(String(evento.target.value));
        todosGlobal = !selectorArea.value && seleccionados.size === trabajadores.length;
        renderizar(true);
        actualizarResumenEditor();
      });
    });
  };

  selectorArea.onchange = () => {
    consulta = "";
    renderizar(true);
    actualizarResumenEditor();
  };

  // El buscador se mantiene visible como única entrada cuando no hay filtro.
  renderizar(false);
  actualizarResumenEditor();

  // Guardamos la selección en el contenedor para que obtenerAsignacionCurso la lea.
  contenedor._obtenerSeleccion = () => ({
    todos: todosGlobal,
    ids: [...seleccionados].map(Number).filter(Number.isFinite)
  });
}

function obtenerAsignacionCurso() {
  const contenedor = document.getElementById("nc-asignacion-trabajadores");
  const seleccion = contenedor?._obtenerSeleccion?.();
  if (seleccion) {
    return seleccion.todos
      ? { asignadoA: "Todos", asignadoAIds: [] }
      : { asignadoA: seleccion.ids.join(","), asignadoAIds: seleccion.ids };
  }
  const ids = [...(contenedor?.querySelectorAll("[data-asignacion-trabajador]:checked") || [])]
    .map((input) => Number(input.value))
    .filter(Number.isFinite);
  return { asignadoA: ids.join(","), asignadoAIds: ids };
}

async function editarCursoEnFormulario(curso) {
  permisos.exigir("editarCursos");
  if (guardandoCursoAdmin) return;
  const solicitud = ++solicitudEditorCurso;
  let examenGuardado;
  try {
    examenGuardado = await evaluaciones.obtenerPorCursoTipo(curso.id, "examen");
  } catch (error) {
    if (solicitud === solicitudEditorCurso) mostrarToastAdmin(error.message || "No se pudo abrir el curso.", "error");
    return;
  }
  if (solicitud !== solicitudEditorCurso || guardandoCursoAdmin) return;
  document.getElementById("nc-imagen").value = "";
  document.getElementById("nc-video").value = "";
  const panelAlta = document.getElementById("alta-curso");
  if (panelAlta) panelAlta.open = true;
  document.getElementById("alta-curso").open = true;
  document.getElementById("curso-comentario-revision")?.remove();
  if (curso.solicitudCurso?.comentario) {
    const comentario = document.createElement("p");
    comentario.id = "curso-comentario-revision";
    comentario.className = "tarjeta";
    comentario.textContent = "Comentario del revisor: " + curso.solicitudCurso.comentario;
    document.getElementById("curso-editor-titulo").after(comentario);
  }
  cursoEnEdicionId = curso.id;
  quitarImagenCurso = false;
  quitarVideoCurso = false;
  const botonQuitarImagen = document.getElementById("nc-quitar-imagen");
  const botonQuitarVideo = document.getElementById("nc-quitar-video");
  if (botonQuitarImagen) botonQuitarImagen.hidden = !curso.thumbnail;
  if (botonQuitarVideo) botonQuitarVideo.hidden = !curso.video;
  document.getElementById("curso-editor-titulo").textContent = `Editando: ${curso.nombre}`;
  document.getElementById("curso-editor-estado").textContent = "Edición activa";
  document.getElementById("nc-nombre").value = curso.nombre || "";
  await cargarPlantillasConstanciaCurso(curso.solicitudCurso?.plantillaConstancia?.archivoId||"");
  cargarInsigniasCurso(curso.insigniaId || "");
  document.getElementById("nc-horas").value = curso.horas || "";
  document.getElementById("nc-descripcion").value = curso.descripcion || "";
  await CatalogosCurso.seleccionar(curso);
  ClasificacionCursos.seleccionar(curso);
  document.getElementById("nc-fecha-inicio").value = fechaParaEditorCurso(curso.fechaInicio);
  document.getElementById("nc-fecha-fin").value = fechaParaEditorCurso(curso.fechaFin);
  pintarMediaExistente(
    document.getElementById("nc-imagen-preview"),
    curso.thumbnail,
    "img",
    "Sin imagen seleccionada"
  );
  pintarMediaExistente(
    document.getElementById("nc-video-preview"),
    curso.video,
    "video",
    "Sin video seleccionado"
  );
  pintarAsignacionTrabajadores(curso.asignadoAIds || [], curso.asignadoA === "Todos");
  // La Evaluación del curso ya no se configura por separado: toma 5 preguntas
  // del banco del Examen final. Solo cargamos y editamos dicho banco.
  evaluacionPendiente = null;
  examenPendiente = examenGuardado || null;
  document.getElementById("btn-agregar-examen-estructura").textContent = examenGuardado ? "Editar examen final" : "+ Configurar examen final";
  const constructor = document.getElementById("constructor-modulos");
  constructor.replaceChildren();
  (curso.modulos || []).forEach((modulo) => {
    agregarModuloEditor();
    const moduloNuevo = constructor.lastElementChild;
    moduloNuevo.querySelector(".editor-modulo-nombre").value = modulo.nombre || "";
    const temas = modulo.temas || [{ nombre: "Contenido del tema", subtemas: modulo.lecciones || [] }];
    const temasContenedor = moduloNuevo.querySelector(".editor-temas");
    temasContenedor.replaceChildren();
    temas.forEach((tema) => {
      agregarTemaEditor(temasContenedor);
      const temaNuevo = temasContenedor.lastElementChild;
      temaNuevo.querySelector(".editor-tema-nombre").value = tema.nombre || "";
      const subtemasContenedor = temaNuevo.querySelector(".editor-subtemas");
      subtemasContenedor.replaceChildren();
      (tema.subtemas || []).forEach((subtema) => {
        agregarSubtemaEditor(subtemasContenedor);
        const subtemaNuevo = subtemasContenedor.lastElementChild;
        subtemaNuevo.querySelector(".editor-subtema-nombre").value = subtema.nombre || "";
        subtemaNuevo.querySelector(".editor-subtema-informacion").value = subtema.informacion || "";
        subtemaNuevo.dataset.leccionId = subtema.id || "";
        subtemaNuevo.dataset.mediaUrl = subtema.url || "";
        aplicarTipoSubtema(subtemaNuevo, subtema.tipo || "texto");
      });
      actualizarResumenTema(temaNuevo);
    });
    actualizarResumenModulo(moduloNuevo);
  });
  document.getElementById("btn-guardar-curso").textContent = "Guardar cambios";
  document.getElementById("btn-cancelar-edicion").classList.remove("oculto");
  actualizarResumenEditor();
  document.getElementById(sesion.rol() === "instructor" ? "cursos-instructor" : "cursos-admin")?.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("nc-nombre").focus();
}

function configurarVistaPreviaMedia() {
  const imagen = document.getElementById("nc-imagen");
  const video = document.getElementById("nc-video");
  const imagenPreview = document.getElementById("nc-imagen-preview");
  const videoPreview = document.getElementById("nc-video-preview");

  imagen?.addEventListener("change", () => {
    const archivo = imagen.files?.[0];
    imagenPreview.replaceChildren();
    if (archivo) {
      const vista = document.createElement("img");
      vista.src = URL.createObjectURL(archivo);
      vista.alt = "Vista previa de la portada";
      imagenPreview.append(vista, document.createTextNode(`${archivo.name} listo para cargar`));
    } else {
      imagenPreview.textContent = "Sin imagen seleccionada";
    }
    imagenPreview.classList.toggle("tiene-archivo", Boolean(archivo));
  });
  video?.addEventListener("change", () => {
    const archivo = video.files?.[0];
    videoPreview.replaceChildren();
    if (archivo) {
      const vista = document.createElement("video");
      vista.src = URL.createObjectURL(archivo);
      vista.muted = true;
      vista.controls = true;
      videoPreview.append(vista, document.createTextNode(`${archivo.name} listo para cargar`));
    } else {
      videoPreview.textContent = "Sin video seleccionado";
    }
    videoPreview.classList.toggle("tiene-archivo", Boolean(archivo));
  });
}

function pintarMediaExistente(contenedor, url, tipo, texto) {
  contenedor.replaceChildren();
  if (!url) {
    contenedor.textContent = texto;
    contenedor.classList.remove("tiene-archivo");
    return;
  }
  const vista = document.createElement(tipo);
  vista.src = url;
  vista.alt = tipo === "img" ? "Vista previa de la portada actual" : "";
  if (tipo === "video") {
    vista.muted = true;
    vista.controls = true;
  }
  contenedor.append(vista, document.createTextNode("Archivo actual"));
  contenedor.classList.add("tiene-archivo");
}

function agregarModuloEditor() {
  const contenedor = document.getElementById("constructor-modulos");
  const modulo = document.createElement("div");
  modulo.className = "editor-modulo";
  modulo.innerHTML = `
    <div class="editor-modulo-cabecera">
      <button type="button" class="editor-modulo-toggle" data-toggle-modulo aria-expanded="true" title="Contraer tema">⌃</button>
      <label class="editor-modulo-indice" data-indice-unidad>Tema 1</label>
      <input type="text" class="editor-modulo-nombre" placeholder="Ej. Identificación de riesgos" required />
      <span class="editor-modulo-contador">0 unidades</span>
      <button type="button" class="btn btn-texto editor-eliminar" data-eliminar-modulo>Eliminar</button>
    </div>
    <div class="editor-temas"></div>
    <button type="button" class="btn btn-secundario btn-sm" data-agregar-tema>+ Agregar unidad</button>
  `;
  contenedor.appendChild(modulo);
  agregarTemaEditor(modulo.querySelector(".editor-temas"));
  actualizarResumenModulo(modulo);
  actualizarResumenEditor();
}

function agregarTemaEditor(contenedor) {
  const tema = document.createElement("div");
  tema.className = "editor-tema";
  tema.innerHTML = `
    <div class="editor-tema-cabecera">
      <label class="editor-modulo-indice" data-indice-tema>Unidad 1</label>
      <input type="text" class="editor-tema-nombre" placeholder="Ej. Conceptos principales" required />
      <span class="editor-tema-contador">0 subtemas</span>
      <button type="button" class="btn btn-texto editor-eliminar" data-eliminar-tema>Eliminar</button>
    </div>
    <div class="editor-subtemas"></div>
    <button type="button" class="btn btn-secundario btn-sm" data-agregar-subtema>+ Agregar subtema</button>
  `;
  contenedor.appendChild(tema);
  agregarSubtemaEditor(tema.querySelector(".editor-subtemas"));
  actualizarResumenTema(tema);
}

function agregarSubtemaEditor(contenedor) {
  const fila = document.createElement("div");
  fila.className = "editor-subtema";
  fila.innerHTML = `
    <div class="editor-subtema-campos">
      <label class="editor-modulo-indice" data-indice-subtema>Subtema 1</label>
      <input type="text" class="editor-subtema-nombre" placeholder="Nombre del subtema" required />
      <div class="editor-subtema-tipo-grupo" role="tablist" aria-label="Tipo de contenido del subtema">
        <button type="button" class="editor-subtema-tipo-boton" data-tipo-subtema="texto">📝 Texto</button>
        <button type="button" class="editor-subtema-tipo-boton" data-tipo-subtema="video">🎬 Video</button>
        <button type="button" class="editor-subtema-tipo-boton" data-tipo-subtema="imagen">🖼️ Imagen</button>
        <button type="button" class="editor-subtema-tipo-boton" data-tipo-subtema="documento">Documento PDF</button>
      </div>
      <input type="hidden" class="editor-subtema-tipo" value="texto" />
      <textarea class="editor-subtema-informacion" placeholder="Texto o descripción del subtema" aria-label="Información del subtema" rows="3"></textarea>
      <label class="editor-subtema-recurso">
        <span>Archivo del subtema (imagen, video o PDF)</span>
        <input type="file" class="editor-subtema-archivo" accept="image/*,video/*" aria-label="Archivo del subtema" />
        <div class="editor-subtema-preview">Sin archivo seleccionado</div>
      </label>
    </div>
    <button type="button" class="btn btn-texto editor-eliminar" data-eliminar-subtema>Eliminar</button>
  `;
  contenedor.appendChild(fila);
  fila.querySelectorAll("[data-tipo-subtema]").forEach((boton) => {
    boton.addEventListener("click", () => aplicarTipoSubtema(fila, boton.dataset.tipoSubtema));
  });
  fila.querySelector(".editor-subtema-archivo").addEventListener("change", () => {
    fila.dataset.mediaUrl = "";
    actualizarVistaSubtema(fila);
    if (fila.querySelector(".editor-subtema-archivo").files.length) mostrarToastAdmin("Archivo seleccionado. Guarda el curso para validar y conservar el material.", "info");
  });
  aplicarTipoSubtema(fila, "texto");
  numerarEstructuraAprendizaje();
}

function aplicarTipoSubtema(fila, tipo) {
  const tipoInput = fila.querySelector(".editor-subtema-tipo");
  const archivo = fila.querySelector(".editor-subtema-archivo");
  const recurso = fila.querySelector(".editor-subtema-recurso");
  if (!tipoInput || !archivo || !recurso) return;
  tipoInput.value = tipo;
  fila.querySelectorAll("[data-tipo-subtema]").forEach((boton) => {
    const activo = boton.dataset.tipoSubtema === tipo;
    boton.classList.toggle("activo", activo);
    boton.setAttribute("aria-pressed", String(activo));
  });
  archivo.accept = tipo === "documento" ? "application/pdf,.pdf" : tipo === "video" ? "video/*" : tipo === "imagen" ? "image/*" : "image/*,video/*";
  recurso.hidden = tipo === "texto";
  actualizarVistaSubtema(fila);
}

function actualizarVistaSubtema(fila) {
  const tipo = fila.querySelector(".editor-subtema-tipo")?.value || "texto";
  const archivo = fila.querySelector(".editor-subtema-archivo");
  const preview = fila.querySelector(".editor-subtema-preview");
  if (!archivo || !preview) return;
  const archivoSeleccionado = archivo.files?.[0];
  const urlVista = archivoSeleccionado ? URL.createObjectURL(archivoSeleccionado) : fila.dataset.mediaUrl || "";
  preview.replaceChildren();
  if (tipo !== "texto" && urlVista) {
    const vista = document.createElement(tipo === "documento" ? "a" : tipo === "video" ? "video" : "img");
    if (tipo === "documento") {vista.href=urlVista; vista.textContent="Ver documento PDF"; vista.target="_blank"; vista.rel="noopener";}
    vista.src = urlVista;
    if (tipo === "video") {
      vista.muted = true;
      vista.controls = true;
    } else {
      vista.alt = "Vista previa del subtema";
    }
    preview.appendChild(vista);
  }
  const etiqueta = document.createElement("small");
  etiqueta.textContent = archivoSeleccionado
    ? `${archivoSeleccionado.name} listo para guardar`
    : fila.dataset.mediaUrl
      ? "Archivo actual conservado"
      : tipo === "texto"
        ? "Este subtema es solo texto"
        : "Sin archivo seleccionado";
  preview.appendChild(etiqueta);
  preview.classList.toggle("tiene-archivo", Boolean(urlVista));
}

function actualizarResumenTema(tema) {
  const contador = tema.querySelector(".editor-tema-contador");
  if (!contador) return;
  const total = tema.querySelectorAll(":scope > .editor-subtemas > .editor-subtema").length;
  contador.textContent = `${total} subtema${total === 1 ? "" : "s"}`;
}

function actualizarResumenModulo(modulo) {
  const contador = modulo.querySelector(".editor-modulo-contador");
  if (!contador) return;
  const total = modulo.querySelectorAll(":scope > .editor-temas > .editor-tema").length;
  contador.textContent = `${total} unidad${total === 1 ? "" : "es"}`;
}

async function construirModulosDesdeEditor() {
  let siguienteId = Math.max(0, ...listaCursos.flatMap(obtenerLeccionesCurso).map(l => Number(l.id) || 0)) + 1;
  const modulos = [];
  for (const [indiceModulo, modulo] of [...document.querySelectorAll("#constructor-modulos > .editor-modulo")].entries()) {
    const temas = [];
    for (const tema of [...modulo.querySelectorAll(":scope > .editor-temas > .editor-tema")]) {
      const subtemas = [];
      for (const subtema of [...tema.querySelectorAll(":scope > .editor-subtemas > .editor-subtema")]) {
        const tipo = subtema.querySelector(".editor-subtema-tipo").value;
        const archivo = subtema.querySelector(".editor-subtema-archivo").files?.[0];
        if (tipo === "documento" && archivo && archivo.type !== "application/pdf" && !/\.pdf$/i.test(archivo.name)) throw new Error("Selecciona un documento PDF.");
        const url = tipo === "texto"
          ? ""
          : archivo ? await leerArchivoComoDataUrl(archivo, tipo === "video" ? 350 : 5) : subtema.dataset.mediaUrl || "";
        subtemas.push({
          id: Number(subtema.dataset.leccionId) || siguienteId++,
          nombre: subtema.querySelector(".editor-subtema-nombre").value.trim(),
          informacion: subtema.querySelector(".editor-subtema-informacion").value.trim(),
          tipo,
          url,
        });
      }
      temas.push({ nombre: tema.querySelector(".editor-tema-nombre").value.trim(), subtemas });
    }
    modulos.push({ id: indiceModulo + 1, nombre: modulo.querySelector(".editor-modulo-nombre").value.trim(), temas });
  }
  return modulos;
}

document.getElementById("btn-agregar-modulo")?.addEventListener("click", () => { agregarModuloEditor(); window.CicsaToast?.marcarPendiente(document.getElementById("form-curso")); mostrarToastAdmin("Tema agregado al editor. Guarda el curso para conservarlo.", "info"); });
document.getElementById("btn-agregar-examen-estructura")?.addEventListener("click", () => {
  const opciones = {
    nombre: document.getElementById("nc-nombre").value.trim() || "Nuevo curso",
    ...(document.getElementById("nc-insignia")?.value ? { insigniaId: document.getElementById("nc-insignia").value } : {}),
    tipo: "examen",
    evaluacion: examenPendiente || { minimaAprobatoria: 80, preguntas: [] },
  };
  administrarExamen(cursoEnEdicionId || null, opciones);
});
document.getElementById("constructor-modulos")?.addEventListener("click", (e) => {
  const boton = e.target.closest("button");
  if (!boton) return;
  if (boton.matches("[data-toggle-modulo]")) {
    const modulo = boton.closest(".editor-modulo");
    const abierto = modulo.classList.toggle("colapsado") === false;
    boton.setAttribute("aria-expanded", String(abierto));
    boton.title = abierto ? "Contraer tema" : "Expandir tema";
    return;
  }
  if (boton.matches("[data-agregar-tema]")) {
    agregarTemaEditor(boton.previousElementSibling);
    mostrarToastAdmin("Unidad agregada al editor. Pendiente de guardar.", "info");
    actualizarResumenModulo(boton.closest(".editor-modulo"));
  }
  if (boton.matches("[data-agregar-subtema]")) {
    agregarSubtemaEditor(boton.previousElementSibling);
    mostrarToastAdmin("Subtema agregado al editor. Pendiente de guardar.", "info");
    actualizarResumenTema(boton.closest(".editor-tema"));
    actualizarResumenModulo(boton.closest(".editor-modulo"));
  }
  if (boton.matches("[data-eliminar-modulo]")) boton.closest(".editor-modulo").remove();
  if (boton.matches("[data-eliminar-tema]")) {
    const modulo = boton.closest(".editor-modulo");
    boton.closest(".editor-tema").remove();
    actualizarResumenModulo(modulo);
  }
  if (boton.matches("[data-eliminar-subtema]")) {
    const tema = boton.closest(".editor-tema");
    const modulo = boton.closest(".editor-modulo");
    boton.closest(".editor-subtema").remove();
    actualizarResumenTema(tema);
    actualizarResumenModulo(modulo);
  }
  window.CicsaToast?.marcarPendiente(document.getElementById("form-curso"));
  actualizarResumenEditor();
});


document.getElementById("form-curso").addEventListener("submit", async (e) => {
  e.preventDefault();
  const botonEnviar = e.target.querySelector('[type="submit"]');
  if (botonEnviar.disabled) return;
  botonEnviar.disabled = true;
  guardandoCursoAdmin = true;
  solicitudEditorCurso += 1;
  const nombre = document.getElementById("nc-nombre").value.trim();
  const horas = Number(document.getElementById("nc-horas").value);
  const descripcion = document.getElementById("nc-descripcion").value.trim();
  const autoria = { instructorId: Number(campoInstructorCurso.value) };
  if (!autoria.instructorId) {
    mostrarToastAdmin("Selecciona el instructor del curso.", "error");
    botonEnviar.disabled = false;
    guardandoCursoAdmin = false;
    campoInstructorCurso.focus();
    return;
  }
  const fechaInicio = document.getElementById("nc-fecha-inicio")?.value || "";
  const fechaFin = document.getElementById("nc-fecha-fin")?.value || "";
  if (fechaInicio && fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) { mostrarToastAdmin("La fecha de cierre debe ser posterior a la fecha de apertura.", "error"); botonEnviar.disabled = false; guardandoCursoAdmin = false; return; }
  const totalPreguntasExamen = examenPendiente?.preguntas?.length || 0;
  if (totalPreguntasExamen < 5 || totalPreguntasExamen > 25) {
    mostrarToastAdmin("Configura el Examen final con entre 5 y 25 preguntas. La Evaluación del curso usará 5 de ellas automáticamente.", "error");
    botonEnviar.disabled = false;
    guardandoCursoAdmin = false;
    return;
  }
  const selectorInsignia = document.getElementById("nc-insignia");
  const asignacion = selectorInsignia ? { insigniaId: selectorInsignia.value } : {};
  const selectorPlantillaConstancia=document.getElementById("nc-plantilla-constancia");
  let plantillaConstanciaSeleccionada=selectorPlantillaConstancia?{plantillaConstanciaId:selectorPlantillaConstancia.value||""}:{};
  const imagenArchivo = document.getElementById("nc-imagen").files?.[0];
  const videoArchivo = document.getElementById("nc-video").files?.[0];
  try {
    if(selectorPlantillaConstancia?.value){
      if(!window.FormatoConstancia)throw new Error("No se pudo preparar la vista de la plantilla. Recarga el panel e intenta nuevamente.");
      const archivo=await solicitar("GET",`/formatos-constancia/${selectorPlantillaConstancia.value}/archivo`);
      const medidas=await FormatoConstancia.inspeccionar(archivo.archivo);
      plantillaConstanciaSeleccionada={plantillaConstanciaId:selectorPlantillaConstancia.value,plantillaConstanciaCampos:FormatoConstancia.camposParaPagina(medidas[0])};
    }
    const [thumbnail, video, modulos] = await Promise.all([
      leerArchivoComoDataUrl(imagenArchivo, 5),
      leerArchivoComoDataUrl(videoArchivo, 350),
      construirModulosDesdeEditor(),
    ]);
    if (cursoEnEdicionId) {
      permisos.exigir("editarCursos");
      const cursoActual = listaCursos.find((curso) => String(curso.id) === String(cursoEnEdicionId));
      await cursos.actualizar(cursoEnEdicionId, {
        comentarioCorreccion: "",
        ...plantillaConstanciaSeleccionada,
        nombre, horas, duracion: horas + " h", descripcion, ...autoria, ...ClasificacionCursos.leer(), fechaInicio, fechaFin, ...asignacion, modulos,
        thumbnail: thumbnail || (quitarImagenCurso ? "" : cursoActual?.thumbnail || ""),
        video: video || (quitarVideoCurso ? "" : cursoActual?.video || ""),
      });
      if (examenPendiente) await evaluaciones.actualizarTipo(cursoEnEdicionId, "examen", examenPendiente);
      mostrarToastAdmin("Curso actualizado. Requiere aprobación.", "exito");
    } else {
      const cursoCreado = await cursos.crear({
        ...plantillaConstanciaSeleccionada,
        nombre, horas, descripcion, ...autoria, ...ClasificacionCursos.leer(), fechaInicio, fechaFin, ...asignacion, thumbnail, video, modulos,
        duracion: `${horas} h`, estado: "pendiente",
        evaluacionesIniciales: { evaluacion: null, examen: examenPendiente },
      });
      cursoEnEdicionId = cursoCreado.id;
      listaCursos.push(cursoCreado);
      document.getElementById("btn-guardar-curso").textContent = "Guardar cambios";
      mostrarToastAdmin("Curso creado. Se envió a Administración para aprobación.", "exito");
    }
    await eliminarBorradorCursoAutomatico();
    window.CicsaToast?.guardado("form-curso");
    limpiarFormularioCurso();
    await cargarTodo();
  } catch (error) {
    mostrarToastAdmin(error.message, "error");
  } finally {
    guardandoCursoAdmin = false;
    botonEnviar.disabled = false;
  }
});

configurarVistaPreviaMedia();

const botonQuitarImagenCurso = document.getElementById("nc-quitar-imagen");
const botonQuitarVideoCurso = document.getElementById("nc-quitar-video");
const inputImagenCurso = document.getElementById("nc-imagen");
const inputVideoCurso = document.getElementById("nc-video");
botonQuitarImagenCurso?.addEventListener("click", () => {
  quitarImagenCurso = true;
  if (inputImagenCurso) inputImagenCurso.value = "";
  const preview = document.getElementById("nc-imagen-preview");
  if (preview) { preview.replaceChildren(document.createTextNode("La imagen actual se quitará al guardar.")); preview.classList.remove("tiene-archivo"); }
  botonQuitarImagenCurso.hidden = true;
});
botonQuitarVideoCurso?.addEventListener("click", () => {
  quitarVideoCurso = true;
  if (inputVideoCurso) inputVideoCurso.value = "";
  const preview = document.getElementById("nc-video-preview");
  if (preview) { preview.replaceChildren(document.createTextNode("El video actual se quitará al guardar.")); preview.classList.remove("tiene-archivo"); }
  botonQuitarVideoCurso.hidden = true;
});
inputImagenCurso?.addEventListener("change", () => { if (inputImagenCurso.files?.length) { quitarImagenCurso = false; if (botonQuitarImagenCurso) botonQuitarImagenCurso.hidden = false; } });
inputVideoCurso?.addEventListener("change", () => { if (inputVideoCurso.files?.length) { quitarVideoCurso = false; if (botonQuitarVideoCurso) botonQuitarVideoCurso.hidden = false; } });

document.getElementById("btn-cancelar-edicion").addEventListener("click", () => { if (!guardandoCursoAdmin) limpiarFormularioCurso(); });

const modalContenidoCurso = document.getElementById("modal-contenido-curso");
function abrirContenidoCurso() {
  modalContenidoCurso?.removeAttribute("hidden");
  modalContenidoCurso?.setAttribute("aria-hidden", "false");
  document.body.classList.add("admin-modal-abierto");
  document.getElementById("btn-cerrar-contenido-curso")?.focus();
}
function cerrarContenidoCurso() {
  modalContenidoCurso?.setAttribute("hidden", "");
  modalContenidoCurso?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("admin-modal-abierto");
}
document.getElementById("btn-abrir-contenido-curso")?.addEventListener("click", abrirContenidoCurso);
document.getElementById("btn-cerrar-contenido-curso")?.addEventListener("click", cerrarContenidoCurso);
modalContenidoCurso?.querySelector("[data-cerrar-contenido]")?.addEventListener("click", cerrarContenidoCurso);
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && modalContenidoCurso && !modalContenidoCurso.hasAttribute("hidden")) {
    cerrarContenidoCurso();
  }
});

// Revela el campo inválido antes de que el navegador intente enfocarlo.
document.getElementById("form-curso").addEventListener("invalid", (evento) => {
  document.getElementById("alta-curso").open = true;
  if (modalContenidoCurso?.contains(evento.target)) {
    abrirContenidoCurso();
    evento.target.closest(".editor-modulo")?.classList.remove("colapsado");
    const toggle = evento.target.closest(".editor-modulo")?.querySelector("[data-toggle-modulo]");
    toggle?.setAttribute("aria-expanded", "true");
  }
}, true);

// Borrador local automático: guarda campos, estructura y archivos en IndexedDB.
const CLAVE_BORRADOR_CURSO_AUTOMATICO = `cicsa-borrador-curso-${sesion.usuario()?.id || "sesion"}`;
let temporizadorBorradorCurso = null;
let restaurandoBorradorCurso = false;
let guardandoBorradorCurso = false;
function abrirBaseBorradorCurso() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("cicsa_borradores_curso", 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains("borradores")) req.result.createObjectStore("borradores"); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("No se pudo abrir el almacenamiento del borrador."));
  });
}
async function guardarBorradorCursoAutomatico() {
  if (restaurandoBorradorCurso || guardandoBorradorCurso) return;
  guardandoBorradorCurso = true;
  try {
    const formulario = document.getElementById("form-curso");
    const campos = [...formulario.elements].filter(e => e.id && !["file", "button", "submit"].includes(e.type)).map(e => ({ id:e.id, value:e.value, checked:e.checked }));
    const modulos = [...document.querySelectorAll("#constructor-modulos > .editor-modulo")].map(m => ({
      nombre:m.querySelector(".editor-modulo-nombre").value,
      temas:[...m.querySelectorAll(":scope > .editor-temas > .editor-tema")].map(t => ({
        nombre:t.querySelector(".editor-tema-nombre").value,
        subtemas:[...t.querySelectorAll(":scope > .editor-subtemas > .editor-subtema")].map(s => ({
          id:s.dataset.leccionId || "", nombre:s.querySelector(".editor-subtema-nombre").value,
          informacion:s.querySelector(".editor-subtema-informacion").value,
          tipo:s.querySelector(".editor-subtema-tipo").value, mediaUrl:s.dataset.mediaUrl || "",
          archivo:s.querySelector(".editor-subtema-archivo").files?.[0] || null
        }))
      }))
    }));
    const borrador = { campos, modulos, examenPendiente, evaluacionPendiente, cursoEnEdicionId,
      portada:document.getElementById("nc-imagen").files?.[0] || null,
      video:document.getElementById("nc-video").files?.[0] || null,
      quitarImagenCurso, quitarVideoCurso, asignacion:obtenerAsignacionCurso(), mediaExistente:(()=>{const c=listaCursos.find(c=>String(c.id)===String(cursoEnEdicionId));return c?{thumbnail:c.thumbnail||"",video:c.video||""}:{};})(), actualizado:new Date().toISOString() };
    const db = await abrirBaseBorradorCurso();
    await new Promise((resolve,reject) => { const tx=db.transaction("borradores","readwrite"); tx.objectStore("borradores").put(borrador,CLAVE_BORRADOR_CURSO_AUTOMATICO); tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); });
    db.close();
    const estado=document.getElementById("curso-editor-estado");
    if(estado && !cursoEnEdicionId) estado.textContent="Borrador guardado automáticamente";
  } catch(error) { mostrarToastAdmin("No se pudo guardar el borrador automático: "+(error.message||"error de almacenamiento"),"error"); }
  finally { guardandoBorradorCurso=false; }
}
function programarGuardadoBorradorCurso() {
  if(restaurandoBorradorCurso)return;
  clearTimeout(temporizadorBorradorCurso);
  temporizadorBorradorCurso=setTimeout(guardarBorradorCursoAutomatico,700);
}
function restaurarArchivoBorrador(input, archivo) {
  if(!input || !archivo)return;
  try { const transfer=new DataTransfer(); transfer.items.add(archivo); input.files=transfer.files; input.dispatchEvent(new Event("change",{bubbles:true})); } catch(_) {}
}
async function restaurarBorradorCursoAutomatico() {
  try {
    const db=await abrirBaseBorradorCurso();
    const borrador=await new Promise((resolve,reject)=>{const tx=db.transaction("borradores","readonly");const req=tx.objectStore("borradores").get(CLAVE_BORRADOR_CURSO_AUTOMATICO);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}); db.close();
    if(!borrador)return;
    restaurandoBorradorCurso=true;
    const formulario=document.getElementById("form-curso");
    borrador.campos.forEach(c=>{const e=document.getElementById(c.id);if(e){if(e.type==="checkbox"||e.type==="radio")e.checked=c.checked;else e.value=c.value;}});
    examenPendiente=borrador.examenPendiente||null; evaluacionPendiente=borrador.evaluacionPendiente||null;
    cursoEnEdicionId=borrador.cursoEnEdicionId||null; quitarImagenCurso=!!borrador.quitarImagenCurso; quitarVideoCurso=!!borrador.quitarVideoCurso;
    const contenedor=document.getElementById("constructor-modulos"); contenedor.replaceChildren();
    (borrador.modulos||[]).forEach(m=>{agregarModuloEditor();const mn=contenedor.lastElementChild;mn.querySelector(".editor-modulo-nombre").value=m.nombre||"";const tc=mn.querySelector(".editor-temas");tc.replaceChildren();(m.temas||[]).forEach(t=>{agregarTemaEditor(tc);const tn=tc.lastElementChild;tn.querySelector(".editor-tema-nombre").value=t.nombre||"";const sc=tn.querySelector(".editor-subtemas");sc.replaceChildren();(t.subtemas||[]).forEach(s=>{agregarSubtemaEditor(sc);const sn=sc.lastElementChild;sn.querySelector(".editor-subtema-nombre").value=s.nombre||"";sn.querySelector(".editor-subtema-informacion").value=s.informacion||"";sn.dataset.leccionId=s.id||"";sn.dataset.mediaUrl=s.mediaUrl||"";aplicarTipoSubtema(sn,s.tipo||"texto");restaurarArchivoBorrador(sn.querySelector(".editor-subtema-archivo"),s.archivo);});actualizarResumenTema(tn);});actualizarResumenModulo(mn);});
    restaurarArchivoBorrador(document.getElementById("nc-imagen"),borrador.portada);
    restaurarArchivoBorrador(document.getElementById("nc-video"),borrador.video);
    if(!borrador.portada&&borrador.mediaExistente?.thumbnail)pintarMediaExistente(document.getElementById("nc-imagen-preview"),borrador.mediaExistente.thumbnail,"img","Sin imagen seleccionada");
    if(!borrador.video&&borrador.mediaExistente?.video)pintarMediaExistente(document.getElementById("nc-video-preview"),borrador.mediaExistente.video,"video","Sin video seleccionado");
    if(borrador.cursoEnEdicionId){document.getElementById("btn-guardar-curso").textContent="Guardar cambios";document.getElementById("btn-cancelar-edicion").classList.remove("oculto");document.getElementById("curso-editor-titulo").textContent="Edición recuperada";}
    pintarAsignacionTrabajadores(borrador.asignacion?.asignadoAIds || [], borrador.asignacion?.asignadoA === "Todos");
    actualizarResumenEditor(); document.getElementById("curso-editor-estado").textContent="Borrador recuperado automáticamente";
    document.getElementById("alta-curso").open=true;
    window.CicsaToast?.mostrar("Se recuperó el borrador del curso guardado automáticamente.","info");
  } catch(error) { console.error("No se pudo recuperar el borrador del curso:",error); }
  finally { restaurandoBorradorCurso=false; }
}
async function eliminarBorradorCursoAutomatico() {
  try { const db=await abrirBaseBorradorCurso(); await new Promise((resolve,reject)=>{const tx=db.transaction("borradores","readwrite");tx.objectStore("borradores").delete(CLAVE_BORRADOR_CURSO_AUTOMATICO);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close(); } catch(_) {}
}
const formularioBorradorCurso=document.getElementById("form-curso");
formularioBorradorCurso?.addEventListener("input",programarGuardadoBorradorCurso);
formularioBorradorCurso?.addEventListener("change",programarGuardadoBorradorCurso);
formularioBorradorCurso?.addEventListener("click",e=>{if(e.target.closest("[data-agregar-tema],[data-agregar-subtema],[data-eliminar-modulo],[data-eliminar-tema],[data-eliminar-subtema],[data-tipo-subtema]"))programarGuardadoBorradorCurso();});
document.getElementById("btn-cancelar-edicion")?.addEventListener("click",eliminarBorradorCursoAutomatico);
window.addEventListener("pagehide",()=>{clearTimeout(temporizadorBorradorCurso);guardarBorradorCursoAutomatico();});
window.addEventListener("panel-datos-listos",restaurarBorradorCursoAutomatico,{once:true});