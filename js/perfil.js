// perfil.js — RF-023..029 (historial) + insignias/certificados como refuerzo motivacional

sesion.requerir(["trabajador"]);
sesion.vigilarInactividad(20);

const usuarioActual = sesion.usuario();

document.querySelector(".help-btn")?.addEventListener("click", () => { window.location.href = "tutorial.html"; });

function iniciales(nombre) {
  return nombre.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function pintarIdentidad() {
  if (!usuarioActual) return;
  const ini = iniciales(usuarioActual.nombre);
  document.getElementById("nombre-perfil").textContent = usuarioActual.nombre;
  document.getElementById("correo-perfil").textContent = usuarioActual.correo || "";
  document.getElementById("avatar-perfil").textContent = ini;
}

// ---------------------------------------------------------------
// Navegación por pestañas (navbar superior: Insignias / Historial)
// ---------------------------------------------------------------
document.querySelectorAll(".tabs-navbar .item-nav").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".tabs-navbar .item-nav").forEach((l) => l.classList.remove("activo"));
    link.classList.add("activo");
    document.querySelectorAll(".vista").forEach((v) => v.classList.add("oculto"));
    document.getElementById("vista-" + link.dataset.vista).classList.remove("oculto");
    history.replaceState(null, "", `#${link.dataset.vista}`);
  });
});

const parametroTab = new URLSearchParams(window.location.search).get("tab");
const hashTab = window.location.hash.replace("#", "");
if (parametroTab === "historial" || hashTab === "historial") {
  document.querySelector('.tabs-navbar .item-nav[data-vista="historial"]')?.click();
}

