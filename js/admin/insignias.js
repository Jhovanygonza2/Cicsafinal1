(() => {
  if (sesion.rol() !== "superadmin") return;
  const $=id=>document.getElementById("insignia-"+id);
  let lista=[], editando=null, imagen="", lectura=0, leyendo=false, guardando=false, origen=null;
  const modal=$("modal");
  const listadoModal=$("listado-modal");
  let origenListado=null;
  let cursosSeleccionados=[];
  const reglaTexto=i=>i?.otorgamiento || i?.regla?.inclusivo ? i.descripcion : i?.regla ? (i.regla.tipo==="cursos"?"Más de "+i.regla.umbral+" cursos aprobados":i.regla.tipo==="insignias"?"Más de "+i.regla.umbral+" insignias de cursos":"Promedio final de "+i.regla.umbral+"% o más") : "Al terminar el curso con calificación de 90% o más";
  let solicitudListados=0;
  function seleccionar(campo,valor){
    const select=$(campo);valor=valor||"";
    if(valor&&![...select.options].some(o=>o.value===valor))select.add(new Option(valor,valor));
    select.value=valor;
  }
  async function cargarListados(){
    const token=++solicitudListados;
    try{
      const [,cursos]=await Promise.all([solicitar("GET","/usuarios"),solicitar("GET","/cursos")]);
      if(token!==solicitudListados)return;
      const contenedor=$("cursos");contenedor.replaceChildren();
      for(const curso of cursos){
        const label=document.createElement("label"),check=document.createElement("input");
        check.type="checkbox";check.value=curso.id;check.checked=cursosSeleccionados.includes(curso.id);
        check.onchange=()=>{cursosSeleccionados=check.checked?[...new Set([...cursosSeleccionados,curso.id])]:cursosSeleccionados.filter(id=>id!==curso.id);};
        label.append(check,document.createTextNode(curso.nombre));contenedor.append(label);
      }
      if(!cursos.length)contenedor.textContent="No hay cursos disponibles.";

    }catch(e){if(token===solicitudListados)$(modal.open?"modal-estado":"estado").textContent="No se pudieron cargar las listas: "+e.message;}
  }
  function abrir(){const actual=lista.find(i=>i.id===editando);$("cursos-campo").hidden=!!actual?.regla || ["categoria","nombre"].includes(actual?.otorgamiento?.tipo);$("cursos-ayuda").textContent=actual?.otorgamiento ? "Selecciona el curso o los cursos que otorgan esta insignia al completarlos y aprobar su examen final." : "Selecciona uno o varios cursos. Cada trabajador la recibe una sola vez por cada curso terminado con 90% o más.";origen=document.activeElement;$("modal-estado").textContent="";if(!modal.open)modal.showModal();$("nombre").focus();cargarListados();}
  function cerrar(){if(guardando)return;modal.close();limpiar();origen?.focus();}
  $("nueva").onclick=()=>{limpiar();abrir();};
  $("cerrar").onclick=cerrar;
  modal.addEventListener("cancel",event=>{event.preventDefault();cerrar();});
  $("ver-listado").onclick=()=>{origenListado=document.activeElement;if(!listadoModal.open)listadoModal.showModal();$("buscar").focus();};
  function cerrarListado(){listadoModal.close();origenListado?.focus();origenListado=null;}
  $("cerrar-listado").onclick=cerrarListado;
  listadoModal.addEventListener("cancel",event=>{event.preventDefault();cerrarListado();});
  function previa(){ $("previa").hidden=!imagen;if(imagen)$("previa").src=imagen;else $("previa").removeAttribute("src"); }
  function limpiar(){cursosSeleccionados=[];lectura++;leyendo=false;$("guardar").disabled=false;editando=null;imagen="";document.getElementById("form-insignia").reset();$("form-titulo").textContent="Nueva insignia";$("guardar").textContent="Crear insignia";$("cancelar").hidden=false;$("modal-estado").textContent="";previa();}
  function pintar(){
    const cuerpo=document.getElementById("insignias-tabla");cuerpo.replaceChildren();
    const filtro=$("buscar").value.trim().toLocaleLowerCase("es");
    const visibles=lista.filter(i=>([i.nombre,i.descripcion].join(" ")).toLocaleLowerCase("es").includes(filtro));
    for(const i of visibles){
      const fila=document.createElement("tr");
      const identidad=document.createElement("td"),bloqueIdentidad=document.createElement("div"),contenido=document.createElement("div"),nombre=document.createElement("strong"),emblema=document.createElement("span");
      identidad.className="insignia-tabla-identidad";bloqueIdentidad.className="insignia-tabla-identidad-contenido";contenido.className="insignia-tabla-nombre";emblema.className="insignia-tabla-emblema";nombre.textContent=i.nombre;
      if(/^data:image\/(png|jpeg|webp);base64,/.test(i.imagen||"")){const img=document.createElement("img");img.src=i.imagen;img.alt="";img.width=48;img.height=48;emblema.append(img);}else{emblema.textContent="★";emblema.setAttribute("aria-hidden","true");}
      const tipo=document.createElement("small");tipo.textContent=i.regla?"Automática":"Por curso";contenido.append(nombre,tipo);bloqueIdentidad.append(emblema,contenido);identidad.append(bloqueIdentidad);fila.append(identidad);
      for(const [clase,texto] of [["insignia-tabla-puntos",i.puntos || 0],["insignia-tabla-descripcion",i.descripcion||"Sin descripción"],["insignia-tabla-asignacion",reglaTexto(i)],["insignia-tabla-estado",i.activa?"Activa":"Inactiva"]]){const td=document.createElement("td");td.className=clase;td.textContent=texto;fila.append(td);}
      const estadoCelda=fila.lastElementChild,etiqueta=document.createElement("span");
      etiqueta.className="catalogo-estado "+(i.activa?"catalogo-estado-activo":"catalogo-estado-inactivo");
      etiqueta.textContent=estadoCelda.textContent;estadoCelda.replaceChildren(etiqueta);
      const acciones=document.createElement("td");
      const editar=document.createElement("button");editar.type="button";editar.className="btn btn-secundario btn-sm";editar.textContent="Editar";
      editar.onclick=()=>{lectura++;leyendo=false;$("guardar").disabled=false;editando=i.id;cursosSeleccionados=[...(i.cursoIds || [])];imagen=i.imagen;$("puntos").value=i.puntos || 0;$("nombre").value=i.nombre;$("descripcion").value=i.descripcion;$("imagen").value="";$("form-titulo").textContent="Editar insignia";$("guardar").textContent="Guardar cambios";$("cancelar").hidden=false;previa();abrir();};
      const activar=document.createElement("button");activar.type="button";activar.className="btn btn-secundario btn-sm";activar.textContent=i.activa?"Desactivar":"Activar";
      activar.onclick=async()=>{activar.disabled=true;try{await solicitar("PATCH","/insignias/"+i.id,{activa:!i.activa});await cargar();window.dispatchEvent(new Event("insignias-actualizadas"));$("estado").textContent=i.activa?"Insignia desactivada. Los reconocimientos existentes se conservan.":"Insignia activada.";}catch(e){$("estado").textContent=e.message;}finally{activar.disabled=false;}};
      const eliminar=document.createElement("button");eliminar.type="button";eliminar.className="btn btn-texto peligro";eliminar.textContent="Eliminar";
      eliminar.onclick=async()=>{if(!await confirmarAdmin(`¿Eliminar la insignia “${i.nombre}” del catálogo? Los reconocimientos emitidos se conservan.`))return;eliminar.disabled=true;try{await solicitar("DELETE","/insignias/"+i.id);if(editando===i.id)limpiar();await cargar();window.dispatchEvent(new Event("insignias-actualizadas"));$("estado").textContent="Insignia eliminada del catálogo.";}catch(e){$("estado").textContent=e.message;}finally{eliminar.disabled=false;}};
      acciones.className="insignia-tabla-acciones";
      const grupoAcciones=document.createElement("div");grupoAcciones.className="insignia-tabla-acciones-contenido";grupoAcciones.append(editar,activar,eliminar);acciones.append(grupoAcciones);fila.append(acciones);cuerpo.append(fila);
    }
    if(!visibles.length){const fila=document.createElement("tr"),td=document.createElement("td");td.colSpan=6;td.className="insignia-tabla-vacia";td.textContent="No hay insignias que coincidan. Puedes crear una nueva insignia.";fila.append(td);cuerpo.append(fila);}
  }
  async function cargar(){try{lista=await solicitar("GET","/insignias");pintar();}catch(e){$("estado").textContent=e.message;}}
  $("imagen").addEventListener("change",async()=>{
    const file=$("imagen").files[0];if(!file)return;const solicitud=++lectura;leyendo=true;$("guardar").disabled=true;
    try{if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>1024*1024)throw new Error("Selecciona PNG, JPG o WEBP de hasta 1 MB.");
      const valor=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("No se pudo leer la imagen."));reader.readAsDataURL(file);});
      if(solicitud!==lectura)return;imagen=valor;previa();
    }catch(e){if(solicitud===lectura){$("modal-estado").textContent=e.message;$("imagen").value="";}}
    finally{if(solicitud===lectura){leyendo=false;$("guardar").disabled=false;}}
  });
  $("quitar-imagen").onclick=()=>{lectura++;leyendo=false;$("guardar").disabled=false;imagen="";$("imagen").value="";previa();};
  document.getElementById("form-insignia").addEventListener("submit",async e=>{
    e.preventDefault();if(leyendo||guardando||$("guardar").disabled)return;guardando=true;$("guardar").disabled=true;$("quitar-imagen").disabled=true;$("imagen").disabled=true;
    try{await solicitar(editando?"PATCH":"POST",editando?"/insignias/"+editando:"/insignias",{cursoIds:cursosSeleccionados,puntos:Number($("puntos").value),nombre:$("nombre").value.trim(),descripcion:$("descripcion").value.trim(),imagen});guardando=false;cerrar();await cargar();window.dispatchEvent(new Event("insignias-actualizadas"));$("estado").textContent="Insignia guardada. Se otorgará cuando el trabajador cumpla su regla o apruebe los cursos asociados.";}
    catch(error){$("modal-estado").textContent=error.message;}finally{guardando=false;$("guardar").disabled=false;$("quitar-imagen").disabled=false;$("imagen").disabled=false;}
  });
  $("cancelar").onclick=cerrar;$("buscar").addEventListener("input",pintar);$("actualizar").onclick=cargar;cargar();
})();
