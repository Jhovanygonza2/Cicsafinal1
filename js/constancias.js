// Plantilla compartida por la vista previa, el historial y el trabajador.
window.Constancias = (() => {
  const insignias = { aprobacion: "Curso aprobado", seguridad: "Seguridad y prevención", excelencia: "Excelencia en capacitación" };
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const imagen = (src, alt) => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(src || "") ? `<img src="${src}" alt="${alt}" style="max-height:80px;max-width:200px">` : "";
  function html(c, previa = false) {
    return `<!doctype html><html lang="es"><meta charset="utf-8"><title>${esc(c.titulo)}</title><style>body{font-family:Arial,sans-serif;color:#12304d;background:#f3f5f8;padding:24px}main{max-width:900px;margin:auto;background:white;border:8px double #143c63;padding:45px;text-align:center}h1{font-size:34px}h2{font-size:28px;color:#a9232e}p{line-height:1.7;white-space:pre-wrap}.detalle{font-size:14px}.firma{margin:30px auto 0;padding-top:12px;border-top:1px solid #aab4be;max-width:360px}@media print{body{background:white;padding:0}main{break-inside:avoid}}</style><main>${imagen(c.logo,"Logo")}<p>CICSA CAPACITA</p><h1>${esc(c.titulo)}</h1><p>Se reconoce a</p><h2>${esc(c.trabajador)}</h2><p>${esc(c.texto)}</p><h2>${esc(c.curso)}</h2><p>Instructor: ${esc(c.instructor)}${c.instructorRegistro?" · Registro: "+esc(c.instructorRegistro):""}</p><p class="detalle">Duración: ${esc(c.horas)} horas · Calificación: ${esc(c.nota)} / 100<br>Fecha: ${esc(new Date(c.fecha).toLocaleDateString("es-MX"))}<br>Folio: ${esc(c.folio)}<br>Insignia: ${esc(c.insigniaDetalle?.nombre || insignias[c.insignia] || c.insignia)}</p>${imagen(c.insigniaDetalle?.imagen,"Insignia obtenida")}<div class="firma">${imagen(c.firma,"Firma del responsable")}<p>${esc(c.firmante)}</p></div></main></html>`;
  }
  function imprimir(c) {
    if(c.formato) return FormatoConstancia.descargar(c);
    const ventana = window.open("", "_blank", "width=1050,height=800");
    if (!ventana) { window.CicsaToast?.mostrar("Permite las ventanas emergentes para descargar la constancia.", "advertencia"); return; }
    ventana.document.write(html(c)); ventana.document.close();
    ventana.addEventListener("load", () => ventana.print(), {once:true});
  }
  return { insignias, html, imprimir, listar: () => solicitar("GET", "/constancias"), guardar: (id, datos) => solicitar("PATCH", `/constancias/configuracion/${id}`, datos) };
})();
