// Seguimiento de la última revisión enviada por el instructor para cada curso.
function pintarMisSolicitudesCursos() {
  const tabla = document.getElementById("tabla-mis-solicitudes-cursos");
  if (!tabla || sesion.rol() !== "instructor") return;
  const usuarioId = String(sesion.usuario().id);
  const propios = listaCursos.filter(c => c.solicitudCurso && String(c.solicitudCurso.usuarioId) === usuarioId)
    .sort((a, b) => String(b.solicitudCurso.fecha).localeCompare(String(a.solicitudCurso.fecha)));
  const estados = { pendiente: "Pendiente de aprobación", publicado: "Aprobado", rechazado: "Cambios solicitados", inactivo: "Desactivado", borrador: "Borrador" };
  tabla.innerHTML = propios.map(c => {
    const solicitud = c.solicitudCurso;
    const fecha = new Date(solicitud.fecha);
    const fechaTexto = solicitud.fecha && !Number.isNaN(fecha.getTime()) ? formatoFecha(solicitud.fecha) : "Sin fecha registrada";
    const tono = ({ publicado: "aprobado", pendiente: "pendiente", rechazado: "cambios" })[c.estado] || "neutro";
    return `<tr data-solicitud-curso="${escaparHtml(c.id)}"><td data-label="Curso"><strong class="solicitud-curso-nombre">${escaparHtml(c.nombre)}</strong></td><td data-label="Fecha">${escaparHtml(fechaTexto)}</td><td data-label="Estatus"><span class="solicitud-estado solicitud-estado-${tono}">${escaparHtml((c.estado === "pendiente" && solicitud.corregidoPor ? "Corregido, pendiente de aprobación" : estados[c.estado]) || "Sin estatus")}</span></td><td data-label="Comentario" style="white-space:pre-wrap;overflow-wrap:anywhere">${escaparHtml(solicitud.comentario || "Sin comentarios")}</td></tr>`;
  }).join("") || '<tr><td colspan="4">Aún no has enviado solicitudes de revisión. Al crear o actualizar un curso, aparecerá aquí.</td></tr>';
}