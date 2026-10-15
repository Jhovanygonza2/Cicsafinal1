const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=new Map();const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
const ctx=vm.createContext({localStorage,console,setTimeout:f=>f(),URLSearchParams,window:{location:{pathname:'/index.html',replace(){}},addEventListener(){}}});
vm.runInContext(fs.readFileSync('js/api.js','utf8')+'\nthis.app={auth,sesion,usuarios,cursos,simularSolicitud,dbListaPromise,DB,INFO_PLATFORMS,insigniasDelTrabajador};',ctx);
(async()=>{
 const a=ctx.app;await a.dbListaPromise;
 const login=async(n,p)=>{const r=await a.auth.login(n,p);a.sesion.guardar(r.token,r.usuario);};await login('ana','Admin2026');
 const request=(m,r,b)=>a.simularSolicitud(m,r,b);
 assert.equal(a.INFO_PLATFORMS.organizacion.length,117);assert.equal(a.INFO_PLATFORMS.categorias.length,12);assert.equal(a.INFO_PLATFORMS.insignias.length,13);
 let org=await request('GET','/catalogos/organizacion');
 assert.equal(new Set(a.INFO_PLATFORMS.organizacion.map(r=>r.departamento)).size,15);
 for(const r of a.INFO_PLATFORMS.organizacion){assert(org.departamentos.includes(r.departamento));assert(org.puestos.includes(r.puesto));assert(org.relaciones.some(x=>x.departamento===r.departamento&&x.puesto===r.puesto));}
 const pos=org.catalogos.puestos.find(p=>p.nombre==='Soldador');await request('PATCH','/catalogos/organizacion',{tipo:'puestos',id:pos.id,nombre:'Soldador actualizado'});
 org=await request('GET','/catalogos/organizacion');assert(org.relaciones.some(r=>r.puesto==='Soldador actualizado'));await request('PATCH','/catalogos/organizacion',{tipo:'puestos',id:pos.id,activo:false});org=await request('GET','/catalogos/organizacion');assert(!org.puestos.includes('Soldador actualizado'));assert(org.relaciones.filter(r=>r.puesto==='Soldador actualizado').every(r=>!r.activo));
 const config=await request('GET','/encuestas-instructor/configuracion');assert.equal(config.preguntas.length,10);assert.equal(new Set(config.preguntas.map(p=>p.seccion)).size,4);assert.equal(new Set(config.preguntas.map(p=>p.id)).size,10);
 const versions=JSON.parse(data.get('cicsa_preguntas_encuesta_instructor'));assert.equal(versions[0].preguntas.length,5);assert.equal(versions.length,2);
 const edited=await request('POST','/encuestas-instructor/configuracion',{version:config.version,preguntas:config.preguntas.map((p,i)=>({...p,texto:i===0?'Pregunta personalizada':p.texto}))});assert.equal((await request('GET','/encuestas-instructor/configuracion')).version,edited.version);assert.equal(JSON.parse(data.get('cicsa_preguntas_encuesta_instructor')).length,3);
 const worker=await a.usuarios.crear({nombre:'Excel test',correo:'excel@test.mx',password:'Test2026',rol:'trabajador'});
 a.DB.progreso[worker.id]={};
 const category=a.INFO_PLATFORMS.categorias[0];
 function completed(n,nota=80){const id=5000+n;a.DB.cursos.push({id,nombre:'Excel course '+n,categoria:category,estado:'publicado'});a.DB.progreso[worker.id][id]={estado:'completado',examenAprobado:true,porcentaje:100,resultadoFinal:{nota,aprobado:true,minimaAprobatoria:80},fechaFin:'2026-10-11'};return id;}
 for(let n=1;n<=4;n++)completed(n);
 let badges=a.insigniasDelTrabajador(worker.id).insignias;assert(badges.some(i=>i.id==='info-curso-3'));assert(!badges.some(i=>i.id==='info-trayectoria-1'));assert(!badges.some(i=>i.id==='info-curso-2'));
 completed(5);badges=a.insigniasDelTrabajador(worker.id).insignias;assert(badges.some(i=>i.id==='info-trayectoria-1'));
 for(let n=6;n<=9;n++)completed(n);badges=a.insigniasDelTrabajador(worker.id).insignias;assert(!badges.some(i=>i.id==='info-trayectoria-2'));assert(!badges.some(i=>i.id==='info-trayectoria-5'));
 completed(10);badges=a.insigniasDelTrabajador(worker.id).insignias;assert(badges.some(i=>i.id==='info-trayectoria-2'));assert(badges.some(i=>i.id==='info-trayectoria-5'));
 for(let n=11;n<=30;n++)completed(n);badges=a.insigniasDelTrabajador(worker.id).insignias;assert(badges.some(i=>i.id==='info-trayectoria-3'));assert(badges.some(i=>i.id==='info-trayectoria-4'));
 data.set('cicsa_cursos',JSON.stringify(a.DB.cursos));data.set('cicsa_progreso',JSON.stringify(a.DB.progreso));
 await request('PATCH','/insignias/info-curso-2',{cursoIds:[5001]});badges=a.insigniasDelTrabajador(worker.id).insignias;assert(badges.some(i=>i.id==='info-curso-2'&&i.cursoId===5001));assert.equal(badges.filter(i=>i.id==='info-curso-2').length,1);
 await request('PATCH','/insignias/info-curso-3',{nombre:'Seguridad personalizada',activa:false});const catalogue=await request('GET','/insignias');assert.equal(catalogue.filter(i=>i.id==='info-curso-3').length,1);assert.equal(catalogue.find(i=>i.id==='info-curso-3').nombre,'Seguridad personalizada');assert(a.insigniasDelTrabajador(worker.id).insignias.some(i=>i.id==='info-curso-3'));
 const snapshot=JSON.stringify(a.insigniasDelTrabajador(worker.id).insignias);assert.equal(JSON.stringify(a.insigniasDelTrabajador(worker.id).insignias),snapshot);
 await login('excel@test.mx','Test2026');await assert.rejects(request('GET','/catalogos/curso'),/permiso/);
 console.log('PASS: workbook catalogues/relationships, rename/deactivation, versioned survey, exact badge thresholds, passing grade below 90, explicit course links, customized records and historical awards.');
})().catch(e=>{console.error(e);process.exitCode=1;});
