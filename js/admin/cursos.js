// cursos.js — Listado y acciones de cursos del programa

// ---------------------------------------------------------------
// CURSOS DEL PROGRAMA — RF-009..016
// ---------------------------------------------------------------
function pintarCursos() {
  const cuerpo = document.getElementById("tabla-cursos-admin");
  const cursosVisibles = sesion.rol() === "instructor"
    ? listaCursos.filter(c => String(c.solicitudCurso?.usuarioId ?? "") === String(sesion.usuario()?.id ?? ""))
    : listaCursos;
  cuerpo.innerHTML = cursosVisibles.map((c, i) => {
    const asignados = c.asignadoA === "Todos"
      ? "Todos los trabajadores"
      : (c.asignadoAIds || []).map((id) => listaUsuarios.find((u) => u.id === id)?.nombre || `Trabajador ${id}`).join(", ") || "Nadie";
    const modulos = c.modulos || [];
    const lecciones = modulos.reduce((total, modulo) =>
      total + (modulo.temas
        ? modulo.temas.reduce((cantidad, tema) => cantidad + (tema.subtemas || []).length, 0)
        : (modulo.lecciones || []).length), 0);
    const estaActivo = c.estado === "publicado";
    const autorSolicitud = listaUsuarios.find((usuario) => String(usuario.id) === String(c.solicitudCurso?.usuarioId ?? ""));
    const solicitudInstructor = autorSolicitud?.rol === "instructor";
    const puedeCambiarEstado = permisos.tiene("aprobarCursos") && (!solicitudInstructor || sesion.rol() === "superadmin");
    const propuestaPlantilla=c.solicitudCurso?.plantillaConstancia,formatoCurso=c.constancia?.formato;
    const plantillaVisible=propuestaPlantilla||formatoCurso;
    const puedeRevisarPlantilla=["admin","superadmin"].includes(sesion.rol())&&propuestaPlantilla?.estado==="pendiente";
    const puedeGestionarPlantilla=["admin","superadmin"].includes(sesion.rol())&&solicitudInstructor;
    const estadoPlantilla=propuestaPlantilla?({pendiente:"Pendiente de revisión",aceptada:"Aceptada para aprobación final",rechazada:"Rechazada; requiere nueva propuesta"}[propuestaPlantilla.estado]||"Revisada"):(formatoCurso?"Plantilla asignada al curso":"Sin revisión");
    const revisionPlantillaHTML=plantillaVisible||puedeGestionarPlantilla?`<section class="curso-plantilla-revision"><div><span>${plantillaVisible?(propuestaPlantilla?"PDF de constancia seleccionado por el Instructor":"Plantilla PDF asignada al curso"):"El curso aún no tiene una plantilla de constancia"}</span>${plantillaVisible?`<strong>${escaparHtml(plantillaVisible.nombre||"Plantilla PDF")}</strong><small>Estado: ${estadoPlantilla}</small>${propuestaPlantilla?.comentario?`<small>Comentario: ${escaparHtml(propuestaPlantilla.comentario)}</small>`:""}`:""}</div><div class="curso-plantilla-revision-acciones">${plantillaVisible?`<button type="button" class="btn btn-secundario btn-sm" data-ver-plantilla-propuesta="${escaparHtml(plantillaVisible.archivoId)}" data-nombre-plantilla="${escaparHtml(plantillaVisible.nombre||"Plantilla PDF")}">Visualizar PDF de constancia</button>`:""}${puedeGestionarPlantilla?`<button type="button" class="btn btn-secundario btn-sm" data-cambiar-plantilla="${c.id}">Cambiar plantilla</button>`:""}${puedeRevisarPlantilla?`<label class="curso-plantilla-revision-comentario">Comentario obligatorio<textarea rows="2" maxlength="2000" data-comentario-plantilla="${c.id}" placeholder="Comentario de la revisión"></textarea></label><button type="button" class="btn btn-primario btn-sm" data-decision-plantilla="aceptada" data-curso-plantilla="${c.id}">Aceptar plantilla</button><button type="button" class="btn btn-secundario btn-sm" data-decision-plantilla="rechazada" data-curso-plantilla="${c.id}">Rechazar plantilla</button>`:""}</div></section>`:"";
    const estado = estaActivo ? (estadoTemporalCurso(c) === "cerrado" ? "Cerrado por tiempo" : estadoTemporalCurso(c) === "programado" ? "Programado" : "Activo") : c.estado === "inactivo" ? "Desactivado" : c.estado === "rechazado" ? "Cambios solicitados" : c.estado === "pendiente" ? "Pendiente de aprobación" : "Borrador";
    return `
      <article class="curso-admin-card" data-curso-admin="${escaparHtml(c.id)}">
        <div class="curso-admin-card-portada">
          <img src="${escaparHtml(c.thumbnail || "../assets/soldador.avif")}" alt="Portada de ${escaparHtml(c.nombre)}" loading="lazy" />
          <span class="curso-admin-numero">Curso ${String(i + 1).padStart(2, "0")}</span>
          <span class="curso-admin-estado ${estaActivo ? "publicado" : ["inactivo", "rechazado"].includes(c.estado) ? "inactivo" : "borrador"}">${estado}</span>
        </div>
        <div class="curso-admin-card-cuerpo">
          <div class="curso-admin-card-titulo">
            <div>
              <h3 class="curso-titulo-con-version"><span>${escaparHtml(c.nombre)}</span>${window.versionesCursos.etiqueta(c)}</h3>
              <p class="curso-admin-instructor"><strong>Instructor:</strong> ${escaparHtml(c.instructorNombre || (autorSolicitud?.rol === "instructor" ? autorSolicitud.nombre : "Sin instructor asignado"))}</p>
              <p>${escaparHtml(c.descripcion || "Sin descripción disponible.")}</p>
            </div>
          </div>
          ${c.solicitudCurso?.comentario ? `<div class="curso-admin-asignacion"><span>Comentario del revisor</span><strong style="white-space:pre-wrap">${escaparHtml(c.solicitudCurso.comentario)}</strong></div>` : ""}
          ${revisionPlantillaHTML}
          <p class="curso-admin-autor muted">Creado por: ${escaparHtml(listaUsuarios.find(u=>u.id===(c.creadoPor || c.solicitudCurso?.usuarioId))?.nombre || "Registro anterior")}</p>
          <div class="curso-admin-datos">
            <span><strong>${c.horas ?? "—"} h</strong> duración</span>
            <span><strong>${modulos.length}</strong> temas</span>
            <span><strong>${lecciones}</strong> subtemas</span>
          </div>
          <div class="curso-admin-asignacion"><span>Asignado a</span><strong>${escaparHtml(asignados)}</strong></div><div class="curso-admin-horario"><span>Apertura</span><strong>${c.fechaInicio ? new Date(c.fechaInicio).toLocaleString("es-MX") : "Inmediata"}</strong><span>Cierre</span><strong>${c.fechaFin ? new Date(c.fechaFin).toLocaleString("es-MX") : "Sin fecha"}</strong></div>
          ${sesion.rol() === "superadmin" ? `<div class="curso-admin-constancia"><div><span>Constancia</span><strong class="lista">Automática al aprobar</strong></div><a href="#constancias-admin" data-ver-constancias="${escaparHtml(c.nombre)}">Ver constancias</a></div>` : ""}
          <div class="curso-admin-acciones">${window.versionesCursos.boton(c)}<button ${permisos.tiene("asignarCursos") ? "" : "hidden"} class="btn btn-secundario btn-sm" data-asignar-curso="${c.id}">Asignar trabajadores</button>
            <button ${permisos.tiene("editarCursos") ? "" : "hidden"} class="btn btn-secundario btn-sm" data-editar-curso="${c.id}">Editar curso</button>
            <button class="btn btn-secundario btn-sm" data-contenido="${c.id}">Ver como trabajador</button>
            <button ${puedeCambiarEstado ? "" : "hidden"} class="btn btn-texto btn-sm" data-cambiar-estado-curso="${c.id}">${estaActivo ? "Desactivar" : "Aprobar y publicar"}</button>
            <button ${sesion.rol() === "superadmin" ? "" : "hidden"} class="btn btn-texto btn-sm peligro" data-eliminar-curso="${c.id}">Eliminar</button>
          </div>
        </div>
      </article>`;
  }).join("") || `<div class="estado-vacio-admin"><strong>${sesion.rol() === "instructor" ? "Todavía no has creado cursos." : "No hay cursos todavía."}</strong><span>Usa el constructor de arriba para crear el primer curso.</span></div>`;

  cuerpo.querySelectorAll("[data-asignar-curso]").forEach(btn => btn.addEventListener("click", () => abrirAsignacionCurso(Number(btn.dataset.asignarCurso))));
  cuerpo.querySelectorAll("[data-contenido]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const c = listaCursos.find((x) => x.id == btn.dataset.contenido);
      if (!c) return;
      verCursoComoTrabajador(c);

    });
  });


  cuerpo.querySelectorAll("[data-editar-curso]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const c = listaCursos.find((x) => String(x.id) === btn.dataset.editarCurso);
      if (c) editarCursoEnFormulario(c);
    });
  });

  cuerpo.querySelectorAll("[data-ver-plantilla-propuesta]").forEach(btn=>btn.addEventListener("click",()=>window.previsualizarPlantillaConstancia?.(btn.dataset.verPlantillaPropuesta,btn.dataset.nombrePlantilla)));
  cuerpo.querySelectorAll("[data-cambiar-plantilla]").forEach(btn=>btn.addEventListener("click",()=>cambiarPlantillaCursoDesdeAdmin(Number(btn.dataset.cambiarPlantilla))));
  cuerpo.querySelectorAll("[data-decision-plantilla]").forEach(btn=>btn.addEventListener("click",async()=>{
    if(!["admin","superadmin"].includes(sesion.rol()))return;
    const id=Number(btn.dataset.cursoPlantilla),comentario=cuerpo.querySelector(`[data-comentario-plantilla="${id}"]`)?.value.trim()||"",decision=btn.dataset.decisionPlantilla;
    if(comentario.length<3){window.CicsaToast?.mostrar("Escribe un comentario de al menos 3 caracteres.","error");return;}
    btn.disabled=true;
    try{await cursos.revisarPlantillaConstancia(id,decision,comentario);window.CicsaToast?.mostrar(decision==="aceptada"?"Plantilla aceptada. El Superadministrador conserva la aprobación final del curso.":"Plantilla rechazada. Se notificó al instructor.","exito");await cargarTodo();}
    catch(error){btn.disabled=false;window.CicsaToast?.mostrar(error.message||"No se pudo registrar la revisión.","error");}
  }));

  cuerpo.querySelectorAll("[data-cambiar-estado-curso]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const c = listaCursos.find((x) => x.id == btn.dataset.cambiarEstadoCurso);
      if (!c) return;
      const activar = c.estado !== "publicado";
      const accion = activar ? "aprobar y publicar" : "desactivar";
      await ejecutarAccionAdmin(btn, async () => {
        if (!await confirmarAdmin(`¿Deseas ${accion} el curso "${c.nombre}"?`)) return;
        const comentario = c.solicitudCurso?.comentario || "";
        await cursos.cambiarEstado(c.id, activar ? "publicado" : "inactivo", comentario);
        mostrarToastAdmin("Estado del curso actualizado.", "exito");
        await cargarTodo();
      });
    });
  });

  cuerpo.querySelectorAll("[data-eliminar-curso]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const c = listaCursos.find((x) => x.id == btn.dataset.eliminarCurso);
      if (!c || guardandoCursoAdmin) return;
      await ejecutarAccionAdmin(btn, async () => {
        if (!await confirmarAdmin(`¿Eliminar el curso "${c.nombre}"? Esta acción no se puede deshacer.`)) return;
        await cursos.eliminar(c.id);
        if (cursoEnEdicionId === c.id) limpiarFormularioCurso();
        mostrarToastAdmin("Curso eliminado.", "exito");
        await cargarTodo();
      });
    });
  });
}

