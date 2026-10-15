window.DC3 = (() => {
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const firma=valor=>/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(valor||"")?`<img src="${valor}" alt="Firma" style="max-width:150px;height:55px;object-fit:contain">`:'<div style="height:55px"></div>';
  async function generarPDF(d,prueba=false){
    if(!window.PlantillaDC3PDF)throw new Error("No se cargó la plantilla DC-3. Recarga la página.");
    const original=await PDFLib.PDFDocument.load(window.PlantillaDC3PDF),doc=await PDFLib.PDFDocument.create();
    const [p]=await doc.copyPages(original,[0]);doc.addPage(p);
    const regular=await doc.embedFont(PDFLib.StandardFonts.Helvetica),bold=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    function texto(value,x,top,w,h,size=10,font=regular,centro=false){
      value=String(value??"").replace(/\s+/g," ").trim();if(!value)return;
      let lines=[];
      for(;size>=4;size-=.25){
        lines=[];let line="";
        for(const word of value.split(" ")){const next=line?line+" "+word:word;if(line&&font.widthOfTextAtSize(next,size)>w){lines.push(line);line=word;}else line=next;}
        if(line)lines.push(line);
        if(lines.length*size*1.1<=h&&lines.every(line=>font.widthOfTextAtSize(line,size)<=w))break;
      }
      if(size<4)throw new Error("Un texto es demasiado largo para el recuadro del DC-3.");
      lines.forEach((line,n)=>p.drawText(line,{x:x+(centro?(w-font.widthOfTextAtSize(line,size))/2:0),y:792-top-size-n*size*1.1,size,font}));
    }
    // Coordenadas medidas sobre la hoja limpia, cuyos recuadros difieren del ejemplo rellenado.
    texto(d.trabajadorNombre,23,155,548,20);
    const limites=[19.5,35.5,52.5,68.5,85.5,101.5,118.5,134.5,151.5,167.5,184.5,200.5,217.5,233.5,250.5,266.5,283.5,299.5,316.5];
    const curp=String(d.curp||"").toUpperCase();
    if(curp.length>18)throw new Error("La CURP debe tener 18 caracteres.");
    [...curp].forEach((v,i)=>texto(v,limites[i],191,limites[i+1]-limites[i],12,9,bold,true));
    texto(d.ocupacion,320,190,251,14,8.5);
    texto(d.puesto,23,217,548,13);
    texto(d.curso,23,360,548,12,9);
    texto(d.horas,23,387,125,11,9,bold);
    function fecha(valor,x){const numeros=String(valor||"").replaceAll("-","");if(!/^\d{8}$/.test(numeros))return;[...numeros].forEach((v,i)=>texto(v,x+i*21,387,21,11,9,regular,true));}
    fecha(d.periodoInicio,221.5);fecha(d.periodoFin,407.5);
    texto(d.areaTematica,23,412,548,12,9);
    texto(d.agente,23,438,548,12,9);
    if(d.firmaInstructor){
      let dato=d.firmaInstructor;
      if(dato.startsWith("data:image/webp")){const im=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error("No se pudo abrir la firma."));i.src=dato;});const c=document.createElement("canvas");c.width=im.width;c.height=im.height;c.getContext("2d").drawImage(im,0,0);dato=c.toDataURL("image/png");}
      const img=dato.startsWith("data:image/png;")?await doc.embedPng(dato):await doc.embedJpg(dato),scale=Math.min(138/img.width,43/img.height),w=img.width*scale,h=img.height*scale;
      p.drawImage(img,{x:48+(143-w)/2,y:792-560,width:w,height:h});
    }
    texto(d.instructor,48,562,143,10,8,bold,true);
    if(prueba)p.drawText("VISTA PREVIA - SIN VALIDEZ",{x:195,y:40,size:10,font:bold,color:PDFLib.rgb(.7,.1,.1)});
    return new Blob([await doc.save()],{type:"application/pdf"});
  }
  async function abrirPDF(d,prueba=false){
    if(d.formato!=="cicsa-dc3-v1"&&!prueba){imprimir(d);return;}
    const blob=await generarPDF(d,prueba),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=`DC-3-${prueba?"PRUEBA-":""}${String(d.folio||"CICSA").replace(/[^a-zA-Z0-9_-]/g,"")}.pdf`;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  const campo=(nombre,valor)=>`<div class="campo"><small>${esc(nombre)}</small><strong>${esc(valor)}</strong></div>`;
  function html(d){return `<!doctype html><html lang="es"><meta charset="utf-8"><title>DC-3 ${esc(d.folio)}</title><style>@page{size:letter;margin:14mm}body{font:12px Arial,sans-serif;color:#111;margin:20px}main{max-width:760px;margin:auto}h1{text-align:center;font-size:19px}h2{font-size:13px;background:#e8e8e8;border:1px solid #222;padding:8px;margin:18px 0 0}.fila{display:flex;border-left:1px solid #222}.campo{flex:1;border-right:1px solid #222;border-bottom:1px solid #222;padding:9px;min-width:0}.campo small,.campo strong{display:block;overflow-wrap:anywhere}.campo strong{padding-top:9px}.firmas{display:flex;text-align:center;gap:15px;margin-top:25px}.firmas>div{flex:1}.linea{border-top:1px solid #222;padding-top:7px}footer{font-size:10px;margin-top:20px}@media print{body{margin:0}main{break-inside:avoid}}</style><main><h1>FORMATO DC-3<br>CONSTANCIA DE COMPETENCIAS<br>O DE HABILIDADES LABORALES</h1><h2>DATOS DEL TRABAJADOR</h2><div class="fila">${campo("Nombre (apellido paterno, apellido materno, nombre[s])",d.trabajadorNombre)}</div><div class="fila">${campo("Clave Única de Registro de Población",d.curp)}${campo("Ocupación específica (catálogo)",d.ocupacion)}</div><div class="fila">${campo("Puesto",d.puesto)}</div><h2>DATOS DE LA EMPRESA</h2><div class="fila">${campo("Nombre o razón social",d.empresa)}</div><div class="fila">${campo("Registro Federal de Contribuyentes con homoclave",d.rfc)}</div><h2>DATOS DEL PROGRAMA DE CAPACITACIÓN, ADIESTRAMIENTO Y PRODUCTIVIDAD</h2><div class="fila">${campo("Nombre del curso",d.curso)}</div><div class="fila">${campo("Duración en horas",d.horas)}${campo("Periodo: de",d.periodoInicio)}${campo("a",d.periodoFin)}</div><div class="fila">${campo("Área temática del curso (catálogo)",d.areaTematica)}</div><div class="fila">${campo("Nombre del agente capacitador",d.agente)}</div><p>Los datos se asientan para acreditar la aprobación del curso de capacitación correspondiente.</p><div class="firmas"><div>${firma(d.firmaInstructor)}<div class="linea">${esc(d.instructor)}<br>Instructor o tutor${d.registroInstructor?'<br>Registro: '+esc(d.registroInstructor):''}</div></div><div>${firma(d.firmaEmpresa)}<div class="linea">${esc(d.representanteEmpresa)}<br>Patrón o representante legal</div></div>${d.requiereRepresentanteTrabajadores?`<div>${firma(d.firmaTrabajadores)}<div class="linea">${esc(d.representanteTrabajadores)}<br>Representante de los trabajadores</div></div>`:''}</div><footer>Folio interno: ${esc(d.folio)} · Fecha de emisión: ${esc(d.fecha.slice(0,10))}</footer></main></html>`;}
  function imprimir(d){const v=window.open("","_blank","width=1000,height=800");if(!v){window.CicsaToast?.mostrar("Permite ventanas emergentes para imprimir o guardar el DC-3 como PDF.","advertencia");return;}v.document.write(html(d));v.document.close();v.addEventListener("load",()=>v.print(),{once:true});}
  async function preparar(registro,actualizar){
    const base=await solicitar("GET",`/constancias/${registro.folio}/dc3`);
    if(registro.dc3&&base.formato!=="cicsa-dc3-v1"){imprimir(base);return;}
    const origen=document.activeElement,dialogo=document.createElement("dialog");
    dialogo.className="dc3-modal";dialogo.setAttribute("aria-label","DC-3 oficial CICSA");
    dialogo.innerHTML='<header><h2>DC-3 oficial CICSA</h2><button type="button" data-cerrar class="btn btn-secundario">Cerrar</button></header><p data-resumen></p><div class="dc3-diseno"><form><p>Los datos registrados se recuperan automáticamente. Completa solamente los campos pendientes. La empresa y sus representantes ya están en la plantilla oficial.</p><div data-campos></div><p data-firma></p><p role="status" aria-live="polite"></p><div class="dc3-acciones"><button type="button" data-previa class="btn btn-secundario">Actualizar vista previa</button><button type="button" data-prueba class="btn btn-secundario">Descargar PDF de prueba</button><button type="submit" class="btn btn-primario">Generar y guardar DC-3</button></div></form><iframe title="Vista previa DC-3"></iframe></div>';
    const form=dialogo.querySelector("form"),estado=form.querySelector('[role="status"]'),visor=dialogo.querySelector("iframe"),campos=form.querySelector('[data-campos]');
    dialogo.querySelector('[data-resumen]').textContent=`${registro.folio} · ${base.trabajadorNombre} · ${base.curso}`;
    form.querySelector('[data-firma]').textContent=base.firmaInstructor?"Firma del instructor registrada.":"Sin firma del instructor registrada: se conserva el espacio para firma.";
    const definiciones=[["trabajadorNombre","Nombre del trabajador",250],["curp","CURP",18],["puesto","Puesto",150],["ocupacion","Ocupación específica (clave y nombre)",200],["areaTematica","Área temática (clave y nombre)",200],["periodoInicio","Inicio del periodo","date"],["periodoFin","Fin del periodo","date"]];
    for(const [clave,nombre,max] of definiciones){
      const label=document.createElement("label"),input=document.createElement("input");label.textContent=nombre;input.name=clave;input.required=true;
      if(max==="date")input.type="date";else input.maxLength=max;
      input.value=base[clave]||"";input.readOnly=!!base[clave]||!!registro.dc3;if(!input.readOnly)input.placeholder="Dato pendiente";label.append(input);campos.append(label);
    }
    const datos=()=>({...base,...Object.fromEntries(definiciones.map(([k])=>[k,form.elements[k].value.trim()]))});
    let url="",version=0,timer,guardando=false;
    function cerrar(){if(!guardando)dialogo.close();}
    dialogo.querySelector('[data-cerrar]').onclick=cerrar;
    dialogo.addEventListener("cancel",e=>{e.preventDefault();cerrar();});
    dialogo.addEventListener("close",()=>{clearTimeout(timer);version++;if(url)URL.revokeObjectURL(url);dialogo.remove();if(origen?.isConnected)origen.focus();});
    async function previa(){const n=++version;try{const blob=await generarPDF(datos(),!registro.dc3);if(n!==version||!dialogo.open)return;const next=URL.createObjectURL(blob);visor.src=next+"#toolbar=0&view=FitH";if(url)URL.revokeObjectURL(url);url=next;estado.textContent=registro.dc3?"DC-3 guardado. Puede descargarlo nuevamente.":"Vista previa de prueba. No genera una emisión.";}catch(e){if(n===version)estado.textContent=e.message;}}
    form.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(previa,200);});
    form.querySelector('[data-previa]').onclick=previa;
    form.querySelector('[data-prueba]').onclick=async()=>{try{await abrirPDF(datos(),true);estado.textContent="PDF de prueba descargado. Sin cambios en el historial.";}catch(e){estado.textContent=e.message;}};
    const guardar=form.querySelector('[type="submit"]');
    function listo(){guardar.textContent="Descargar DC-3";for(const [k] of definiciones)form.elements[k].readOnly=true;}
    if(registro.dc3)listo();
    form.onsubmit=async e=>{e.preventDefault();if(guardando)return;guardando=true;guardar.disabled=true;
      try{if(registro.dc3){await abrirPDF(registro.dc3);}else{
        await generarPDF(datos());
        const d=await solicitar("POST",`/constancias/${registro.folio}/dc3`,datos());registro.dc3=d;Object.assign(base,d);listo();await previa();estado.textContent="DC-3 generado y guardado. Usa Descargar DC-3 para obtener el PDF.";await actualizar?.();
      }}catch(error){estado.textContent=error.message;}finally{guardando=false;guardar.disabled=false;}
    };
    document.body.append(dialogo);dialogo.showModal();await previa();
  }
  async function seleccionar(registros,actualizar){
    if(!registros.length)throw new Error("Primero debe existir una constancia de un curso aprobado.");
    const origen=document.activeElement,d=document.createElement("dialog");d.className="dc3-selector";d.setAttribute("aria-label","Seleccionar trabajador y curso para DC-3");
    d.innerHTML='<h2>DC-3</h2><form><label>Trabajador y curso aprobado<select required></select></label><p role="status"></p><button class="btn btn-primario" type="submit">Abrir DC-3</button> <button class="btn btn-secundario" type="button">Cerrar</button></form>';
    const select=d.querySelector("select");select.replaceChildren(...registros.map(c=>new Option(`${c.trabajador} · ${c.curso} · ${c.folio}`,c.folio)));
    d.querySelector('[type="button"]').onclick=()=>d.close();d.addEventListener("close",()=>{d.remove();if(origen?.isConnected)origen.focus();});
    d.querySelector("form").onsubmit=async e=>{e.preventDefault();const b=d.querySelector('[type="submit"]');b.disabled=true;try{await preparar(registros.find(c=>c.folio===select.value),actualizar);d.close();}catch(error){d.querySelector('[role="status"]').textContent=error.message;}finally{b.disabled=false;}};
    document.body.append(d);d.showModal();
  }
  return {html,imprimir,preparar,seleccionar,generarPDF,abrirPDF};
})();
