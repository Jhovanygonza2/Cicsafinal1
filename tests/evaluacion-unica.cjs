const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=new Map();
function open(){
 const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i],get length(){return data.size}};
 const ctx=vm.createContext({localStorage,console,setTimeout:f=>f(),URLSearchParams,window:{location:{pathname:'/index.html',replace(){}},addEventListener(){}}});
 vm.runInContext(fs.readFileSync('js/api.js','utf8')+'\nthis.app={DB,dbListaPromise,auth,sesion,progreso,evaluaciones,simularSolicitud};',ctx);
 return ctx.app;
}
(async()=>{
 let app=open();await app.dbListaPromise;
 const login=async name=>{const r=await app.auth.login(name,'123456');app.sesion.guardar(r.token,r.usuario);return r.usuario;};
 const worker=await login('ejimenez');
 const preguntas=Array.from({length:5},(_,i)=>({id:i+1,enunciado:'Pregunta '+i,opciones:[{id:'a',texto:'Si'},{id:'b',texto:'No'}],correcta:'a'}));
 const course={id:100,nombre:'Curso prueba',horas:24,fechaInicio:new Date(Date.now()-1000).toISOString(),estado:'publicado',asignadoA:'Todos',modulos:[{id:1,lecciones:[{id:1001,tipo:'texto',nombre:'Contenido',informacion:'Material de lectura'}]}]};
 app.DB.cursos=[course];app.DB.evaluaciones={100:{examen:{minimaAprobatoria:80,preguntas}}};
 data.set('cicsa_cursos',JSON.stringify(app.DB.cursos));data.set('cicsa_evaluaciones',JSON.stringify(app.DB.evaluaciones));
 const answers=choice=>Object.fromEntries(preguntas.map(p=>[p.id,choice]));
 await assert.rejects(app.evaluaciones.enviarIntento(100,answers('a'),'examen'),/Contesta/);
 const first=await app.evaluaciones.enviarIntento(100,answers('b'),'evaluacion');assert.equal(first.nota,0);assert.equal(first.aprobado,false);
 const original=JSON.stringify(app.DB.progreso[worker.id][100].resultadoEvaluacionInicial);
 const repeats=await Promise.all([app.evaluaciones.enviarIntento(100,answers('a'),'evaluacion'),app.evaluaciones.enviarIntento(100,answers('a'),'evaluacion')]);
 assert(repeats.every(r=>r.nota===0&&r.conservado));
 assert.equal(app.DB.evaluacionesResultado.filter(r=>r.tipo==='evaluacion').length,1);
 assert.equal((await app.evaluaciones.obtenerPorCursoTipo(100,'evaluacion')).resultadoConservado.nota,0);
 await assert.rejects(app.evaluaciones.enviarIntento(100,answers('a'),'examen'),/lecciones/);
 await app.simularSolicitud('POST','/progreso/leccion/1001/completar',{evidencia:{segundos:120}});
 await app.evaluaciones.enviarIntento(100,answers('b'),'examen');
 await login('jche');await app.progreso.reabrir(100,worker.id);
 assert.equal(JSON.stringify(app.DB.progreso[worker.id][100].resultadoEvaluacionInicial),original);
 assert.equal(app.DB.progreso[worker.id][100].completadas.length,0);
 assert.equal(app.DB.progreso[worker.id][100].evaluacionInicialRealizada,true);
 assert.equal(app.DB.progreso[worker.id][100].evaluacionInicialAprobada,false);
 app=open();await app.dbListaPromise;await login('ejimenez');
 assert.equal((await app.evaluaciones.enviarIntento(100,answers('a'),'evaluacion')).nota,0);
 assert.equal(JSON.stringify(app.DB.progreso[worker.id][100].resultadoEvaluacionInicial),original);
 // A different worker receives an independent first attempt.
 const other=await login('ybravo');assert.equal((await app.evaluaciones.enviarIntento(100,answers('a'),'evaluacion')).nota,100);
 await login('jche');await app.progreso.reabrir(100,other.id);assert.equal(app.DB.progreso[other.id][100].resultadoEvaluacionInicial.nota,100);
 // Legacy records are newest first; recover the earliest, including same-day ties.
 delete app.DB.progreso[worker.id][100].resultadoEvaluacionInicial;
 app.DB.progreso[worker.id][100].historialIntentos=[];
 app.DB.evaluacionesResultado=[{usuarioId:worker.id,cursoId:100,tipo:'evaluacion',nota:100,estado:'aprobado',fecha:'2026-10-01'},{usuarioId:worker.id,cursoId:100,tipo:'evaluacion',nota:20,estado:'no aprobado',fecha:'2026-10-01'}];
 data.set('cicsa_progreso',JSON.stringify(app.DB.progreso));
 await app.progreso.reabrir(100,worker.id);
 assert.equal(app.DB.progreso[worker.id][100].resultadoEvaluacionInicial.nota,20);
 console.log('OK: primer intento aprobado/reprobado, duplicados, repeticion, recarga, usuarios independientes, historial y examen final.');
})().catch(e=>{console.error(e);process.exitCode=1;});
