const fs=require("fs"),vm=require("vm"),assert=require("assert/strict"),PDFLib=require("../js/vendor/pdf-lib.min.js");
const data=new Map(),archivos=new Map();const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i],get length(){return data.size}};
const ctx=vm.createContext({localStorage,console,PDFLib,URLSearchParams,setTimeout:f=>f(),window:{location:{pathname:"/index.html",replace(){}},addEventListener(){}},guardarEnPrueba:async(id,data)=>archivos.set(id,data),obtenerEnPrueba:async id=>archivos.get(id)||""});
vm.runInContext(fs.readFileSync("js/vendor/pdf-lib.min.js","utf8"),ctx);
vm.runInContext(fs.readFileSync("js/api.js","utf8")+'\nguardarArchivoMedia=guardarEnPrueba;obtenerArchivoMedia=obtenerEnPrueba;this.a={sesion,auth,usuarios,cursos,evaluaciones,progreso,simularSolicitud,dbListaPromise,datosConstanciaSistema,DB,instructorDelCurso};',ctx);
vm.runInContext(fs.readFileSync("js/formato-constancia.js","utf8"),ctx);
(async()=>{
 const a=ctx.a,F=ctx.window.FormatoConstancia;await a.dbListaPromise;
 const login=async(n,p)=>{const r=await a.auth.login(n,p);a.sesion.guardar(r.token,r.usuario);return r.usuario;};
 const fuente=await PDFLib.PDFDocument.create();fuente.addPage([600,400]).drawText("FORMATO ORIGINAL");const segunda=fuente.addPage([600,400]);segunda.setRotation(PDFLib.degrees(90));
 const archivo=await fuente.saveAsBase64({dataUri:true});
 await login("administrador","AdminDemo2026");await assert.rejects(a.simularSolicitud("POST","/formatos-constancia",{nombre:"Sin permiso",archivo}),/Super Admin/);
 await login("ana","Admin2026");
 await assert.rejects(a.simularSolicitud("POST","/formatos-constancia",{nombre:"Falso",archivo:"data:application/pdf;base64,AAAA"}),/válido/);
 const formato=await a.simularSolicitud("POST","/formatos-constancia",{nombre:"Mi diseño",archivo});
 assert.equal((await a.simularSolicitud("GET","/formatos-constancia")).length,1);
 const medidas=await F.inspeccionar(archivo);assert.equal(medidas.length,2);assert.equal(medidas[1].ancho,400);assert.equal(medidas[1].alto,600);
 const instructor=await login("instructor","Instructor2026");
 const preguntas=Array.from({length:5},(_,i)=>({id:i+1,enunciado:"Pregunta "+i,opciones:[{id:"a",texto:"Sí"},{id:"b",texto:"No"}],correcta:"a"}));
 const curso=await a.cursos.crear({nombre:"Curso con diseño",horas:1,modulos:[],evaluacionesIniciales:{examen:{minimaAprobatoria:80,preguntas}}});
 await login("ana","Admin2026");
 const alumno=await a.usuarios.crear({nombre:"Ángel Pérez López",correo:"formato@test.mx",password:"Test2026",rol:"trabajador"});
 const configuracion={instructorId:instructor.id,insignia:"aprobacion",titulo:"Constancia",texto:"Aprobación",firmante:instructor.nombre,formato:{archivoId:formato.id,campos:F.predeterminados()}};
 await assert.rejects(a.simularSolicitud("PATCH",`/constancias/configuracion/${curso.id}`,{...configuracion,formato:{...configuracion.formato,campos:[{...configuracion.formato.campos[0],x:99}]}}),/posición/);
 await a.simularSolicitud("PATCH",`/constancias/configuracion/${curso.id}`,configuracion);
 assert.equal(JSON.parse(data.get("cicsa_cursos")).find(c=>c.id===curso.id).constancia.formato.archivoId,formato.id);
 assert.ok(!data.get("cicsa_cursos").includes("JVBER"),"El archivo no se duplica en el curso");
 await a.cursos.asignar(curso.id,{asignadoAIds:[alumno.id]});await a.cursos.cambiarEstado(curso.id,"publicado");
 await login("formato@test.mx","Test2026");await assert.rejects(a.simularSolicitud("GET",`/formatos-constancia/${formato.id}/archivo`),/acceso/);
 const respuestas=Object.fromEntries(preguntas.map(p=>[p.id,"a"]));await a.evaluaciones.enviarIntento(curso.id,respuestas,"evaluacion");const resultado=await a.evaluaciones.enviarIntento(curso.id,respuestas,"examen");
 const reconocimiento=resultado.reconocimiento;assert.equal(reconocimiento.formato.archivoId,formato.id);
 const pdf=await F.generar(reconocimiento);const generado=await PDFLib.PDFDocument.load(Buffer.from(pdf));assert.equal(generado.getPageCount(),2);assert.equal(generado.getPage(0).getWidth(),600);assert.equal(generado.getPage(1).getHeight(),600);
 await assert.rejects(F.generar({...reconocimiento,formato:{...reconocimiento.formato,campos:[{...F.predeterminados()[0],pagina:3}]}}));
 await login("jhovany","Cicsa2026");await assert.rejects(a.simularSolicitud("GET",`/formatos-constancia/${formato.id}/archivo`),/acceso/);
 await login("ana","Admin2026");
 for(const [ruta,mime] of [["assets/cicsa-logo.png","image/png"],["assets/recursos/images.jpg","image/jpeg"]]){
   const imagen="data:"+mime+";base64,"+fs.readFileSync(ruta).toString("base64");const item=await a.simularSolicitud("POST","/formatos-constancia",{nombre:mime,archivo:imagen});
   const bytes=await F.generar({...reconocimiento,formato:{archivoId:item.id,campos:F.predeterminados()}},true);assert.equal((await PDFLib.PDFDocument.load(Buffer.from(bytes))).getPageCount(),1);
 }
 assert.equal(JSON.parse(data.get("cicsa_constancias_emitidas"))[0].formato.archivoId,formato.id);
 // La plantilla oficial debe funcionar sin subir un archivo al navegador.
 ctx.bytesOficial=fs.readFileSync("assets/constancia-cicsa-limpia-v1.pdf");
 const bufferOficial=vm.runInContext("Uint8Array.from(bytesOficial).buffer",ctx);
 let lecturas=0;ctx.fetch=async ruta=>{assert.ok(ruta.endsWith("assets/constancia-cicsa-limpia-v1.pdf"));lecturas++;return {ok:true,arrayBuffer:async()=>bufferOficial};};
 await a.simularSolicitud("PATCH",`/constancias/configuracion/${curso.id}`,{...configuracion,formato:F.oficial()});
 assert.equal(JSON.parse(data.get("cicsa_cursos")).find(c=>c.id===curso.id).constancia.formato.archivoId,"cicsa-oficial-v1");
 assert.equal(JSON.parse(data.get("cicsa_constancias_emitidas"))[0].formato.archivoId,formato.id,"El historial conserva el formato con que se emitio");
 const muestra={...reconocimiento,trabajador:"JACQUELINE ESTRADA PI\u00d1ERA",curso:"INTERPRETACION INTEGRAL DE LA NORMA ISO 9001:2015, ISO 14001:2015 & ISO 45001:2018",instructor:"DANIEL ALEJANDRO CRUZ",instructorRegistro:"AECD970210C5A",horas:16,lugar:"Ciudad del Carmen",periodoInicio:"2026-03-20",periodoFin:"2026-03-21",fecha:"2026-03-21T18:00:00Z",formato:F.oficial()};
 assert.equal(F.fechaOficial("2026-03-21"),"21 de marzo de 2026");
 assert.equal(F.fechaOficial("2026-03-22T01:00:00Z"),"21 de marzo de 2026");
 assert.equal(F.fechaOficial("invalida"),"");
 assert.ok(F.detalleOficial(muestra).includes("20 de marzo de 2026 al 21 de marzo de 2026"));
 const oficial=await F.generar(muestra,true);
 const docOficial=await PDFLib.PDFDocument.load(Buffer.from(oficial));
 assert.equal(docOficial.getPageCount(),1,"La constancia no incluye un DC-3 sin completar");
 assert.equal(docOficial.getPage(0).getWidth(),612);assert.equal(docOficial.getPage(0).getHeight(),792);
 await F.generar({...muestra,trabajador:"Nombre muy largo ".repeat(12),curso:"Curso extenso ".repeat(20),instructorRegistro:""});
 assert.equal(lecturas,1,"Se reutiliza el archivo limpio");
 if(process.env.CICSA_PREVIEW_OUTPUT)fs.writeFileSync(process.env.CICSA_PREVIEW_OUTPUT,Buffer.from(oficial));

 await login("instructor","Instructor2026");
 const sinInsignia=await a.cursos.crear({nombre:"Constancia oficial sin insignia",horas:2,modulos:[],evaluacionesIniciales:{examen:{minimaAprobatoria:80,preguntas}}});
 await login("ana","Admin2026");
 const oficialConfigurada=await a.simularSolicitud("PATCH",`/constancias/configuracion/${sinInsignia.id}`,{...configuracion,insignia:"",formato:F.oficial()});
 assert.equal(oficialConfigurada.constancia.insignia,"");
 await a.cursos.asignar(sinInsignia.id,{asignadoAIds:[alumno.id]});await a.cursos.cambiarEstado(sinInsignia.id,"publicado");
 await login("formato@test.mx","Test2026");
 await a.evaluaciones.enviarIntento(sinInsignia.id,respuestas,"evaluacion");
 // Simula una ficha actualizada despues de iniciar sesion: la emision debe usarla.
 a.DB.usuarios.find(u=>u.id===alumno.id).nombre="Nombre actualizado de la ficha";
 data.set("cicsa_usuarios",JSON.stringify(a.DB.usuarios));
 const emitidaOficial=(await a.evaluaciones.enviarIntento(sinInsignia.id,respuestas,"examen")).reconocimiento;
 const esperada=a.datosConstanciaSistema(a.DB.cursos.find(c=>c.id===sinInsignia.id),a.DB.usuarios.find(u=>u.id===alumno.id),a.instructorDelCurso(sinInsignia),emitidaOficial.fecha);
 for(const [clave,valor] of Object.entries(esperada))assert.equal(emitidaOficial[clave],valor,"Dato coincidente: "+clave);
 assert.equal(emitidaOficial.periodoFin,emitidaOficial.fecha,"Sin fecha de curso, la prueba y emision usan la fecha de aprobacion");
 const cantidadAntes=JSON.parse(data.get("cicsa_constancias_emitidas")).length;
 await F.generar({...emitidaOficial,folio:"VISTA-PREVIA"},true);
 assert.equal(JSON.parse(data.get("cicsa_constancias_emitidas")).length,cantidadAntes,"Una prueba no crea emisiones ni consume folios");

 assert.equal(emitidaOficial.formato.archivoId,"cicsa-oficial-v1");
 assert.equal(emitidaOficial.trabajador,"Nombre actualizado de la ficha");
 assert.equal(emitidaOficial.curso,sinInsignia.nombre);
 assert.equal(emitidaOficial.instructorRegistro,"");
 assert.equal((await PDFLib.PDFDocument.load(Buffer.from(await F.generar(emitidaOficial)))).getPageCount(),1);
 console.log("PASS: plantilla oficial incorporada, una pagina, fechas de Mexico, nombres largos e historial conservado.");

 console.log("PASS: PDF multipágina/rotado, PNG, JPG, posiciones, persistencia, permisos, emisión y descarga sobre diseño original.");
})().catch(e=>{console.error(e);process.exitCode=1});
