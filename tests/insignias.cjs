const fs=require("fs"),vm=require("vm"),assert=require("assert/strict");
const data=new Map();
const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i],get length(){return data.size}};
function cargar(){const ctx=vm.createContext({localStorage,console,setTimeout:f=>f(),URLSearchParams,window:{location:{pathname:"/index.html",replace(){}},addEventListener(){}}});vm.runInContext(fs.readFileSync("js/api.js","utf8")+'\nthis.app={auth,sesion,cursos,dbListaPromise,simularSolicitud};',ctx);return ctx.app;}
(async()=>{
 let a=cargar();await a.dbListaPromise;
 const login=async(n,p)=>{const r=await a.auth.login(n,p);a.sesion.guardar(r.token,r.usuario);return r.usuario;};
 for(const [n,p] of [["jhovany","Cicsa2026"],["administrador","AdminDemo2026"],["instructor","Instructor2026"]]){
   await login(n,p);await assert.rejects(a.simularSolicitud("GET","/insignias"),/Super Admin/);await assert.rejects(a.simularSolicitud("POST","/insignias",{nombre:"Sin permiso"}),/Super Admin/);await assert.rejects(a.simularSolicitud("PATCH","/insignias/seguridad",{activa:false}),/Super Admin/);
 }
 const instructor=await login("instructor","Instructor2026");
 await login("ana","Admin2026");
 assert.equal((await a.simularSolicitud("GET","/insignias")).length,21);
 const nueva=await a.simularSolicitud("POST","/insignias",{nombre:"Trabajo en alturas",descripcion:"Aprobación de alturas",areaTrabajo:"Operaciones",puesto:"Técnico",dirigidoA:"Mateo Alejandro Morales Castro"});
 assert.equal(nueva.activa,true);
 assert.equal(nueva.areaTrabajo,"Operaciones");assert.equal(nueva.puesto,"Técnico");assert.equal(nueva.dirigidoA,"Mateo Alejandro Morales Castro");
 await assert.rejects(a.simularSolicitud("PATCH","/insignias/"+nueva.id,{areaTrabajo:"x".repeat(151)}));
 await assert.rejects(a.simularSolicitud("PATCH","/insignias/"+nueva.id,{dirigidoA:{nombre:"Inválido"}}));

 await assert.rejects(a.simularSolicitud("POST","/insignias",{nombre:"TRABAJO EN ALTURAS"}),/existe/);
 await assert.rejects(a.simularSolicitud("POST","/insignias",{nombre:""}));
 await assert.rejects(a.simularSolicitud("PATCH","/insignias/"+nueva.id,{imagen:"javascript:alert(1)"}));
 await assert.rejects(a.simularSolicitud("PATCH","/insignias/"+nueva.id,{activa:"false"}));
 const curso=await a.cursos.crear({nombre:"Curso catálogo",horas:1,modulos:[]});
 const config={insignia:nueva.id,instructorId:instructor.id,titulo:"Constancia",texto:"Curso aprobado",firmante:"Responsable"};
 const guardado=await a.simularSolicitud("PATCH",`/constancias/configuracion/${curso.id}`,config);
 assert.equal(guardado.constancia.insigniaDetalle.nombre,nueva.nombre);
 await a.simularSolicitud("PATCH","/insignias/"+nueva.id,{activa:false});
 await assert.rejects(a.simularSolicitud("PATCH",`/constancias/configuracion/${curso.id}`,config),/activa/);
 assert.equal((await a.cursos.obtener(curso.id)).constancia.insigniaDetalle.nombre,nueva.nombre);
 await a.simularSolicitud("PATCH","/insignias/"+nueva.id,{activa:true,nombre:"Alturas actualizado"});
 assert.equal((await a.simularSolicitud("PATCH",`/constancias/configuracion/${curso.id}`,config)).constancia.insigniaDetalle.nombre,"Alturas actualizado");
 a=cargar();await a.dbListaPromise;
 assert.ok((await a.simularSolicitud("GET","/insignias")).some(i=>i.id===nueva.id&&i.nombre==="Alturas actualizado"));
 const persistida=(await a.simularSolicitud("GET","/insignias")).find(i=>i.id===nueva.id);assert.equal(persistida.areaTrabajo,"Operaciones");assert.equal(persistida.puesto,"Técnico");assert.equal(persistida.dirigidoA,"Mateo Alejandro Morales Castro");
 console.log("PASS: roles, altas, edición, duplicados, imágenes, activación, selección en curso y persistencia tras recarga.");
})().catch(e=>{console.error(e);process.exitCode=1});
