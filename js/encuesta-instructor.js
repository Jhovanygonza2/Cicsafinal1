// Encuesta posterior a la aprobacion: no modifica la nota ni el certificado.
window.encuestaInstructorUI = {
  async montar(contenedor, cursoId) {
    if (!contenedor || sesion.rol() !== "trabajador") return;
    const escapar = valor => String(valor ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    contenedor.innerHTML = '<p role="status">Cargando evaluaci\u00f3n de experiencia de aprendizaje...</p>';
    try {
      const estado = await encuestasInstructor.estado(cursoId);
      if (!contenedor.isConnected) return;
      if (!estado.elegible) { contenedor.replaceChildren(); return; }
      if (estado.enviada) { contenedor.innerHTML = '<p role="status">Gracias. Tu evaluaci\u00f3n de experiencia de aprendizaje ya fue enviada.</p>'; return; }
      const ordenSecciones = ["Contenido", "Material didáctico", "Aprendizaje y aplicación", "Satisfacción general"];
      const preguntas = estado.preguntas
        .map((p, orden) => [p.id, p.texto, p.seccion, orden])
        .sort((a, b) => {
          const seccionA = ordenSecciones.indexOf(a[2]);
          const seccionB = ordenSecciones.indexOf(b[2]);
          return (seccionA < 0 ? ordenSecciones.length : seccionA) - (seccionB < 0 ? ordenSecciones.length : seccionB) || a[3] - b[3];
        });
      contenedor.innerHTML = `<section class="tarjeta encuesta-instructor"><h2>Evaluaci\u00f3n de experiencia de aprendizaje</h2><p>${escapar(estado.instructor)}</p><p>Comparte tu experiencia con el contenido y los materiales del curso. Las respuestas son para consulta exclusiva del super admin.</p><p>Escala de 1 a 5: 1 = Muy en desacuerdo; 5 = Muy de acuerdo.</p>
        <form>${preguntas.map(([clave,texto,seccion],indice) => `${seccion && seccion!==preguntas[indice-1]?.[2] ? `<h3 class="encuesta-seccion">${escapar(seccion)}</h3>` : ""}<fieldset><legend>${indice+1}. ${escapar(texto)}</legend><div class="encuesta-opciones">${[1,2,3,4,5].map(n => `<label><input type="radio" name="${escapar(clave)}" value="${n}" required> ${n}</label>`).join("")}</div></fieldset>`).join("")}
        <h3 class="encuesta-seccion">${preguntas.length+1}. Comentarios y sugerencias</h3><label>¿Qué mejorarías del contenido o del material del curso? (opcional)<textarea name="comentario" maxlength="1000" rows="4"></textarea></label>
        <p role="alert" data-error></p><button class="btn btn-primario" type="submit">Enviar evaluaci\u00f3n</button></form></section>`;
      contenedor.querySelector("form").addEventListener("submit", async evento => {
        evento.preventDefault();
        const form = evento.currentTarget;
        if (!form.reportValidity()) return;
        const boton = form.querySelector("button");
        if (boton.disabled) return;
        boton.disabled = true;
        const datos = new FormData(form);
        form.querySelector("[data-error]").textContent = "";
        try {
          await encuestasInstructor.enviar(cursoId, { version: estado.version, puntuaciones: Object.fromEntries(preguntas.map(([clave]) => [clave, Number(datos.get(clave))])), comentario: datos.get("comentario") });
          contenedor.innerHTML = '<p role="status" tabindex="-1">Gracias. Tu evaluaci\u00f3n de experiencia de aprendizaje fue enviada.</p>';
          contenedor.querySelector("p").focus();
        } catch (error) {
          form.querySelector("[data-error]").textContent = error.message || "No se pudo enviar. Intenta nuevamente.";
          boton.disabled = false;
        }
      });
    } catch (error) {
      contenedor.innerHTML = '<p role="alert">No se pudo cargar la evaluaci\u00f3n de experiencia de aprendizaje.</p><button type="button" class="btn btn-secundario">Reintentar</button>';
      contenedor.querySelector("button").addEventListener("click", () => window.encuestaInstructorUI.montar(contenedor, cursoId));
    }
  }
};
