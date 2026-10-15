const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('./node_modules/playwright');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const modo of ['file','http']){
   const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{const original=window.fetch;window.fetch=(url,...args)=>{if(String(url).includes('constancia-cicsa-limpia'))throw new Error('No se permite fetch de PDF en esta prueba');return original(url,...args);};});
   const url=relative=>modo==='file'?pathToFileURL(path.join(root,relative)).href:'http://127.0.0.1:'+server.address().port+'/'+relative;
   await page.goto(url('index.html'));
   const fixture=await page.evaluate(async()=>{
    await dbListaPromise;const login=async(n,p)=>{const r=await auth.login(n,p);sesion.guardar(r.token,r.usuario);return r.usuario;};
    await login('ana','Admin2026');const alumno=await usuarios.crear({nombre:'Trabajador prueba local',correo:'local@test.mx',password:'Test2026',rol:'trabajador',curp:'MAMC900101HDFRRR09',puesto:'Operador'});
    const instructor=await login('instructor','Instructor2026');
    const preguntas=Array.from({length:5},(_,i)=>({id:i+1,enunciado:'Pregunta '+i,opciones:[{id:'a',texto:'Si'},{id:'b',texto:'No'}],correcta:'a'}));
    const curso=await cursos.crear({nombre:'Constancia local sin servidor',horas:16,modulos:[],instructorId:instructor.id,evaluacionesIniciales:{examen:{minimaAprobatoria:80,preguntas}}});
    await login('ana','Admin2026');await cursos.asignar(curso.id,{asignadoAIds:[alumno.id]});await cursos.cambiarEstado(curso.id,'publicado');
    await login('local@test.mx','Test2026');const respuestas=Object.fromEntries(preguntas.map(p=>[p.id,'a']));
    await evaluaciones.enviarIntento(curso.id,respuestas,'evaluacion');
    const resultado=await evaluaciones.enviarIntento(curso.id,respuestas,'examen');
    await login('ana','Admin2026');return {curso:curso.id,alumno:alumno.id,folio:resultado.reconocimiento.folio};
   });
   await page.goto(url('admin/dashboard.html'));
   await page.waitForFunction(id=>[...document.querySelectorAll('#constancia-curso option')].some(o=>o.value===String(id)),fixture.curso);
   await page.evaluate(()=>window.irASeccionPanel('constancias-admin'));
   await page.locator('#constancia-dc3-abrir').click();await page.locator('.dc3-selector select').selectOption(fixture.folio);
   await page.locator('.dc3-selector [type=submit]').click();
   await page.waitForFunction(()=>document.querySelector('.dc3-modal iframe')?.getAttribute('src')?.startsWith('blob:'));
   assert.equal(await page.locator('.dc3-modal [name=curp]').inputValue(),'MAMC900101HDFRRR09');
   assert.equal(await page.locator('.dc3-modal [name=curp]').getAttribute('readonly'),'');
   await page.locator('.dc3-modal [name=ocupacion]').fill('01. PRODUCCION');
   await page.locator('.dc3-modal [name=areaTematica]').fill('6000 SEGURIDAD');
   await page.locator('.dc3-modal [name=periodoInicio]').fill('2026-03-20');
   const previewDownload=page.waitForEvent('download');await page.locator('.dc3-modal [data-prueba]').click();const trial=await previewDownload;
   assert.equal(await trial.failure(),null);await trial.saveAs('.codex-tools/revision/dc3-prueba-'+modo+'.pdf');
   assert.equal(await page.evaluate(folio=>!!JSON.parse(localStorage.getItem('cicsa_constancias_emitidas')).find(c=>c.folio===folio).dc3,fixture.folio),false);
   await page.locator('.dc3-modal [type=submit]').click();
   await page.waitForFunction(()=>document.querySelector('.dc3-modal [type=submit]')?.textContent==='Descargar DC-3');
   const stored=await page.evaluate(folio=>JSON.parse(localStorage.getItem('cicsa_constancias_emitidas')).find(c=>c.folio===folio).dc3,fixture.folio);
   assert.equal(stored.formato,'cicsa-dc3-v1');assert.equal(stored.curp,'MAMC900101HDFRRR09');assert.equal(stored.ocupacion,'01. PRODUCCION');
   const downloadPromise=page.waitForEvent('download');await page.locator('.dc3-modal [type=submit]').click();const download=await downloadPromise;
   assert.equal(await download.failure(),null);await download.saveAs('.codex-tools/revision/dc3-descarga-'+modo+'.pdf');
   await page.reload();await page.waitForFunction(()=>window.DC3&&typeof window.irASeccionPanel==='function');
   await page.evaluate(()=>window.irASeccionPanel('constancias-admin'));await page.locator('#constancia-dc3-abrir').click();await page.locator('.dc3-selector select').selectOption(fixture.folio);await page.locator('.dc3-selector [type=submit]').click();
   await page.waitForFunction(()=>document.querySelector('.dc3-modal iframe')?.getAttribute('src')?.startsWith('blob:'));
   assert.equal(await page.locator('.dc3-modal [type=submit]').textContent(),'Descargar DC-3');
   await page.waitForTimeout(1200);await page.screenshot({path:'.codex-tools/revision/dc3-formulario-'+modo+'.png'});
   await page.evaluate(async()=>{const r=await auth.login('local@test.mx','Test2026');sesion.guardar(r.token,r.usuario);});
   await page.goto(url('trabajador/perfil.html'));
   const workerDownload=page.waitForEvent('download');await page.getByRole('button',{name:/Descargar DC-3/}).click();const workerPDF=await workerDownload;
   assert.equal(await workerPDF.failure(),null);await workerPDF.saveAs('.codex-tools/revision/dc3-trabajador-'+modo+'.pdf');
   assert.deepEqual(errors,[]);console.log('PASS '+modo+': DC-3 sin fetch, datos automaticos, prueba sin emision, descarga y persistencia tras recargar.');await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
