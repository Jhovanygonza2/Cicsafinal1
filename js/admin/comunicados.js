(() => {
  const CLAVE = "cicsa_comunicados";
  const maximo = 3;
  const form = document.getElementById("form-comunicado");
  if (!form) return;
  const $ = id => document.getElementById(id);
  const estado = $("comunicado-admin-estado"); 
  const lista = $("comunicados-admin-lista");       
  const rol = sesion.activa() ? sesion.rol() : null;
  const autorizado = ["admin", "superadmin"].includes(rol);
  const leer = () => { try { const v = JSON.parse(localStorage.getItem(CLAVE) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
  const guardar = datos => localStorage.setItem(CLAVE, JSON.stringify(datos));
  const comunicadosExistentes = new Set(leer().map(c => String(c.id)));
  const vigente = c => {
    if (!c.fechaLimite) return true;
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(c.fechaLimite);
    if (!partes) return true;
    const fin = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]) + 1);
    return Date.now() < fin.getTime();
  };
  const escapar = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let imagenPendiente = "", lectura=0, procesando=false, origen=null;
  const modal=$("comunicado-modal");
  function abrir(editando=false){
    if(!autorizado)return;
    origen=document.activeElement;
    $("comunicado-modal-titulo").textContent=editando?"Editar comunicado":"Nuevo comunicado";
    $("btn-guardar-comunicado").disabled=procesando||(!editando&&leer().filter(vigente).length>=maximo);
    modal.showModal();$("comunicado-titulo").focus();
  }
  function cerrar(){modal.close();reiniciar();(origen?.isConnected?origen:$("btn-nuevo-comunicado")).focus();}
  $("btn-nuevo-comunicado").onclick=()=>{reiniciar();abrir();};
  $("comunicado-cerrar").onclick=cerrar;
  modal.addEventListener("cancel",e=>{e.preventDefault();cerrar();});
  const categoriaBonita = valor => ({Curso:"Convocatoria", Mantenimiento:"Aviso", Importante:"Informativo"}[valor] || valor || "Aviso");
  const categoriaEditable = valor => ({Curso:"Convocatoria", Mantenimiento:"Aviso", Importante:"Informativo"}[valor] || valor || "Aviso");
  const formatoFecha = valor => { if (!valor) return "Fecha no especificada"; const f = new Date(valor + (String(valor).length === 10 ? "T12:00:00" : "")); return Number.isNaN(f.getTime()) ? escapar(valor) : new Intl.DateTimeFormat("es-MX", {day:"numeric",month:"short",year:"numeric"}).format(f); };
  function pintar() {
    const datos = leer(); $("comunicados-contador").textContent = `${datos.filter(vigente).length}/${maximo} activos`;
    lista.innerHTML = datos.length ? datos.map(c => `<article class="comunicado-admin-item">${c.imagen ? `<img src="${c.imagen}" alt="">` : `<div class="comunicado-admin-sin-imagen"><span>ℹ</span><small>SOLO TEXTO</small></div>`}<div class="comunicado-admin-item-info"><span class="comunicado-categoria">${escapar(categoriaBonita(c.categoria))}</span><h4>${escapar(c.titulo)}</h4>${c.texto ? `<p>${escapar(c.texto)}</p>` : `<p class="campo-ayuda">Comunicado publicado solo con imagen.</p>`}<small>${formatoFecha(c.fecha)} · ${c.fechaLimite ? `${vigente(c) ? "Visible hasta" : "Vencido el"} ${formatoFecha(c.fechaLimite)}` : "Sin fecha límite"}</small><div class="comunicado-admin-item-acciones"><button type="button" class="btn btn-secundario btn-sm" data-editar="${escapar(c.id)}">Editar</button><button type="button" class="btn btn-secundario btn-sm" data-eliminar="${escapar(c.id)}">Eliminar</button></div></div></article>`).join("") : `<p class="comunicados-admin-vacio">Todavía no hay comunicados publicados.</p>`;
    const lleno = datos.filter(vigente).length >= maximo && !$("comunicado-id").value; $("btn-guardar-comunicado").disabled = lleno || procesando;
    if (lleno) estado.textContent = "Ya hay 3 comunicados activos. Elimina uno o ajusta su fecha límite para publicar otro.";
  }
  function reiniciar() { lectura++;procesando=false;form.reset(); $("comunicado-id").value=""; $("comunicado-fecha").value=new Date().toISOString().slice(0,10); imagenPendiente=""; $("btn-guardar-comunicado").textContent="Publicar comunicado"; $("btn-cancelar-comunicado").hidden=false; estado.textContent=""; pintar(); }
  if (!autorizado) { $("btn-nuevo-comunicado").hidden=true;form.hidden=true; estado.textContent="Solo el administrador y el superadministrador pueden gestionar comunicados."; window.CicsaToast?.mostrar("Solo el administrador y el superadministrador pueden gestionar comunicados.","info"); }
  $("comunicado-fecha").value = new Date().toISOString().slice(0,10);
  $("comunicado-imagen").addEventListener("change", async e => {
    const token=++lectura,archivo=e.target.files?.[0];imagenPendiente="";procesando=false;
    $("btn-guardar-comunicado").disabled=!$("comunicado-id").value&&leer().filter(vigente).length>=maximo;
    if(!archivo)return;
    if(!archivo.type.startsWith("image/")||archivo.size>12*1024*1024){estado.textContent="Selecciona una imagen de hasta 12 MB.";e.target.value="";return;}
    procesando=true;$("btn-guardar-comunicado").disabled=true;estado.textContent="Procesando imagen…";
    try{const imagen=await comprimirImagen(archivo);if(token!==lectura)return;imagenPendiente=imagen;estado.textContent="Imagen lista para publicar.";}
    catch{if(token===lectura){estado.textContent="No se pudo procesar la imagen. Prueba con otra.";e.target.value="";}}
    finally{if(token===lectura){procesando=false;$("btn-guardar-comunicado").disabled=!$("comunicado-id").value&&leer().filter(vigente).length>=maximo;}}
  });
  function comprimirImagen(file) { return new Promise((resolve,reject) => { const img=new Image(); const url=URL.createObjectURL(file); img.onload=()=>{ const escala=Math.min(1,1400/Math.max(img.width,img.height)); const canvas=document.createElement("canvas"); canvas.width=Math.max(1,Math.round(img.width*escala)); canvas.height=Math.max(1,Math.round(img.height*escala)); const ctx=canvas.getContext("2d"); ctx.drawImage(img,0,0,canvas.width,canvas.height); URL.revokeObjectURL(url); resolve(canvas.toDataURL("image/jpeg",0.78)); }; img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Imagen inválida"));}; img.src=url; }); }
  form.addEventListener("submit", e => { e.preventDefault(); if (!autorizado || procesando) return; const datos=leer(); const id=$("comunicado-id").value; const existente=datos.find(c=>String(c.id)===id); if (vigente({fechaLimite:$("comunicado-fecha-limite").value}) && datos.filter(c=>String(c.id)!==id && vigente(c)).length>=maximo) { estado.textContent="Solo puedes tener 3 comunicados activos. Elimina uno o ajusta su fecha límite."; window.CicsaToast?.mostrar("Solo puedes tener 3 comunicados activos. Elimina uno o ajusta su fecha límite.","advertencia"); return; } const item={id:id || `com-${Date.now()}`, titulo:$("comunicado-titulo").value.trim(), categoria:$("comunicado-categoria").value, fecha:$("comunicado-fecha").value, fechaLimite:$("comunicado-fecha-limite").value, texto:$("comunicado-texto").value.trim(), imagen:imagenPendiente || existente?.imagen || "", creado:existente?.creado || new Date().toISOString(), actualizado:new Date().toISOString()}; if (!item.titulo || !item.fecha || (!item.texto && !item.imagen)) { estado.textContent="Completa el título y la fecha, y agrega texto o una imagen."; window.CicsaToast?.mostrar("Completa el título y la fecha, y agrega texto o una imagen.","advertencia"); return; } if (item.fechaLimite && item.fechaLimite < item.fecha) { estado.textContent="La fecha límite no puede ser anterior a la fecha del comunicado."; window.CicsaToast?.mostrar(estado.textContent,"advertencia"); return; } const actualizados=existente ? datos.map(c=>c.id===existente.id?item:c) : [item,...datos]; try { guardar(actualizados); window.CicsaToast?.mostrar(existente ? "Comunicado actualizado." : "Comunicado publicado.", "exito"); estado.textContent=existente?"Comunicado actualizado.":"Comunicado publicado."; cerrar(); } catch (err) { estado.textContent="No se pudo guardar. La imagen podría ser demasiado grande; usa una imagen más pequeña."; window.CicsaToast?.mostrar("No se pudo guardar. La imagen podría ser demasiado grande; usa una imagen más pequeña.","error"); } });
  lista.addEventListener("click", e => { if (!autorizado) return; const editar=e.target.closest("[data-editar]"); const eliminar=e.target.closest("[data-eliminar]"); const datos=leer(); if (editar) { const c=datos.find(x=>String(x.id)===editar.dataset.editar); if (!c) return; lectura++;procesando=false;$("comunicado-imagen").value="";$("comunicado-id").value=c.id; $("comunicado-titulo").value=c.titulo; $("comunicado-categoria").value=categoriaEditable(c.categoria); $("comunicado-fecha").value=c.fecha || ""; $("comunicado-fecha-limite").value=c.fechaLimite || ""; $("comunicado-texto").value=c.texto; imagenPendiente=""; $("btn-guardar-comunicado").textContent="Guardar cambios"; $("btn-cancelar-comunicado").hidden=false; estado.textContent="Editando comunicado. Si no seleccionas otra imagen, se conservará la actual."; abrir(true); } else if (eliminar) { const c=datos.find(x=>String(x.id)===eliminar.dataset.eliminar); if (!c || !confirm(`¿Eliminar el comunicado «${c.titulo}»?`)) return; try { guardar(datos.filter(x=>x.id!==c.id)); window.CicsaToast?.mostrar("Comunicado eliminado.", "exito"); } catch { window.CicsaToast?.mostrar("No se pudo eliminar el comunicado.", "error"); return; } if ($("comunicado-id").value===String(c.id)) reiniciar(); else {estado.textContent="Comunicado eliminado."; window.CicsaToast?.mostrar("Comunicado eliminado.","exito");pintar();} } });
  $("btn-cancelar-comunicado").addEventListener("click", cerrar);
  form.addEventListener("submit", () => setTimeout(() => {
    const nuevos = leer().filter(c => !comunicadosExistentes.has(String(c.id)));
    nuevos.forEach(c => {
      comunicadosExistentes.add(String(c.id));
      notificacionesAdmin.comunicado(c).catch(error => window.CicsaToast?.mostrar("El comunicado se publicó, pero no se pudo notificar a Administración: " + error.message, "advertencia"));
    });
  }, 0));
  window.addEventListener("storage", e => { if (e.key===CLAVE) pintar(); });
  window.addEventListener("focus", pintar);
  window.addEventListener("pageshow", pintar);
  setInterval(pintar, 30000);
  pintar();
})();