async function cambiarPlantillaCursoDesdeAdmin(cursoId){
  if(!["admin","superadmin"].includes(sesion.rol()))return;
  try{
    const [formatos,catalogoCursos]=await Promise.all([solicitar("GET","/formatos-constancia"),cursos.listar()]);
    const curso=catalogoCursos.find(c=>Number(c.id)===Number(cursoId));
    const activas=formatos.filter(f=>f.activo!==false&&f.mime==="application/pdf");
    if(!curso||!activas.length){window.CicsaToast?.mostrar(!curso?"No se encontró el curso.":"No hay plantillas PDF activas disponibles.","advertencia");return;}
    const dialog=document.createElement("dialog");dialog.className="constancia-generacion constancias-cambiar-plantilla-modal";
    const titulo=document.createElement("h3");titulo.textContent="Cambiar plantilla de constancia";
    const descripcion=document.createElement("p");descripcion.textContent=`Curso: ${curso.nombre}. El cambio quedará pendiente de aprobación final del Superadministrador.`;
    const label=document.createElement("label");label.textContent="Plantilla PDF";const select=document.createElement("select");select.append(new Option("Selecciona una plantilla activa",""),...activas.map(f=>new Option(f.nombre,f.id)));const actual=curso.solicitudCurso?.plantillaConstancia?.archivoId||curso.constancia?.formato?.archivoId;if(actual&&activas.some(f=>f.id===actual))select.value=actual;label.append(select);
    const estado=document.createElement("p");estado.setAttribute("role","status");
    const acciones=document.createElement("div");acciones.className="curso-plantilla-revision-acciones";
    const cancelar=document.createElement("button");cancelar.type="button";cancelar.className="btn btn-secundario";cancelar.textContent="Cancelar";
    const previsualizar=document.createElement("button");previsualizar.type="button";previsualizar.className="btn btn-secundario";previsualizar.textContent="Visualizar PDF";
    const guardar=document.createElement("button");guardar.type="button";guardar.className="btn btn-primario";guardar.textContent="Guardar y enviar a aprobación";
    acciones.append(cancelar,previsualizar,guardar);dialog.append(titulo,descripcion,label,estado,acciones);document.body.append(dialog);dialog.addEventListener("close",()=>dialog.remove(),{once:true});dialog.showModal();
    cancelar.onclick=()=>dialog.close();previsualizar.onclick=()=>{const formato=activas.find(f=>f.id===select.value);if(formato)window.previsualizarPlantillaConstancia?.(formato.id,formato.nombre);else estado.textContent="Selecciona una plantilla para visualizarla.";};
    guardar.onclick=async()=>{
      const formato=activas.find(f=>f.id===select.value);if(!formato){estado.textContent="Selecciona una plantilla PDF activa.";return;}
      guardar.disabled=true;estado.textContent="Preparando plantilla…";
      try{
        const respuesta=await solicitar("GET",`/formatos-constancia/${formato.id}/archivo`),medidas=await FormatoConstancia.inspeccionar(respuesta.archivo),campos=FormatoConstancia.camposParaPagina(medidas[0]);
        await solicitar("PATCH",`/cursos/${curso.id}/plantilla-constancia-seleccion`,{plantillaConstanciaId:formato.id,plantillaConstanciaCampos:campos});
        window.CicsaToast?.mostrar(`Se asignó «${formato.nombre}». El curso quedó pendiente de aprobación final del Superadministrador.`,"exito",{duracion:5000});dialog.close();await cargarTodo();
      }catch(error){estado.textContent=error.message||"No se pudo cambiar la plantilla.";window.CicsaToast?.mostrar(estado.textContent,"error",{duracion:5000});guardar.disabled=false;}
    };
  }catch(error){window.CicsaToast?.mostrar(error.message||"No se pudieron cargar las plantillas.","error",{duracion:5000});}
}

