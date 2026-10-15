// Catálogos de organización; los cambios no sustituyen datos históricos.
(() => {
  if (!["admin", "superadmin"].includes(sesion.rol())) return;
  const $ = id => document.getElementById(id);
  const estado = $("organizacion-estado"), puedeEditar = sesion.rol() === "superadmin";
  const tipos = [["departamento", "departamentos"], ["puesto", "puestos"]];
  const editando = {};
  let datos = null, ocupado = false;
  const campoPuesto=$("nu-puesto"), listaPuestos=$("altas-puestos");
  let sugerenciasPuesto=null;
  if(campoPuesto&&listaPuestos){
    sugerenciasPuesto=document.createElement("div");sugerenciasPuesto.className="altas-puesto-sugerencias";sugerenciasPuesto.hidden=true;campoPuesto.parentElement?.append(sugerenciasPuesto);
    const pintarSugerencias=()=>{const q=campoPuesto.value.trim().toLocaleLowerCase("es"),opciones=[...listaPuestos.options].map(o=>o.value).filter(v=>!q||v.toLocaleLowerCase("es").includes(q)).slice(0,30);sugerenciasPuesto.replaceChildren();for(const valor of opciones){const b=document.createElement("button");b.type="button";b.textContent=valor;b.addEventListener("mousedown",e=>e.preventDefault());b.addEventListener("click",()=>{campoPuesto.value=valor;sugerenciasPuesto.hidden=true;campoPuesto.focus();});sugerenciasPuesto.append(b);}sugerenciasPuesto.hidden=!opciones.length||document.activeElement!==campoPuesto;};
    campoPuesto.addEventListener("focus",pintarSugerencias);campoPuesto.addEventListener("input",pintarSugerencias);campoPuesto.addEventListener("keydown",e=>{if(e.key==="Escape")sugerenciasPuesto.hidden=true;});campoPuesto.addEventListener("blur",()=>setTimeout(()=>{if(sugerenciasPuesto)sugerenciasPuesto.hidden=true;},120));
  }
  function avisar(texto) { estado.textContent = texto; }
  function cancelar(singular) {
    editando[singular] = null;
    $("form-"+singular).reset();
    $("form-"+singular).querySelector('[type="submit"]').textContent = "Agregar " + singular;
    $("cancelar-"+singular).hidden = true;
  }
  function pintar() {
    if (!datos) return;
    for (const [singular,tipo] of tipos) {
      const lista = datos.catalogos?.[tipo] || datos[tipo].map(nombre=>({id:nombre,nombre,activo:true}));
      const filtro = $("buscar-"+tipo).value.trim().toLocaleLowerCase("es");
      const tabla = $("organizacion-"+tipo); tabla.replaceChildren();
      $("total-"+tipo).textContent = lista.filter(i=>i.activo).length + " activos · " + lista.filter(i=>!i.activo).length + " inactivos";
      for (const item of lista.filter(i=>i.nombre.toLocaleLowerCase("es").includes(filtro))) {
        const fila=document.createElement("tr"), nombre=document.createElement("td"), estadoCelda=document.createElement("td"), acciones=document.createElement("td"), etiqueta=document.createElement("span");
        nombre.textContent=item.nombre;
        if(tipo==="puestos") {const departamentos=[...new Set((datos.relaciones||[]).filter(r=>r.puesto===item.nombre).map(r=>r.departamento))];if(departamentos.length){const detalle=document.createElement("small");detalle.className="organizacion-departamentos-puesto";detalle.textContent=departamentos.join(" / ");nombre.append(detalle);}}
        etiqueta.textContent=item.activo?"Activo":"Inactivo"; etiqueta.className="organizacion-status"+(item.activo?"":" inactivo"); estadoCelda.append(etiqueta); acciones.className="organizacion-acciones";
        if(puedeEditar) {
          const editar=document.createElement("button"), activar=document.createElement("button");
          editar.type=activar.type="button"; editar.className=activar.className="btn btn-secundario";
          editar.textContent="Editar"; activar.textContent=item.activo?"Desactivar":"Activar";
          editar.setAttribute("aria-label","Editar "+item.nombre); activar.setAttribute("aria-label",activar.textContent+" "+item.nombre);
          editar.disabled=activar.disabled=ocupado;
          editar.onclick=()=>{editando[singular]=item.id; $("organizacion-"+singular).value=item.nombre; $("form-"+singular).querySelector('[type="submit"]').textContent="Guardar cambios"; $("cancelar-"+singular).hidden=false; $("organizacion-"+singular).focus();};
          activar.onclick=async()=>{
            if(ocupado)return;
            if(item.activo && !await confirmarAdmin('¿Desactivar “'+item.nombre+'”? Dejará de ofrecerse en Altas. Los trabajadores registrados conservarán sus datos.'))return;
            if(ocupado)return;
            await guardar("PATCH",{tipo,id:item.id,activo:!item.activo},item.activo?"Registro desactivado.":"Registro activado.");
          };
          acciones.append(editar,activar);
        }
        fila.append(nombre,estadoCelda,acciones); tabla.append(fila);
      }
      if(!tabla.children.length){const fila=document.createElement("tr"),celda=document.createElement("td");celda.colSpan=3;celda.className="organizacion-vacio";celda.textContent=filtro?"No hay coincidencias.":"Aún no hay "+tipo+" registrados.";fila.append(celda);tabla.append(fila);}
    }
    const area=$("nu-area"), anterior=area.value;
    const departamentos=[...datos.departamentos];
    if(anterior&&!departamentos.includes(anterior))departamentos.push(anterior);
    area.replaceChildren(new Option("Selecciona un departamento",""),...departamentos.map(v=>new Option(v,v))); area.value=anterior;
    actualizarPuestos();
  }
  function actualizarPuestos(){
    if(!datos)return;
    const area=$("nu-area").value;
    const relaciones=datos.relaciones||[];
    const nombres=datos.puestos.filter(p=>!area || relaciones.some(r=>r.puesto===p&&r.departamento===area&&r.activo) || !relaciones.some(r=>r.puesto===p));
    $("altas-puestos").replaceChildren(...nombres.map(v=>new Option(v,v)));
    if(sugerenciasPuesto&&document.activeElement===campoPuesto){const evento=new Event("input");campoPuesto.dispatchEvent(evento);}
  }
  $("nu-area").addEventListener("change",actualizarPuestos);
  async function cargar(){
    if(ocupado)return;
    $("organizacion-reintentar").hidden=true;
    try{datos=await solicitar("GET","/catalogos/organizacion");pintar();avisar("");}
    catch(error){avisar(error.message);$("organizacion-reintentar").hidden=false;}
  }
  async function guardar(metodo,cuerpo,mensaje,singular){
    if(ocupado)return;
    ocupado=true;
    document.querySelectorAll(".organizacion-form button, .organizacion-form input").forEach(b=>b.disabled=true); pintar();
    try{datos=await solicitar(metodo,"/catalogos/organizacion",cuerpo);if(singular)cancelar(singular);avisar(mensaje);mostrarToastAdmin(mensaje,"exito");}
    catch(error){avisar(error.message);}
    finally{ocupado=false;document.querySelectorAll(".organizacion-form button, .organizacion-form input").forEach(b=>b.disabled=false);pintar();}
  }
  for(const [singular,tipo] of tipos){
    $("buscar-"+tipo).addEventListener("input",pintar);
    $("cancelar-"+singular).onclick=()=>cancelar(singular);
    if(puedeEditar)$("form-"+singular).addEventListener("submit",evento=>{evento.preventDefault();const id=editando[singular];guardar(id?"PATCH":"POST",{tipo,id,nombre:$("organizacion-"+singular).value},id?"Cambios guardados.":"Registro agregado.",singular);});
  }
  $("organizacion-reintentar").addEventListener("click",cargar);
  window.addEventListener("panel-datos-listos",cargar); cargar();
})();
