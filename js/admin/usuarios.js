// usuarios.js — Trabajadores registrados, alta individual e importación masiva
const rolesDisponibles = [
  { valor: "trabajador", etiqueta: "Trabajador" },
  ...(sesion.rol() === "superadmin" ? [{ valor: "instructor", etiqueta: "Instructor" }] : []),
  ...(sesion.rol() === "superadmin" ? [{ valor: "admin", etiqueta: "Administrador" }, { valor: "superadmin", etiqueta: "Súper administrador" }] : []),
];

document.getElementById("nu-rol").innerHTML = opcionesRol("trabajador");
const selectorOcupacionTrabajador = document.getElementById("nu-area-ocupacion");
selectorOcupacionTrabajador.replaceChildren(new Option("Seleccionar clave del área/subárea", ""), ...ClasificacionCursos.ocupaciones.map(item => new Option(`${item.clave} — ${item.nombre}`, item.clave)));

function opcionesRol(valorActual) {
  return rolesDisponibles.map((rol) => `<option value="${rol.valor}"${rol.valor === valorActual ? " selected" : ""}>${rol.etiqueta}</option>`).join("");
}

document.getElementById("usuarios-por-pagina").addEventListener("change", (evento) => {
  const cantidad = Number(evento.target.value);
  if (![0, 50, 100, 150].includes(cantidad)) return;
  estadoDashboard.usuarios.porPagina = cantidad;
  estadoDashboard.usuarios.pagina = 1;
  pintarUsuarios();
});

function pintarUsuarios() {
  let filtroAviso = document.getElementById("usuarios-filtro-aviso");
  if (!filtroAviso) {
    filtroAviso = document.createElement("button");
    filtroAviso.id = "usuarios-filtro-aviso";
    filtroAviso.type = "button";
    filtroAviso.className = "btn btn-secundario btn-sm";
    filtroAviso.textContent = "Mostrar todos los usuarios";
    filtroAviso.addEventListener("click", () => {
      window.filtroUsuariosAviso = null;
      estadoDashboard.usuarios.pagina = 1;
      pintarUsuarios();
    });
    document.getElementById("buscar-usuarios")?.after(filtroAviso);
  }
  filtroAviso.hidden = !window.filtroUsuariosAviso;

  const consulta = document.getElementById("buscar-usuarios")?.value.trim().toLowerCase() || "";
  const visibles = listaUsuarios.filter(u => permisos.gestionarUsuario(u)).filter(u => !window.filtroUsuariosAviso || window.filtroUsuariosAviso.some(id => String(id) === String(u.id))).filter((u) => !consulta || [u.nombre,u.correo,u.rol,u.area].some(v => String(v||"").toLowerCase().includes(consulta)));
  const cuerpo = document.getElementById("tabla-usuarios");
  const estado = estadoDashboard.usuarios;
  // El valor 0 significa mostrar cero filas, no sustituirlo por el límite predeterminado.
  if (estado.porPagina === 0) {
    cuerpo.innerHTML = '<tr><td colspan="5" class="muted" style="text-align:center;padding:20px">No se muestran registros (límite establecido en 0).</td></tr>';
    document.getElementById("paginacion-usuarios")?.replaceChildren();
    return;
  }
  estado.pagina = Math.min(estado.pagina, Math.max(1, Math.ceil(visibles.length / estado.porPagina)));
  const inicio = (estado.pagina - 1) * estado.porPagina;
  cuerpo.innerHTML = visibles.slice(inicio, inicio + estado.porPagina).map((u) => `
    <tr>
      <td><strong>${escaparHtml(u.nombre)}</strong><br><small>${escaparHtml(u.correo)}</small></td>
      <td>${escaparHtml(u.area || "Sin asignar")}</td>
      <td><select ${!permisos.gestionarUsuario(u) || u.id === sesion.usuario()?.id ? "disabled" : ""} class="select-rol-usuario" data-rol-usuario="${u.id}" aria-label="Rol de ${escaparHtml(u.nombre)}">${rolesDisponibles.some(r => r.valor === u.rol) ? opcionesRol(u.rol) : "<option>" + permisos.etiqueta(u.rol) + "</option>"}</select></td>
      <td>${u.activo ? '<span class="badge badge-exito">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}</td>
      <td><button class="btn btn-secundario btn-sm" type="button" data-ver-avance="${u.id}" aria-haspopup="dialog" aria-controls="modal-perfil-trabajador">Ver perfil</button>${permisos.tiene("password") && listaSolicitudes.some(s => Number(s.usuarioId) === Number(u.id) && s.estado === "pendiente") ? '<small class="altas-password-pendiente">Restablecimiento pendiente</small>' : ""}</td>
    </tr>`).join("") || '<tr><td colspan="5" class="muted" style="text-align:center;padding:20px">No hay trabajadores registrados.</td></tr>';
  pintarPaginacion("paginacion-usuarios", visibles.length, estado, pintarUsuarios);
}

