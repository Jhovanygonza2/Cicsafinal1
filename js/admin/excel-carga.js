// Excel se descarga solo cuando se solicita importar o exportar un archivo.
(() => {
  let pendiente = null;
  window.cargarExcelCicsa = function () {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (pendiente) return pendiente;
    pendiente = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
      script.async = true;
      const fallo = () => {
        clearTimeout(limite);
        script.remove();
        reject(new Error("No se pudo cargar Excel. Revisa tu conexion e intenta de nuevo."));
      };
      const limite = setTimeout(fallo, 15000);
      script.onload = () => {
        clearTimeout(limite);
        if (window.XLSX) resolve(window.XLSX);
        else fallo();
      };
      script.onerror = fallo;
      document.head.appendChild(script);
    }).catch(error => { pendiente = null; throw error; });
    return pendiente;
  };
})();