function verCursoComoTrabajador(curso) {
  const previo = document.getElementById("vista-previa-trabajador-curso");
  previo?.remove();
  const lecciones = (curso.modulos || []).map((modulo, indice) => {
    const unidades = modulo.temas?.length ? modulo.temas : [{ nombre: "Contenido del tema", subtemas: modulo.lecciones || [] }];
    return `<section class="vista-trabajador-modulo"><h3>Tema ${indice + 1}: ${escaparHtml(modulo.nombre || "Sin título")}</h3>${unidades.map((unidad, indiceUnidad) => `<section><h4>Unidad ${indiceUnidad + 1}: ${escaparHtml(unidad.nombre || "Sin título")}</h4><ol>${(unidad.subtemas || []).map((subtema, indiceSubtema) => `<li><strong>Subtema ${indiceSubtema + 1}: ${escaparHtml(subtema.nombre || "Sin título")}</strong>${subtema.informacion ? `<p>${escaparHtml(subtema.informacion)}</p>` : ""}</li>`).join("") || "<li>Sin subtemas disponibles.</li>"}</ol></section>`).join("")}</section>`;
  }).join("") || '<p class="muted">Este curso aún no tiene contenido.</p>';
  const modal = document.createElement("section");
  modal.id = "vista-previa-trabajador-curso";
  modal.className = "perfil-trabajador-modal";
  modal.innerHTML = `<div class="perfil-trabajador-fondo" data-cerrar-vista-curso></div><article class="perfil-trabajador-card vista-trabajador-curso" role="dialog" aria-modal="true" aria-labelledby="vista-curso-titulo"><button type="button" class="perfil-trabajador-cerrar" data-cerrar-vista-curso aria-label="Cerrar vista">×</button><span class="admin-bloque-kicker">Vista del trabajador</span><h2 id="vista-curso-titulo">${escaparHtml(curso.nombre)}</h2><p class="curso-admin-instructor"><strong>Instructor:</strong> ${escaparHtml(curso.instructorNombre || listaUsuarios.find(u => u.rol === "instructor" && String(u.id) === String(curso.solicitudCurso?.usuarioId))?.nombre || "Sin instructor asignado")}</p><p class="muted">${escaparHtml(curso.descripcion || "Contenido de capacitación")}</p><div class="vista-trabajador-meta"><span>${curso.horas || 0} h de duración</span><span>${(curso.modulos || []).length} temas</span></div>${lecciones}</article>`;
  document.body.appendChild(modal);
  document.body.classList.add("admin-modal-abierto");
  const cerrar = () => { modal.remove(); document.body.classList.remove("admin-modal-abierto"); };
  modal.querySelectorAll("[data-cerrar-vista-curso]").forEach((elemento) => elemento.addEventListener("click", cerrar));
  modal.querySelector(".perfil-trabajador-cerrar")?.focus();
}
