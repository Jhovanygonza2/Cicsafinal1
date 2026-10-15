window.FormatoConstancia = (() => {
  const oficialId="cicsa-oficial-v1";
  const rutaOficial=typeof document!=="undefined"?new URL("../assets/constancia-cicsa-limpia-v1.pdf",document.currentScript.src).href:"assets/constancia-cicsa-limpia-v1.pdf";
  const oficial=()=>({archivoId:oficialId,nombre:"Plantilla oficial CICSA",campos:[]});
  let fondoOficial;
  function fechaOficial(valor){
    if(!valor)return "";
    const solo=/^\d{4}-\d{2}-\d{2}$/.test(valor),d=new Date(solo?valor+"T12:00:00-06:00":valor);
    return Number.isNaN(d.getTime())?"":d.toLocaleDateString("es-MX",{timeZone:"America/Mexico_City",day:"numeric",month:"long",year:"numeric"});
  }
  function detalleOficial(c){
    const inicio=fechaOficial(c.periodoInicio),fin=fechaOficial(c.periodoFin);
    return [`Con duración total de ${c.horas??""} horas`,c.lugar?`realizado en ${c.lugar}`:"",inicio&&fin&&inicio!==fin?`del ${inicio} al ${fin}`:fin?`el ${fin}`:inicio?`a partir del ${inicio}`:""].filter(Boolean).join(" ")+".";
  }
  async function generarOficial(c,previa){
    if(!fondoOficial && window.PlantillaCicsaPDF)fondoOficial=Promise.resolve(window.PlantillaCicsaPDF);
    if(!fondoOficial)fondoOficial=fetch(rutaOficial).then(r=>{if(!r.ok)throw new Error("No se pudo cargar la plantilla oficial CICSA.");return r.arrayBuffer();}).catch(e=>{fondoOficial=null;throw e;});
    const original=await PDFLib.PDFDocument.load(await fondoOficial),doc=await PDFLib.PDFDocument.create();
    // La segunda hoja es el DC-3, que conserva su flujo de emisión independiente.
    const [p]=await doc.copyPages(original,[0]);doc.addPage(p);
    const regular=await doc.embedFont(PDFLib.StandardFonts.Helvetica),bold=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold),italic=await doc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique);
    function texto(valor,x,y,w,h,size=12,font=regular,centrado=true){
      const value=String(valor??"").replace(/\s+/g," ").trim();if(!value)return;
      let lines=[];
      for(;size>=4;size-=.5){
        lines=[];let line="";
        for(const word of value.split(" ")){const next=line?line+" "+word:word;if(line&&font.widthOfTextAtSize(next,size)>w){lines.push(line);line=word;}else line=next;}
        if(line)lines.push(line);
        if(lines.length*size*1.15<=h&&lines.every(l=>font.widthOfTextAtSize(l,size)<=w))break;
      }
      size=Math.max(4,size);
      const alturaTexto=font.heightAtSize(size,{descender:false}),alturaBloque=alturaTexto+(lines.length-1)*size*1.15;
      lines.forEach((line,n)=>p.drawText(line,{x:x+(centrado?(w-font.widthOfTextAtSize(line,size))/2:0),y:p.getHeight()-y-(h-alturaBloque)/2-alturaTexto-n*size*1.15,size,font}));
    }
    // Plantilla CICSA V1 CP (formato horizontal, 842.25 × 595.5 pt).
    // Las coordenadas se miden desde el borde superior de la página.
    const anchoPagina=p.getWidth(), altoPagina=p.getHeight();
    if(anchoPagina>altoPagina){
      const dibujar=(clave,valor,font=regular)=>{
        const [x,y,w,h,size]=horizontal[clave];
        texto(valor,x*anchoPagina/100,y*altoPagina/100,w*anchoPagina/100,h*altoPagina/100,size,font);
      };
      dibujar("trabajador",c.trabajador,bold);
      dibujar("curso",c.curso,italic);
      dibujar("periodoFin",fechaOficial(c.fecha||c.periodoFin));
      dibujar("lugar",c.lugar||"Ciudad del Carmen, Campeche");
      dibujar("horas",`${c.horas??""} horas`);
      dibujar("instructor",c.instructor||"");
      // La vigencia de dos años ya está impresa en el PDF original.
    } else {
      texto(c.trabajador,72,338,468,32,18,bold);
      texto(c.curso,72,474,468,47,18,italic);
      texto(detalleOficial(c),72,535,468,43,12);
    }
    if(c.firma){
      let dato=c.firma;
      if(dato.startsWith("data:image/webp")){const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error("No se pudo abrir la firma."));i.src=dato;});const canvas=document.createElement("canvas");canvas.width=img.width;canvas.height=img.height;canvas.getContext("2d").drawImage(img,0,0);dato=canvas.toDataURL("image/png");}
      const img=dato.startsWith("data:image/png;")?await doc.embedPng(dato):await doc.embedJpg(dato),scale=Math.min(180/img.width,65/img.height),w=img.width*scale,h=img.height*scale;
      p.drawImage(img,{x:(612-w)/2,y:792-635,width:w,height:h});
    }
    if(p.getWidth()<=p.getHeight()){
      texto(c.instructor,182,638,248,11,8.5,bold);
      texto(c.instructorRegistro,182,664,248,12,8.5,bold);
      texto(fechaOficial(c.fecha),204,686,235,12,9,bold,false);
      texto(c.folio?"Código: "+c.folio:"",164,713,310,12,9,bold,false);
    }
    return doc.save();
  }
  const nombres={trabajador:"Nombre del trabajador",curso:"Nombre del curso",instructor:"Instructor",registro:"Registro del instructor",horas:"Duración",nota:"Calificación",fecha:"Fecha de emisión",folio:"Código / folio",firma:"Firma del instructor",insignia:"Imagen de insignia",curp:"CURP",puesto:"Puesto",empresa:"Nombre de empresa",domicilio:"Domicilio",titulo:"Título del documento",area:"Área del trabajador",numeroEmpleado:"Número de empleado",categoria:"Categoría",periodoInicio:"Inicio del curso",periodoFin:"Término del curso",modalidad:"Modalidad",minimaAprobatoria:"Mínimo aprobatorio",resultado:"Resultado",instructorCargo:"Cargo del instructor",lugar:"Lugar de realización",responsable:"Responsable de emisión",firmaResponsable:"Firma del responsable",logo:"Logotipo",texto:"Texto del reconocimiento",vigencia:"Vigencia"};
  const cache=new Map();
  // Posiciones porcentuales segun la constancia vertical de referencia.
  const ordenModelo=["empresa","titulo","trabajador","texto","curso","horas","lugar","periodoFin","firma","instructor","instructorCargo","firmaResponsable","fecha","vigencia","folio","insignia"];
  // La zona de contenido del modelo horizontal termina antes del sello lateral.
  const horizontal={trabajador:[7,51,61,4,20],curso:[7,56,61,3.5,13],periodoFin:[34,63,34,3,11],lugar:[34,67.5,34,3,11],horas:[34,71.7,34,3,11],instructor:[34,76,34,3,11]};
  const horizontalAnterior={trabajador:[12,51,76,4,20],curso:[12,56,76,3.5,13],periodoFin:[31,65.5,45,2.5,10],lugar:[33,70.5,45,2.5,10],horas:[36,75,40,2.5,10],instructor:[32,79.5,48,2.5,10]};
  function camposParaPagina(medida){
    const campos=predeterminados();
    if(!medida||medida.ancho<=medida.alto)return campos;
    return campos.map(c=>{
      const p=horizontal[c.clave];
      return {...c,visible:!!p,...(p?{x:p[0],y:p[1],ancho:p[2],alto:p[3],tamano:p[4],pagina:1,alineacion:"centro",multilinea:["trabajador","curso","instructor"].includes(c.clave)}:{})};
    });
  }
  function actualizarCampos(campos,pagina){
    // Corrige solo el preset antiguo; conserva posiciones personalizadas e historial.
    if(pagina.getWidth()<=pagina.getHeight()||!Object.entries(horizontalAnterior).every(([clave,p])=>{
      const c=campos.find(c=>c.clave===clave);
      return c&&c.pagina===1&&["x","y","ancho","alto"].every((k,i)=>c[k]===p[i]);
    }))return campos;
    const nuevos=camposParaPagina({ancho:pagina.getWidth(),alto:pagina.getHeight()});
    return campos.map(c=>horizontal[c.clave]?{...c,...Object.fromEntries(["x","y","ancho","alto","multilinea"].map(k=>[k,nuevos.find(n=>n.clave===c.clave)[k]]))}:c);
  }
  function predeterminados(){
    const posiciones={empresa:[16,16,68,7,16],titulo:[20,32,60,5,25],trabajador:[16,43,68,4,18],texto:[14,49,72,6,12],curso:[14,56,72,7,17],horas:[14,68,18,3,11],lugar:[32,68,54,3,11],periodoFin:[25,71,50,3,11],firma:[34,74,32,7,12],instructor:[30,81,40,2,9],instructorCargo:[30,83,40,2,8],firmaResponsable:[70,75,17,8,12],fecha:[25,87,50,2,9],vigencia:[25,89,50,2,9],folio:[25,91,50,2,9],insignia:[76,85,10,7,12]};
    const claves=[...ordenModelo,...Object.keys(nombres).filter(k=>!ordenModelo.includes(k))];
    return claves.map(clave=>{
      const [x,y,ancho,alto,tamano]=posiciones[clave]||[15,85,70,4,12];
      return {clave,visible:ordenModelo.includes(clave)&&!["firmaResponsable","insignia"].includes(clave),pagina:1,x,y,ancho,alto,tamano,multilinea:["empresa","texto","curso"].includes(clave),color:"#222222",alineacion:"centro"};
    });
  }
  async function archivo(id){if(!cache.has(id)){const r=await solicitar("GET",`/formatos-constancia/${id}/archivo`);cache.set(id,r.archivo);}return cache.get(id);}
  function recordar(id,data){cache.set(id,data);}
  async function base(data){
    const {PDFDocument,degrees}=PDFLib;const destino=await PDFDocument.create();
    if(data.startsWith("data:application/pdf;")){
      let fuente;try{fuente=await PDFDocument.load(data);}catch(e){throw new Error("No se pudo abrir el PDF. Usa un archivo válido sin contraseña.");}
      if(fuente.getPageCount()>100)throw new Error("El PDF admite un máximo de 100 páginas.");
      try{if(fuente.getForm().getFields().length)fuente.getForm().flatten();}catch(e){throw new Error("No se pudo leer el formulario del PDF. Exporta una copia plana e intenta nuevamente.");}
      for(const pagina of fuente.getPages()){
        const ancho=pagina.getWidth(),alto=pagina.getHeight(),giro=((pagina.getRotation().angle%360)+360)%360;
        const salida=destino.addPage(giro===90||giro===270?[alto,ancho]:[ancho,alto]);
        pagina.drawText(" ",{x:0,y:0,size:1});
        const incrustada=await destino.embedPage(pagina);
        salida.drawPage(incrustada,{x:giro===180?ancho:giro===270?alto:0,y:giro===90?ancho:giro===180?alto:0,width:ancho,height:alto,rotate:degrees(-giro)});
      }
    }else{
      let imagen;try{imagen=data.startsWith("data:image/png;")?await destino.embedPng(data):await destino.embedJpg(data);}catch(e){throw new Error("No se pudo abrir la imagen. Usa un PNG o JPG válido.");}
      const ancho=imagen.width>=imagen.height?842:595,alto=ancho*imagen.height/imagen.width;
      if(!Number.isFinite(alto)||alto<100||alto>3000)throw new Error("Las proporciones de la imagen no son adecuadas para una constancia.");
      const pagina=destino.addPage([ancho,alto]);pagina.drawImage(imagen,{x:0,y:0,width:ancho,height:alto});
    }
    return destino;
  }
  async function inspeccionar(data){const doc=await base(data);return doc.getPages().map(p=>({ancho:p.getWidth(),alto:p.getHeight()}));}
  function valor(c,clave){if(clave==="minimaAprobatoria")return `${c.minimaAprobatoria??80}%`;if(clave==="periodoFin")return c.fecha?fechaOficial(c.fecha):(c[clave]?fechaOficial(c[clave]):"");if(clave==="periodoInicio")return c[clave]?fechaOficial(c[clave]):"";if(clave==="registro")return c.instructorRegistro||"";if(clave==="horas")return `${c.horas??""} h`;if(clave==="nota")return `${c.nota??""}/100`;if(clave==="fecha")return fechaOficial(c.fecha);return String(c[clave]??"");}
  async function generar(c,previa=false){
    if(c.formato?.archivoId===oficialId)return generarOficial(c,previa);
    if(!c.formato?.archivoId)throw new Error("Carga primero tu formato.");
    const documento=await base(await archivo(c.formato.archivoId));
    const fuente=await documento.embedFont(PDFLib.StandardFonts.Helvetica);
    for(const campo of actualizarCampos(c.formato.campos,documento.getPage(0))){
      if(!campo.visible)continue;
      const pagina=documento.getPage(campo.pagina-1);if(!pagina)throw new Error(`El campo ${nombres[campo.clave]} apunta a una página inexistente.`);
      const W=pagina.getWidth(),H=pagina.getHeight(),x=campo.x*W/100,ancho=campo.ancho*W/100,alto=campo.alto*H/100,arriba=H-campo.y*H/100;
      if(["firma","insignia","firmaResponsable","logo"].includes(campo.clave)){
        let dato=campo.clave==="insignia"?c.insigniaDetalle?.imagen:c[campo.clave];if(!dato)continue;
        if(dato.startsWith("data:image/webp")){const imagen=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error("No se pudo abrir la firma o insignia."));i.src=dato;});const canvas=document.createElement("canvas");canvas.width=imagen.width;canvas.height=imagen.height;canvas.getContext("2d").drawImage(imagen,0,0);dato=canvas.toDataURL("image/png");}
        const img=dato.startsWith("data:image/png;")?await documento.embedPng(dato):await documento.embedJpg(dato);
        const escala=Math.min(ancho/img.width,alto/img.height),w=img.width*escala,h=img.height*escala;
        const desplazamiento=(campo.alineacion||"centro")==="centro"?(ancho-w)/2:(campo.alineacion||"centro")==="derecha"?ancho-w:0;
        pagina.drawImage(img,{x:x+desplazamiento,y:arriba-(alto+h)/2,width:w,height:h});continue;
      }
      const texto=valor(c,campo.clave).replace(/[\r\n]+/g," ");if(!texto)continue;
      let medida;try{medida=fuente.widthOfTextAtSize(texto,campo.tamano);}catch(e){throw new Error(`El campo ${nombres[campo.clave]} contiene caracteres que esta fuente no admite.`);}
      if(campo.multilinea){
        let tamano=Math.min(campo.tamano,alto*.8),lineas=[];
        const palabras=texto.split(/\s+/);
        while(tamano>=1){
          lineas=[];let linea="";
          for(const palabra of palabras){
            const propuesta=linea?linea+" "+palabra:palabra;
            if(linea&&fuente.widthOfTextAtSize(propuesta,tamano)>ancho){lineas.push(linea);linea=palabra;}else linea=propuesta;
          }
          if(linea)lineas.push(linea);
          if(lineas.length*tamano*1.2<=alto&&lineas.every(l=>fuente.widthOfTextAtSize(l,tamano)<=ancho))break;
          tamano-=.5;
        }
        tamano=Math.max(1,tamano);
        const rgb=[1,3,5].map(n=>parseInt(campo.color.slice(n,n+2),16)/255);
        const alturaTexto=fuente.heightAtSize(tamano,{descender:false}),alturaBloque=alturaTexto+(lineas.length-1)*tamano*1.2;
        lineas.forEach((linea,i)=>{
          const w=fuente.widthOfTextAtSize(linea,tamano),dx=(campo.alineacion||"centro")==="centro"?(ancho-w)/2:(campo.alineacion||"centro")==="derecha"?ancho-w:0;
          pagina.drawText(linea,{x:x+dx,y:arriba-(alto-alturaBloque)/2-alturaTexto-i*tamano*1.2,size:tamano,font:fuente,color:PDFLib.rgb(...rgb)});
        });
        continue;
      }
      const tamano=Math.min(campo.tamano,alto*.85,medida>ancho?campo.tamano*ancho/medida:campo.tamano);
      const w=fuente.widthOfTextAtSize(texto,tamano),desplazamiento=(campo.alineacion||"centro")==="centro"?(ancho-w)/2:(campo.alineacion||"centro")==="derecha"?ancho-w:0;
      const rgb=[1,3,5].map(n=>parseInt(campo.color.slice(n,n+2),16)/255);
      pagina.drawText(texto,{x:x+desplazamiento,y:arriba-(alto+fuente.heightAtSize(tamano,{descender:false}))/2,size:tamano,font:fuente,color:PDFLib.rgb(...rgb)});
    }
    return documento.save();
  }
  async function descargar(c,previa=false,alError){try{const bytes=await generar(c,previa);const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));const a=document.createElement("a");a.href=url;a.download=(c.folio||"constancia")+".pdf";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return true;}catch(e){window.CicsaToast?.mostrar(e.message,"error");alError?.(e);return false;}}
  return {oficial,fechaOficial,detalleOficial,nombres,ordenModelo,predeterminados,camposParaPagina,archivo,recordar,inspeccionar,generar,descargar};
})();
