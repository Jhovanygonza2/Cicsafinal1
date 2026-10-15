const fs = require("fs"), vm = require("vm"), assert = require("assert/strict");
let rol = "admin", permitido = true, foco, destino, errores = [], editor;
const elementos = new Map();
function el(id) {
  if (!elementos.has(id)) elementos.set(id, { id, value: "anterior", hidden: false, options: [],
    matches: () => false, focus() { foco = id; }, setAttribute() {},
    closest() { return this; }, querySelector() { return this; } });
  return elementos.get(id);
}
const curso = { id: 7, nombre: "Curso prueba", solicitudCurso: { usuarioId: 42, comentario: "Corregir unidad" } };
const user = { id: 9, nombre: "Trabajador", correo: "trabajador@cicsa.mx" };
const ctx = vm.createContext({
  window: { irASeccionPanel(id) { destino = id; }, desplazarPanel() {} },
  document: { getElementById: el, querySelectorAll(selector) { const name = selector.slice(1,-1); const node = el(name); node.getAttribute = () => name === "data-nueva-password" || name === "data-rol-usuario" ? "9" : "7"; return [node]; } },
  sesion: { rol: () => rol, usuario: () => ({ id: 42 }) }, permisos: { tiene: permiso => permitido && ({
    admin: ["usuarios", "asignarCursos", "reportes", "tutorial"],
    superadmin: ["usuarios", "password", "editarCursos", "aprobarCursos", "asignarCursos", "reportes"],
    instructor: ["editarCursos", "crearCursos"]
  }[rol] || []).includes(permiso) },
  escaparHtml: s => String(s).replaceAll('"', '&quot;'),
  cursos: { obtener: async id => { assert.equal(String(id), "7"); return curso; } },
  usuarios: { listar: async () => [user] }, listaCursos: [], listaUsuarios: [user], cursoEnEdicionId: null,
  estadoDashboard: { usuarios: { pagina: 4 } },
  async abrirRestablecerPassword(id) { assert.equal(id, 9); foco = "restablecer-password-nueva"; }, pintarUsuarios() {}, pintarCursos() {}, pintarMisSolicitudesCursos() {}, pintarAprobacionesCursos() {},
  inicializarFiltrosReporte() { el("reporte-filtro-trabajador").options = [{value:""},{value:"9"},{value:"10"}]; },
  construirSelectorTrabajadoresReporte() {}, pintarSeguimiento() {},
  editarCursoEnFormulario: async c => { editor = c; ctx.cursoEnEdicionId = c.id; },
  mostrarToastAdmin: s => errores.push(s)
});
vm.runInContext(fs.readFileSync("js/destinos-notificaciones.js", "utf8"), ctx);
const api = ctx.window.destinosNotificaciones;
async function abrir(tipo, extra={}) { errores=[]; destino=null; foco=null; await api.abrir({id: "aviso", tipo, usuarioId:9, cursoId:7, ...extra}); assert.deepEqual(errores, []); }
(async () => {
  for (rol of ["admin","superadmin"]) {
    for (const tipo of ["usuario-nuevo","usuarios-nuevos","curso-revision","curso-vencimiento","curso-observado","curso-rechazado","curso-aprobado","curso-autorizado","curso-listo","curso-completado"]) assert.ok(api.boton({tipo,id:'a"b'}).includes('a&quot;b'));
    if (rol === "superadmin") { await abrir("password"); assert.equal(destino,"usuarios-admin"); assert.equal(foco,"restablecer-password-nueva"); assert.equal(ctx.window.filtroUsuariosAviso[0],9); }
    else assert.equal(api.boton({tipo:"password"}), "");
    await abrir("usuario-nuevo"); assert.equal(destino,"usuarios-admin"); assert.equal(ctx.window.filtroUsuariosAviso[0],9); assert.equal(ctx.estadoDashboard.usuarios.pagina,1);
    await abrir("usuarios-nuevos",{usuarioIds:[9,10]}); assert.deepEqual(ctx.window.filtroUsuariosAviso,[9,10]);
    await abrir("curso-revision"); assert.equal(destino,rol === "superadmin" ? "aprobacion-cursos-admin" : "cursos-admin");
    await abrir("curso-vencimiento"); assert.equal(foco,rol === "admin" ? "data-curso-admin" : "nc-fecha-fin");
    if (rol === "admin") assert.equal(editor, undefined, "Admin must not open the editor");
    else assert.equal(editor.id,7);
    for (const tipo of ["curso-observado", "curso-rechazado"]) {
      await abrir(tipo); assert.equal(foco,rol === "admin" ? "data-curso-admin" : "nc-nombre");
    }
    for (const tipo of ["curso-autorizado", "curso-aprobado"]) { await abrir(tipo); assert.equal(foco,"data-curso-admin"); }
    if (rol === "admin") assert.equal(editor,undefined);
    for (const tipo of ["curso-listo","curso-completado"]) {
      await abrir(tipo); assert.equal(destino,"seguimiento-admin"); assert.equal(foco,"tabla-vista-previa-reporte");
      assert.equal(el("reporte-filtro-curso").value,curso.nombre);
      assert.deepEqual(el("reporte-filtro-trabajador").options.map(o=>o.selected),[false,true,false]);
      assert.equal(el("reporte-fecha-desde").value,"");
    }
  }
  rol="instructor";
  for (const tipo of ["curso-rechazado","curso-observado"]) { await abrir(tipo); assert.equal(destino,"cursos-instructor"); assert.equal(foco,"nc-nombre"); }
  for (const tipo of ["curso-aprobado","curso-autorizado"]) { await abrir(tipo); assert.equal(destino,"mis-solicitudes-cursos"); assert.equal(foco,"data-solicitud-curso"); }
  assert.equal(api.boton({tipo:"password"}),"");
  curso.solicitudCurso.usuarioId=99; destino=null; await api.abrir({tipo:"curso-rechazado",cursoId:7}); assert.equal(destino,null); assert.equal(errores.length,1);
  rol="admin"; permitido=false; errores=[]; await api.abrir({tipo:"password",usuarioId:9}); assert.equal(errores.length,1); assert.equal(api.boton({tipo:"password"}),"");
  permitido=true; rol="superadmin"; errores=[]; await api.abrir({tipo:"password",usuarioId:999}); assert.equal(errores.length,1);
  errores=[]; await api.abrir(undefined); assert.equal(errores.length,1);
  console.log("PASS: notification routes, role permissions, exact records, report filters, missing users and instructor ownership.");
})().catch(e=>{console.error(e);process.exitCode=1});
