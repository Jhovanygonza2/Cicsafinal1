const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=new Map(),localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
const ctx=vm.createContext({localStorage,console,setTimeout:f=>f(),URLSearchParams,window:{location:{pathname:'/index.html',replace(){}},addEventListener(){}}});
vm.runInContext(fs.readFileSync('js/api.js','utf8')+'\nthis.app={auth,sesion,usuarios,cursos,evaluaciones,simularSolicitud,dbListaPromise};',ctx);
(async()=>{
 const a=ctx.app;await a.dbListaPromise;const login=async(n,p)=>{const r=await a.auth.login(n,p);a.sesion.guardar(r.token,r.usuario);return r.usuario;};
 await login('ana','Admin2026');const worker=await a.usuarios.crear({nombre:'Direct certificate',correo:'direct@test.mx',password:'Test2026',rol:'trabajador'});
 const teacher=await login('instructor','Instructor2026');
 const preguntas=Array.from({length:5},(_,i)=>({id:i+1,enunciado:'Q'+i,opciones:[{id:'a',texto:'A'},{id:'b',texto:'B'}],correcta:'a'}));
 const course=await a.cursos.crear({nombre:'Without configuration',horas:1,modulos:[],evaluacionesIniciales:{examen:{minimaAprobatoria:80,preguntas}}});
 assert(!course.constancia);
 await login('ana','Admin2026');await a.cursos.asignar(course.id,{asignadoAIds:[worker.id]});await a.cursos.cambiarEstado(course.id,'publicado');
 await login('direct@test.mx','Test2026');assert.equal((await a.simularSolicitud('GET','/constancias')).length,0);
 const answers=Object.fromEntries(preguntas.map(p=>[p.id,'a']));await a.evaluaciones.enviarIntento(course.id,answers,'evaluacion');assert.equal((await a.simularSolicitud('GET','/constancias')).length,0);
 const result=await a.evaluaciones.enviarIntento(course.id,answers,'examen');
 assert.equal(result.reconocimiento.formato.archivoId,'cicsa-oficial-v1');assert.equal(result.reconocimiento.trabajador,worker.nombre);assert.equal(result.reconocimiento.curso,course.nombre);assert.equal(result.reconocimiento.instructor,teacher.nombre);assert.equal(result.reconocimiento.nota,100);
 const original=JSON.stringify(await a.simularSolicitud('GET','/constancias'));assert.equal(JSON.stringify(await a.simularSolicitud('GET','/constancias')),original);
 // Recover a missing historical document with the same automatic official template.
 data.set('cicsa_constancias_emitidas','[]');const own=await a.simularSolicitud('GET','/constancias');assert.equal(own.length,1);assert.equal(own[0].formato.archivoId,'cicsa-oficial-v1');
 await login('jhovany','Cicsa2026');assert.equal((await a.simularSolicitud('GET','/constancias')).length,0);
 await login('ana','Admin2026');assert.equal((await a.simularSolicitud('GET','/constancias')).length,1);
 assert(!JSON.parse(data.get('cicsa_cursos')).find(c=>c.id===course.id).constancia);
 console.log('PASS: no configuration, final-exam gate, automatic official template, real worker/course data, idempotence, recovery and privacy.');
})().catch(e=>{console.error(e);process.exitCode=1;});
