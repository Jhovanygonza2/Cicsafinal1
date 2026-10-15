// Representación compartida y segura de las insignias obtenidas.
window.InsigniasVista = (() => {
  function pintar(contenedor, insignias, compacto=false) {
    contenedor.replaceChildren();
    contenedor.classList.add(compacto?"insignias-resumen":"insignias-obtenidas");
    if (!insignias.length) {
      const texto=document.createElement("p");texto.className="muted";texto.textContent="Aún no hay insignias. Aprueba cursos para obtenerlas.";contenedor.append(texto);return;
    }
    for(const i of insignias){
      const tarjeta=document.createElement(compacto?"span":"article");tarjeta.className=compacto?"insignia-mini":"insignia-obtenida";
      tarjeta.title=`${i.nombre} · ${i.puntos || 0} puntos${i.curso?" · "+i.curso:""}${Number.isFinite(i.calificacion)?" · "+i.calificacion+"%":""}`;
      const emblema=document.createElement("span");emblema.className="insignia-emblema";
      if(/^data:image\/(png|jpeg|webp);base64,/.test(i.imagen || "")){
        const img=document.createElement("img");img.src=i.imagen;img.alt=i.nombre;img.width=64;img.height=64;emblema.append(img);
      }else{emblema.textContent="★";emblema.setAttribute("aria-label",i.nombre);}
      tarjeta.append(emblema);
      if(!compacto){
        const nombre=document.createElement("h4");nombre.textContent=i.nombre;tarjeta.append(nombre);
        const detalle=document.createElement("p");detalle.textContent=i.descripcion || "Reconocimiento por tu capacitación.";tarjeta.append(detalle);
        const origen=document.createElement("small");origen.textContent=i.automatica?"Premio automático":[i.curso || "Curso aprobado",Number.isFinite(i.calificacion)?i.calificacion+"%":""].filter(Boolean).join(" · ");tarjeta.append(origen);
        const puntos=document.createElement("strong");puntos.textContent=`${i.puntos || 0} puntos`;tarjeta.append(puntos);
      }
      contenedor.append(tarjeta);
    }
  }
  return {pintar};
})();
