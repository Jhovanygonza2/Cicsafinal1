/* La distribución de entrega no permite volver a cargar cursos ficticios. */
async function cargarDatosTester() {
  throw new Error("La carga de datos demo está deshabilitada en esta versión.");
}
