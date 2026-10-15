window.CatalogosCurso = (() => {
  let listado={instructores:[],insignias:[]},consulta,version=0;
  async function cargar(){
    if(consulta)return consulta;
    consulta=solicitar("GET","/catalogos/curso").then(datos=>{listado=datos;return datos;}).finally(()=>consulta=null);
    return consulta;
  }
  function opciones(select,lista,valor,titulo){
    select.replaceChildren(new Option(titulo,""),...lista.map(i=>{const opcion=new Option(i.nombre+(i.activo===false||i.activa===false?" (inactivo)":""),i.id);opcion.disabled=(i.activo===false||i.activa===false)&&String(i.id)!==String(valor);return opcion;}));
    select.value=valor || "";
  }
  async function seleccionar(curso={}){
    const actual=++version;
    try{
      await cargar();if(actual!==version)return;
      const id=curso.instructorId || curso.constancia?.instructorId || listado.instructores.find(i=>i.nombre===curso.instructorNombre)?.id || (sesion.rol()==="instructor"?sesion.usuario().id:"");
      opciones(document.getElementById("nc-instructor"),listado.instructores,id,"Seleccionar instructor");
    }catch(error){window.CicsaToast?.mostrar("No se pudieron cargar los instructores: "+error.message,"error");}
  }
  const refrescar=()=>seleccionar({instructorId:Number(document.getElementById("nc-instructor")?.value)||undefined});
  window.addEventListener("insignias-actualizadas",refrescar);
  window.addEventListener("instructores-actualizados",refrescar);
  return {seleccionar,cargar};
})();
