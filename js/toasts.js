// Avisos compartidos: confirmar resultados reales, sin sustituir los errores junto al campo.
(() => {
  "use strict";
  const tipos = {exito:["✓","Éxito"],error:["!","Error"],advertencia:["!","Atención"],info:["i","Información"]};
  const recientes = new Map();
  const pendientes = new Set();
  let contenedor;
  function mostrar(mensaje, tipo = "info", opciones = {}) {
    if (!mensaje) return;
    tipo = tipos[tipo] ? tipo : "info";
    const clave = opciones.clave || tipo + ":" + mensaje;
    const ahora = Date.now();
    if (recientes.has(clave) && ahora - recientes.get(clave) < (opciones.intervalo || 4000)) return;
    recientes.set(clave, ahora);
    for (const [key, tiempo] of recientes) if (ahora - tiempo > 60000) recientes.delete(key);
    if (!contenedor) {
      contenedor = document.createElement("section");
      contenedor.className = "cicsa-toasts";
      contenedor.setAttribute("aria-label", "Avisos de la aplicación");
      document.body.appendChild(contenedor);
    }
    while (contenedor.children.length >= 4) contenedor.firstElementChild._cerrarToast();
    const aviso = document.createElement("div");
    aviso.className = "cicsa-toast cicsa-toast-" + tipo;
    aviso.setAttribute("role", tipo === "error" ? "alert" : "status");
    aviso.setAttribute("aria-atomic", "true");
    const icono = document.createElement("span");
    icono.className = "cicsa-toast-icono"; icono.textContent = tipos[tipo][0]; icono.setAttribute("aria-hidden","true");
    const texto = document.createElement("span");
    texto.className = "cicsa-toast-texto"; texto.textContent = tipos[tipo][1] + ": " + mensaje;
    const cerrar = document.createElement("button");
    cerrar.type = "button"; cerrar.textContent = "×"; cerrar.setAttribute("aria-label","Cerrar aviso");
    let timer, salidaTimer, saliendo = false;
    const quitar = () => { clearTimeout(timer); clearTimeout(salidaTimer); aviso.remove(); };
    aviso._cerrarToast = quitar;
    const pausar = () => clearTimeout(timer);
    const desvanecer = () => {
      if (saliendo) return;
      saliendo = true;
      aviso.className += " cicsa-toast-saliendo";
      salidaTimer = setTimeout(quitar, 300);
    };
    const continuar = () => { pausar(); if (!saliendo) timer = setTimeout(desvanecer, opciones.duracion || 1000); };
    cerrar.addEventListener("click", quitar);
    aviso.addEventListener("mouseenter", pausar); aviso.addEventListener("mouseleave", continuar);
    aviso.addEventListener("focusin", pausar);
    aviso.addEventListener("focusout", e => { if (!aviso.contains(e.relatedTarget)) continuar(); });
    aviso.append(icono,texto,cerrar); contenedor.appendChild(aviso); continuar();
    return aviso;
  }
  function alNavegar(mensaje, tipo = "info") {
    try { sessionStorage.setItem("cicsa_toast_pendiente", JSON.stringify({mensaje,tipo,fecha:Date.now()})); }
    catch { mostrar(mensaje,tipo); }
  }
  function marcarPendiente(form) {
    if (!form || pendientes.has(form)) return;
    pendientes.add(form);
    mostrar("Tienes cambios pendientes de guardar.", "info", {clave:"cambios-pendientes"});
  }
  function guardado(form) { pendientes.delete(typeof form === "string" ? document.getElementById(form) : form); }
  window.CicsaToast = {mostrar,alNavegar,marcarPendiente,guardado};
  window.addEventListener("offline", () => mostrar("Sin conexión. Comprueba la red antes de continuar.", "advertencia", {clave:"red"}));
  window.addEventListener("online", () => mostrar("Conexión recuperada.", "exito", {clave:"red-recuperada"}));
  window.addEventListener("beforeunload", e => { if (pendientes.size) { e.preventDefault(); e.returnValue = ""; } });
  function iniciar() {
    try {
      const raw = sessionStorage.getItem("cicsa_toast_pendiente");
      sessionStorage.removeItem("cicsa_toast_pendiente");
      const aviso = raw && JSON.parse(raw);
      if (aviso && Date.now()-aviso.fecha < 60000) mostrar(aviso.mensaje,aviso.tipo);
    } catch {}
    document.querySelectorAll("#form-curso, #form-comunicado, #form-usuario, #form-soporte").forEach(form => {
      form.addEventListener("input", () => marcarPendiente(form));
      form.addEventListener("change", () => marcarPendiente(form));
      form.addEventListener("reset", () => guardado(form));
      form.addEventListener("invalid", e => mostrar(e.target.validationMessage || "Revisa los campos del formulario.", "advertencia", {clave:"formulario-invalido"}), true);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
