const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=new Map(),localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
const ctx=vm.createContext({localStorage,console,setTimeout:f=>f(),URLSearchParams,window:{location:{pathname:'/index.html',replace(){}},addEventListener(){}}});
vm.runInContext(fs.readFileSync('js/api.js','utf8')+'\nthis.app={auth,sesion,usuarios,cursos,soporte,notificacionesAdmin,dbListaPromise};',ctx);
(async()=>{
 const a=ctx.app;await a.dbListaPromise;
 const login=async(n,p)=>{const r=await a.auth.login(n,p);a.sesion.guardar(r.token,r.usuario);};
 await login('ana','Admin2026');
 const worker=await a.usuarios.crear({nombre:'Avisos worker',correo:'avisos@test.mx',password:'Test2026',rol:'trabajador'});
 const course=await a.cursos.crear({nombre:'Curso avisos',horas:2,modulos:[]});
 await a.cursos.cambiarEstado(course.id,'publicado');await a.cursos.asignar(course.id,{asignadoAIds:[worker.id]});
 await login('avisos@test.mx','Test2026');
 const body={tipo:'repetir',cursoId:course.id,descripcion:'Solicito repetir este curso.'};
 const ticket=await a.soporte.crear(body);assert.equal((await a.soporte.crear(body)).id,ticket.id);
 for(const [name,password,rol] of [['administrador','AdminDemo2026','admin'],['ana','Admin2026','superadmin']]){
  await login(name,password);
  const notifications=(await a.notificacionesAdmin.listar()).filter(n=>n.tipo==='repetir-solicitado'&&n.ticketId===ticket.id);
  assert.equal(notifications.length,1);assert.equal(notifications[0].destinatarioRol,rol);
  const bell=fs.readFileSync('js/admin/campana-admin.js','utf8');
  const bctx=vm.createContext({listaSolicitudes:[],listaUsuarios:[],listaNotificaciones:notifications});
  vm.runInContext(bell.slice(0,bell.indexOf('function pintarCampanaAdmin')),bctx);
  assert.equal(bctx.construirAlertasAdmin()[0].tipo,'repetir-solicitado');
  const nav={window:{location:{}},sesion:{rol:()=>rol},permisos:{tiene:()=>true},escaparHtml:String,mostrarToastAdmin:msg=>assert.fail(msg)};
  vm.runInNewContext(fs.readFileSync('js/destinos-notificaciones.js','utf8'),nav);
  assert.match(nav.window.destinosNotificaciones.boton(notifications[0]),/Ver solicitud/);
  await nav.window.destinosNotificaciones.abrir(notifications[0]);
  assert.equal(nav.window.location.href,'../trabajador/soporte.html?ticket='+ticket.id);
 }
 const now=new Date('2026-10-10T12:00:00Z');
 for(const file of ['js/worker-dashboard.js','js/notificaciones-perfil.js']){
  const source=fs.readFileSync(file,'utf8'),start=source.indexOf('function obtenerNotificacionesTrabajador('),end=source.indexOf('\nfunction descartarNotificaciones',start);
  const elements={},toasts=[];
  const nctx=vm.createContext({Date,notificacionesEliminadas:new Set(),vencimientosMostrados:new Set(),notificacionesMostradas:false,iconoAviso:s=>s,formatoProgramacion:s=>s,mostrarToast(){},window:{CicsaToast:{mostrar:(...a)=>toasts.push(a)}},document:{getElementById:id=>elements[id]??={style:{},setAttribute(){}}}});
  vm.runInContext(source.slice(start,end),nctx);
  const item=(days,extra={})=>({curso:{id:1,nombre:'Curso',fechaFin:new Date(+now+days*86400000).toISOString()},progreso:{estado:'en_proceso'},asignado:true,...extra});
  const due=(items,time=now)=>nctx.obtenerNotificacionesTrabajador(items,time).filter(n=>n.tipo==='vencimiento');
  assert.equal(due([item(7)]).length,1);assert.equal(due([item(7.01)]).length,0);
  assert.equal(due([item(1,{asignado:false})]).length,0);
  assert.equal(due([item(1,{progreso:{estado:'completado'}})]).length,0);
  assert.equal(due([item(0)]).length,0);assert.equal(due([item(-1)]).length,0);
  const future=item(8);assert.equal(due([future],new Date(+now+86400000)).length,1);
  const reminder=due([item(1)])[0];nctx.notificacionesEliminadas.add(reminder.id);assert.equal(due([item(1)]).length,0);
  nctx.notificacionesEliminadas.clear();
  const actual={curso:{id:2,nombre:'Actual',fechaFin:new Date(Date.now()+86400000).toISOString()},progreso:{estado:'en_proceso'},asignado:true};
  nctx.actualizarNotificaciones([actual]);nctx.actualizarNotificaciones([actual]);assert.equal(toasts.length,1);
 }
 console.log('PASS: repeat requests reach both roles once, bell and ticket links, deadline boundaries, assigned/incomplete courses, live time changes, dismissal and toast deduplication.');
})().catch(e=>{console.error(e);process.exitCode=1;});
