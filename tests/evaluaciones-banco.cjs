const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=new Map();
const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i],get length(){return data.size}};
const ctx=vm.createContext({localStorage,console,setTimeout:fn=>{fn();return 0},URLSearchParams,window:{location:{pathname:'/index.html',replace(){}},addEventListener(){}}});
vm.runInContext(fs.readFileSync('js/api.js','utf8')+'\nthis.app={sesion,auth,usuarios,cursos,evaluaciones,progreso,soporte,DB,dbListaPromise};',ctx);
(async()=>{
  const a=ctx.app; await a.dbListaPromise;
  const login=async(name,pw)=>{const r=await a.auth.login(name,pw);a.sesion.guardar(r.token,r.usuario);return r.usuario;};
  await login('ana','Admin2026');
  const trabajador=await a.usuarios.crear({nombre:'Trabajador examen',correo:'worker.exam@test.mx',password:'Test2026',rol:'trabajador'});
  await login('instructor','Instructor2026');
  const preguntas=Array.from({length:25},(_,i)=>({
    id:i+1,
    enunciado:`Pregunta ${i+1}`,
    opciones:[{id:'a',texto:'Correcta'},{id:'b',texto:'Incorrecta'},{id:'c',texto:'Otra'}],
    correcta:'a'
  }));
  const curso=await a.cursos.crear({nombre:'Banco 25',horas:1,descripcion:'Prueba de banco',modulos:[],evaluacionesIniciales:{evaluacion:null,examen:{minimaAprobatoria:80,preguntas}}});
  await assert.rejects(a.evaluaciones.actualizarTipo(curso.id,'examen',{minimaAprobatoria:80,preguntas:[...preguntas,{id:26,enunciado:'26',opciones:[{id:'a',texto:'A'},{id:'b',texto:'B'},{id:'c',texto:'C'}],correcta:'a'}]}),/máximo de 25/);
  await assert.rejects(a.evaluaciones.actualizarTipo(curso.id,'examen',{minimaAprobatoria:79}),/entre 80 y 100/);
  await assert.rejects(a.evaluaciones.actualizarTipo(curso.id,'examen',{minimaAprobatoria:101}),/entre 80 y 100/);
  await login('ana','Admin2026');
  await a.cursos.asignar(curso.id,{asignadoAIds:[trabajador.id]});
  await a.cursos.cambiarEstado(curso.id,'publicado','Banco listo.');
  await login('worker.exam@test.mx','Test2026');

  // Fuerza una secuencia determinista de barajado para comprobar que no se entrega el orden original.
  vm.runInContext('Math.random = () => 0;',ctx);
  const evaluacion=await a.evaluaciones.obtenerPorCursoTipo(curso.id,'evaluacion');
  assert.equal(evaluacion.preguntas.length,5,'La Evaluación del curso debe tener exactamente 5 preguntas.');
  assert.ok(evaluacion.preguntas.every(p=>preguntas.some(q=>q.id===p.id)),'Las 5 preguntas deben provenir del banco del Examen final.');
  const respEval=Object.fromEntries(evaluacion.preguntas.map(p=>[p.id,'a']));
  const resEval=await a.evaluaciones.enviarIntento(curso.id,respEval,'evaluacion');
  assert.equal(resEval.total,5);
  assert.equal(resEval.aprobado,true);

  const examen=await a.evaluaciones.obtenerPorCursoTipo(curso.id,'examen');
  assert.equal(examen.preguntas.length,25,'El Examen final debe mostrar como máximo 25 preguntas.');
  assert.notDeepEqual(examen.preguntas.map(p=>p.id),preguntas.map(p=>p.id),'Al trabajador no se le debe entregar el orden fijo del banco.');
  assert.deepEqual([...examen.preguntas.map(p=>p.id)].sort((x,y)=>x-y),preguntas.map(p=>p.id),'El examen aleatorio debe conservar las mismas 25 preguntas del banco.');
  const respExamen=Object.fromEntries(examen.preguntas.map(p=>[p.id,'a']));
  const responder = n => Object.fromEntries(examen.preguntas.map((p,i)=>[p.id,i<n?'a':'b']));
  const reprobado = await a.evaluaciones.enviarIntento(curso.id,responder(19),'examen');
  assert.equal(reprobado.aprobado,false);
  assert.equal(a.DB.progreso[trabajador.id][curso.id].resultadoFinal.aprobado,false);
  assert.notEqual(a.DB.progreso[trabajador.id][curso.id].examenAprobado,true);
  await assert.rejects(a.cursos.obtener(curso.id),/bloqueado/);
  await assert.rejects(a.evaluaciones.enviarIntento(curso.id,responder(25),'examen'),/bloqueado/);
  assert.equal((await a.progreso.misCursos()).find(x=>x.curso.id===curso.id).progreso.estado,'bloqueado');
  assert.equal(JSON.parse(data.get('cicsa_progreso'))[trabajador.id][curso.id].bloqueadoPorExamen,true);
  const solicitud = await a.soporte.crear({tipo:'repetir',cursoId:curso.id,descripcion:'Solicito repetir el curso bloqueado.'});
  assert.equal((await a.soporte.crear({tipo:'repetir',cursoId:curso.id,descripcion:'Solicito repetir el curso bloqueado.'})).id,solicitud.id);
  await login('administrador','AdminDemo2026');
  assert.ok(!(await a.soporte.listar()).some(t=>t.id===solicitud.id));
  await assert.rejects(a.progreso.reabrir(curso.id,trabajador.id),/Super Admin/);
  await assert.rejects(a.soporte.actualizar(solicitud.id,{estado:'resuelto',respuesta:'Autorizado',autorizarRepeticion:true}));
  await login('ana','Admin2026');
  assert.ok((await a.soporte.listar()).some(t=>t.id===solicitud.id));
  await a.soporte.actualizar(solicitud.id,{estado:'resuelto',respuesta:'Repetición autorizada',autorizarRepeticion:true});
  await assert.rejects(a.soporte.actualizar(solicitud.id,{estado:'resuelto',respuesta:'Repetición autorizada',autorizarRepeticion:true}));
  await login('worker.exam@test.mx','Test2026');
  assert.equal((await a.cursos.obtener(curso.id)).accesoReautorizado,true);
  assert.equal(a.DB.progreso[trabajador.id][curso.id].historialIntentos[0].bloqueadoPorExamen,true);
  await a.evaluaciones.enviarIntento(curso.id,respEval,'evaluacion');
  const limite = await a.evaluaciones.enviarIntento(curso.id,responder(20),'examen');
  assert.equal(limite.nota,80);
  assert.equal(limite.aprobado,true);
  assert.equal(limite.minimaAprobatoria,80);
  a.DB.evaluaciones[curso.id].examen.minimaAprobatoria=100;
  const casi = await a.evaluaciones.enviarIntento(curso.id,responder(24),'examen');
  assert.equal(casi.aprobado,false);
  assert.equal(casi.minimaAprobatoria,100);
  await login('ana','Admin2026');
  await a.progreso.reabrir(curso.id,trabajador.id);
  await login('worker.exam@test.mx','Test2026');
  await a.evaluaciones.enviarIntento(curso.id,respEval,'evaluacion');
  const resExamen=await a.evaluaciones.enviarIntento(curso.id,respExamen,'examen');
  assert.equal(resExamen.total,25);
  assert.equal(resExamen.aprobado,true);
  const guardado=JSON.parse(data.get("cicsa_progreso"))[trabajador.id][curso.id].resultadoFinal;
  assert.equal(guardado.aprobado,true);
  assert.equal(guardado.nota,100);
  assert.equal(guardado.minimaAprobatoria,100);
  assert.ok(guardado.fecha);
  console.log('PASS: evaluación automática de 5 desde el banco, examen máximo 25 y orden aleatorio para trabajador.');
})().catch(e=>{console.error(e);process.exitCode=1});
