(() => {
  if (sesion.rol() !== "superadmin") return;
  const $ = id => document.getElementById("constancia-" + id);
  let cursosDisponibles = [], instructores = [], emitidas = [], catalogo = [], imagenes = {logo:"",firma:"",firmaResponsable:""}, cambios = false;
  let formatos=[],formato=null,campos=FormatoConstancia.predeterminados(),versionPrevia=0,urlPrevia="",timerPrevia,subiendo=false,versionCarga=0;
  const formulario = document.getElementById("form-constancia");
  const modal=$("modal");let origenModal=null,guardando=false;
  function abrirModal(){origenModal=document.activeElement;if(!modal.open)modal.showModal();$("curso").focus();}
  function cerrarModal(){if(guardando)return;modal.close();(origenModal?.isConnected?origenModal:$("abrir")).focus();}
  $("abrir").onclick=abrirModal;$("cerrar").onclick=cerrarModal;
  modal.addEventListener("cancel",event=>{
    // Cancelar el selector de archivos no debe cerrar el dialogo que lo contiene.
    if(event.target!==modal)return;
    event.preventDefault();cerrarModal();
  });
  const datosEmision=["empresa","lugar","vigencia"];
  const camposModelo=FormatoConstancia.ordenModelo;
  const camposEditables=["visible","pagina","x","y","ancho","alto","tamano","color","alineacion"];
  $("campo").replaceChildren(...camposModelo.map(id=>new Option(id==="periodoFin"?"Fecha del curso":FormatoConstancia.nombres[id],id)));
  function mostrarCampo(){const c=campos.find(c=>c.clave===$("campo").value);if(!c)return;for(const clave of camposEditables){const input=$("campo-"+clave);if(clave==="visible")input.checked=c[clave];else input.value=c[clave];}}
  function leerCampo(){const c=campos.find(c=>c.clave===$("campo").value);if(!c)return;for(const clave of camposEditables){const input=$("campo-"+clave);c[clave]=clave==="visible"?input.checked:["color","alineacion"].includes(clave)?input.value:Number(input.value);}}
  function opcionesFormatos(){const id=formato?.archivoId || "";$("formato").replaceChildren(new Option("Seleccionar formato",""),...formatos.map(f=>new Option(f.nombre,f.id)));$("formato").value=id;}
  function ejemplo(){const curso=cursosDisponibles.find(c=>c.id===Number($("curso").value));return {...datos(),trabajador:$("trabajador-auto").value.trim() || "Nombre del trabajador",curso:curso?.nombre || "Nombre del curso",categoria:curso?.categoria || "",periodoInicio:curso?.fechaInicio || "",periodoFin:curso?.fechaFin || "",area:"Área del trabajador",numeroEmpleado:"Número de empleado",resultado:"APROBADO",minimaAprobatoria:curso?.minimaConstancia ?? 80,instructorCargo:instructores.find(i=>i.id===Number($("instructor").value))?.puesto || "",horas:curso?.horas || 1,nota:100,fecha:new Date().toISOString(),folio:"VISTA-PREVIA",curp:"CURP DEL TRABAJADOR",puesto:"Puesto del trabajador",instructorRegistro:instructores.find(i=>i.id===Number($("instructor").value))?.registro || "Registro del instructor"};}
  $("orden-ejemplo").onclick=()=>{
    campos=FormatoConstancia.predeterminados();
    campos.find(c=>c.clave==="firmaResponsable").visible=!!imagenes.firmaResponsable;
    $("campo").value=camposModelo[0];mostrarCampo();cambios=true;previa();
  };
  $("campo").addEventListener("change",mostrarCampo);
  $("posiciones").addEventListener("input",event=>{if(event.target===$("campo"))return;leerCampo();cambios=true;previa();});
  $("actualizar-previa").onclick=()=>{leerCampo();previa();};
  $("prueba").onclick=()=>FormatoConstancia.descargar(ejemplo(),true);
  $("formato").addEventListener("change",()=>{const f=formatos.find(f=>f.id===$("formato").value);formato=f?{archivoId:f.id,nombre:f.nombre}:null;campos=FormatoConstancia.predeterminados();cambios=true;mostrarCampo();previa();});
  $("archivo").addEventListener("change",async()=>{
    const file=$("archivo").files[0];if(!file)return;
    const token=++versionCarga;subiendo=true;formulario.querySelector('[type="submit"]').disabled=true;$("archivo-estado").textContent="Leyendo y comprobando el formato…";
    try{
      if(!["application/pdf","image/png","image/jpeg"].includes(file.type)||file.size>5*1024*1024)throw new Error("Selecciona un PDF, PNG o JPG válido de hasta 5 MB.");
      const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error("No se pudo leer el archivo."));r.readAsDataURL(file);});
      const paginas=await FormatoConstancia.inspeccionar(data);if(token!==versionCarga)return;
      const nombre=$("formato-nombre").value.trim() || file.name.replace(/\.[^.]+$/,"");
      const guardado=await solicitar("POST","/formatos-constancia",{nombre,archivo:data});
      if(token!==versionCarga)return;
      FormatoConstancia.recordar(guardado.id,data);formatos.push(guardado);formato={archivoId:guardado.id,nombre:guardado.nombre};campos=FormatoConstancia.predeterminados();opcionesFormatos();mostrarCampo();cambios=true;previa();
      $("archivo-estado").textContent=`Formato guardado: ${guardado.nombre} · ${paginas.length} página(s). Ajusta los campos y vincúlalo al curso.`;
    }catch(error){if(token===versionCarga)$("archivo-estado").textContent=error.message;}
    finally{if(token===versionCarga){subiendo=false;formulario.querySelector('[type="submit"]').disabled=false;$("archivo").value="";}}
  });
  window.addEventListener("pagehide",()=>{if(urlPrevia)URL.revokeObjectURL(urlPrevia);});
  function datos() {
    return { ...Object.fromEntries(datosEmision.map(k=>[k,$(k).value.trim()])), instructorId:Number($("instructor").value), instructor:instructores.find(i=>i.id===Number($("instructor").value))?.nombre || "Seleccionar instructor", insignia:$("insignia").value, insigniaDetalle:catalogo.find(i=>i.id===$("insignia").value), titulo:$("titulo").value.trim(), texto:$("texto").value.trim(), firmante:$("firmante").value.trim(), ...imagenes, formato:formato?{...formato,campos:campos.map(c=>({...c}))}:null };
  }
  function previa() {
    clearTimeout(timerPrevia);const version=++versionPrevia;
    if(!formato){if(urlPrevia){URL.revokeObjectURL(urlPrevia);urlPrevia="";}$("previa").removeAttribute("src");$("previa").srcdoc='<p style="font:16px Arial;padding:32px;color:#455468">Carga tu formato PDF, PNG o JPG para ver aquí el diseño con los datos del curso.</p>';return;}
    timerPrevia=setTimeout(async()=>{try{
      const bytes=await FormatoConstancia.generar(ejemplo(),true);if(version!==versionPrevia)return;
      const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));$("previa").removeAttribute("srcdoc");$("previa").src=url+"#toolbar=0&view=FitH";
      if(urlPrevia)URL.revokeObjectURL(urlPrevia);urlPrevia=url;
    }catch(error){if(version===versionPrevia)$("estado").textContent=error.message;}},300);
  }
  function seleccionar() {
    versionCarga++;subiendo=false;formulario.querySelector('[type="submit"]').disabled=false;$("archivo").value="";
    imagenes = {logo:"",firma:"",firmaResponsable:""};
    const curso = cursosDisponibles.find(c=>c.id===Number($("curso").value)), c=curso?.constancia;
    formato=c?.formato?{archivoId:c.formato.archivoId,nombre:c.formato.nombre}:null;campos=c?.formato?.campos?c.formato.campos.map(c=>({...c})):FormatoConstancia.predeterminados();campos=FormatoConstancia.predeterminados().map(base=>campos.find(c=>c.clave===base.clave)||base);opcionesFormatos();mostrarCampo();
    $("archivo-estado").textContent=formato?"Formato vinculado: "+formato.nombre:"Selecciona un formato guardado o carga uno nuevo.";
    $("instructor").value = curso?.instructorId || c?.instructorId || instructores.find(i=>i.nombre===curso?.instructorNombre || i.id===curso?.creadoPor || i.id===curso?.solicitudCurso?.usuarioId)?.id || "";
    $("insignia").value = curso?.insigniaId || c?.insignia || "";
    $("titulo").value = c?.titulo || "CONSTANCIA";
    for(const k of datosEmision)$(k).value=c?.[k] ?? curso?.[k] ?? (k==="empresa"?"Corporativo Industrial y Comercial S.A. de C.V.":"");
    $("resumen-curso").textContent=curso?`${curso.nombre} · ${curso.categoria || "Sin categoría"} · ${curso.horas || 0} horas · Mínimo aprobatorio: ${curso.minimaConstancia!=null?curso.minimaConstancia+"%":"No disponible"} · Inicio: ${curso.fechaInicio?new Date(curso.fechaInicio).toLocaleDateString("es-MX"):"Sin fecha"} · Término: ${curso.fechaFin?new Date(curso.fechaFin).toLocaleDateString("es-MX"):"Sin fecha"}`:"Selecciona un curso para consultar sus datos.";
    $("texto").value = c?.texto || "Por haber cumplido de manera satisfactoria con la totalidad del presente curso, acreditando los conocimientos y competencias correspondientes.";
    $("firmante").value = c?.firmante || "";
    for (const campo of ["logo","firma","firmaResponsable"]) {imagenes[campo]=c?.[campo] || "";if($(campo))$(campo).value="";}
    $("estado").textContent = c && !catalogo.some(i=>i.id===c.insignia && i.activa) ? "La insignia guardada está inactiva. Selecciona una activa para guardar cambios. Los reconocimientos anteriores se conservan." : c ? "Constancia configurada para este curso." : "Selecciona el curso y completa su constancia.";
    $("horas-auto").value=curso?(curso.horas!=null?`${curso.horas} horas`:curso.duracion || "Sin duracion registrada"):"Selecciona un curso";
    $("categoria-auto").value=curso?.categoria || "Sin categoria registrada";
    $("descripcion-auto").value=curso?.descripcion || "Sin descripcion registrada";
    $("inicio-auto").value=curso?.fechaInicio?new Date(curso.fechaInicio).toLocaleString("es-MX"):"Sin fecha de inicio";
    $("minima-auto").value=curso?.minimaConstancia!=null?`${curso.minimaConstancia}%`:"Sin calificacion disponible";
    $("fecha-curso-auto").value=curso?.fechaFin?new Date(curso.fechaFin).toLocaleDateString("es-MX"):"Se completa al finalizar el curso";
    firmaDelInstructor(); cambios=false; previa();
  }
  function firmaDelInstructor(){
    const ficha=instructores.find(i=>i.id===Number($("instructor").value));
    $("firmante").value=ficha?.nombre || "";imagenes.firma=ficha?.firma || "";
    $("cargo-auto").value=ficha?.puesto || "Sin cargo registrado";
  }
  $("instructor").addEventListener("change",()=>{firmaDelInstructor();cambios=true;previa();});
  let paginaHistorial=1,seleccionada=null,urlDocumento="",versionDocumento=0;
  const modalVista=$("vista-modal");
  let origenVista=null;
  function abrirVista(c){
    origenVista=document.activeElement;
    if(!modalVista.open)modalVista.showModal();
    $("vista-cerrar").focus();
    verDocumento(c);
  }
  $("vista-cerrar").onclick=()=>modalVista.close();
  modalVista.addEventListener("close",()=>{
    versionDocumento++;seleccionada=null;
    $("documento").hidden=true;
    $("documento").removeAttribute("src");
    $("documento").removeAttribute("srcdoc");
    $("descargar-seleccion").disabled=true;
    if(urlDocumento){URL.revokeObjectURL(urlDocumento);urlDocumento="";}
    (origenVista?.isConnected?origenVista:$("buscar")).focus();
    origenVista=null;
  });
  const fechaHistorial=c=>{const d=new Date(c.fecha);return Number.isNaN(d.getTime())?"\u2014":d.toLocaleDateString("es-MX");};
  async function verDocumento(c) {
    seleccionada=c;const version=++versionDocumento;
    $("descargar-seleccion").disabled=!c;
    const visor=$("documento");visor.hidden=true;visor.removeAttribute("src");visor.removeAttribute("srcdoc");
    if(urlDocumento){URL.revokeObjectURL(urlDocumento);urlDocumento="";}
    $("vista-estado").textContent=c?"Cargando "+c.folio+"\u2026":"Selecciona una constancia del listado.";
    if(!c)return;
    try{
      if(c.formato){
        const bytes=await FormatoConstancia.generar(c);
        if(version!==versionDocumento)return;
        urlDocumento=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
        visor.src=urlDocumento+"#toolbar=0&view=FitH";
      }else{visor.srcdoc=Constancias.html(c);}
      visor.hidden=false;$("vista-estado").textContent=c.folio+" \u00b7 "+c.trabajador;
    }catch(error){if(version===versionDocumento)$("vista-estado").textContent="No se pudo mostrar la constancia: "+error.message;}
  }
  async function descargarDocumento(c){try{await Constancias.imprimir(c);}catch(error){$("panel-estado").textContent=error.message;}}
  $("descargar-seleccion").onclick=()=>{if(seleccionada)descargarDocumento(seleccionada);};
  window.addEventListener("pagehide",()=>{versionDocumento++;if(urlDocumento)URL.revokeObjectURL(urlDocumento);});
  function historial() {
    const filtro=$("buscar").value.trim().toLocaleLowerCase("es"),tipo=$("filtro").value;
    const lista=emitidas.filter(c=>[c.trabajador,c.curso,c.folio].join(" ").toLocaleLowerCase("es").includes(filtro)&&(!tipo||(tipo==="con"?!!c.dc3:!c.dc3))).sort((a,b)=>(Date.parse(b.fecha)||0)-(Date.parse(a.fecha)||0));
    const paginas=Math.max(1,Math.ceil(lista.length/8));paginaHistorial=Math.min(paginaHistorial,paginas);
    const inicio=(paginaHistorial-1)*8,visibles=lista.slice(inicio,inicio+8);
    $("total").textContent=emitidas.length;
    $("sin-formato").textContent=cursosDisponibles.filter(c=>!c.constancia?.formato).length;
    $("total-dc3").textContent=emitidas.filter(c=>c.dc3).length;
    $("total-cursos").textContent=new Set(emitidas.map(c=>c.cursoId??c.curso)).size;
    const contenedor=document.getElementById("constancias-historial");
    contenedor.replaceChildren();
    for(const c of visibles){
      const fila=document.createElement("tr");
      if(c.folio===seleccionada?.folio)fila.classList.add("seleccionada");
      const celda=(texto,clase)=>{const td=document.createElement("td");td.textContent=texto;if(clase)td.className=clase;fila.append(td);return td;};
      celda(c.folio,"constancias-folio");
      const persona=celda(""),avatar=document.createElement("span"),nombre=document.createElement("span");
      avatar.className="constancias-avatar";avatar.textContent=String(c.trabajador||"").split(/\s+/).filter(Boolean).slice(0,2).map(n=>n[0]).join("");
      nombre.textContent=c.trabajador;persona.append(avatar,nombre);
      celda(c.curso);celda(c.nota==null?"\u2014":c.nota+"%");celda(fechaHistorial(c));
      const estado=document.createElement("span");estado.className="constancias-status";estado.textContent="Emitida";celda("").append(estado);
      const acciones=celda("");acciones.className="constancias-acciones";
      const boton=(texto,titulo,accion)=>{const b=document.createElement("button");b.type="button";if(texto==="Ver"||texto==="PDF"){const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("class","constancias-svg");svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("fill","none");svg.setAttribute("stroke","currentColor");svg.setAttribute("stroke-width","1.8");svg.setAttribute("stroke-linecap","round");svg.setAttribute("stroke-linejoin","round");svg.setAttribute("aria-hidden","true");const path=document.createElementNS("http://www.w3.org/2000/svg","path");path.setAttribute("d",texto==="Ver"?"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0":"M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5");svg.append(path);b.append(svg);}else{b.textContent=texto;}b.title=titulo;b.setAttribute("aria-label",titulo+" \u00b7 "+c.folio);b.onclick=accion;acciones.append(b);};
      boton("Ver","Ver constancia",()=>abrirVista(c));
      boton("PDF","Descargar PDF",()=>descargarDocumento(c));
      boton("DC-3",c.dc3?"Descargar DC-3":"Generar DC-3",async()=>{try{await DC3.preparar(c,cargar);}catch(error){$("panel-estado").textContent=error.message;}});
      contenedor.append(fila);
    }
    if(!lista.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=7;td.className="constancias-vacio";td.textContent=emitidas.length?"No hay constancias que coincidan con los filtros.":"A\u00fan no hay constancias emitidas. Se generan cuando el trabajador aprueba un curso configurado dentro del plazo.";tr.append(td);contenedor.append(tr);}
    $("resultados").textContent=lista.length?("Mostrando "+(inicio+1)+" a "+Math.min(inicio+8,lista.length)+" de "+lista.length+" resultados"):"0 resultados";
    $("pagina").textContent=paginaHistorial+" / "+paginas;
    $("anterior").disabled=paginaHistorial===1;$("siguiente").disabled=paginaHistorial===paginas;
  }
  $("filtro").addEventListener("change",()=>{paginaHistorial=1;historial();});
  $("anterior").onclick=()=>{paginaHistorial--;historial();};
  $("siguiente").onclick=()=>{paginaHistorial++;historial();};
  async function cargar() {
    try {
      const [lista,usuariosLista,historia,insignias,archivos]=await Promise.all([cursos.listar(),solicitar("GET","/instructores"),Constancias.listar(),solicitar("GET","/insignias"),solicitar("GET","/formatos-constancia")]);
      await Promise.all(lista.map(async curso=>{
        try{const examen=await evaluaciones.obtenerPorCursoTipo(curso.id,"examen");curso.minimaConstancia=examen?.minimaAprobatoria ?? 80;}
        catch{curso.minimaConstancia=null;}
      }));
      formatos=archivos;opcionesFormatos();
      catalogo=insignias;
      const seleccion=$("insignia").value;
      $("insignia").replaceChildren(new Option("Seleccionar",""),...catalogo.filter(i=>i.activa).map(i=>new Option(i.nombre,i.id)));
      $("insignia").value=seleccion;
      cursosDisponibles=lista;instructores=usuariosLista.filter(u=>u.activo);emitidas=historia;
      if(modalVista.open&&seleccionada)verDocumento(emitidas.find(c=>c.folio===seleccionada.folio)||null);
      if (!cambios) {
        const id=$("curso").value;
        $("curso").replaceChildren(new Option("Seleccionar curso",""),...lista.map(c=>new Option(c.nombre,c.id)));
        $("curso").value=id;
        $("instructor").replaceChildren(new Option("Seleccionar",""),...instructores.map(u=>new Option(u.nombre,u.id)));
        seleccionar();
      }
      historial();
    } catch(error) {$("estado").textContent=error.message;$("panel-estado").textContent="No se pudieron cargar las constancias: "+error.message;}
  }
  $("curso").addEventListener("change",seleccionar);
  formulario.addEventListener("input",()=>{cambios=true;previa();});
  for (const campo of ["logo","firma","firmaResponsable"]) $(campo)?.addEventListener("change", async () => {
    const file=$(campo).files[0];if(!file)return;
    try {
      if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>1024*1024)throw new Error("Usa una imagen PNG, JPG o WEBP de hasta 1 MB.");
      const valor=await new Promise((resolve,reject)=>{const lector=new FileReader();lector.onload=()=>resolve(lector.result);lector.onerror=()=>reject(new Error("No se pudo leer la imagen."));lector.readAsDataURL(file);});
      if($(campo).files[0]!==file)return;
      imagenes[campo]=valor;
      if(campo==="firmaResponsable") {
        const posicion=campos.find(c=>c.clave===campo);
        if(posicion)posicion.visible=true;
        $("campo").value=campo;mostrarCampo();
      }
      cambios=true;previa();
    }catch(error){$(campo).value="";$("estado").textContent=error.message;}
  });
  formulario.querySelectorAll("[data-quitar-imagen]").forEach(b=>b.onclick=()=>{imagenes[b.dataset.quitarImagen]="";$(b.dataset.quitarImagen).value="";cambios=true;previa();});
  formulario.addEventListener("submit",async event=>{
    event.preventDefault();if(subiendo||guardando)return;guardando=true;$("cerrar").disabled=true;const boton=formulario.querySelector('[type="submit"]');boton.disabled=true;
    try{if(!formato)throw new Error("Carga o selecciona tu formato PDF, PNG o JPG antes de guardar.");leerCampo();await FormatoConstancia.generar(ejemplo(),true);await Constancias.guardar(Number($("curso").value),datos());cambios=false;await cargar();$("estado").textContent="Constancia e insignia vinculadas al curso. Se emitirán al aprobar dentro del plazo.";await cargarTodo();guardando=false;cerrarModal();$("panel-estado").textContent="Constancia guardada y vinculada al curso.";}
    catch(error){$("estado").textContent=error.message;}finally{guardando=false;$("cerrar").disabled=false;boton.disabled=false;}
  });
  $("verificar").onclick=async()=>{
    const folio=$("verificar-folio").value.trim().toUpperCase();
    if(!folio){$("verificacion-estado").textContent="Escribe el folio que deseas consultar.";return;}
    $("verificar").disabled=true;
    try{const registros=await Constancias.listar(),c=registros.find(c=>c.folio===folio);$("verificacion-estado").textContent=c?`Constancia registrada: ${c.folio} · ${c.trabajador} · ${c.curso} · ${c.nota}/100 · APROBADO`:"No se encontró una constancia con ese folio en este sistema.";}
    catch(e){$("verificacion-estado").textContent=e.message;}finally{$("verificar").disabled=false;}
  };
  $("buscar").addEventListener("input",()=>{paginaHistorial=1;historial();});
  $("actualizar").addEventListener("click",cargar);
  window.addEventListener("panel-datos-listos",cargar);
  window.addEventListener("insignias-actualizadas",cargar);
  window.addEventListener("instructores-actualizados",cargar);
  document.addEventListener("click", async event => {
    const enlace=event.target.closest("[data-configurar-constancia]");
    if(!enlace)return;
    event.preventDefault();await cargar();
    $("curso").value=enlace.dataset.configurarConstancia;seleccionar();
    window.irASeccionPanel?.("constancias-admin");abrirModal();
  });
  mostrarCampo();previa();cargar();
})();