async function manejarAccionUsuario(evento) {
  const boton = evento.target.closest("button"); if (!boton) return;
  await ejecutarAccionAdmin(boton, async () => {
    if (boton.matches("[data-eliminar-usuario]")) {
      const id=Number(boton.dataset.eliminarUsuario),usuario=listaUsuarios.find(u=>u.id===id);
      if(!usuario)return;
      if(!await confirmarAdmin(`¿Eliminar la cuenta de ${usuario.nombre}? Ya no podrá acceder. Su historial de cursos y constancias se conservará.`))return;
      await usuarios.eliminar(id);
      cerrarPerfilTrabajador();
      mostrarToastAdmin("Usuario eliminado.","exito");
      await cargarTodo();
    }
    else if (boton.matches(".btn-toggle-usuario")) {
      const id = Number(boton.dataset.id);
      await usuarios.cambiarEstado(id, boton.dataset.activo !== "true");
      mostrarToastAdmin(boton.dataset.activo === "true" ? "Usuario desactivado." : "Usuario activado.", "exito");
      await cargarTodo();
      const modal = document.getElementById("modal-perfil-trabajador");
      if (!modal.hidden && Number(modal.dataset.usuarioId) === id) await abrirPerfilTrabajador(id);
    }
    else if (boton.matches("[data-restablecer-password]")) await abrirRestablecerPassword(boton.dataset.restablecerPassword, boton);
    else if (boton.matches("[data-ver-avance]")) await abrirPerfilTrabajador(boton.dataset.verAvance, boton);
  });
}
document.getElementById("tabla-usuarios").addEventListener("click", manejarAccionUsuario);
document.getElementById("perfil-trabajador-acciones").addEventListener("click", manejarAccionUsuario);

document.getElementById("tabla-usuarios").addEventListener("change", async (evento) => {
  const selector = evento.target.closest("[data-rol-usuario]"); if (!selector) return;
  const previo = listaUsuarios.find(u => Number(u.id) === Number(selector.dataset.rolUsuario))?.rol;
  await ejecutarAccionAdmin(selector, async () => {
    try {
      await usuarios.cambiarRol(Number(selector.dataset.rolUsuario), selector.value);
      mostrarToastAdmin("Rol actualizado correctamente.", "exito");
      await cargarTodo();
    } catch (error) {
      selector.value = previo || "trabajador";
      throw error;
    }
  });
});

document.getElementById("buscar-usuarios")?.addEventListener("input", () => { window.filtroUsuariosAviso = null; estadoDashboard.usuarios.pagina=1; pintarUsuarios(); });

function actualizarCamposInstructor() {
  const instructor = document.getElementById("nu-rol").value === "instructor";
  for (const [grupo, campo] of [["nu-registro-instructor", "nu-clave-dc3"], ["nu-firma-instructor", "nu-firma"]]) {
    document.getElementById(grupo).hidden = !instructor;
    document.getElementById(campo).disabled = !instructor;
    if (!instructor) document.getElementById(campo).value = "";
  }
}
document.getElementById("nu-rol").addEventListener("change", actualizarCamposInstructor);
actualizarCamposInstructor();

async function leerFirmaAlta(archivo) {
  if (!archivo) return "";
  if (!["image/png", "image/jpeg", "image/webp"].includes(archivo.type) || archivo.size > 1024 * 1024) {
    throw new Error("Usa una firma PNG, JPG o WEBP de hasta 1 MB.");
  }
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo leer la firma."));
    lector.readAsDataURL(archivo);
  });
}

