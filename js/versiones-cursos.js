window.versionesCursos = {
  etiqueta(curso) {
    if (!["admin", "superadmin", "instructor"].includes(sesion.rol())) return "";
    const version = curso.versionActual ?? 1;
    return `<span class="curso-version-etiqueta">${version ? "V" + escaparHtml(version) : "Sin versi\u00f3n aprobada"}</span>`;
  },
  boton(curso) {
    if (!["admin", "superadmin", "instructor"].includes(sesion.rol())) return "";
    const version = curso.versionActual ?? 1;
    return `<button type="button" class="btn btn-secundario btn-sm" data-versiones-curso="${escaparHtml(curso.id)}">${version ? "V" + version : "Sin version aprobada"} &middot; Ver versiones</button>`;
  }
};
document.addEventListener("click", async evento => {
  const boton = evento.target.closest("[data-versiones-curso]");
  if (!boton || boton.disabled) return;
  boton.disabled = true;
  try {
    const datos = await cursos.versiones(boton.dataset.versionesCurso);
    const ventana = document.createElement("dialog");
    ventana.className = "versiones-curso-modal";
    ventana.setAttribute("aria-labelledby", "titulo-versiones-curso");
    ventana.innerHTML = `<header><h2 id="titulo-versiones-curso">Versiones del curso</h2><button type="button" class="btn btn-secundario" data-cerrar autofocus>Cerrar</button></header><h3>${escaparHtml(datos.curso)}</h3><p>Version aprobada: <strong>${datos.versionActual ? "V" + datos.versionActual : "Sin aprobacion inicial"}</strong></p><p>La version aumenta solo cuando el super admin aprueba los cambios.</p><ol>${[...datos.historial].reverse().map(h => `<li><strong>${escaparHtml(h.tipo === "modificacion" ? "Modificaciones" : h.resultado)} ? ${h.version ? "V" + h.version : "Sin version aprobada"}</strong><p>${escaparHtml(formatoFecha(h.fecha))} ? ${escaparHtml(h.usuario)}</p>${h.campos?.length ? `<p>Campos actualizados: ${escaparHtml(h.campos.join(", "))}</p>` : ""}<p>${escaparHtml(h.comentario || h.resultado)}</p></li>`).join("") || "<li>Curso existente registrado como V1. No hay modificaciones registradas todavia.</li>"}</ol>`;
    ventana.querySelector("[data-cerrar]").addEventListener("click", () => ventana.close());
    ventana.addEventListener("close", () => { ventana.remove(); boton.focus(); });
    document.body.append(ventana);
    ventana.showModal();
  } catch (error) { mostrarToastAdmin(error.message || "No se pudieron consultar las versiones.", "error"); }
  finally { boton.disabled = false; }
});