// ---------------------------------------------------------------
// Datos: insignias, certificados e historial de aprendizaje
// ---------------------------------------------------------------
async function cargarPerfil() {
  const [items, resultados, logros] = await Promise.all([
    progreso.misCursos(),
    // Mantiene el perfil operativo mientras el backend real incorpora este reporte.
    reportes.misResultados().catch(() => []),
    solicitar("GET", "/insignias/mis"),
  ]);
  window.notificacionesPerfil.actualizar(items);
  const completados = items.filter((i) => i.progreso.estado === "completado" && i.progreso.examenAprobado === true);
  const promedioProgreso = items.length
    ? Math.round(items.reduce((acc, i) => acc + i.progreso.porcentaje, 0) / items.length)
    : 0;

  document.getElementById("metrica-certificados").textContent = completados.length;
  document.getElementById("metrica-insignias").textContent = logros.insignias.length;
  document.getElementById("metrica-progreso").textContent = `${promedioProgreso}%`;

  document.getElementById("nombre-historial").textContent = usuarioActual.nombre;
  document.getElementById("avatar-historial").textContent = iniciales(usuarioActual.nombre);
  document.getElementById("meta-insignias-historial").textContent = logros.insignias.length;
  document.getElementById("meta-cursos-historial").textContent = completados.length;

  pintarPanelDesempeno(resultados);

  document.getElementById("puesto-perfil").textContent = logros.usuario.puesto || "Puesto pendiente de asignar";
  document.getElementById("puntos-insignias-perfil").textContent = `${logros.puntos} puntos obtenidos`;
  InsigniasVista.pintar(document.getElementById("contenedor-insignias"),logros.insignias);
  InsigniasVista.pintar(document.getElementById("insignias-resumen-perfil"),logros.insignias,true);
  const contenedorCertificados = document.getElementById("contenedor-certificados");
  contenedorCertificados.replaceChildren();
  let constanciasEmitidas = [];
  try { constanciasEmitidas = await Constancias.listar(); }
  catch (error) { window.CicsaToast?.mostrar("No se pudieron cargar tus constancias. Recarga para volver a consultar.", "advertencia"); }
  document.getElementById("metrica-certificados").textContent = constanciasEmitidas.length;
  if (!constanciasEmitidas.length) {
    const vacio=document.createElement("div");vacio.className="tarjeta";
    const texto=document.createElement("p");texto.className="muted";texto.style.textAlign="center";
    texto.textContent="Todavía no tienes constancias emitidas. Al aprobar el examen final de un curso, tu constancia aparecerá aquí.";
    vacio.append(texto);contenedorCertificados.append(vacio);
  } else {
    constanciasEmitidas.sort((a,b)=>(Date.parse(b.fecha)||0)-(Date.parse(a.fecha)||0));
    for (const registro of constanciasEmitidas) {
      const tarjeta=document.createElement("article");tarjeta.className="tarjeta";
      tarjeta.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:var(--gap-md);flex-wrap:wrap;";
      const info=document.createElement("div");
      const titulo=document.createElement("p");titulo.style.cssText="font-weight:600;margin:0 0 4px;";titulo.textContent=registro.curso || "Curso aprobado";
      const detalle=document.createElement("p");detalle.className="muted";detalle.style.cssText="margin:0;font-size:12px;";
      const fecha=registro.fecha?new Date(registro.fecha).toLocaleDateString("es-MX"):"Fecha no disponible";
      detalle.textContent=`Constancia ${registro.folio || ""} · Calificación: ${registro.nota ?? "—"}% · ${fecha}`;
      info.append(titulo,detalle);tarjeta.append(info);
      const acciones=document.createElement("div");acciones.style.cssText="display:flex;gap:8px;flex-wrap:wrap;";
      const ver=document.createElement("button");ver.type="button";ver.className="btn btn-secundario";ver.textContent="Visualizar";
      ver.addEventListener("click",async()=>{
        try {
          if(registro.formato && window.FormatoConstancia){
            const bytes=await FormatoConstancia.generar(registro);
            const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
            const ventana=window.open(url,"_blank");
            if(!ventana)window.CicsaToast?.mostrar("Permite las ventanas emergentes para visualizar la constancia.","advertencia");
            setTimeout(()=>URL.revokeObjectURL(url),60000);
          } else {
            const blob=new Blob([Constancias.html(registro)],{type:"text/html;charset=utf-8"});
            const url=URL.createObjectURL(blob);const ventana=window.open(url,"_blank");
            if(!ventana)window.CicsaToast?.mostrar("Permite las ventanas emergentes para visualizar la constancia.","advertencia");
            setTimeout(()=>URL.revokeObjectURL(url),60000);
          }
        } catch(error){window.CicsaToast?.mostrar("No se pudo visualizar la constancia: "+error.message,"error");}
      });
      const descargar=document.createElement("button");descargar.type="button";descargar.className="btn btn-primario";descargar.textContent="Descargar constancia";
      descargar.addEventListener("click",()=>Constancias.imprimir(registro));
      acciones.append(ver,descargar);tarjeta.append(acciones);contenedorCertificados.append(tarjeta);
    }
  }
  for (const registro of constanciasEmitidas.filter(r=>r.dc3)) {
    const boton=document.createElement("button");boton.type="button";boton.className="btn btn-secundario";boton.textContent="Descargar DC-3 · "+registro.curso;
    boton.onclick=()=>DC3.abrirPDF(registro.dc3).catch(error=>window.CicsaToast?.mostrar("No se pudo abrir el DC-3: "+error.message,"error"));contenedorCertificados.append(boton);
  }
  const contenedorHistorial = document.getElementById("contenedor-historial");
  const filtroEstado = document.getElementById("filtro-historial-estado");
  const filtroOrden = document.getElementById("filtro-historial-orden");
  const buscador = document.getElementById("buscar-historial");

  function obtenerItemsFiltrados() {
    let lista = [...items];
    const texto = buscador?.value.trim().toLowerCase() || "";
    const estado = filtroEstado?.value || "";

    if (texto) {
      lista = lista.filter((i) => i.curso.nombre.toLowerCase().includes(texto));
    }

    if (estado) {
      lista = lista.filter((i) => i.progreso.estado === estado);
    }

    if (filtroOrden?.value === "antiguo") {
      lista.sort((a, b) => (a.curso.fechaInicio || "").localeCompare(b.curso.fechaInicio || ""));
    } else if (filtroOrden?.value === "nombre") {
      lista.sort((a, b) => a.curso.nombre.localeCompare(b.curso.nombre));
    } else {
      lista.sort((a, b) => (b.progreso.fechaFin || b.progreso.fechaInicio || "").localeCompare(a.progreso.fechaFin || a.progreso.fechaInicio || ""));
    }

    return lista;
  }

  function renderHistorial() {
    const lista = obtenerItemsFiltrados();
    contenedorHistorial.innerHTML = lista.length
      ? lista.map((i) => `
          <div class="historial-item">
            <div class="historial-item-curso">
              <div class="historial-item-imagen"><svg class="perfil-icono-lineal" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4V4Zm9 3a3 3 0 0 1 3-3h4v15h-3a4 4 0 0 0-4 2"/><path d="M7 8h3M7 12h3"/></svg></div>
              <div class="historial-item-info">
                <strong>${i.curso.nombre}</strong>
                <div class="historial-item-meta">
                  <span>${i.curso.categoria || "General"}</span>
                  <span>•</span>
                  <span>${i.curso.duracion || "Sin duración"}</span>
                </div>
              </div>
            </div>
            <div class="historial-col">
              <span>Fecha de inicio del curso</span>
              <strong>${formatearFechaInicioCurso(i.curso.fechaInicio)}</strong>
            </div>
            <div class="historial-col">
              <span>Fecha de finalización del curso</span>
              <strong>${i.progreso.fechaFin || "—"}</strong>
            </div>
            <div class="historial-col">
              <span>Fecha de finalización</span>
              <strong>${i.progreso.fechaFin || "—"}</strong>
            </div>
            <div class="historial-col" style="align-items:flex-end;">
              <span>Estado de finalización</span>
              <span class="historial-estado ${i.progreso.estado}">${i.progreso.estado === "completado" ? "Completado" : i.progreso.bloqueadoPorExamen ? "Bloqueado · examen no aprobado" : estadoTemporalCurso(i.curso) === "cerrado" ? "Bloqueado · plazo vencido" : i.progreso.estado === "listo_examen" ? "Pendiente de examen" : i.progreso.estado === "en_proceso" ? "En proceso" : "No iniciado"}</span>
            </div>
          </div>
        `).join("")
      : `<div class="tarjeta"><p class="muted" style="text-align: center;">No se encontraron resultados.</p></div>`;
  }

  buscador?.addEventListener("input", renderHistorial);
  filtroEstado?.addEventListener("change", renderHistorial);
  filtroOrden?.addEventListener("change", renderHistorial);

  renderHistorial();
}

