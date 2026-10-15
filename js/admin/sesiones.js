// El reporte también exige permiso en la API, no solo en el menú.
(() => {
  if (!["admin", "superadmin"].includes(sesion.rol())) return;
  document.getElementById("historial-sesiones").hidden = false;
  document.getElementById("sesiones-demo").hidden = !MOCK_MODE;
  let registros = [], cargando = false;
  const buscar = document.getElementById("buscar-sesiones");
  const limite = document.getElementById("sesiones-limite");
  limite.value = "0";
  const error = document.getElementById("sesiones-error");
  function pintar() {
    const filas = registros.filter(r => r.nombre.toLocaleLowerCase().includes(buscar.value.trim().toLocaleLowerCase()));
    document.getElementById("tabla-sesiones").innerHTML = filas.slice(0, Math.max(0, Number(limite.value) || 0)).map(r => {
      const segundos = Math.max(0, Math.floor((Date.parse(r.salida || r.ultimaSenal) - Date.parse(r.entrada)) / 1000));
      const duracion = Math.floor(segundos / 3600) + " h " + Math.floor(segundos % 3600 / 60) + " min " + segundos % 60 + " s";
      return `<tr><td>${escaparHtml(r.nombre)}</td><td>${formatoFecha(r.entrada)}</td><td>${r.salida ? formatoFecha(r.salida) + (r.estimada ? " (estimada)" : "") : "Sigue conectado"}</td><td>${duracion}</td></tr>`;
    }).join("") || '<tr><td colspan="4">No hay conexiones registradas para esta búsqueda.</td></tr>';
  }
  function puedeConsultar() {
    const permitido = sesion.activa() && ["admin", "superadmin"].includes(sesion.rol());
    if (!permitido) {
      registros = [];
      document.getElementById("tabla-sesiones").replaceChildren();
      document.getElementById("historial-sesiones").hidden = true;
    }
    return permitido;
  }
  async function cargar() {
    if (!puedeConsultar() || cargando) return;
    cargando = true;
    try {
      registros = (await reportes.sesiones()).sort((a,b) => Date.parse(b.entrada) - Date.parse(a.entrada));
      if (!puedeConsultar()) return;
      pintar(); error.textContent = "";
    } catch (e) { error.textContent = "No se pudo actualizar el historial: " + e.message; }
    finally { cargando = false; }
  }
  buscar.addEventListener("input", pintar);
  limite.addEventListener("change", pintar);
  window.addEventListener("storage", e => { if (puedeConsultar() && e.key === "cicsa_sesiones_uso") cargar(); });
  setInterval(cargar, 30000);
  cargar();
})();