document.getElementById("form-usuario").addEventListener("submit", async (e) => {
  e.preventDefault();
  const boton = e.target.querySelector('[type="submit"]');
  if (boton.disabled) return;
  boton.disabled = true;
  try {
    const nombres = document.getElementById("nu-nombre").value.trim();
    const apellidoPaterno = document.getElementById("nu-apellido-paterno").value.trim();
    const apellidoMaterno = document.getElementById("nu-apellido-materno").value.trim();
    if (!nombres || !apellidoPaterno) throw new Error("Completa el nombre y el apellido paterno.");
    const nombre = [apellidoPaterno, apellidoMaterno, nombres].filter(Boolean).join(" ");
    const area = document.getElementById("nu-area").value.trim();
    const password = document.getElementById("nu-password").value.trim();
    const rol = document.getElementById("nu-rol").value;
    const puesto = document.getElementById("nu-puesto").value.trim();
    const areaOcupacionClave = selectorOcupacionTrabajador.value;
    const curp = document.getElementById("nu-curp").value.trim().toUpperCase();
    const correo = document.getElementById("nu-correo").value.trim() || nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(" ").filter(Boolean).slice(0, 2).join(".") + "@cicsa.mx";
    const claveDc3 = rol === "instructor" ? document.getElementById("nu-clave-dc3").value.trim() : "";
    const firma = rol === "instructor" ? await leerFirmaAlta(document.getElementById("nu-firma").files?.[0]) : "";
    await usuarios.crear({nombre, nombres, apellidoPaterno, apellidoMaterno, area, puesto, areaOcupacionClave, curp, claveDc3, firma, password, correo, rol});
    e.target.reset();
    document.getElementById("nu-rol").value = "trabajador";
    actualizarCamposInstructor();
    mostrarToastAdmin("Usuario creado correctamente.", "exito");
    await cargarTodo();
  } catch (error) {
    mostrarToastAdmin(error.message || "No se pudo crear el trabajador.", "error");
  } finally {
    boton.disabled = false;
  }
});

function normalizarEncabezado(valor){ return String(valor||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""); }
function leerRegistrosExcel(array){
  if(!array.length) return [];
  const encabezados=Object.keys(array[0]);
  const mapa={}; encabezados.forEach(k=>mapa[normalizarEncabezado(k)]=k);
  const buscar=(fila,nombres)=>{ for(const n of nombres){ if(mapa[normalizarEncabezado(n)]!==undefined) return fila[mapa[normalizarEncabezado(n)]]; } return ""; };
  return array.map(fila=>({ nombre: (buscar(fila,["Apellido paterno"]) || buscar(fila,["Apellido materno"])) ? [buscar(fila,["Apellido paterno"]),buscar(fila,["Apellido materno"]),buscar(fila,["Nombres","Nombre(s)","Nombre"])].map(v=>String(v||"").trim()).filter(Boolean).join(" ") : buscar(fila,["Nombre completo","Nombre","Trabajador","Empleado"]), claveDc3:buscar(fila,["Clave D-C3","Clave DC-3","D-C3","DC-3"]), area:buscar(fila,["Area","Área","Área de trabajo","Departamento"]), puesto:buscar(fila,["Puesto","Puestos","Cargo"]), curp:buscar(fila,["CURP"]), correo:buscar(fila,["Correo","Email","E-mail"]), password:buscar(fila,["Contraseña","Password"]) })).filter(r=>String(r.nombre||"").trim());
}

document.getElementById("btn-importar-trabajadores")?.addEventListener("click",()=>document.getElementById("archivo-trabajadores-excel")?.click());
document.getElementById("archivo-trabajadores-excel")?.addEventListener("change", async (e)=>{
  const archivo=e.target.files?.[0]; if(!archivo)return;
  try {
    await cargarExcelCicsa();
    const buffer=await archivo.arrayBuffer(); const libro=XLSX.read(buffer,{type:"array"}); const hoja=libro.Sheets[libro.SheetNames[0]];
    const datos=XLSX.utils.sheet_to_json(hoja,{defval:""}); const registros=leerRegistrosExcel(datos);
    if(!registros.length) throw new Error("No encontré trabajadores. Usa las columnas Nombre y Área.");
    if(registros.length>500) throw new Error("El archivo supera el límite de 500 trabajadores por importación.");
    const resultado=await usuarios.importar(registros);
    mostrarToastAdmin(`Importación terminada: ${resultado.creados.length} creados, ${resultado.omitidos.length} omitidos.`, resultado.omitidos.length ? "info" : "exito");
    if(resultado.omitidos.length) console.table(resultado.omitidos);
    await cargarTodo();
  } catch(error){ mostrarToastAdmin(error.message||"No se pudo importar el Excel.","error"); } finally { e.target.value=""; }
});

document.getElementById("btn-plantilla-trabajadores")?.addEventListener("click",async()=>{
  try { await cargarExcelCicsa(); } catch(error) { mostrarToastAdmin(error.message,"error"); return; }
  const filas=[{"Apellido paterno":"Pérez","Apellido materno":"López","Nombre(s)":"Juan","Clave D-C3":"",Área:"Operaciones",Puesto:"",CURP:"",Correo:"juan.perez@cicsa.mx",Contraseña:"Cicsa2026"},{"Apellido paterno":"López","Apellido materno":"García","Nombre(s)":"María","Clave D-C3":"",Área:"QHSE",Puesto:"",CURP:"",Correo:"",Contraseña:""}];
  const hoja=XLSX.utils.json_to_sheet(filas); const libro=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(libro,hoja,"Trabajadores"); XLSX.writeFile(libro,"plantilla_trabajadores_cicsa.xlsx");
});
