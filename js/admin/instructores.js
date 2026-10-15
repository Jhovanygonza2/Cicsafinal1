(() => {
  if(!["superadmin","instructor"].includes(sesion.rol()))return;
  const propio=sesion.rol()==="instructor";
  const $=id=>document.getElementById("ficha-"+id);
  let lista=[],firma="",cambios=false,lectura=0,guardando=false,origen=null;
  const modal=$("modal"),form=document.getElementById("form-instructor-ficha");
  function abrir(id=""){
    if(propio)id=sesion.usuario().id;
    origen=document.activeElement;elegir(id);$("modal-estado").textContent="";
    $("modal-titulo").textContent=propio?"Mis datos de instructor":id?"Editar instructor":"Registrar instructor";
    $("cuenta").disabled=!!id;modal.showModal();$(id?"puesto":"cuenta").focus();
  }
  function cerrar(){if(guardando)return;modal.close();elegir("");$("cuenta").disabled=false;(origen?.isConnected?origen:$("nueva")).focus();}
  $("nueva").onclick=()=>abrir();$("cerrar").onclick=cerrar;$("cancelar").onclick=cerrar;
  modal.addEventListener("cancel",e=>{e.preventDefault();cerrar();});
  function previa(){ const vacia=$("sin-firma");if(vacia){vacia.hidden=!!firma;$("quitar").hidden=!firma;} $("previa").hidden=!firma;if(firma)$("previa").src=firma;else $("previa").removeAttribute("src"); }
  function elegir(id){lectura++;$("guardar").disabled=false;$("cuenta").value=id;const i=lista.find(i=>i.id===Number(id));for(const campo of ["puesto","rfc"])$(campo).value=i?.[campo] || "";$("tipo").value=i?.tipo || "interno";firma=i?.firma || "";$("firma").value="";cambios=false;previa();}
  function pintarPerfilPersonal(contenedor) {
    contenedor.replaceChildren();
    const instructor = lista.find(i => String(i.id) === String(sesion.usuario().id));
    if (!instructor) {
      const aviso = document.createElement("p");
      aviso.textContent = "No se pudieron encontrar tus datos de instructor.";
      contenedor.append(aviso);
      return;
    }
    const identidad = document.createElement("div");
    identidad.className = "instructor-identidad";
    const avatar = document.createElement("span");
    avatar.className = "instructor-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = (instructor.nombre || "I").trim().split(/\s+/).slice(0, 2).map(n => n[0]).join("").toLocaleUpperCase("es");
    const texto = document.createElement("div");
    const nombre = document.createElement("h3");
    nombre.textContent = instructor.nombre;
    const tipo = document.createElement("p");
    tipo.textContent = instructor.tipo === "externo" ? "Instructor externo" : "Instructor interno";
    texto.append(nombre, tipo);
    const estado = document.createElement("span");
    estado.className = "catalogo-estado " + (instructor.activo ? "catalogo-estado-activo" : "catalogo-estado-inactivo");
    estado.textContent = instructor.activo ? "Activo" : "Inactivo";
    identidad.append(avatar, texto, estado);
    const datos = document.createElement("dl");
    datos.className = "instructor-datos";
    for (const [etiqueta, valor, pendiente] of [
      ["Registro", instructor.registro || "Sin registro", !instructor.registro],
      ["Cargo / Puesto", instructor.puesto || "Por completar", !instructor.puesto],
      ["Firma", instructor.firma ? "Firma registrada" : "Pendiente de agregar", !instructor.firma]
    ]) {
      const bloque = document.createElement("div");
      const titulo = document.createElement("dt");
      titulo.textContent = etiqueta;
      const detalle = document.createElement("dd");
      detalle.textContent = valor;
      if (pendiente) detalle.className = "instructor-dato-pendiente";
      bloque.append(titulo, detalle);
      datos.append(bloque);
    }
    contenedor.append(identidad, datos);
  }
  function pintar(){
    const perfilPersonal = document.getElementById("instructor-perfil-personal");
    if (propio && perfilPersonal) { pintarPerfilPersonal(perfilPersonal); return; }
    const tabla=document.getElementById("fichas-tabla");tabla.replaceChildren();const filtro=$("buscar").value.toLocaleLowerCase("es");
    for(const i of lista.filter(i=>[i.nombre,i.registro,i.puesto].join(" ").toLocaleLowerCase("es").includes(filtro))){
      const tr=document.createElement("tr");
      for(const texto of [i.nombre,i.registro||"Sin registro",i.puesto||"—",i.firma?"Registrada":"Sin firma",i.activo?"Activo":"Inactivo"]){const td=document.createElement("td");td.textContent=texto;tr.append(td);}
      const estadoCelda=tr.lastElementChild,etiqueta=document.createElement("span");
      etiqueta.className="catalogo-estado "+(i.activo?"catalogo-estado-activo":"catalogo-estado-inactivo");
      etiqueta.textContent=estadoCelda.textContent;estadoCelda.replaceChildren(etiqueta);
      const acciones=document.createElement("td"),editar=document.createElement("button"),estado=document.createElement("button");
      editar.type=estado.type="button";editar.className=estado.className="btn btn-secundario btn-sm";editar.textContent="Ver / Editar";estado.textContent=i.activo?"Desactivar":"Activar";estado.disabled=!i.cuentaActiva;estado.title=!i.cuentaActiva?"Activa primero la cuenta en Usuarios":"";
      editar.onclick=()=>abrir(i.id);
      estado.onclick=async()=>{estado.disabled=true;try{await solicitar("PATCH","/instructores/"+i.id,{activo:!i.activo});await cargar();window.dispatchEvent(new Event("instructores-actualizados"));$("estado").textContent="Estado del instructor actualizado.";}catch(e){$("estado").textContent=e.message;}finally{estado.disabled=false;}};
      acciones.className="catalogo-acciones";
      acciones.append(editar);if(!propio)acciones.append(estado);tr.append(acciones);tabla.append(tr);
    }
    if(!tabla.children.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=6;td.textContent="No hay instructores. Registra una cuenta con ese rol en Usuarios.";tr.append(td);tabla.append(tr);}
  }
  async function cargar(){try{lista=await solicitar("GET","/instructores");const id=$("cuenta").value;$("cuenta").replaceChildren(new Option("Seleccionar",""),...lista.map(i=>new Option(i.nombre,i.id)));$("cuenta").value=id;if(!modal.open&&!cambios)elegir(id);pintar();}catch(e){$("estado").textContent=e.message;}}
  $("cuenta").onchange=()=>elegir($("cuenta").value);
  document.getElementById("form-instructor-ficha").addEventListener("input",()=>cambios=true);
  $("firma").onchange=async()=>{const file=$("firma").files[0];if(!file)return;const token=++lectura;$("guardar").disabled=true;try{if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>1024*1024)throw new Error("Usa una firma PNG, JPG o WEBP de hasta 1 MB.");const valor=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error("No se pudo leer la firma."));r.readAsDataURL(file);});if(token!==lectura)return;firma=valor;previa();}catch(e){if(token===lectura){$("modal-estado").textContent=e.message;$("firma").value="";}}finally{if(token===lectura)$("guardar").disabled=false;}};
  $("quitar").onclick=()=>{lectura++;$("guardar").disabled=false;firma="";$("firma").value="";cambios=true;previa();};
  form.onsubmit=async e=>{
    e.preventDefault();if(guardando||$("guardar").disabled)return;
    const id=$("cuenta").value,datos={firma};
    for(const campo of ["puesto","tipo","rfc"])datos[campo]=$(campo).value;
    guardando=true;$("modal-estado").textContent="Guardando registro…";
    const controles=[...form.querySelectorAll("input,select,button")],deshabilitados=controles.map(c=>c.disabled);
    controles.forEach(c=>c.disabled=true);
    try{
      await solicitar("PATCH","/instructores/"+id,datos);
      guardando=false;cerrar();await cargar();
      window.dispatchEvent(new Event("instructores-actualizados"));
      $("estado").textContent=propio?"Datos guardados. Se notificó al Super Admin si hubo modificaciones.":"Registro guardado. Los nuevos documentos usarán estos datos.";
      if(!origen?.isConnected)$("nueva").focus();
    }catch(e){$("modal-estado").textContent=e.message;}
    finally{guardando=false;controles.forEach((c,i)=>c.disabled=deshabilitados[i]);if(!modal.open)$("cuenta").disabled=false;}
  };
  window.abrirFichaInstructor=async id=>{await cargar();abrir(id);};
  $("buscar").oninput=pintar;$("actualizar").onclick=cargar;window.addEventListener("panel-datos-listos",cargar);document.getElementById("instructor-ir-usuarios").onclick=e=>{e.preventDefault();window.irASeccionPanel?.("usuarios-admin");};cargar();
})();
