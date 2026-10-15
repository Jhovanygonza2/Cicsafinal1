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
    await login('ana','Admin2026');const alumno=await usuarios.crear({nombre:'Trabajador prueba local',correo:'local@test.mx',password:'Test2026',rol:'trabajador'});
    const instructor=await login('instructor','Instructor2026');
    const preguntas=Array.from({length:5},(_,i)=>({id:i+1,enunciado:'Pregunta '+i,opciones:[{id:'a',texto:'Si'},{id:'b',texto:'No'}],correcta:'a'}));
    const curso=await cursos.crear({nombre:'Constancia local sin servidor',horas:16,modulos:[],instructorId:instructor.id,evaluacionesIniciales:{examen:{minimaAprobatoria:80,preguntas}}});
    await login('ana','Admin2026');await cursos.asignar(curso.id,{asignadoAIds:[alumno.id]});return {curso:curso.id,alumno:alumno.id};
   });
   await page.goto(url('admin/dashboard.html'));
   await page.waitForFunction(id=>[...document.querySelectorAll('#constancia-curso option')].some(o=>o.value===String(id)),fixture.curso);
   await page.evaluate(()=>window.irASeccionPanel('constancias-admin'));await page.locator('#constancia-abrir').click();
   await page.locator('#constancia-curso').selectOption(String(fixture.curso));
   await page.waitForFunction(()=>document.querySelector('#constancia-previa').getAttribute('src')?.startsWith('blob:'));
   const preview=await page.evaluate(async()=>{const r=await fetch(document.querySelector('#constancia-previa').src.split('#')[0]);return {type:r.headers.get('Content-Type'),size:(await r.arrayBuffer()).byteLength};});
   assert.equal(preview.type,'application/pdf');assert.ok(preview.size>10000);
   const downloadPromise=page.waitForEvent('download');await page.locator('#constancia-prueba').click();const download=await downloadPromise;
   assert.equal(await download.failure(),null);assert.equal(download.suggestedFilename(),'VISTA-PREVIA.pdf');
   await download.saveAs('.codex-tools/revision/descarga-'+modo+'.pdf');
   await page.locator('#form-constancia button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#constancia-modal').open);
   assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('cicsa_cursos')).find(c=>c.id===id).constancia.formato.archivoId,fixture.curso),'cicsa-oficial-v1');
   await page.reload();await page.waitForFunction(id=>[...document.querySelectorAll('#constancia-curso option')].some(o=>o.value===String(id)),fixture.curso);
   await page.evaluate(()=>window.irASeccionPanel('constancias-admin'));await page.locator('#constancia-abrir').click();await page.locator('#constancia-curso').selectOption(String(fixture.curso));
   await page.waitForFunction(()=>document.querySelector('#constancia-previa').getAttribute('src')?.startsWith('blob:'));
   await page.waitForTimeout(1800);await page.screenshot({path:'.codex-tools/revision/correccion-'+modo+'.png'});
   assert.deepEqual(errors,[]);console.log('PASS '+modo+': PDF sin fetch, descarga real, guardar sin insignia y persistencia tras recargar.');await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
