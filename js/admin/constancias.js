(() => {
  if(sesion.rol() !== "superadmin") return;
  const $=id=>document.getElementById("constancia-"+id);
  let emitidas=[], cargando=false;
  const modal=$("modal"),formulario=document.getElementById("form-constancia");
  const iframeGeneracion=$("generar-preview"),vacioGeneracion=$("generar-preview-vacio"),botonDescargarGeneracion=$("generacion-descargar"),botonGenerarMasiva=$("generar-masiva");
  let origenModal=null, formatosDisponibles=[],cursosDisponibles=[],urlPreviewGeneracion="",registroGeneracionActual=null,trabajandoPreview=false;
  function cursoSeleccionado(){return cursosDisponibles.find(c=>Number(c.id)===Number($("curso").value));}
  function formatoActivoAsignado(curso=cursoSeleccionado()){
    const asignado=curso?.constancia?.formato;
    return asignado&&asignado.activo!==false&&asignado.autorizada!==false?formatosDisponibles.find(f=>f.id===asignado.archivoId&&f.activo!==false&&f.mime==="application/pdf"):null;
  }
  function registrosCursoSeleccionado(){return emitidas.filter(c=>Number(c.cursoId)===Number($("curso").value));}
  function actualizarCursos(){
    const anteriores=$("trabajador").value,registros=registrosCursoSeleccionado();
    $("trabajador").replaceChildren(new Option("Seleccionar trabajador aprobado",""),...registros.slice().sort((a,b)=>String(a.trabajador).localeCompare(String(b.trabajador),"es")).map(c=>new Option(`${c.trabajador} · ${c.nota}%`,c.folio)));
    if(registros.some(c=>c.folio===anteriores))$("trabajador").value=anteriores;
    actualizarSeleccionMasiva();
    actualizarResumen();
  }
  function actualizarResumen(){
    const c=registrosCursoSeleccionado().find(c=>c.folio===$("trabajador").value),plantilla=formatoActivoAsignado();
    $("generar").disabled=!c||!plantilla||trabajandoPreview;
    if(botonDescargarGeneracion)botonDescargarGeneracion.disabled=!registroGeneracionActual||trabajandoPreview;
    $("resumen-curso").textContent=c?`${c.trabajador} · ${c.curso} · ${c.horas??""} horas · Calificación: ${c.nota}%`:"Selecciona un curso y un trabajador que lo haya aprobado.";
    const textoPlantilla=$("plantilla-asignada");if(textoPlantilla)textoPlantilla.textContent=plantilla?`Plantilla autorizada del curso: ${plantilla.nombre}`:"Este curso no tiene una plantilla PDF activa y autorizada asignada.";
    if(botonGenerarMasiva)botonGenerarMasiva.disabled=!plantilla||!document.querySelector("#constancia-trabajadores-seleccion input:checked");
  }
  function actualizarSeleccionMasiva(){
    const contenedor=$("trabajadores-seleccion"),todos=$("trabajadores-todos");if(!contenedor)return;
    const anteriores=new Set([...contenedor.querySelectorAll("input:checked")].map(i=>i.value));contenedor.replaceChildren();
    const registros=registrosCursoSeleccionado();
    if(!registros.length){const aviso=document.createElement("p");aviso.textContent="No hay trabajadores aprobados para este curso.";contenedor.append(aviso);if(todos)todos.checked=false;return;}
    for(const registro of registros.slice().sort((a,b)=>String(a.trabajador).localeCompare(String(b.trabajador),"es"))){
      const label=document.createElement("label"),input=document.createElement("input"),texto=document.createElement("span");input.type="checkbox";input.value=registro.folio;input.checked=anteriores.has(registro.folio);texto.textContent=`${registro.trabajador} · ${registro.nota}%`;label.append(input,texto);contenedor.append(label);input.addEventListener("change",()=>{if(todos)todos.checked=[...contenedor.querySelectorAll("input")].every(x=>x.checked);actualizarResumen();});
    }
    if(todos)todos.checked=registros.length>0&&[...contenedor.querySelectorAll("input")].every(x=>x.checked);
  }
  function actualizarTrabajadores(){
    actualizarCursos();
    $("estado").textContent=emitidas.length?"Los datos se completan automáticamente con la información de las constancias emitidas.":"Aún no hay trabajadores con cursos aprobados para generar constancias.";
  }
  async function abrirModal(){
    origenModal=document.activeElement;
    if(!modal.open)modal.showModal();
    await cargar();
    await cargarOpcionesPlantilla();
    document.getElementById("constancias-formato-nombre")?.focus();
  }
  function limpiarPreviewGeneracion(){
    if(urlPreviewGeneracion){URL.revokeObjectURL(urlPreviewGeneracion);urlPreviewGeneracion="";}
    iframeGeneracion?.removeAttribute("src");if(iframeGeneracion)iframeGeneracion.hidden=true;
    if(vacioGeneracion)vacioGeneracion.hidden=false;
    registroGeneracionActual=null;if(botonDescargarGeneracion)botonDescargarGeneracion.disabled=true;
  }
  function cerrarModal(){modal.close();(origenModal?.isConnected?origenModal:$("abrir")).focus();}
  $("abrir").onclick=abrirModal;$("cerrar").onclick=cerrarModal;
  modal.addEventListener("cancel",event=>{event.preventDefault();cerrarModal();});
  formulario.addEventListener("submit",async event=>{
    event.preventDefault();
    const registro=registrosCursoSeleccionado().find(c=>c.folio===$("trabajador").value);
    if(!registro||!formatoActivoAsignado()){$("estado").textContent="Selecciona un curso con plantilla activa y autorizada y un trabajador aprobado.";return;}
    await generarPreviewEnModal(registro);
  });
  $("curso").addEventListener("change",event=>{limpiarPreviewGeneracion();actualizarCursos();actualizarResumen();if(event.isTrusted){const curso=cursoSeleccionado(),plantilla=formatoActivoAsignado(curso);window.CicsaToast?.mostrar(plantilla?`Curso seleccionado. Se usará la plantilla «${plantilla.nombre}».`:"Este curso no tiene una plantilla PDF activa y autorizada.",plantilla?"info":"advertencia");}});
  $("trabajador").addEventListener("change",()=>{limpiarPreviewGeneracion();actualizarResumen();});
  $("trabajadores-todos")?.addEventListener("change",event=>{document.querySelectorAll("#constancia-trabajadores-seleccion input[type=checkbox]").forEach(input=>input.checked=event.target.checked);actualizarResumen();});
  $("generar-masiva")?.addEventListener("click",descargarMasiva);
  botonDescargarGeneracion?.addEventListener("click",async()=>{
    if(!registroGeneracionActual)return;
    try{botonDescargarGeneracion.disabled=true;await Constancias.imprimir(registroGeneracionActual);$("estado").textContent="Constancia descargada con la plantilla seleccionada.";window.CicsaToast?.mostrar($("estado").textContent,"exito");}
    catch(error){$("estado").textContent="No se pudo descargar la constancia: "+error.message;window.CicsaToast?.mostrar($("estado").textContent,"error");}
    finally{botonDescargarGeneracion.disabled=!registroGeneracionActual;}
  });
  modal.addEventListener("close",()=>{limpiarPreviewGeneracion();});
  async function cargarOpcionesPlantilla(){
    try{
      const [formatos,cursosCargados]=await Promise.all([solicitar("GET","/formatos-constancia"),cursos.listar()]);
      formatosDisponibles=formatos.filter(f=>f.activo!==false&&f.mime==="application/pdf");
      const anterior=$("curso").value,conEmision=new Set(emitidas.map(c=>Number(c.cursoId)));
      cursosDisponibles=cursosCargados.filter(c=>conEmision.has(Number(c.id))&&!!formatoActivoAsignado(c));
      $("curso").replaceChildren(new Option("Seleccionar curso aprobado",""),...cursosDisponibles.map(c=>new Option(c.nombre,String(c.id))));
      if(cursosDisponibles.some(c=>String(c.id)===anterior))$("curso").value=anterior;
      else if(cursosDisponibles.length===1)$("curso").value=String(cursosDisponibles[0].id);
      actualizarCursos();
    }catch(error){$("estado").textContent="No se pudieron cargar las plantillas: "+error.message;}
  }
  async function prepararRegistroConPlantilla(registro){
    const curso=cursosDisponibles.find(c=>Number(c.id)===Number(registro.cursoId)),asignado=curso?.constancia?.formato,plantilla=formatoActivoAsignado(curso),id=asignado?.archivoId;
    if(!id||!plantilla)throw new Error("El curso no tiene una plantilla PDF activa y autorizada asignada.");
    const copia={...registro,fecha:registro.fecha||new Date().toISOString()};
    // Para la constancia, la fecha de término representa el día real de aprobación.
    copia.periodoFin=copia.fecha;
    if(Array.isArray(asignado.campos)){copia.formato={...asignado,nombre:plantilla.nombre};return copia;}
    const respuesta=await solicitar("GET",`/formatos-constancia/${id}/archivo`);
    FormatoConstancia.recordar(id,respuesta.archivo);
    const medidas=await FormatoConstancia.inspeccionar(respuesta.archivo);
    const campos=FormatoConstancia.camposParaPagina(medidas[0]);
    copia.formato={...asignado,archivoId:id,nombre:plantilla.nombre,campos};
    return copia;
  }
  async function generarPreviewEnModal(registro){
    if(trabajandoPreview)return;
    trabajandoPreview=true;actualizarResumen();$("estado").textContent="Generando vista previa de la constancia…";
    try{
      const preparado=await prepararRegistroConPlantilla(registro);
      const bytes=await FormatoConstancia.generar(preparado,true);
      if(urlPreviewGeneracion)URL.revokeObjectURL(urlPreviewGeneracion);
      urlPreviewGeneracion=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
      iframeGeneracion.src=urlPreviewGeneracion+"#toolbar=0&view=FitH";iframeGeneracion.hidden=false;vacioGeneracion.hidden=true;
      registroGeneracionActual=preparado;botonDescargarGeneracion.disabled=false;
      $("estado").textContent="Vista previa lista. Revisa los datos antes de descargar la constancia.";
      window.CicsaToast?.mostrar("Vista previa de constancia lista.","exito");
    }catch(error){limpiarPreviewGeneracion();$("estado").textContent="No se pudo generar la vista previa: "+error.message;window.CicsaToast?.mostrar($("estado").textContent,"error");}
    finally{trabajandoPreview=false;actualizarResumen();}
  }
  async function descargarMasiva(){
    const folios=[...document.querySelectorAll("#constancia-trabajadores-seleccion input:checked")].map(i=>i.value);
    const registros=registrosCursoSeleccionado().filter(c=>folios.includes(c.folio)),plantilla=formatoActivoAsignado();
    if(!registros.length||!plantilla)return;
    const boton=botonGenerarMasiva;boton.disabled=true;$("estado").textContent=`Generando ${registros.length} constancia(s) en un solo PDF…`;
    try{
      const combinado=await PDFLib.PDFDocument.create();
      for(const registro of registros){
        const preparado=await prepararRegistroConPlantilla(registro),bytes=await FormatoConstancia.generar(preparado,true),documento=await PDFLib.PDFDocument.load(bytes);
        const paginas=await combinado.copyPages(documento,documento.getPageIndices());paginas.forEach(p=>combinado.addPage(p));
      }
      const blob=new Blob([await combinado.save()],{type:"application/pdf"}),url=URL.createObjectURL(blob),enlace=document.createElement("a");
      enlace.href=url;enlace.download=`Constancias-${String(cursoSeleccionado()?.nombre||"curso").replace(/[^\p{L}\p{N}-]+/gu,"-")}.pdf`;enlace.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
      $("estado").textContent=`Se generaron ${registros.length} constancia(s) en un solo PDF.`;
      window.CicsaToast?.mostrar($("estado").textContent,"exito");
    }catch(error){$("estado").textContent="No se pudo generar el PDF conjunto: "+error.message;window.CicsaToast?.mostrar($("estado").textContent,"error");}
    finally{actualizarResumen();}
  }
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
    const filtro=$("buscar").value.trim().toLocaleLowerCase("es");
    const lista=emitidas.filter(c=>[c.trabajador,c.curso,c.folio].join(" ").toLocaleLowerCase("es").includes(filtro)).sort((a,b)=>(Date.parse(b.fecha)||0)-(Date.parse(a.fecha)||0));
    const paginas=Math.max(1,Math.ceil(lista.length/8));paginaHistorial=Math.min(paginaHistorial,paginas);
    const inicio=(paginaHistorial-1)*8,visibles=lista.slice(inicio,inicio+8);
    $("total").textContent=emitidas.length;
    $("total-trabajadores").textContent=new Set(emitidas.map(c=>c.usuarioId??c.trabajador)).size;
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
      contenedor.append(fila);
    }
    if(!lista.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=7;td.className="constancias-vacio";td.textContent=emitidas.length?"No hay constancias que coincidan con los filtros.":"A\u00fan no hay constancias emitidas. Se generan cuando el trabajador aprueba el examen final del curso dentro del plazo.";tr.append(td);contenedor.append(tr);}
    $("resultados").textContent=lista.length?("Mostrando "+(inicio+1)+" a "+Math.min(inicio+8,lista.length)+" de "+lista.length+" resultados"):"0 resultados";
    $("pagina").textContent=paginaHistorial+" / "+paginas;
    $("anterior").disabled=paginaHistorial===1;$("siguiente").disabled=paginaHistorial===paginas;
  }
  $("filtro").addEventListener("change",()=>{paginaHistorial=1;historial();});
  $("anterior").onclick=()=>{paginaHistorial--;historial();};
  $("siguiente").onclick=()=>{paginaHistorial++;historial();};
  async function cargar(){
    if(cargando)return;
    cargando=true;$("actualizar").disabled=true;
    try{
      emitidas=await Constancias.listar();
      actualizarTrabajadores();historial();
      if(modalVista.open&&seleccionada)verDocumento(emitidas.find(c=>c.folio===seleccionada.folio)||null);
      $("panel-estado").textContent="";
    }catch(error){$("estado").textContent=error.message;$("panel-estado").textContent="No se pudieron cargar las constancias: "+error.message;}
    finally{cargando=false;$("actualizar").disabled=false;}
  }
  $("buscar").addEventListener("input",()=>{paginaHistorial=1;historial();});
  $("actualizar").addEventListener("click",cargar);
  window.addEventListener("panel-datos-listos",cargar);
  document.addEventListener("click",async event=>{
    const enlace=event.target.closest("[data-ver-constancias]");if(!enlace)return;
    event.preventDefault();await cargar();$("buscar").value=enlace.dataset.verConstancias;paginaHistorial=1;historial();window.irASeccionPanel?.("constancias-admin");
  });
  cargar();

  // Biblioteca de plantillas PDF. Se mantiene dentro de Constancias para facilitar
  // la incorporación de nuevos formatos sin alterar el flujo de emisión existente.
  const formFormatos=document.getElementById("constancias-formato-subir");
  const listaFormatos=document.getElementById("constancias-formatos-lista");
  const estadoFormatos=document.getElementById("constancias-formatos-estado");
  const modalFormato=document.getElementById("constancias-formato-vista-modal");
  const iframeFormato=document.getElementById("constancias-formato-vista-documento");
  const nombreVistaFormato=document.getElementById("constancias-formato-vista-nombre");
  let urlFormatoVista="",formatosDatos=[],cursosDatos=[];
  const buscadorFormatos=document.getElementById("constancias-formato-buscar"),filtroFormatos=document.getElementById("constancias-formato-filtro");
  document.getElementById("constancias-formato-vista-cerrar")?.addEventListener("click",()=>modalFormato?.close());
  modalFormato?.addEventListener("close",()=>{iframeFormato.removeAttribute("src");if(urlFormatoVista){URL.revokeObjectURL(urlFormatoVista);urlFormatoVista="";}});
  async function verFormato(formato){
    try{const respuesta=await solicitar("GET",`/formatos-constancia/${formato.id}/archivo`);const bytes=await (await fetch(respuesta.archivo)).arrayBuffer().catch(()=>Uint8Array.from(atob(respuesta.archivo.split(",")[1]),c=>c.charCodeAt(0)).buffer);if(urlFormatoVista)URL.revokeObjectURL(urlFormatoVista);urlFormatoVista=URL.createObjectURL(new Blob([bytes],{type:formato.mime||"application/pdf"}));nombreVistaFormato.textContent=formato.nombre;iframeFormato.src=urlFormatoVista+"#toolbar=1&view=FitH";modalFormato.showModal();}catch(error){estadoFormatos.textContent="No se pudo abrir el PDF: "+error.message;}
  }
  async function editarFormato(formato){
    const dialog=document.createElement("dialog");dialog.className="constancia-generacion constancias-formato-editar-modal";
    const titulo=document.createElement("h3");titulo.textContent="Editar plantilla";
    const nombreLabel=document.createElement("label");nombreLabel.textContent="Nombre de la plantilla";
    const nombre=document.createElement("input");nombre.type="text";nombre.maxLength=150;nombre.required=true;nombre.value=formato.nombre;nombreLabel.append(nombre);
    const archivoLabel=document.createElement("label");archivoLabel.textContent="Reemplazar PDF (opcional)";
    const archivo=document.createElement("input");archivo.type="file";archivo.accept="application/pdf,.pdf";archivoLabel.append(archivo);
    const estado=document.createElement("p");estado.setAttribute("role","status");
    const acciones=document.createElement("div");acciones.className="constancias-formato-acciones";
    const cancelar=document.createElement("button");cancelar.type="button";cancelar.className="btn btn-secundario";cancelar.textContent="Cancelar";
    const guardar=document.createElement("button");guardar.type="button";guardar.className="btn btn-primario";guardar.textContent="Guardar cambios";
    acciones.append(cancelar,guardar);dialog.append(titulo,nombreLabel,archivoLabel,estado,acciones);document.body.append(dialog);cancelar.onclick=()=>dialog.close();dialog.addEventListener("close",()=>dialog.remove());dialog.showModal();
    guardar.onclick=async()=>{const nuevoNombre=nombre.value.trim(),f=archivo.files[0];if(!nuevoNombre){estado.textContent="Escribe un nombre para la plantilla.";return;}if(f&&(f.type!=="application/pdf"||f.size>5*1024*1024)){estado.textContent="El PDF debe ser válido y pesar hasta 5 MB.";return;}guardar.disabled=true;try{const datos={nombre:nuevoNombre};if(f)datos.archivo=await new Promise((resolve,reject)=>{const lector=new FileReader();lector.onload=()=>resolve(lector.result);lector.onerror=()=>reject(new Error("No se pudo leer el PDF."));lector.readAsDataURL(f);});await solicitar("PATCH",`/formatos-constancia/${formato.id}`,datos);estadoFormatos.textContent="Plantilla actualizada; sus constancias vinculadas usarán los cambios.";await cargarFormatos();dialog.close();}catch(error){estado.textContent=error.message;guardar.disabled=false;}};
  }
  async function asignarFormato(formato){
    if(formato.activo===false){estadoFormatos.textContent="Activa la plantilla antes de asignarla.";return;}
    try{
      cursosDatos=await cursos.listar();const dialog=document.createElement("dialog");dialog.className="constancia-generacion constancias-formato-asignar-modal";
      const cab=document.createElement("header");cab.className="constancia-modal-cabecera asignar-cursos-cabecera";const encabezado=document.createElement("div"),titulo=document.createElement("h3"),descripcion=document.createElement("p");titulo.textContent="Asignar plantilla a cursos";descripcion.textContent=`Elige los cursos que utilizarán “${formato.nombre}”.`;encabezado.append(titulo,descripcion);cab.append(encabezado);
      const controles=document.createElement("div");controles.className="asignar-cursos-controles";
      const buscarLabel=document.createElement("label");buscarLabel.textContent="Buscar curso";const buscar=document.createElement("input");buscar.type="search";buscar.placeholder="Escribe el nombre de un curso";buscarLabel.append(buscar);
      const seleccionarLabel=document.createElement("label");seleccionarLabel.className="asignar-cursos-todos";const todos=document.createElement("input");todos.type="checkbox";const textoTodos=document.createElement("span");textoTodos.textContent="Seleccionar todos";seleccionarLabel.append(todos,textoTodos);controles.append(buscarLabel,seleccionarLabel);
      const listado=document.createElement("div");listado.className="asignar-cursos-lista";listado.setAttribute("role","group");listado.setAttribute("aria-label","Cursos disponibles");
      const filas=[];cursosDatos.slice().sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre),"es")).forEach(curso=>{const asignada=curso.constancia?.formato?.archivoId===formato.id,label=document.createElement("label"),check=document.createElement("input"),texto=document.createElement("span"),estadoCurso=document.createElement("small");label.className="asignar-curso-opcion";check.type="checkbox";check.checked=asignada;check.value=String(curso.id);check.setAttribute("aria-label",`Asignar a ${curso.nombre}`);texto.textContent=curso.nombre;estadoCurso.textContent=asignada?"Actualmente asignada":"Disponible";label.append(check,texto,estadoCurso);listado.append(label);filas.push({curso,check,label,estadoCurso});check.addEventListener("change",()=>{estadoCurso.textContent=check.checked?"Se asignará":"No seleccionada";actualizarSeleccion();});});
      const pie=document.createElement("div");pie.className="asignar-cursos-pie";const contador=document.createElement("span");contador.className="asignar-cursos-contador";const estado=document.createElement("p");estado.className="asignar-cursos-estado";estado.setAttribute("role","status");
      const acciones=document.createElement("div");acciones.className="constancias-formato-acciones asignar-cursos-acciones";const cancelar=document.createElement("button");cancelar.type="button";cancelar.className="btn btn-secundario";cancelar.textContent="Cancelar";const guardar=document.createElement("button");guardar.type="button";guardar.className="btn btn-primario";guardar.textContent="Guardar asignación";acciones.append(cancelar,guardar);pie.append(contador,acciones);dialog.append(cab,controles,listado,estado,pie);document.body.append(dialog);cancelar.onclick=()=>dialog.close();dialog.addEventListener("close",()=>dialog.remove());
      function actualizarSeleccion(){const seleccionadas=filas.filter(f=>f.check.checked).length;contador.textContent=`${seleccionadas} de ${filas.length} cursos seleccionados`;const visibles=filas.filter(f=>!f.label.hidden);todos.checked=visibles.length>0&&visibles.every(f=>f.check.checked);todos.indeterminate=visibles.some(f=>f.check.checked)&&!todos.checked;guardar.disabled=seleccionadas===0;}
      todos.addEventListener("change",()=>{filas.filter(f=>!f.label.hidden).forEach(f=>{f.check.checked=todos.checked;f.estadoCurso.textContent=todos.checked?"Se asignará":"No seleccionada";});actualizarSeleccion();});
      buscar.addEventListener("input",()=>{const texto=buscar.value.trim().toLocaleLowerCase("es");filas.forEach(f=>{f.label.hidden=!String(f.curso.nombre).toLocaleLowerCase("es").includes(texto);});actualizarSeleccion();});
      actualizarSeleccion();dialog.showModal();
      guardar.onclick=async()=>{guardar.disabled=true;try{const ids=filas.filter(f=>f.check.checked).map(f=>Number(f.curso.id));const respuesta=await solicitar("GET",`/formatos-constancia/${formato.id}/archivo`);const medidas=await FormatoConstancia.inspeccionar(respuesta.archivo);const campos=FormatoConstancia.camposParaPagina(medidas[0]);await solicitar("POST","/formatos-constancia/asignar",{formatoId:formato.id,cursoIds:ids,campos});estado.textContent=`Plantilla asignada a ${ids.length} curso(s).`;estadoFormatos.textContent=estado.textContent;window.CicsaToast?.mostrar(estado.textContent,"exito",{duracion:5000});await cargarFormatos();if(typeof cargarTodo==="function")await cargarTodo();setTimeout(()=>dialog.close(),700);}catch(error){estado.textContent=error.message;guardar.disabled=false;}};
    }catch(error){estadoFormatos.textContent="No se pudieron cargar los cursos: "+error.message;}
  }
  async function cambiarEstadoPlantilla(formato){
    try{await solicitar("PATCH",`/formatos-constancia/${formato.id}`,{activo:formato.activo===false});estadoFormatos.textContent=formato.activo===false?"Plantilla activada y lista para asignarse a cursos.":"Plantilla desactivada.";window.CicsaToast?.mostrar(estadoFormatos.textContent,formato.activo===false?"exito":"info",{duracion:5000});await cargarFormatos();}catch(error){estadoFormatos.textContent="No se pudo cambiar el estado: "+error.message;}
  }
  async function eliminarFormato(formato){
    if(!await confirmarAdmin(`¿Eliminar la plantilla “${formato.nombre}”? Solo se podrá eliminar si no está asignada a cursos ni se ha utilizado en constancias.`))return;
    try{await solicitar("DELETE",`/formatos-constancia/${formato.id}`);estadoFormatos.textContent="Plantilla eliminada correctamente.";await cargarFormatos();}catch(error){estadoFormatos.textContent=error.message;}
  }
  function pintarFormatos(){
    const texto=(buscadorFormatos?.value||"").trim().toLocaleLowerCase("es"),filtro=filtroFormatos?.value||"";listaFormatos.replaceChildren();
    const filas=formatosDatos.map(formato=>{const asignados=cursosDatos.filter(c=>c.constancia?.formato?.archivoId===formato.id);return{formato,asignados};}).filter(({formato,asignados})=>{
      const coincideTexto=!texto||formato.nombre.toLocaleLowerCase("es").includes(texto)||asignados.some(c=>c.nombre.toLocaleLowerCase("es").includes(texto));
      const coincideFiltro=!filtro||(filtro==="activa"?formato.activo!==false:filtro==="inactiva"?formato.activo===false:filtro==="asignada"?asignados.length>0:asignados.length===0);return coincideTexto&&coincideFiltro;
    });
    for(const {formato,asignados} of filas){
      const tr=document.createElement("tr"),plantilla=document.createElement("td"),cursosCelda=document.createElement("td"),estado=document.createElement("td"),acciones=document.createElement("td");
      const nombre=document.createElement("strong");nombre.textContent=formato.nombre;const meta=document.createElement("small");meta.textContent=`PDF · ${formato.fecha?new Date(formato.fecha).toLocaleDateString("es-MX"):"sin fecha"}`;plantilla.append(nombre,meta);
      cursosCelda.textContent=asignados.length?asignados.map(c=>c.nombre).join(", "):"Ninguno";
      const estadoEtiqueta=document.createElement("span");estadoEtiqueta.className=formato.activo===false?"constancias-estado-pill inactiva":"constancias-estado-pill activa";estadoEtiqueta.textContent=formato.activo===false?"Inactiva":"Activa";estado.append(estadoEtiqueta);
      const boton=(texto,clase,fn)=>{const b=document.createElement("button");b.type="button";b.className=clase;b.textContent=texto;b.addEventListener("click",fn);acciones.append(b);};
      boton("Visualizar PDF","btn btn-secundario",()=>verFormato(formato));boton("Editar","btn btn-secundario",()=>editarFormato(formato));boton(formato.activo===false?"Activar":"Desactivar","btn btn-secundario",()=>cambiarEstadoPlantilla(formato));boton("Asignar cursos","btn btn-secundario",()=>asignarFormato(formato));boton("Eliminar","btn btn-peligro",()=>eliminarFormato(formato));
      tr.append(plantilla,cursosCelda,estado,acciones);listaFormatos.append(tr);
    }
    if(!filas.length){const vacia=document.createElement("tr"),celda=document.createElement("td");celda.colSpan=4;celda.textContent=formatosDatos.length?"No hay plantillas que coincidan con la búsqueda o el filtro.":"Todavía no has agregado plantillas.";vacia.append(celda);listaFormatos.append(vacia);}
  }
  async function cargarFormatos(){
    try{const [formatos,cursosCargados]=await Promise.all([solicitar("GET","/formatos-constancia"),cursos.listar()]);formatosDatos=formatos.map(f=>({...f,activo:f.activo!==false}));cursosDatos=cursosCargados;pintarFormatos();}catch(error){estadoFormatos.textContent="No se pudieron cargar las plantillas: "+error.message;}
  }
  buscadorFormatos?.addEventListener("input",pintarFormatos);filtroFormatos?.addEventListener("change",pintarFormatos);document.getElementById("constancias-formato-actualizar")?.addEventListener("click",cargarFormatos);
  document.getElementById("constancias-formato-archivo")?.addEventListener("change",event=>{const archivo=event.target.files?.[0];if(archivo)window.CicsaToast?.mostrar(`PDF seleccionado: «${archivo.name}». Completa el nombre y pulsa Agregar plantilla PDF.`,"info",{duracion:4500});});
  if(formFormatos){
    formFormatos.addEventListener("submit",async event=>{
      event.preventDefault();
      const nombre=document.getElementById("constancias-formato-nombre").value.trim();
      const archivo=document.getElementById("constancias-formato-archivo").files[0];
      if(!archivo||archivo.type!=="application/pdf"){estadoFormatos.textContent="Selecciona un archivo PDF válido.";window.CicsaToast?.mostrar(estadoFormatos.textContent,"advertencia",{duracion:4500});return;}
      if(archivo.size>5*1024*1024){estadoFormatos.textContent="El PDF debe pesar como máximo 5 MB.";window.CicsaToast?.mostrar(estadoFormatos.textContent,"advertencia",{duracion:4500});return;}
      try{
        estadoFormatos.textContent="Cargando plantilla…";
        window.CicsaToast?.mostrar(`Cargando la plantilla «${nombre}»…`,"info",{duracion:3000});
        const data=await new Promise((resolve,reject)=>{const lector=new FileReader();lector.onload=()=>resolve(lector.result);lector.onerror=()=>reject(new Error("No se pudo leer el PDF."));lector.readAsDataURL(archivo);});
        if(!window.FormatoConstancia?.inspeccionar)throw new Error("No se pudo preparar el lector PDF. Recarga la página e intenta nuevamente.");
        await FormatoConstancia.inspeccionar(data);
        const formato=await solicitar("POST","/formatos-constancia",{nombre,archivo:data});
        if(!formato?.id)throw new Error("El archivo no se registró correctamente en la biblioteca.");
        formFormatos.reset();estadoFormatos.textContent="Plantilla cargada. Selecciona los cursos donde debe aparecer.";window.CicsaToast?.mostrar(estadoFormatos.textContent,"exito",{duracion:5000});await cargarFormatos();
        await asignarFormato(formato);
      }catch(error){estadoFormatos.textContent="No se pudo agregar la plantilla: "+error.message;window.CicsaToast?.mostrar(estadoFormatos.textContent,"error",{duracion:5000});}
    });
  }
  cargarFormatos();
})();