function pintarPanelDesempeno(resultados) {
  const panel = document.getElementById("panel-desempeno");
  if (!panel) return;
  // El reporte entrega primero el intento más reciente cuando coinciden las fechas.
  const finales = resultados.filter(r =>
    String(r.tipo || "examen").toLowerCase() === "examen" &&
    r.nota !== null && r.nota !== undefined && String(r.nota).trim() !== "" &&
    Number.isFinite(Number(r.nota)) && Number(r.nota) >= 0 && Number(r.nota) <= 100
  ).sort((a,b) => (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0));
  panel.hidden = !finales.length;
  if (!finales.length) return;

  const resultado = finales[0], nota = Number(resultado.nota);
  const estado = String(resultado.estado || "").trim().toLowerCase();
  const minima = resultado.minimaAprobatoria;
  const tieneMinima = minima !== null && minima !== undefined && String(minima).trim() !== "" && Number.isFinite(Number(minima));
  const aprobado = estado === "aprobado" ? true
    : ["no aprobado", "reprobado"].includes(estado) ? false
    : typeof resultado.aprobado === "boolean" ? resultado.aprobado
    : tieneMinima ? nota >= Number(minima) : null;
  const titulo = document.getElementById("panel-desempeno-titulo");
  const mensaje = document.getElementById("panel-desempeno-mensaje");
  const etiqueta = document.getElementById("panel-desempeno-etiqueta");
  const icono = document.getElementById("panel-desempeno-icono");
  panel.classList.remove("desempeno-excelente", "desempeno-en-progreso", "desempeno-impulso");
  panel.classList.add(aprobado === false ? "desempeno-impulso" : aprobado === true ? "desempeno-excelente" : "desempeno-en-progreso");
  document.getElementById("panel-desempeno-promedio").textContent = `${nota}%`;
  etiqueta.textContent = "Último examen final";
  titulo.textContent = aprobado === true ? "Examen final aprobado" : aprobado === false ? "Examen final reprobado" : "Calificación del examen final";
  icono.textContent = aprobado === true ? "✓" : aprobado === false ? "!" : "•";
  mensaje.textContent = `${resultado.curso || "Curso"} · Obtuviste ${nota}% en el examen final.${tieneMinima ? ` Calificación mínima aprobatoria: ${Number(minima)}%.` : ""}`;
}

if (sesion.activa() && sesion.rol() === "trabajador") {
  pintarIdentidad();
  cargarPerfil().catch((error) => {
    const aviso = document.createElement("p");
    aviso.setAttribute("role", "alert");
    aviso.textContent = error.message || "No se pudo cargar tu perfil. Recarga la página para reintentar.";
    document.querySelector(".app-main-panel")?.prepend(aviso);
  });
}
