const fs=require("fs"),vm=require("vm"),assert=require("assert/strict");
const data=new Map(),localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i],get length(){return data.size}};
function cargar(){const ctx=vm.createContext({localStorage,console,setTimeout:f=>f(),URLSearchParams,window:{location:{pathname:"/index.html",replace(){}},addEventListener(){}}});vm.runInContext(fs.readFileSync("js/api.js","utf8")+"\nthis.app={auth,sesion,usuarios,cursos,simularSolicitud,dbListaPromise};",ctx);return ctx.app;}
(async()=>{
 let a=cargar();await a.dbListaPromise;
 async function login(n,p){const r=await a.auth.login(n,p);a.sesion.guardar(r.token,r.usuario);return r.usuario;}
 await login("ana","Admin2026");
 const trabajador=await a.usuarios.crear({nombre:"Trabajador insignias",correo:"logros@test.mx",password:"Test2026",rol:"trabajador",puesto:"Operador",area:"Operaciones"});
 const cursos=[];for(let i=0;i<21;i++)cursos.push(await a.cursos.crear({nombre:"Curso logro "+i,horas:1,modulos:[]}));
 const catalogo=await a.simularSolicitud("GET","/insignias");assert.equal(catalogo.filter(i=>i.regla).length,10);
 const anterior=catalogo.map(i=>i.id==="logro-14"?{...i,nombre:"Mi premio",puntos:25,regla:{tipo:"promedio",umbral:95},descripcion:"Promedio de exámenes finales mayor de 95%"}:i);
 localStorage.setItem("cicsa_insignias",JSON.stringify(anterior));
 const migrada=(await a.simularSolicitud("GET","/insignias")).find(i=>i.id==="logro-14");assert.equal(migrada.regla.umbral,90);assert.equal(migrada.nombre,"Mi premio");assert.equal(migrada.puntos,25);assert.ok(migrada.descripcion.includes("90%"));
 localStorage.setItem("cicsa_insignias",JSON.stringify(catalogo));
 await assert.rejects(a.simularSolicitud("POST","/insignias",{nombre:"Regla falsa",regla:{tipo:"cursos",umbral:0}}));
 await assert.rejects(a.simularSolicitud("POST","/insignias",{nombre:"Curso falso",cursoIds:[-1]}));
 await assert.rejects(a.simularSolicitud("GET","/insignias/mis"));
 await login("logros@test.mx","Test2026");
 await assert.rejects(a.simularSolicitud("GET","/insignias"));
 const obtener=()=>a.simularSolicitud("GET","/insignias/mis");
 function avance(n,nota=90){const propio={};for(const c of cursos.slice(0,n))propio[c.id]={estado:"completado",examenAprobado:true,resultadoFinal:{nota,aprobado:true},fechaFin:"2026-10-08"};localStorage.setItem("cicsa_progreso",JSON.stringify({[trabajador.id]:propio}));}
 let logros=await obtener();assert.equal(logros.insignias.length,0);assert.equal(logros.promedio,null);
 avance(5,89);logros=await obtener();assert.equal(logros.cursosCompletados,5);assert.equal(logros.insigniasDeCursos,0);assert.ok(!logros.insignias.some(i=>i.id==="logro-14"));
 avance(5);logros=await obtener();assert.equal(logros.insigniasDeCursos,5);assert.ok(logros.insignias.some(i=>i.id==="logro-14"));assert.equal(new Set(logros.insignias.filter(i=>!i.automatica).map(i=>i.curso)).size,5);assert.ok(logros.insignias.filter(i=>!i.automatica).every(i=>i.calificacion===90));
 avance(6);logros=await obtener();assert.ok(logros.insignias.some(i=>i.id==="logro-10"));assert.ok(logros.insignias.some(i=>i.id==="logro-11"));assert.ok(logros.insignias.some(i=>i.id==="logro-14"));
 avance(10);logros=await obtener();assert.ok(!logros.insignias.some(i=>i.id==="logro-12"));
 avance(11);logros=await obtener();assert.ok(logros.insignias.some(i=>i.id==="logro-12"));
 avance(20);logros=await obtener();assert.ok(!logros.insignias.some(i=>i.id==="logro-13"));
 avance(21,90.01);logros=await obtener();assert.ok(logros.insignias.some(i=>i.id==="logro-13"));assert.ok(logros.insignias.some(i=>i.id==="logro-14"));assert.equal(logros.insignias.filter(i=>!i.id.startsWith("info-")).length,26);
 const original=JSON.stringify(logros.insignias);assert.equal(JSON.stringify((await obtener()).insignias),original);
 a=cargar();await a.dbListaPromise;assert.equal(JSON.stringify((await obtener()).insignias),original);
 // El nuevo intento no borra el logro histórico ni duplica el curso.
 const propio=JSON.parse(localStorage.getItem("cicsa_progreso"));const previo=propio[trabajador.id][cursos[0].id];propio[trabajador.id][cursos[0].id]={estado:"no_iniciado",historialIntentos:[previo]};localStorage.setItem("cicsa_progreso",JSON.stringify(propio));
 logros=await obtener();assert.equal(logros.cursosCompletados,21);assert.equal(logros.insignias.filter(i=>!i.id.startsWith("info-")).length,26);
 await login("ana","Admin2026");
 const adicional=await a.simularSolicitud("POST","/insignias",{nombre:"Insignia adicional",descripcion:"Dos cursos",puntos:20,cursoIds:[cursos[1].id,cursos[2].id],imagen:"data:image/png;base64,AAAA"});
 const restringida=await a.simularSolicitud("POST","/insignias",{nombre:"Otra area",cursoIds:[cursos[1].id],areaTrabajo:"Otra"});
 await login("logros@test.mx","Test2026");logros=await obtener();assert.equal(logros.insignias.filter(i=>i.id===adicional.id).length,2);assert.equal(logros.puntos,40);assert.ok(!logros.insignias.some(i=>i.id===restringida.id));
 await login("ana","Admin2026");await a.simularSolicitud("PATCH","/insignias/"+adicional.id,{nombre:"Nombre nuevo",puntos:90,imagen:"",activa:false});await a.simularSolicitud("DELETE","/insignias/logro-10");
 await login("logros@test.mx","Test2026");logros=await obtener();assert.equal(logros.puntos,40);assert.equal(logros.insignias.find(i=>i.id===adicional.id).nombre,"Insignia adicional");assert.ok(logros.insignias.some(i=>i.id==="logro-10"));
 // Ningún usuario obtiene los reconocimientos de otro.
 await login("jhovany","Cicsa2026");assert.equal((await obtener()).insignias.length,0);
 console.log("PASS: course badges at 90+, separate workers/courses, thresholds 5/10/20, average 90+, points, no duplicates or cascading, retry history, snapshot persistence, restrictions and access control.");
})().catch(e=>{console.error(e);process.exitCode=1});
