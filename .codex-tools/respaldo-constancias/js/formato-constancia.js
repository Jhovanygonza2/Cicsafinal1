window.FormatoConstancia = (() => {
  const nombres={trabajador:"Nombre del trabajador",curso:"Nombre del curso",instructor:"Instructor",registro:"Registro del instructor",horas:"Duración",nota:"Calificación",fecha:"Fecha de emisión",folio:"Código / folio",firma:"Firma del instructor",insignia:"Imagen de insignia",curp:"CURP",puesto:"Puesto",empresa:"Nombre de empresa",domicilio:"Domicilio",titulo:"Título del documento",area:"Área del trabajador",numeroEmpleado:"Número de empleado",categoria:"Categoría",periodoInicio:"Inicio del curso",periodoFin:"Término del curso",modalidad:"Modalidad",minimaAprobatoria:"Mínimo aprobatorio",resultado:"Resultado",instructorCargo:"Cargo del instructor",lugar:"Lugar de realización",responsable:"Responsable de emisión",firmaResponsable:"Firma del responsable",logo:"Logotipo",texto:"Texto del reconocimiento",vigencia:"Vigencia"};
  const cache=new Map();
  // Posiciones porcentuales segun la constancia vertical de referencia.
  const ordenModelo=["empresa","titulo","trabajador","texto","curso","horas","lugar","periodoFin","firma","instructor","instructorCargo","firmaResponsable","fecha","vigencia","folio","insignia"];
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
  function valor(c,clave){if(clave==="minimaAprobatoria")return `${c.minimaAprobatoria??80}%`;if(["periodoInicio","periodoFin"].includes(clave))return c[clave]?new Date(c[clave]).toLocaleDateString("es-MX"):"";if(clave==="registro")return c.instructorRegistro||"";if(clave==="horas")return `${c.horas??""} h`;if(clave==="nota")return `${c.nota??""}/100`;if(clave==="fecha")return new Date(c.fecha).toLocaleDateString("es-MX");return String(c[clave]??"");}
  async function generar(c,previa=false){
    if(!c.formato?.archivoId)throw new Error("Carga primero tu formato.");
    const documento=await base(await archivo(c.formato.archivoId));
    const fuente=await documento.embedFont(PDFLib.StandardFonts.Helvetica);
    for(const campo of c.formato.campos){
      if(!campo.visible)continue;
      const pagina=documento.getPage(campo.pagina-1);if(!pagina)throw new Error(`El campo ${nombres[campo.clave]} apunta a una página inexistente.`);
      const W=pagina.getWidth(),H=pagina.getHeight(),x=campo.x*W/100,ancho=campo.ancho*W/100,alto=campo.alto*H/100,arriba=H-campo.y*H/100;
      if(["firma","insignia","firmaResponsable","logo"].includes(campo.clave)){
        let dato=campo.clave==="insignia"?c.insigniaDetalle?.imagen:c[campo.clave];if(!dato)continue;
        if(dato.startsWith("data:image/webp")){const imagen=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error("No se pudo abrir la firma o insignia."));i.src=dato;});const canvas=document.createElement("canvas");canvas.width=imagen.width;canvas.height=imagen.height;canvas.getContext("2d").drawImage(imagen,0,0);dato=canvas.toDataURL("image/png");}
        const img=dato.startsWith("data:image/png;")?await documento.embedPng(dato):await documento.embedJpg(dato);
        const escala=Math.min(ancho/img.width,alto/img.height),w=img.width*escala,h=img.height*escala;
        const desplazamiento=campo.alineacion==="centro"?(ancho-w)/2:campo.alineacion==="derecha"?ancho-w:0;
        pagina.drawImage(img,{x:x+desplazamiento,y:arriba-h,width:w,height:h});continue;
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
        lineas.forEach((linea,i)=>{
          const w=fuente.widthOfTextAtSize(linea,tamano),dx=campo.alineacion==="centro"?(ancho-w)/2:campo.alineacion==="derecha"?ancho-w:0;
          pagina.drawText(linea,{x:x+dx,y:arriba-tamano-i*tamano*1.2,size:tamano,font:fuente,color:PDFLib.rgb(...rgb)});
        });
        continue;
      }
      const tamano=Math.min(campo.tamano,alto*.85,medida>ancho?campo.tamano*ancho/medida:campo.tamano);
      const w=fuente.widthOfTextAtSize(texto,tamano),desplazamiento=campo.alineacion==="centro"?(ancho-w)/2:campo.alineacion==="derecha"?ancho-w:0;
      const rgb=[1,3,5].map(n=>parseInt(campo.color.slice(n,n+2),16)/255);
      pagina.drawText(texto,{x:x+desplazamiento,y:arriba-tamano,size:tamano,font:fuente,color:PDFLib.rgb(...rgb)});
    }
    if(previa){const p=documento.getPage(0);p.drawText("VISTA PREVIA - SIN VALIDEZ",{x:12,y:12,size:9,font:fuente,color:PDFLib.rgb(.7,.1,.1)});}
    return documento.save();
  }
  async function descargar(c,previa=false){try{const bytes=await generar(c,previa);const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));const a=document.createElement("a");a.href=url;a.download=(c.folio||"constancia")+".pdf";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){window.CicsaToast?.mostrar(e.message,"error");}}
  return {nombres,ordenModelo,predeterminados,archivo,recordar,inspeccionar,generar,descargar};
})();
