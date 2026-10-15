window.DC3 = (() => {
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const firma=valor=>/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(valor||"")?`<img src="${valor}" alt="Firma" style="max-width:150px;height:55px;object-fit:contain">`:'<div style="height:55px"></div>';
  const plantillaUrl=()=>new URL("../assets/constancia-cicsa-limpia-v1.pdf",document.currentScript?.src||location.href).href;
  const fechaPartes=valor=>{const m=String(valor||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?{anio:m[1],mes:m[2],dia:m[3]}:{anio:"",mes:"",dia:""};};
  async function generarPDF(d){
    if(!window.PDFLib?.PDFDocument)throw new Error("No se cargó el generador de PDF. Recarga la página e inténtalo de nuevo.");
    const respuesta=await fetch(plantillaUrl());if(!respuesta.ok)throw new Error("No se encontró la plantilla oficial DC-3 de CICSA.");
    const original=await PDFLib.PDFDocument.load(await respuesta.arrayBuffer());
    const doc=await PDFLib.PDFDocument.create();
    const [pagina]=await doc.copyPages(original,[1]);doc.addPage(pagina);
    const regular=await doc.embedFont(PDFLib.StandardFonts.Helvetica),bold=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const alto=pagina.getHeight();
    const txt=(valor,x,top,w,size=9,font=regular,centrar=false)=>{
      const value=String(valor??"").replace(/\s+/g," ").trim();if(!value)return;
      let fs=size;while(fs>5&&font.widthOfTextAtSize(value,fs)>w)fs-=.5;
      const width=font.widthOfTextAtSize(value,fs);pagina.drawText(value,{x:x+(centrar?Math.max(0,(w-width)/2):0),y:alto-top-fs,size:fs,font,color:PDFLib.rgb(0.05,0.05,0.05),maxWidth:w});
    };
    const wrap=(valor,x,top,w,maxLines=2,size=9)=>{
      const words=String(valor??"").replace(/\s+/g," ").trim().split(" ");let line="",lines=[];
      for(const word of words){const candidate=line?line+" "+word:word;if(line&&regular.widthOfTextAtSize(candidate,size)>w){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);
      const shown=lines.slice(0,maxLines);shown.forEach((line,i)=>txt(line,x,top+i*(size+2),w,size,regular,false));
    };
    // Plantilla oficial CICSA: las coordenadas se alinean con los recuadros del DC-3 limpio.
    wrap(d.trabajadorNombre,23,150,540,2,10);
    const curp=String(d.curp||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,18);
    for(let i=0;i<curp.length;i++)txt(curp[i],(57+i*25.9)*.6-4,185,9,9,bold,true);
    wrap(d.ocupacion,320,185,250,2,8.5);
    wrap(d.puesto,23,211,540,2,10);
    // La razón social y RFC están preimpresos en la plantilla CICSA para evitar diferencias con el formato oficial.
    wrap(d.curso,23,357,540,2,10);
    txt(d.horas,23,383,125,10,bold,false);
    const ini=fechaPartes(d.periodoInicio),fin=fechaPartes(d.periodoFin);
    const digitosFecha=(valor,centros)=>String(valor||"").split("").forEach((digito,i)=>{if(centros[i]!=null)txt(digito,centros[i]*.6-5,385,10,8.5,regular,true);});
    digitosFecha(ini.anio,[386,420,454,488]);digitosFecha(ini.mes,[527,561]);digitosFecha(ini.dia,[598,632]);
    digitosFecha(fin.anio,[697,731,765,799]);digitosFecha(fin.mes,[836,870]);digitosFecha(fin.dia,[905,939]);
    wrap(d.areaTematica,23,405,540,2,9);
    wrap(d.agente,23,431,540,2,9);
    // Instructor o tutor: nombre y firma registrados en el sistema.
    if(d.firmaInstructor){
      let dato=d.firmaInstructor;
      if(dato.startsWith("data:image/webp")){
        const im=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error("No se pudo abrir la firma del instructor."));image.src=dato;});
        const canvas=document.createElement("canvas");canvas.width=im.width;canvas.height=im.height;canvas.getContext("2d").drawImage(im,0,0);dato=canvas.toDataURL("image/png");
      }
      const img=dato.startsWith("data:image/png;")?await doc.embedPng(dato):await doc.embedJpg(dato);
      const scale=Math.min(125/img.width,42/img.height);pagina.drawImage(img,{x:55,y:226,width:img.width*scale,height:img.height*scale});
    }
    txt(d.instructor,52,562,245,8.5,bold,true);
    // La plantilla limpia ya contiene los datos corporativos y firmas autorizadas de CICSA.
    const pdf=await doc.save();return new Blob([pdf],{type:"application/pdf"});
  }
  async function abrirPDF(d){
    const blob=await generarPDF(d),url=URL.createObjectURL(blob),ventana=window.open(url,"_blank");
    if(!ventana){const a=document.createElement("a");a.href=url;a.download=`DC-3-${String(d.folio||"CICSA").replace(/[^a-zA-Z0-9_-]/g,"")}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);return;}
    setTimeout(()=>URL.revokeObjectURL(url),120000);
  }
  const campo=(nombre,valor)=>`<div class="campo"><small>${esc(nombre)}</small><strong>${esc(valor)}</strong></div>`;
  function html(d){return `<!doctype html><html lang="es"><meta charset="utf-8"><title>DC-3 ${esc(d.folio)}</title><style>@page{size:letter;margin:14mm}body{font:12px Arial,sans-serif;color:#111;margin:20px}main{max-width:760px;margin:auto}h1{text-align:center;font-size:19px}h2{font-size:13px;background:#e8e8e8;border:1px solid #222;padding:8px;margin:18px 0 0}.fila{display:flex;border-left:1px solid #222}.campo{flex:1;border-right:1px solid #222;border-bottom:1px solid #222;padding:9px;min-width:0}.campo small,.campo strong{display:block;overflow-wrap:anywhere}.campo strong{padding-top:9px}.firmas{display:flex;text-align:center;gap:15px;margin-top:25px}.firmas>div{flex:1}.linea{border-top:1px solid #222;padding-top:7px}footer{font-size:10px;margin-top:20px}@media print{body{margin:0}main{break-inside:avoid}}</style><main><h1>FORMATO DC-3<br>CONSTANCIA DE COMPETENCIAS<br>O DE HABILIDADES LABORALES</h1><h2>DATOS DEL TRABAJADOR</h2><div class="fila">${campo("Nombre (apellido paterno, apellido materno, nombre[s])",d.trabajadorNombre)}</div><div class="fila">${campo("Clave Única de Registro de Población",d.curp)}${campo("Ocupación específica (catálogo)",d.ocupacion)}</div><div class="fila">${campo("Puesto",d.puesto)}</div><h2>DATOS DE LA EMPRESA</h2><div class="fila">${campo("Nombre o razón social",d.empresa)}</div><div class="fila">${campo("Registro Federal de Contribuyentes con homoclave",d.rfc)}</div><h2>DATOS DEL PROGRAMA DE CAPACITACIÓN, ADIESTRAMIENTO Y PRODUCTIVIDAD</h2><div class="fila">${campo("Nombre del curso",d.curso)}</div><div class="fila">${campo("Duración en horas",d.horas)}${campo("Periodo: de",d.periodoInicio)}${campo("a",d.periodoFin)}</div><div class="fila">${campo("Área temática del curso (catálogo)",d.areaTematica)}</div><div class="fila">${campo("Nombre del agente capacitador",d.agente)}</div><p>Los datos se asientan para acreditar la aprobación del curso de capacitación correspondiente.</p><div class="firmas"><div>${firma(d.firmaInstructor)}<div class="linea">${esc(d.instructor)}<br>Instructor o tutor${d.registroInstructor?'<br>Registro: '+esc(d.registroInstructor):''}</div></div><div>${firma(d.firmaEmpresa)}<div class="linea">${esc(d.representanteEmpresa)}<br>Patrón o representante legal</div></div>${d.requiereRepresentanteTrabajadores?`<div>${firma(d.firmaTrabajadores)}<div class="linea">${esc(d.representanteTrabajadores)}<br>Representante de los trabajadores</div></div>`:''}</div><footer>Folio interno: ${esc(d.folio)} · Fecha de emisión: ${esc(d.fecha.slice(0,10))}</footer></main></html>`;}
  function imprimir(d){const v=window.open("","_blank","width=1000,height=800");if(!v){window.CicsaToast?.mostrar("Permite ventanas emergentes para imprimir o guardar el DC-3 como PDF.","advertencia");return;}v.document.write(html(d));v.document.close();v.addEventListener("load",()=>v.print(),{once:true});}
  async function preparar(registro,actualizar){
    if(registro.dc3){await abrirPDF(registro.dc3);return;}
    const dialogo=document.createElement("dialog");dialogo.style.cssText="width:min(850px,90vw);max-height:90vh;overflow:auto;border:1px solid #bcc5cf;border-radius:12px;padding:24px";
    dialogo.innerHTML='<h2>Preparar DC-3</h2><p data-resumen></p><p>Revisa nombres y datos. Las firmas disponibles se incorporan automáticamente; los espacios sin imagen quedan para firma autógrafa. La emisión se conserva en el historial.</p><form><div class="curso-editor-grid" data-campos></div><label><input name="requiereRepresentanteTrabajadores" type="checkbox" checked> Incluir representante de trabajadores (empresa con más de 50 trabajadores)</label><div data-firmas></div><p role="status"></p><button type="submit" class="btn btn-primario">Generar DC-3</button> <button type="button" class="btn btn-secundario" data-cerrar>Cancelar</button></form>';
    dialogo.querySelector('[data-resumen]').textContent=registro.trabajador+' · '+registro.curso+' · Instructor: '+registro.instructor;
    const form=dialogo.querySelector('form'),campos=dialogo.querySelector('[data-campos]');
    const definiciones=[['trabajadorNombre','Nombre del trabajador (apellidos, nombres)',registro.trabajador,250],['curp','CURP',registro.curp||registro.trabajadorCurp,18],['puesto','Puesto',registro.puesto||registro.trabajadorPuesto,150],['ocupacion','Ocupación específica: clave y nombre del catálogo',registro.ocupacion||'',200],['empresa','Nombre o razón social de la empresa','CORPORATIVO INDUSTRIAL Y COMERCIAL S.A. DE C.V.',250],['rfc','RFC de la empresa con homoclave','CIC9303278B5',13],['areaTematica','Área temática: clave y nombre del catálogo',registro.areaTematica||registro.categoria||'',200],['periodoInicio','Inicio del periodo',registro.periodoInicio?.slice(0,10),'date'],['periodoFin','Fin del periodo',registro.periodoFin?.slice(0,10)||registro.fecha.slice(0,10),'date'],['representanteEmpresa','Patrón o representante legal','YAMILETH BRAVO ROMERO',200],['representanteTrabajadores','Representante de trabajadores','JORGE ENRIQUE CHE CENTURIÓN',200]];
    for(const [nombre,etiqueta,valor,limite] of definiciones){const div=document.createElement('div');div.className='campo';const label=document.createElement('label'),input=document.createElement('input');label.textContent=etiqueta;input.id='dc3-'+nombre;label.htmlFor=input.id;input.name=nombre;input.required=true;input.value=valor||'';if(limite==='date')input.type='date';else input.maxLength=limite;div.append(label,input);campos.append(div);}
    for(const [nombre,etiqueta] of [['firmaEmpresa','Firma del patrón o representante legal'],['firmaTrabajadores','Firma del representante de trabajadores']]){const label=document.createElement('label'),input=document.createElement('input');label.textContent=etiqueta+' (opcional, imagen de hasta 1 MB)';input.type='file';input.name=nombre;input.accept='image/png,image/jpeg,image/webp';label.append(input);dialogo.querySelector('[data-firmas]').append(label);}
    form.elements.requiereRepresentanteTrabajadores.onchange=()=>{form.elements.representanteTrabajadores.required=form.elements.requiereRepresentanteTrabajadores.checked;};
    const cerrar=()=>{dialogo.close();dialogo.remove();};dialogo.querySelector('[data-cerrar]').onclick=cerrar;dialogo.addEventListener('cancel',e=>{e.preventDefault();cerrar();});
    form.onsubmit=async event=>{event.preventDefault();const boton=form.querySelector('[type="submit"]');boton.disabled=true;try{
      const datos={};for(const [nombre] of definiciones)datos[nombre]=form.elements[nombre].value;
      datos.requiereRepresentanteTrabajadores=form.elements.requiereRepresentanteTrabajadores.checked;
      for(const nombre of ['firmaEmpresa','firmaTrabajadores']){const file=form.elements[nombre].files[0];if(!file)continue;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1024*1024)throw new Error('Las firmas deben ser imágenes de hasta 1 MB.');datos[nombre]=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('No se pudo leer la firma.'));r.readAsDataURL(file);});}
      const documento=await solicitar('POST',`/constancias/${registro.folio}/dc3`,datos);registro.dc3=documento;await actualizar?.();
      const resultado=document.createElement('p');resultado.textContent='DC-3 generado y guardado. ';const descargar=document.createElement('button');descargar.type='button';descargar.className='btn btn-primario';descargar.textContent='Descargar DC-3 / PDF';descargar.onclick=()=>abrirPDF(documento).catch(error=>{form.querySelector('[role="status"]').textContent=error.message;});resultado.append(descargar);form.replaceChildren(resultado);const salir=document.createElement('button');salir.type='button';salir.textContent='Cerrar';salir.className='btn btn-secundario';salir.onclick=cerrar;form.append(salir);
    }catch(error){form.querySelector('[role="status"]').textContent=error.message;}finally{boton.disabled=false;}};
    document.body.append(dialogo);dialogo.showModal();
  }
  return {html,imprimir,preparar,generarPDF,abrirPDF};
})();
