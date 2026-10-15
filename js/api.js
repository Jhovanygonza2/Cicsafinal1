/**
 * api.js — Cliente de API para CICSA Capacita
 * ---------------------------------------------------------------
 * Centraliza toda comunicación con el backend (Node/Express/MySQL).
 * Cambia MOCK_MODE a false cuando el backend esté corriendo, y
 * ajusta API_BASE a la URL real (ej. http://localhost:4000/api).
 *
 * Cobertura de requerimientos (trazabilidad):
 *  RF-001..005  auth.* / users.*
 *  RF-006..008  sesion.rol() controla qué botones/rutas se muestran
 *  RF-009..016  cursos.*
 *  RF-017..022  contenidos.*
 *  RF-023..029  progreso.*
 *  RF-030..036  evaluaciones.*
 *  RF-039..044  reportes.*
 *  RS-001..011  token en localStorage, expiración, roles en cada llamada
 * ---------------------------------------------------------------
 */
const API_BASE = "http://localhost:4000/api";
// Catalogos importados de INFO PLATFORMS.xlsx (2026-10-11).
const INFO_PLATFORMS = {
  "fuente": "INFO PLATFORMS.xlsx",
  "organizacion": [
    {
      "departamento": "Mantenimiento",
      "puesto": "Ayudante de Mec\u00e1nico (A, B, o C)"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "Carpintero"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "El\u00e9ctrico (A y B)"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "Hojalatero-Pintor"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "Jefe de Mantenimiento"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "Lavador"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "Mec\u00e1nico (A, B o C)"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "Soldador"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "Supervisor de Equipos Terrestres"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "Supervisor de Mantenimiento"
    },
    {
      "departamento": "Mantenimiento",
      "puesto": "Vulcanizador"
    },
    {
      "departamento": "Arrenmaq",
      "puesto": "Supervisor de \u00c1rea"
    },
    {
      "departamento": "Arrenmaq",
      "puesto": "Mec\u00e1nico General"
    },
    {
      "departamento": "Arrenmaq",
      "puesto": "Ayudante de Operador de Maquinaria Pesada"
    },
    {
      "departamento": "Arrenmaq",
      "puesto": "Ayudante de Mec\u00e1nico General"
    },
    {
      "departamento": "Arrenmaq",
      "puesto": "Auxiliar Administrativo"
    },
    {
      "departamento": "Arrenmaq",
      "puesto": "Operador de Maquinaria Pesada"
    },
    {
      "departamento": "Servicios y Procesos Especiales",
      "puesto": "Analista Operativo"
    },
    {
      "departamento": "Servicios y Procesos Especiales",
      "puesto": "Coordinador de Servicios y Procesos Especiales"
    },
    {
      "departamento": "Servicios y Procesos Especiales",
      "puesto": "Operador de Maquinaria y Equipos Pesados"
    },
    {
      "departamento": "Servicios y Procesos Especiales",
      "puesto": "T\u00e9cnico Operativo"
    },
    {
      "departamento": "Servicios y Procesos Especiales",
      "puesto": "Mec\u00e1nico"
    },
    {
      "departamento": "Servicios y Procesos Especiales",
      "puesto": "Jefe de Mec\u00e1nicos"
    },
    {
      "departamento": "Servicios y Procesos Especiales",
      "puesto": "Mec\u00e1nico Especialista"
    },
    {
      "departamento": "Servicios y Procesos Especiales",
      "puesto": "Ayudante de Mec\u00e1nico"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Jefe de Almac\u00e9n"
    },
    {
      "departamento": "Recursos Humanos",
      "puesto": "Coordinador de Recursos Humanos"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Jefe de Tesorer\u00eda"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Jefe de Contabilidad"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Analista de Cuentas por Cobrar"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Coordinador de Compras"
    },
    {
      "departamento": "Compras",
      "puesto": "Comprador"
    },
    {
      "departamento": "Licitaciones y Administraci\u00f3n de Contratos",
      "puesto": "Coordinador de Licitaciones y Administraci\u00f3n de Contratos"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Coordinador de Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo"
    },
    {
      "departamento": "Licitaciones y Administraci\u00f3n de Contratos",
      "puesto": "Analista Administrativo de Contratos"
    },
    {
      "departamento": "Licitaciones y Administraci\u00f3n de Contratos",
      "puesto": "Analista de Control de Proyectos y Documental"
    },
    {
      "departamento": "Licitaciones y Administraci\u00f3n de Contratos",
      "puesto": "Analista de Precios Unitarios"
    },
    {
      "departamento": "Licitaciones y Administraci\u00f3n de Contratos",
      "puesto": "Auxiliar de Administrador de Contratos"
    },
    {
      "departamento": "Licitaciones y Administraci\u00f3n de Contratos",
      "puesto": "Analista de Licitaciones y Contratos"
    },
    {
      "departamento": "Almac\u00e9n",
      "puesto": "Almacenista"
    },
    {
      "departamento": "Almac\u00e9n",
      "puesto": "Log\u00edstico"
    },
    {
      "departamento": "Almac\u00e9n",
      "puesto": "Auxiliar de Almac\u00e9n"
    },
    {
      "departamento": "Almac\u00e9n",
      "puesto": "Auxiliar de Almac\u00e9n Para\u00edso"
    },
    {
      "departamento": "Almac\u00e9n",
      "puesto": "Almacenista Para\u00edso"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Especialista en Automatizaci\u00f3n"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Ingeniero de Soporte e Infraestructura Jr"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Ingeniero de Proyectos"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Desarrollador Sr"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Desarrollador Jr"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Desarrollador en Entrenamiento"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Jefe de Soporte e Infraestructura"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Ingeniero de Soporte e Infraestructura en Entrenamiento"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Ingeniero de Ciberseguridad e Infraestructura Sr"
    },
    {
      "departamento": "Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo",
      "puesto": "Practicante de Tecnolog\u00eda, Innovaci\u00f3n y Desarrollo"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Analista Administrativo"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Analista de Cuentas por Pagar"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Analista de Activos Fijos"
    },
    {
      "departamento": "Equipos Terrestres",
      "puesto": "Coordinador de Equipos Terrestres"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Analista Contable"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Analista de Vi\u00e1ticos"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Tubero"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Soldador Especialista"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Tornero"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Ingeniero y Dise\u00f1o Jr."
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Ingeniero y Dise\u00f1o Sr."
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Soldador"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Maniobrista"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Analista de Fabricaci\u00f3n"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Ayudante de Soldador"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Ayudante de Tubero"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Cadista"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Supervisor de Campo"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Operador de Montacargas"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Operador de Tractocami\u00f3n"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Maniobrista"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Cabo de Maniobra"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Operador de Cargador Frontal"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Operador de Gr\u00faa"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Operador de Torton con Gr\u00faa Articulada"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Operador de Tractocami\u00f3n con Gr\u00faa Articulada"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Ayudante Operador de Torton con Gr\u00faa Articulada"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Ayudante Operador de Tractocami\u00f3n con Gr\u00faa Articulada"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Ayudante de Grua"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Ayudante de Cargador Frontal"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Supervisor de Operaciones y Log\u00edstica"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Auxiliar de Combustible"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "T\u00e9cnico Operativo Especialista"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Jefe de Operaciones y Log\u00edstica"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Representante T\u00e9cnico"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Supervisor Operativo Especialista"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Intendencia Carmen"
    },
    {
      "departamento": "QHSE",
      "puesto": "Responsable de SSPA Carmen"
    },
    {
      "departamento": "QHSE",
      "puesto": "Auxiliar de Inspector de Calidad"
    },
    {
      "departamento": "QHSE",
      "puesto": "Param\u00e9dico Carmen"
    },
    {
      "departamento": "QHSE",
      "puesto": "Supervisor de SSPA Carmen"
    },
    {
      "departamento": "QHSE",
      "puesto": "Lider QHSE Carmen"
    },
    {
      "departamento": "QHSE",
      "puesto": "Inspector de Calidad"
    },
    {
      "departamento": "QHSE",
      "puesto": "Lider QHSE Para\u00edso"
    },
    {
      "departamento": "QHSE",
      "puesto": "Intendencia Para\u00edso"
    },
    {
      "departamento": "QHSE",
      "puesto": "Supervisor de SSPA Para\u00edso"
    },
    {
      "departamento": "QHSE",
      "puesto": "Responsable de SSPA Para\u00edso"
    },
    {
      "departamento": "QHSE",
      "puesto": "Param\u00e9dico Para\u00edso"
    },
    {
      "departamento": "QHSE",
      "puesto": "Vigilante"
    },
    {
      "departamento": "QHSE",
      "puesto": "M\u00e9dico de Salud Ocupacional"
    },
    {
      "departamento": "Logistica (Operaciones y log\u00edstica)",
      "puesto": "Operador de Transporte de Personal"
    },
    {
      "departamento": "Administraci\u00f3n y Finanzas",
      "puesto": "Gerente de Administraci\u00f3n y Finanzas"
    },
    {
      "departamento": "Direcci\u00f3n",
      "puesto": "Asistente de Direcci\u00f3n"
    },
    {
      "departamento": "QHSE",
      "puesto": "Coordinador de QHSE"
    },
    {
      "departamento": "Fabricaci\u00f3n",
      "puesto": "Gerente de Fabricaci\u00f3n"
    },
    {
      "departamento": "Servicios y Procesos Especiales",
      "puesto": "Gerente de Servicios y Procesos Especiales"
    },
    {
      "departamento": "Recursos Humanos",
      "puesto": "Analista de Capacitaci\u00f3n y Desarrollo"
    },
    {
      "departamento": "Recursos Humanos",
      "puesto": "Analista de N\u00f3mina"
    },
    {
      "departamento": "Recursos Humanos",
      "puesto": "Analista de Reclutamiento y Selecci\u00f3n"
    },
    {
      "departamento": "Recursos Humanos",
      "puesto": "Analista Jur\u00eddico"
    },
    {
      "departamento": "Recursos Humanos",
      "puesto": "Especialista de RH"
    },
    {
      "departamento": "Recursos Humanos",
      "puesto": "Analista Operativo de RH"
    },
    {
      "departamento": "Procura",
      "puesto": "Coordinador de Procura"
    }
  ],
  "categorias": [
    "Seguridad",
    "Medio Ambiente",
    "Calidad y Sistemas de Gesti\u00f3n",
    "T\u00e9cnica y Operativa",
    "Desarrollo Humano y Liderazgo",
    "Administraci\u00f3n y Finanzas",
    "Recursos Humanos",
    "Compras, Procura y Log\u00edstica",
    "Tecnolog\u00eda y Competencias Digitales",
    "Cumplimiento Legal y Normativo",
    "Servicio al Cliente y Gesti\u00f3n Comercial",
    "Inducci\u00f3n y Cultura Organizacional"
  ],
  "preguntas": [
    {
      "texto": "La informaci\u00f3n se present\u00f3 de manera clara y comprensible.",
      "seccion": "Contenido"
    },
    {
      "texto": "El contenido fue relevante para el objetivo del curso.",
      "seccion": "Contenido"
    },
    {
      "texto": "La informaci\u00f3n estuvo organizada de forma l\u00f3gica y f\u00e1cil de seguir.",
      "seccion": "Contenido"
    },
    {
      "texto": "Los videos, im\u00e1genes, textos o recursos utilizados facilitaron mi comprensi\u00f3n.",
      "seccion": "Material did\u00e1ctico"
    },
    {
      "texto": "La narraci\u00f3n, cuando estuvo presente, fue clara y f\u00e1cil de seguir.",
      "seccion": "Material did\u00e1ctico"
    },
    {
      "texto": "La duraci\u00f3n del curso fue adecuada para el contenido presentado.",
      "seccion": "Material did\u00e1ctico"
    },
    {
      "texto": "El curso me ayud\u00f3 a comprender nuevos conocimientos o reforzar los que ya ten\u00eda.",
      "seccion": "Aprendizaje y aplicaci\u00f3n"
    },
    {
      "texto": "Puedo aplicar lo aprendido en mis actividades laborales.",
      "seccion": "Aprendizaje y aplicaci\u00f3n"
    },
    {
      "texto": "En general, estoy satisfecho con este curso.",
      "seccion": "Satisfacci\u00f3n general"
    },
    {
      "texto": "Me gust\u00f3 el curso.",
      "seccion": "Satisfacci\u00f3n general"
    }
  ],
  "insignias": [
    {
      "id": "info-curso-1",
      "nombre": "Primer paso",
      "descripcion": "Completar el curso de Bienvenida institucional al 100 %.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "otorgamiento": {
        "tipo": "nombre",
        "valor": "Bienvenida institucional"
      }
    },
    {
      "id": "info-curso-2",
      "nombre": "Guardi\u00e1n de la Seguridad",
      "descripcion": "Completar un curso espec\u00edfico de Seguridad que tenga asignada esta insignia.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "otorgamiento": {
        "tipo": "asignacion"
      }
    },
    {
      "id": "info-curso-3",
      "nombre": "Escudo de Seguridad",
      "descripcion": "Completar curso de Seguridad.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "otorgamiento": {
        "tipo": "categoria",
        "valor": "Seguridad"
      }
    },
    {
      "id": "info-curso-4",
      "nombre": "Aliado del Medio Ambiente",
      "descripcion": "Completar curso de Medio Ambiente.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "otorgamiento": {
        "tipo": "categoria",
        "valor": "Medio Ambiente"
      }
    },
    {
      "id": "info-curso-5",
      "nombre": "Embajador de la Calidad",
      "descripcion": "Completar curso de Calidad y Sistemas de Gesti\u00f3n.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "otorgamiento": {
        "tipo": "categoria",
        "valor": "Calidad y Sistemas de Gesti\u00f3n"
      }
    },
    {
      "id": "info-curso-6",
      "nombre": "Experto Operativo",
      "descripcion": "Completar curso T\u00e9cnica y Operativa asignada.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "otorgamiento": {
        "tipo": "categoria",
        "valor": "T\u00e9cnica y Operativa"
      }
    },
    {
      "id": "info-curso-7",
      "nombre": "L\u00edder en Desarrollo",
      "descripcion": "Completar curso de Desarrollo Humano y Liderazgo.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "otorgamiento": {
        "tipo": "categoria",
        "valor": "Desarrollo Humano y Liderazgo"
      }
    },
    {
      "id": "info-curso-8",
      "nombre": "Talento Digital",
      "descripcion": "Completar curso de Tecnolog\u00eda y Competencias Digitales.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "otorgamiento": {
        "tipo": "categoria",
        "valor": "Tecnolog\u00eda y Competencias Digitales"
      }
    },
    {
      "id": "info-trayectoria-1",
      "nombre": "Aprendiz Constante",
      "descripcion": "Completar 5 cursos.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "regla": {
        "tipo": "cursos",
        "umbral": 5,
        "inclusivo": true
      }
    },
    {
      "id": "info-trayectoria-2",
      "nombre": "Explorador del Conocimiento",
      "descripcion": "Completar 10 cursos.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "regla": {
        "tipo": "cursos",
        "umbral": 10,
        "inclusivo": true
      }
    },
    {
      "id": "info-trayectoria-3",
      "nombre": "Coleccionista de Conocimientos",
      "descripcion": "Completar 20 cursos.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "regla": {
        "tipo": "cursos",
        "umbral": 20,
        "inclusivo": true
      }
    },
    {
      "id": "info-trayectoria-4",
      "nombre": "Embajador del Aprendizaje",
      "descripcion": "Completar 30 cursos.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "regla": {
        "tipo": "cursos",
        "umbral": 30,
        "inclusivo": true
      }
    },
    {
      "id": "info-trayectoria-5",
      "nombre": "Excelencia Formativa",
      "descripcion": "Aprobar 10 evaluaciones con la calificaci\u00f3n requerida.",
      "imagen": "",
      "activa": true,
      "puntos": 0,
      "cursoIds": [],
      "regla": {
        "tipo": "evaluaciones",
        "umbral": 10,
        "inclusivo": true
      }
    }
  ]
};

const MOCK_MODE = true; // TODO: poner en false al conectar el backend real

function obtenerRutaLogin() {
  const rutaActual = window.location.pathname || "/";
  return rutaActual.includes("/admin/") || rutaActual.includes("/trabajador/") || rutaActual.includes("/instructor/") ? "../index.html" : "index.html";
}

function navegarALogin() {
  window.location.replace(obtenerRutaLogin());
}

// ---------------------------------------------------------------
// Sesión (RS-001, RS-005, RS-006, RS-007)
// ---------------------------------------------------------------
const sesion = {
  guardar(token, usuario) {
    localStorage.setItem("cicsa_token", token);
    localStorage.setItem("cicsa_usuario", JSON.stringify(usuario));
    localStorage.setItem("cicsa_ultima_actividad", Date.now().toString());
  },
  usuario() {
    const raw = localStorage.getItem("cicsa_usuario");
    if (!raw) return null;
    try {
      const usuario = JSON.parse(raw);
      return usuario && typeof usuario === "object" ? usuario : null;
    } catch (error) {
      console.warn("La sesión almacenada no es válida.", error);
      return null;
    }
  },
  token() {
    return localStorage.getItem("cicsa_token");
  },
  rol() {
    const u = sesion.usuario();
    return u ? u.rol : null;
  },
  activa() {
    const usuario = sesion.usuario();
    return !!sesion.token() && !!usuario?.id && ["superadmin", "admin", "instructor", "trabajador"].includes(usuario.rol);
  },
  marcarActividad() {
    localStorage.setItem("cicsa_ultima_actividad", Date.now().toString());
  },
  cerrar(motivo = "cierre_manual") {
    window.CicsaToast?.alNavegar(motivo === "inactividad" ? "Tu sesión se cerró por inactividad." : motivo === "expirada" ? "Tu sesión venció. Inicia sesión nuevamente." : "Sesión cerrada.", motivo === "cierre_manual" ? "info" : "advertencia");
    enviarPulsoUso("cerrar", motivo);
    localStorage.removeItem("cicsa_token");
    localStorage.removeItem("cicsa_usuario");
    localStorage.removeItem("cicsa_ultima_actividad");
    navegarALogin();
  },
  /** RS-006: cierre por inactividad configurable (minutos) */
  vigilarInactividad(minutos = 20) {
    const limite = minutos * 60 * 1000;
    const identidadUso = sesion.token();
    enviarPulsoUso();
    let registroUso = localStorage.getItem("cicsa_sesion_uso");
    const mismaSesion = () => sesion.token() === identidadUso && localStorage.getItem("cicsa_sesion_uso") === registroUso;
    let ultimaActividadPorScroll = 0;
    const registrarActividadPorScroll = () => {
      if (!mismaSesion()) return;
      const ahora = Date.now();
      if (ahora - ultimaActividadPorScroll < 1000) return;
      ultimaActividadPorScroll = ahora;
      sesion.marcarActividad();
    };
    setInterval(() => {
      if (!mismaSesion()) return;
      const ultima = Number(localStorage.getItem("cicsa_ultima_actividad") || 0);
      if (sesion.activa() && Date.now() - ultima > limite) {
        sesion.cerrar("inactividad");

      } else {
        enviarPulsoUso();
        registroUso = localStorage.getItem("cicsa_sesion_uso");
      }
    }, 30000);
    ["click", "keydown"].forEach((ev) => window.addEventListener(ev, () => { if (mismaSesion()) sesion.marcarActividad(); }));
    window.addEventListener("scroll", registrarActividadPorScroll, { passive: true });
  },
  /** RF-003 / RS-007: protege una página según los roles permitidos */
  requerir(rolesPermitidos) {
    if (!sesion.activa()) {
      window.CicsaToast?.alNavegar("Inicia sesión para continuar.", "advertencia");
      navegarALogin();
      return false;
    }
    if (rolesPermitidos && sesion.rol() !== "superadmin" && !rolesPermitidos.includes(sesion.rol())) {
      window.CicsaToast?.alNavegar("No tienes permisos para acceder a este apartado.", "error");
      navegarALogin();
      return false;
    }
    return true;
  },
};

// ---------------------------------------------------------------
// Fetch envoltorio con token automático
// ---------------------------------------------------------------
async function solicitar(metodo, ruta, cuerpo) {
  try {
    const respuesta = await solicitarDatos(metodo, ruta, cuerpo);
    if (MOCK_MODE) notificarCambiosApartados(metodo, ruta, cuerpo, respuesta);
    const avisos = typeof window !== "undefined" ? window.CicsaToast : null;
    if (avisos) {
      if (ruta === "/auth/olvide-password") avisos.mostrar("Solicitud de recuperación enviada.", "exito");
      else if (ruta === "/auth/restablecer-password") avisos.mostrar("Contraseña actualizada.", "exito");
      else if (metodo === "PATCH" && /\/asignacion$/.test(ruta)) avisos.mostrar("Curso asignado correctamente.", "exito");
      else if (metodo === "POST" && /\/progreso\/leccion\/.*\/completar$/.test(ruta)) avisos.mostrar("Lección completada. Progreso guardado.", "exito");
      else if (metodo === "POST" && /\/intento$/.test(ruta)) avisos.mostrar(respuesta.aprobado ? "Respuestas enviadas. Evaluación aprobada." : "Respuestas enviadas. Consulta tu resultado.", respuesta.aprobado ? "exito" : "info");
      else if (metodo === "POST" && ruta === "/soporte") avisos.mostrar(cuerpo?.tipo === "repetir" ? "Solicitud de nuevo intento enviada." : "Solicitud de soporte enviada.", "exito");
      else if (metodo === "PATCH" && ruta.startsWith("/soporte/")) avisos.mostrar(cuerpo?.estado === "resuelto" ? "Caso resuelto." : "Respuesta de soporte guardada.", "exito");
      else if (metodo === "DELETE" && ruta.startsWith("/notificaciones-admin")) avisos.mostrar("Notificación eliminada.", "exito");
    }
    return respuesta;
  } catch (error) {
    // Los fallos del endpoint opcional de agenda se resuelven con su catálogo alternativo.
    if (ruta !== "/agenda/cursos" && !ruta.startsWith("/sesiones")) {
      window.CicsaToast?.mostrar(error.message || "No se pudo completar la solicitud.", "error", {intervalo:60000});
    }
    throw error;
  }
}
// Incluye la recepción del cuerpo de la respuesta dentro del límite de espera.
const TIEMPO_LIMITE_API_MS = 15000;
async function conLimiteDeEspera(ejecutar) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_API_MS);
  try {
    return await ejecutar(controlador.signal);
  } catch (error) {
    if (controlador.signal.aborted) {
      throw new Error("El servidor tardó demasiado en responder. Intenta de nuevo.");
    }
    throw error;
  } finally {
    clearTimeout(temporizador);
  }
}
async function solicitarDatos(metodo, ruta, cuerpo) {
  if (MOCK_MODE) {
    const respuesta = await simularSolicitud(metodo, ruta, cuerpo);
    // Copia la respuesta sin serializar videos e imágenes grandes como texto JSON.
    if(respuesta==null)return respuesta;
    if(typeof structuredClone==="function"){
      const copia=structuredClone(respuesta),pendientes=[copia],vistos=new Set();
      while(pendientes.length){
        const actual=pendientes.pop();
        if(!actual||typeof actual!=="object"||vistos.has(actual))continue;
        vistos.add(actual);
        for(const clave of Object.keys(actual)){
          if((clave==="password"&&sesion.rol()!=="superadmin")||(clave==="historialVersiones"&&sesion.rol()==="trabajador"))delete actual[clave];
          else if(actual[clave]&&typeof actual[clave]==="object")pendientes.push(actual[clave]);
        }
      }
      return copia;
    }
    // Compatibilidad con navegadores antiguos.
    return JSON.parse(JSON.stringify(respuesta,(clave,valor)=>(clave==="password"&&sesion.rol()!=="superadmin")||(clave==="historialVersiones"&&sesion.rol()==="trabajador")?undefined:valor));
  }

  return conLimiteDeEspera(async signal => {
    const res = await fetch(`${API_BASE}${ruta}`, {
      signal,
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        ...(sesion.token() ? { Authorization: `Bearer ${sesion.token()}` } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    if (res.status === 401 && !ruta.startsWith("/auth/")) {
      sesion.cerrar("expirada");
      throw new Error("Sesión expirada");
    }
    if (res.status === 403) {
      throw new Error("No tienes permisos para realizar esta acción.");
    }
    if (!res.ok) {
      let mensaje = "No se pudo completar la solicitud.";
      try {
        const err = await res.json();
        mensaje = err.mensaje || err.message || mensaje;
      } catch (error) {
        if (res.status >= 500) mensaje = "El servidor no está disponible. Intenta más tarde.";
      }
      throw new Error(mensaje);
    }
    return res.status === 204 ? null : await res.json();
  });
}

// ---------------------------------------------------------------
// Datos simulados (usados mientras MOCK_MODE = true)
// ---------------------------------------------------------------
const DB = {
  usuarios: [],
  solicitudesRestablecimiento: [
  ],
  notificacionesAdmin: [],
  puestos: [],
  cursos: [],
  progreso: {},
  evaluacionesResultado: [],
  contenidoLecciones: {},
  evaluaciones: {},
};

// Identidades de las muestras antiguas; nunca se elimina solo por ID.
const CURSOS_DEMO_ANTERIORES = new Map([
  ["1", "Seguridad e Higiene Industrial"],
  ["2", "Atención al Cliente"],
  ["3", "Uso de Sistemas Internos"],
  ["4", "Soldador Industrial"],
  ["5", "Prevención y control de incendios"],
]);
function limpiarCursosDemo() {
  if (!MOCK_MODE || localStorage.getItem("cicsa_limpieza_cursos_demo") === "v1") return;
  const catalogo = cargarDatosPersistidos("cicsa_cursos", []);
  const esDemo = c => CURSOS_DEMO_ANTERIORES.get(String(c.id)) === c.nombre ||
    (/^\[TEST\] Uso de la plataforma - (publicado|pendiente|rechazado|borrador)$/.test(c.nombre || "") &&
      c.descripcion === "Contenido ficticio para probar navegación, avance, evaluaciones y revisión de cursos.");
  const eliminados = catalogo.filter(esDemo);
  const conservados = catalogo.filter(c => !esDemo(c));
  const idsConservados = new Set(conservados.map(c => String(c.id)));
  const ids = new Set(eliminados.map(c => String(c.id)));
  // Incluye residuos de muestras retiradas por la antigua migración del catálogo.
  for (const id of CURSOS_DEMO_ANTERIORES.keys()) if (!idsConservados.has(id)) ids.add(id);
  const nombres = new Set([...CURSOS_DEMO_ANTERIORES.values(), ...eliminados.map(c => c.nombre)]);
  for (const c of conservados) nombres.delete(c.nombre);
  const conservar = r => r.cursoId != null ? !ids.has(String(r.cursoId)) : !nombres.has(r.curso);
  for (const avances of Object.values(DB.progreso)) {
    for (const id of ids) delete avances[id];
  }
  for (const id of ids) delete DB.evaluaciones[id];
  DB.evaluacionesResultado = DB.evaluacionesResultado.filter(conservar);
  DB.notificacionesAdmin = DB.notificacionesAdmin.filter(conservar);
  for (const clave of ["cicsa_constancias_emitidas", "cicsa_encuestas_instructor", "cicsa_insignias_otorgadas", "cicsa_soporte"]) {
    if (localStorage.getItem(clave) !== null) guardarDatosPersistidos(clave, cargarDatosPersistidos(clave, []).filter(conservar));
  }
  const claves = Array.from({length: localStorage.length}, (_, i) => localStorage.key(i));
  for (const clave of claves) {
    const coincidencia = /^(?:cicsa_temporizador_|cicsa_consumo_v1_)[^_]+_([^_]+)(?:_|$)/.exec(clave || "");
    if (coincidencia && ids.has(coincidencia[1])) localStorage.removeItem(clave);
  }
  guardarDatosPersistidos("cicsa_progreso", DB.progreso);
  guardarDatosPersistidos("cicsa_evaluaciones", DB.evaluaciones);
  guardarDatosPersistidos("cicsa_evaluaciones_resultado", DB.evaluacionesResultado);
  guardarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
  guardarDatosPersistidos("cicsa_cursos", conservados);
  localStorage.setItem("cicsa_limpieza_cursos_demo", "v1");
}

function cargarDatosPersistidos(clave, valorInicial) {
  const guardado = localStorage.getItem(clave);
  if (!guardado) return valorInicial;
  try {
    const datos = JSON.parse(guardado);
    return Array.isArray(datos) ? datos : valorInicial;
  } catch (error) {
    console.warn(`No se pudieron cargar los datos persistidos: ${clave}`, error);
    return valorInicial;
  }
}

function guardarDatosPersistidos(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
  } catch (error) {
    // El almacenamiento local (localStorage) tiene un límite de unos 5 MB por
    // sitio. Las imágenes y videos ya no se guardan aquí en base64 (van a
    // IndexedDB), pero este límite se conserva como red de seguridad por si
    // el resto de los datos guardados crece demasiado.
    if (error && (error.name === "QuotaExceededError" || error.code === 22 || error.code === 1014)) {
      throw new Error(
        "No se pudo guardar: se alcanzó el límite de almacenamiento del navegador. " +
        "Elimina datos que ya no necesites e inténtalo de nuevo."
      );
    }
    throw error;
  }
}
function cargarObjetoPersistido(clave, valorInicial) {
  const guardado = localStorage.getItem(clave);
  if (!guardado) return valorInicial;
  try {
    const datos = JSON.parse(guardado);
    return datos && typeof datos === "object" && !Array.isArray(datos) ? datos : valorInicial;
  } catch (error) {
    console.warn(`No se pudieron cargar los datos persistidos: ${clave}`, error);
    return valorInicial;
  }
}

// ---- Almacenamiento de imágenes/videos en IndexedDB ----
// localStorage tiene un límite de unos 5 MB por sitio, así que las imágenes y
// videos (guardados como base64) se guardan aparte en IndexedDB, que admite
// archivos mucho más pesados. En localStorage solo queda una referencia corta
// (por ejemplo "idb:media:curso-3-video") en vez del archivo completo.
const PREFIJO_MEDIA_IDB = "idb:media:";
let promesaBaseMedia = null;

function abrirBaseMedia() {
  if (promesaBaseMedia) return promesaBaseMedia;
  promesaBaseMedia = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB no está disponible en este navegador."));
      return;
    }
    const solicitud = indexedDB.open("cicsa_media", 1);
    solicitud.onupgradeneeded = () => {
      if (!solicitud.result.objectStoreNames.contains("archivos")) {
        solicitud.result.createObjectStore("archivos", { keyPath: "id" });
      }
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error || new Error("No se pudo abrir el almacenamiento de archivos."));
  });
  return promesaBaseMedia;
}

async function guardarArchivoMedia(id, dataUrl) {
  const baseDatos = await abrirBaseMedia();
  return new Promise((resolve, reject) => {
    const transaccion = baseDatos.transaction("archivos", "readwrite");
    transaccion.objectStore("archivos").put({ id, dataUrl });
    transaccion.oncomplete = () => resolve();
    transaccion.onerror = () => reject(transaccion.error || new Error("No se pudo guardar el archivo."));
  });
}

async function obtenerArchivoMedia(id) {
  const baseDatos = await abrirBaseMedia();
  return new Promise((resolve, reject) => {
    const transaccion = baseDatos.transaction("archivos", "readonly");
    const solicitud = transaccion.objectStore("archivos").get(id);
    solicitud.onsuccess = () => resolve(solicitud.result ? solicitud.result.dataUrl : "");
    solicitud.onerror = () => reject(solicitud.error || new Error("No se pudo leer el archivo."));
  });
}

function esDataUrl(valor) {
  return typeof valor === "string" && valor.startsWith("data:");
}

function esReferenciaMediaIdb(valor) {
  return typeof valor === "string" && valor.startsWith(PREFIJO_MEDIA_IDB);
}

// Recorre un curso clonado y, por cada campo con una imagen/video en base64,
// lo guarda en IndexedDB y deja en su lugar una referencia corta. El objeto
// `curso` original (en memoria) nunca se toca, así que la app sigue viendo
// las URLs reales sin ningún cambio en el código que las pinta en pantalla.
async function extraerMediaParaGuardar(cursoOriginal) {
  const curso = typeof structuredClone==="function"?structuredClone(cursoOriginal):JSON.parse(JSON.stringify(cursoOriginal));
  const tareas = [];
  const extraerCampo = (objeto, campo, id) => {
    if (!objeto || !esDataUrl(objeto[campo])) return;
    const valor = objeto[campo];
    tareas.push(
      guardarArchivoMedia(id, valor).then(() => {
        objeto[campo] = PREFIJO_MEDIA_IDB + id;
      })
    );
  };
  extraerCampo(curso, "thumbnail", `curso-${curso.id}-portada`);
  extraerCampo(curso, "video", `curso-${curso.id}-video`);
  (curso.modulos || []).forEach((modulo, indiceModulo) => {
    extraerCampo(modulo, "imagen", `curso-${curso.id}-m${indiceModulo}-imagen`);
    extraerCampo(modulo, "image", `curso-${curso.id}-m${indiceModulo}-image`);
    extraerCampo(modulo, "video", `curso-${curso.id}-m${indiceModulo}-video`);
    const gruposSubtemas = modulo.temas
      ? modulo.temas.map((tema, indiceTema) => ({ tema, subtemas: tema.subtemas || [], indiceTema }))
      : [{ tema: null, subtemas: modulo.lecciones || [], indiceTema: 0 }];
    gruposSubtemas.forEach(({ tema, subtemas, indiceTema }) => {
      if (tema) {
        extraerCampo(tema, "imagen", `curso-${curso.id}-m${indiceModulo}-t${indiceTema}-imagen`);
        extraerCampo(tema, "image", `curso-${curso.id}-m${indiceModulo}-t${indiceTema}-image`);
        extraerCampo(tema, "video", `curso-${curso.id}-m${indiceModulo}-t${indiceTema}-video`);
      }
      subtemas.forEach((subtema, indiceSubtema) => {
        extraerCampo(
          subtema,
          "url",
          `curso-${curso.id}-m${indiceModulo}-t${indiceTema}-s${indiceSubtema}`
        );
      });
    });
  });
  await Promise.all(tareas);
  return curso;
}

// Operación inversa: reemplaza cada referencia "idb:media:<id>" por el
// archivo real guardado en IndexedDB, para que el curso en memoria siempre
// tenga URLs directamente utilizables (data URLs, http o rutas relativas).
async function resolverMediaAlCargar(cursoOriginal, { soloImagenes = false } = {}) {
  const curso = cursoOriginal;
  const tareas = [];
  const resolverCampo = (objeto, campo) => {
    if (soloImagenes && campo !== "thumbnail") return;
    if (!objeto || !esReferenciaMediaIdb(objeto[campo])) return;
    const id = objeto[campo].slice(PREFIJO_MEDIA_IDB.length);
    tareas.push(
      obtenerArchivoMedia(id).then((dataUrl) => {
        objeto[campo] = dataUrl || "";
      })
    );
  };
  resolverCampo(curso, "thumbnail");
  resolverCampo(curso, "video");
  (curso.modulos || []).forEach((modulo) => {
    resolverCampo(modulo, "imagen");
    resolverCampo(modulo, "image");
    resolverCampo(modulo, "video");
    const gruposSubtemas = modulo.temas
      ? modulo.temas.map((tema) => ({ tema, subtemas: tema.subtemas || [] }))
      : [{ tema: null, subtemas: modulo.lecciones || [] }];
    gruposSubtemas.forEach(({ tema, subtemas }) => {
      if (tema) {
        resolverCampo(tema, "imagen");
        resolverCampo(tema, "image");
        resolverCampo(tema, "video");
      }
      subtemas.forEach((subtema) => resolverCampo(subtema, "url"));
    });
  });
  await Promise.all(tareas);
  return curso;
}

async function guardarCursosPersistidos(cursos) {
  const cursosParaGuardar = await Promise.all(cursos.map((curso) => extraerMediaParaGuardar(curso)));
  guardarDatosPersistidos("cicsa_cursos", cursosParaGuardar);
}

async function cargarCursosPersistidos(valorInicial) {
  // Mantiene video y documentos como referencias a IndexedDB. Resolverlos
  // aquí haría que cada pantalla cargara todos los archivos de todos los cursos.
  return cargarDatosPersistidos("cicsa_cursos", valorInicial);
}

function clonarCurso(curso) {
  return typeof structuredClone === "function"
    ? structuredClone(curso)
    : JSON.parse(JSON.stringify(curso));
}

async function cargarCursosConMiniaturas(cursos) {
  const resultado = cursos.map(clonarCurso);
  await Promise.all(resultado.map((curso) => resolverMediaAlCargar(curso, { soloImagenes: true })));
  return resultado;
}

DB.usuarios = cargarDatosPersistidos("cicsa_usuarios", DB.usuarios);
DB.progreso = cargarObjetoPersistido("cicsa_progreso", DB.progreso);

DB.solicitudesRestablecimiento = cargarDatosPersistidos(
  "cicsa_solicitudes_restablecimiento",
  DB.solicitudesRestablecimiento
);
DB.notificacionesAdmin = cargarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
DB.evaluacionesResultado = cargarDatosPersistidos("cicsa_evaluaciones_resultado", DB.evaluacionesResultado).map((resultado) => ({
  ...resultado,
  // Los registros antiguos no guardaban el tipo; se consideran examen final
  // para no mostrarlos incorrectamente como evaluación inicial.
  tipo: String(resultado.tipo || "examen").toLowerCase() === "evaluacion" ? "evaluacion" : "examen",
}));
// Limpieza única de cuentas demo y sus datos asociados.
const versionLimpiezaUsuarios = "cuentas-demo-v1";
if (MOCK_MODE && localStorage.getItem("cicsa_limpieza_usuarios") !== versionLimpiezaUsuarios) {
  const demo = [
    { id: 1, correo: "ana.torres@cicsa.mx", nombre: "Ana Torres" },
    { id: 2, correo: "jhovany@cicsa.mx", nombre: "Jhovany Gonzales" },
    { id: 3, correo: "maria.lopez@cicsa.mx", nombre: "Maria Fernanda Lopez" },
    { id: 4, correo: "carlos.ramirez@cicsa.mx", nombre: "Carlos Ramirez" },
    { id: 5, correo: "daniela.cruz@cicsa.mx", nombre: "Daniela Cruz" },
    { id: 6, correo: "roberto.mendez@cicsa.mx", nombre: "Roberto Mendez" },
  ];
  const esDemo = (u) => demo.some(d => String(d.id) === String(u.id) && d.correo === String(u.correo || "").toLowerCase());
  const ids = new Set(demo.filter(d => !DB.usuarios.some(u => String(u.id) === String(d.id) && !esDemo(u))).map(d => String(d.id)));
  const nombres = new Set(demo.filter(d => !DB.usuarios.some(u => u.nombre === d.nombre && !esDemo(u))).map(d => d.nombre));
  const conservarRegistro = (r) => r.usuarioId != null ? !ids.has(String(r.usuarioId)) : !nombres.has(r.usuario);
  DB.usuarios = DB.usuarios.filter(u => !esDemo(u));
  for (const id of ids) delete DB.progreso[id];
  DB.evaluacionesResultado = DB.evaluacionesResultado.filter(conservarRegistro);
  DB.solicitudesRestablecimiento = DB.solicitudesRestablecimiento.filter(conservarRegistro);
  DB.notificacionesAdmin = DB.notificacionesAdmin.filter(conservarRegistro);
  guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
  guardarDatosPersistidos("cicsa_progreso", DB.progreso);
  guardarDatosPersistidos("cicsa_evaluaciones_resultado", DB.evaluacionesResultado);
  guardarDatosPersistidos("cicsa_solicitudes_restablecimiento", DB.solicitudesRestablecimiento);
  guardarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
  for (const clave of Object.keys(localStorage)) {
    if ([...ids].some(id => clave.startsWith("cicsa_temporizador_" + id + "_"))) localStorage.removeItem(clave);
  }
  if (sesion.usuario() && esDemo(sesion.usuario())) {
    ["cicsa_token", "cicsa_usuario", "cicsa_ultima_actividad"].forEach(clave => localStorage.removeItem(clave));
  }
  localStorage.setItem("cicsa_limpieza_usuarios", versionLimpiezaUsuarios);
}

// Cuentas de acceso solicitadas; se configuran una sola vez por navegador.
if (MOCK_MODE && localStorage.getItem("cicsa_cuentas_acceso") !== "v1") {
  const cuentas = [
    { nombre: "Jhovany", usuarioLogin: "jhovany", correo: "jhovany@cicsa.mx", password: "Cicsa2026", rol: "trabajador" },
    { nombre: "ana", usuarioLogin: "ana", correo: "ana@cicsa.mx", password: "Admin2026", rol: "admin" },
  ];
  for (const cuenta of cuentas) {
    const existente = DB.usuarios.find(u => String(u.correo || "").toLowerCase() === cuenta.correo);
    if (existente) Object.assign(existente, cuenta, { activo: true });
    else DB.usuarios.push({ id: Math.max(6, ...DB.usuarios.map(u => Number(u.id) || 0)) + 1, area: "Sin asignar", ultimoAcceso: null, activo: true, ...cuenta });
  }
  guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
  localStorage.setItem("cicsa_cuentas_acceso", "v1");
}

// Cuentas adicionales: migración independiente para no restablecer las existentes.
if (MOCK_MODE && localStorage.getItem("cicsa_cuentas_roles_demo") !== "v1") {
  const cuentas = [
    { nombre: "Administrador demo", usuarioLogin: "administrador", correo: "administrador@cicsa.mx", password: "AdminDemo2026", rol: "admin" },
    { nombre: "Mateo Alejandro Morales Castro", usuarioLogin: "instructor", correo: "instructor@cicsa.mx", password: "Instructor2026", rol: "instructor" },
  ];
  for (const cuenta of cuentas) {
    const existente = DB.usuarios.some(u =>
      [u.correo, u.usuarioLogin].some(valor =>
        [cuenta.correo, cuenta.usuarioLogin].includes(String(valor || "").toLowerCase())
      )
    );
    if (!existente) DB.usuarios.push({
      id: Math.max(6, ...DB.usuarios.map(u => Number(u.id) || 0)) + 1,
      area: "Capacitación", ultimoAcceso: null, activo: true, ...cuenta
    });
  }
  guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
  localStorage.setItem("cicsa_cuentas_roles_demo", "v1");
}

// Actualiza también la cuenta ya guardada en navegadores existentes.
if (MOCK_MODE && localStorage.getItem("cicsa_nombre_cuenta_instructor") !== "v1") {
  const instructor = DB.usuarios.find(u => u.rol === "instructor" && u.correo === "instructor@cicsa.mx");
  if (instructor) {
    instructor.nombre = "Mateo Alejandro Morales Castro";
    guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
    const actual = sesion.usuario();
    if (actual?.id === instructor.id) localStorage.setItem("cicsa_usuario", JSON.stringify({ ...actual, nombre: instructor.nombre }));
    localStorage.setItem("cicsa_nombre_cuenta_instructor", "v1");
  }
}

if (MOCK_MODE && localStorage.getItem("cicsa_roles_v2") !== "1") {
  const propietaria = DB.usuarios.find(u => u.correo === "ana@cicsa.mx");
  if (propietaria && !DB.usuarios.some(u => u.rol === "superadmin" && u.activo)) {
    propietaria.rol = "superadmin";
    guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
    if (sesion.usuario()?.id === propietaria.id) sesion.guardar(sesion.token(), { id: propietaria.id, nombre: propietaria.nombre, correo: propietaria.correo, rol: propietaria.rol });
  }
  localStorage.setItem("cicsa_roles_v2", "1");
}
// Cuentas oficiales solicitadas para la plataforma CICSA. Se aplica una sola vez por navegador.
// La sustitución de cuentas no elimina los cursos ni las demás funciones del sistema.
if (MOCK_MODE && localStorage.getItem("cicsa_cuentas_empresa_v1") !== "1") {
  const primerId = Math.max(0, ...DB.usuarios.map(u => Number(u.id) || 0)) + 1;
  const cuentasEmpresa = [
    { nombre: "Erik Miguel Jimenez Morales", usuarioLogin: "ejimenez", correo: "ejimenez@cicsagruas.net", puesto: "Coordinador de Recursos Humanos", area: "Recursos Humanos", departamento: "Recursos Humanos", rol: "trabajador", password: "123456" },
    { nombre: "Jorge Enrique Che Centurión", usuarioLogin: "jche", correo: "jche@cicsagruas.net", puesto: "Especialista de RH", area: "Recursos Humanos", departamento: "Recursos Humanos", rol: "superadmin", password: "123456" },
    { nombre: "Yamileth Bravo Romero", usuarioLogin: "ybravo", correo: "ybravo@cicsagruas.net", puesto: "Analista Jurídico", area: "Recursos Humanos", departamento: "Recursos Humanos", rol: "trabajador", password: "123456" },
    { nombre: "Silvia Gallegos Juarez", usuarioLogin: "sgallegos", correo: "sgallegos@cicsagruas.net", puesto: "Analista de Capacitación y Desarrollo Organizacional", area: "Recursos Humanos", departamento: "Recursos Humanos", rol: "instructor", password: "123456" },
    { nombre: "Andrés Alexis García Jiménez", usuarioLogin: "agarcia", correo: "agarcia@cicsagruas.net", puesto: "Analista de RH", area: "Recursos Humanos", departamento: "Recursos Humanos", rol: "admin", password: "123456", correoGenerado: true }
  ];
  DB.usuarios = cuentasEmpresa.map((cuenta, indice) => ({
    id: primerId + indice, activo: true, ultimoAcceso: null, ...cuenta
  }));
  guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
  // Evita que una sesión de una cuenta retirada continúe abierta.
  localStorage.removeItem("cicsa_token");
  localStorage.removeItem("cicsa_usuario");
  localStorage.removeItem("cicsa_ultima_actividad");
  localStorage.setItem("cicsa_cuentas_empresa_v1", "1");
}

DB.evaluaciones = cargarObjetoPersistido("cicsa_evaluaciones", DB.evaluaciones);
const dbListaPromise = (async () => {
  limpiarCursosDemo();
  DB.cursos = await cargarCursosPersistidos([]);
  if (localStorage.getItem("cicsa_horario_global") !== "v1") {
    DB.cursos = DB.cursos.map(c => {
      if (!(Number(c.horas) > 0)) return c;
      const fechaInicio = c.fechaInicio || "";
      const fin = fechaCierreCurso({ ...c, fechaInicio });
      return { ...c, duracion: Number(c.horas) + " h", fechaInicio, fechaFin: fin ? new Date(fin).toISOString() : "" };
    });
    await guardarCursosPersistidos(DB.cursos);
    localStorage.setItem("cicsa_horario_global", "v1");
  }

})();

// La evaluacion inicial se contesta una sola vez por trabajador y curso.
function recuperarEvaluacionInicial(usuarioId, cursoId) {
  const curso = DB.cursos.find(c => String(c.id) === String(cursoId));
  const usuario = DB.usuarios.find(u => String(u.id) === String(usuarioId));
  const propio = DB.progreso[usuarioId] || {};
  const avance = propio[cursoId];
  let resultado = avance?.resultadoEvaluacionInicial;
  if (!resultado) {
    const registro = [...DB.evaluacionesResultado].reverse().filter(r =>
      r.tipo === "evaluacion" &&
      (r.usuarioId != null ? String(r.usuarioId) === String(usuarioId) : usuario && r.usuario === usuario.nombre) &&
      (r.cursoId != null ? String(r.cursoId) === String(cursoId) : curso && r.curso === curso.nombre)
    ).sort((a,b) => String(a.fecha || "").localeCompare(String(b.fecha || "")))[0];
    resultado = registro ? { ...registro, aprobado: registro.estado === "aprobado" } :
      avance?.historialIntentos?.find(h => h.resultadoEvaluacionInicial)?.resultadoEvaluacionInicial;
  }
  if (resultado && !avance?.resultadoEvaluacionInicial) {
    const actualizado = { ...DB.progreso, [usuarioId]: { ...propio, [cursoId]: {
      porcentaje: 0, estado: "no_iniciado", completadas: [], ...avance,
      resultadoEvaluacionInicial: resultado, evaluacionInicialRealizada: true,
      evaluacionInicialAprobada: resultado.aprobado
    } } };
    guardarDatosPersistidos("cicsa_progreso", actualizado);
    DB.progreso = actualizado;
  }
  return resultado || null;
}

// Los mínimos históricos inferiores a 80 se ajustan al requisito vigente.
function minimaExamen(valor) {
  const numero = Number(valor ?? 80);
  return Number.isFinite(numero) ? Math.min(100, Math.max(80, numero)) : 80;
}

function validarMinimaExamen(valor) {
  if (valor === undefined) return;
  const numero = Number(valor);
  if (valor === null || valor === '' || !Number.isFinite(numero) || numero < 80 || numero > 100) {
    throw new Error("La calificación mínima del examen final debe estar entre 80 y 100%.");
  }
}

function pausa(ms) { return new Promise((r) => setTimeout(r, ms)); }

function requerirAdministrador() {
  if (!sesion.activa() || !["admin", "superadmin"].includes(sesion.rol())) {
    throw new Error("No tienes permisos de administración.");
  }
}


const permisos = {
  tiene(permiso) {
    const matriz = {
      superadmin: ["usuarios", "password", "crearCursos", "editarCursos", "aprobarCursos", "asignarCursos", "reportes", "tutorial"],
      admin: ["usuarios", "asignarCursos", "reportes", "tutorial"],
      instructor: ["crearCursos", "editarCursos"], trabajador: []
    };
    return (matriz[sesion.rol()] || []).includes(permiso);
  },
  exigir(permiso) {
    if (!sesion.activa() || !this.tiene(permiso)) throw new Error("No tienes permisos para realizar esta acción.");
  },
  gestionarUsuario(u) {
    return this.tiene("usuarios") && (sesion.rol() === "superadmin" || ["trabajador", "instructor"].includes(u?.rol));
  },
  etiqueta(rol) {
    return { superadmin: "Súper administrador", admin: "Administrador", instructor: "Instructor", trabajador: "Trabajador" }[rol] || rol;
  }
};
// Version aprobada y bitacora: los cambios de contenido no incrementan la version.
function prepararVersionCurso(curso) {
  if (!Number.isInteger(curso.versionActual) || curso.versionActual < 0) curso.versionActual = 1;
  if (!Array.isArray(curso.historialVersiones)) curso.historialVersiones = [];
}
function registrarCambioVersionCurso(curso, campos) {
  prepararVersionCurso(curso);
  curso.historialVersiones = [...curso.historialVersiones, {
    tipo: "modificacion", resultado: "Pendiente", version: curso.versionActual,
    fecha: new Date().toISOString(), usuario: sesion.usuario().nombre,
    campos, comentario: "Cambios enviados para aprobacion."
  }];
}
function resolverVersionCurso(curso, estado, comentario) {
  prepararVersionCurso(curso);
  if (curso.estado !== "pendiente") return;
  if (estado === "publicado") curso.versionActual += 1;
  curso.historialVersiones = [...curso.historialVersiones, {
    tipo: "revision", resultado: estado === "publicado" ? "Aprobado" : "No aprobado",
    version: curso.versionActual, fecha: new Date().toISOString(),
    usuario: sesion.usuario().nombre, comentario
  }];
}

function nuevaSolicitudCurso() {
  return { usuarioId: sesion.usuario().id, fecha: new Date().toISOString(), comentario: "" };
}
function validarPlantillaPropuestaCurso(id, campos) {
  if (id === undefined) return undefined;
  if (id === null || id === "") return null;
  const plantilla = cargarDatosPersistidos("cicsa_formatos_constancia", []).find(f => f.id === String(id) && f.activo !== false && f.mime === "application/pdf");
  if (!plantilla) throw new Error("Selecciona una plantilla PDF activa de la biblioteca.");
  const permitidos=["trabajador","curso","instructor","registro","horas","nota","fecha","folio","firma","insignia","curp","puesto","empresa","domicilio","titulo","area","numeroEmpleado","categoria","periodoInicio","periodoFin","modalidad","minimaAprobatoria","resultado","instructorCargo","lugar","responsable","firmaResponsable","logo","texto","vigencia"];
  if(!Array.isArray(campos)||campos.length>permitidos.length||campos.some(c=>!permitidos.includes(c.clave)||!Number.isFinite(c.x)||!Number.isFinite(c.y)||!Number.isFinite(c.ancho)||!Number.isFinite(c.alto)||!Number.isFinite(c.tamano)||!Number.isInteger(c.pagina)||c.pagina<1||typeof c.visible!=="boolean"))throw new Error("No se pudo preparar la distribución de campos de la plantilla PDF.");
  return { archivoId: plantilla.id, nombre: plantilla.nombre, campos: campos.map(c=>({...c})), estado: "pendiente", comentario: "", fecha: new Date().toISOString() };
}
function agregarPlantillaPropuesta(solicitud, propuesta) {
  if (propuesta === undefined) return solicitud;
  const actualizada = { ...solicitud };
  if (propuesta) actualizada.plantillaConstancia = { ...propuesta };
  else delete actualizada.plantillaConstancia;
  return actualizada;
}
function solicitudCursoEsDeInstructor(curso) {
  const autor = DB.usuarios.find((u) => String(u.id) === String(curso?.solicitudCurso?.usuarioId ?? ""));
  return autor?.rol === "instructor";
}
function notificacionVisibleParaActual(notificacion) {
  if (notificacion?.destinatarioRol && notificacion.destinatarioRol !== sesion.rol()) return false;
  if (notificacion?.destinatarioId != null && String(notificacion.destinatarioId) !== String(sesion.usuario()?.id ?? "")) return false;
  if (notificacion?.tipo === "password" && !permisos.tiene("password")) return false;
  return true;
}
function agregarNotificacionCICSA(datos) {
  const notificacion = {
    id: `${datos.tipo || "aviso"}-${datos.destinatarioRol || "general"}-${datos.cursoId || datos.usuarioId || Date.now()}-${Date.now()}`,
    fecha: new Date().toISOString(),
    leida: false,
    ...datos,
  };
  DB.notificacionesAdmin.unshift(notificacion);
  guardarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
  return notificacion;
}
function notificarCambiosApartados(metodo, ruta, cuerpo, respuesta) {
  if (!sesion.activa() || !["POST", "PATCH", "PUT", "DELETE"].includes(metodo) || ruta.startsWith("/notificaciones-admin")) return;
  const rol = sesion.rol();
  const actor = sesion.usuario();
  const aviso = (roles, detalle, destinatarioId, seccion) => roles.forEach(destinatarioRol => agregarNotificacionCICSA({
    tipo: "actividad-apartado", destinatarioRol, destinatarioId, seccion,
    usuarioId: actor?.id, detalle, fecha: new Date().toISOString(),
  }));
  if (["admin", "superadmin"].includes(rol)) {
    let apartado = "", seccion = "", accion = "actualizó", rolesDestino = ["admin", "superadmin"];
    if (ruta.startsWith("/formatos-constancia") || ruta.startsWith("/constancias/")) { apartado = "Constancias"; seccion = "constancias-admin"; rolesDestino = ["superadmin"]; }
    else if (ruta.startsWith("/catalogos/organizacion")) { apartado = "Organización"; seccion = "puestos-departamentos-admin"; rolesDestino = ["superadmin"]; }
    else if (ruta.startsWith("/insignias")) { apartado = "Insignias"; seccion = "insignias-admin"; rolesDestino = ["superadmin"]; }
    else if (ruta.startsWith("/encuestas-instructor/configuracion")) { apartado = "Experiencia de aprendizaje"; seccion = "encuestas-instructor-admin"; rolesDestino = ["superadmin"]; }
    else if (ruta === "/soporte" || /^\/soporte\/\d+$/.test(ruta)) apartado = "Soporte";
    else if (ruta.startsWith("/usuarios/") && !ruta.startsWith("/usuarios/importar")) { apartado = "Usuarios"; seccion = "usuarios-admin"; }
    else if (/^\/cursos\/\d+\/asignacion$/.test(ruta)) { apartado = "Asignación de cursos"; seccion = "cursos-admin"; }
    else if (ruta === "/cursos" && metodo === "POST") { apartado = "Cursos"; seccion = "cursos-admin"; }
    else if (/^\/cursos\/\d+$/.test(ruta) && metodo === "PATCH") { apartado = "Cursos"; seccion = "cursos-admin"; }
    if (apartado) {
      if (metodo === "POST") accion = "agregó en";
      else if (metodo === "DELETE") accion = "eliminó en";
      else if (metodo === "PATCH") accion = "actualizó en";
      const detalle = `${actor?.nombre || "Administración"} ${accion} ${apartado}.`;
      aviso(rolesDestino, detalle, undefined, seccion);
    }
  }
  if (["trabajador", "instructor"].includes(rol) && metodo === "POST" && ruta === "/soporte" && cuerpo?.tipo !== "repetir") {
    aviso(["admin", "superadmin"], `${actor?.nombre || "Un usuario"} envió una solicitud de soporte.`);
  }
  if (rol === "trabajador" && metodo === "POST" && /^\/encuestas-instructor\/curso\/\d+$/.test(ruta)) {
    const cursoId = Number(ruta.split("/").pop());
    const curso = DB.cursos.find(c => Number(c.id) === cursoId);
    agregarNotificacionCICSA({ tipo: "actividad-apartado", destinatarioRol: "superadmin", usuarioId: actor?.id, cursoId, detalle: `Se recibió una evaluación de experiencia de aprendizaje para «${curso?.nombre || "un curso"}».` });
  }
  if (rol === "instructor" && ((ruta === "/cursos" && metodo === "POST") || (/^\/cursos\/\d+$/.test(ruta) && metodo === "PATCH"))) {
    const curso = respuesta?.id ? respuesta : DB.cursos.find(c => Number(c.id) === Number(ruta.split("/")[2]));
    agregarNotificacionCICSA({ tipo: "actividad-apartado", destinatarioRol: "instructor", destinatarioId: actor?.id, usuarioId: actor?.id, detalle: `${metodo === "POST" ? "Enviaste" : "Actualizaste"} «${curso?.nombre || "tu curso"}» para revisión.` });
  }
  if (rol === "instructor" && metodo === "PATCH" && /^\/instructores\/\d+$/.test(ruta)) {
    agregarNotificacionCICSA({ tipo: "actividad-apartado", destinatarioRol: "instructor", destinatarioId: actor?.id, usuarioId: actor?.id, detalle: "Tu perfil de instructor se actualizó correctamente." });
  }
  if (["trabajador", "instructor"].includes(rol) && metodo === "POST" && ruta === "/soporte") {
    agregarNotificacionCICSA({ tipo: "actividad-apartado", destinatarioRol: rol, destinatarioId: actor?.id, usuarioId: actor?.id, detalle: "Tu solicitud de soporte fue enviada." });
  }
}
function notificarRevisionCurso(curso, motivo = "envio") {
  if (sesion.rol() !== "instructor" || !curso) return;
  // Mantiene una sola alerta pendiente por curso y perfil.
  DB.notificacionesAdmin = DB.notificacionesAdmin.filter((n) => !(n.tipo === "curso-revision" && String(n.cursoId) === String(curso.id)));
  const baseAviso = { tipo: "curso-revision", usuarioId: sesion.usuario().id, cursoId: curso.id, motivo };
  agregarNotificacionCICSA({ ...baseAviso, destinatarioRol: "admin" });
  agregarNotificacionCICSA({ ...baseAviso, destinatarioRol: "superadmin" });
}
function retirarNotificacionesRevisionCurso(cursoId) {
  const longitud = DB.notificacionesAdmin.length;
  DB.notificacionesAdmin = DB.notificacionesAdmin.filter((n) => !(n.tipo === "curso-revision" && String(n.cursoId) === String(cursoId)));
  if (DB.notificacionesAdmin.length !== longitud) guardarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
}
function cursoPropioDelInstructor(curso) {
  if (sesion.rol() !== "instructor") return true;
  return String(curso?.solicitudCurso?.usuarioId ?? "") === String(sesion.usuario()?.id ?? "");
}
function exigirCursoPropioDelInstructor(curso) {
  if (sesion.rol() === "instructor" && !cursoPropioDelInstructor(curso)) {
    throw new Error("Este curso no pertenece a tu cuenta de Instructor.");
  }
}
function solicitudCursoCorregida(curso, comentario) {
  if (sesion.rol() === "instructor") return nuevaSolicitudCurso();
  return { ...(curso.solicitudCurso || nuevaSolicitudCurso()),
    corregidoPor: sesion.usuario().id, fechaCorreccion: new Date().toISOString(),
    comentario: String(comentario ?? curso.solicitudCurso?.comentario ?? "").trim().slice(0, 2000) };
}
function autorizarSolicitud(metodo, ruta, cuerpo = {}) {
  DB.usuarios = cargarDatosPersistidos("cicsa_usuarios", DB.usuarios);
  if (ruta.startsWith("/auth/") && ruta !== "/auth/restablecer-password") return;
  const cuenta = DB.usuarios.find(u => Number(u.id) === Number(sesion.usuario()?.id));
  if (!cuenta?.activo || sesion.token() !== "token-demo." + cuenta.id) throw new Error("La sesión ya no está activa.");
  if (cuenta.rol !== sesion.rol()) {
    sesion.guardar(sesion.token(), { id: cuenta.id, nombre: cuenta.nombre, correo: cuenta.correo, rol: cuenta.rol, area: cuenta.area || "", puesto: cuenta.puesto || "", curp: cuenta.curp || "" });
    throw new Error("Tu rol cambió. Recarga la página.");
  }
  if (ruta === "/auth/restablecer-password") permisos.exigir("password");
  if (ruta.startsWith("/usuarios")) {
    permisos.exigir("usuarios");
    const destino = DB.usuarios.find(u => u.id === Number(ruta.split("/")[2]));
    if (destino?.eliminado) throw new Error("La cuenta fue eliminada.");
    if (metodo !== "GET" && destino && !permisos.gestionarUsuario(destino)) throw new Error("Solo el súper administrador puede gestionar administradores.");
    if (ruta.endsWith("/password")) permisos.exigir("password");
    if (cuerpo.rol === "instructor" && sesion.rol() !== "superadmin") throw new Error("Solo el Super Admin puede registrar instructores.");
    if (cuerpo.rol && !permisos.gestionarUsuario({ rol: cuerpo.rol })) throw new Error("No puedes asignar ese rol.");
    if (destino?.id === cuenta.id && (cuerpo.activo === false || (cuerpo.rol && cuerpo.rol !== cuenta.rol))) throw new Error("No puedes desactivar tu cuenta ni cambiar tu propio rol.");
  }
  if (ruta.startsWith("/progreso/reabrir/")) permisos.exigir("asignarCursos");
  if (ruta.startsWith("/solicitudes-restablecimiento")) permisos.exigir("password");
  if (ruta.startsWith("/notificaciones-admin") && sesion.rol() !== "instructor") permisos.exigir("usuarios");
  if (ruta.startsWith("/reportes/") && ruta !== "/reportes/mis-resultados") permisos.exigir("reportes");
  if (ruta.startsWith("/cursos") && metodo !== "GET") {
    if (Object.prototype.hasOwnProperty.call(cuerpo, "constancia")) throw new Error("Configura la constancia desde el apartado exclusivo del Super Admin.");
    if (["versionActual", "historialVersiones"].some(clave => Object.prototype.hasOwnProperty.call(cuerpo, clave))) throw new Error("La version y el historial solo cambian mediante la revision del super admin.");
    if (ruta.endsWith("/plantilla-constancia-seleccion")) {
      if (! ["admin", "superadmin"].includes(sesion.rol())) throw new Error("Solo Administración puede proponer un cambio de plantilla.");
    } else if (ruta.endsWith("/plantilla-constancia")) {
      if (! ["admin", "superadmin"].includes(sesion.rol())) throw new Error("Solo Administración puede revisar la plantilla propuesta.");
    } else if (ruta.endsWith("/estado")) {
      permisos.exigir("aprobarCursos");
      if (["publicado", "rechazado"].includes(cuerpo.estado) && sesion.rol() !== "superadmin") throw new Error("Solo el super admin puede aprobar o rechazar las versiones de cursos.");
      if (!["publicado", "inactivo", "rechazado"].includes(cuerpo.estado)) throw new Error("Estado no válido.");
      const idCurso = Number(ruta.split("/")[2]);
      const cursoRevision = DB.cursos.find((curso) => Number(curso.id) === idCurso);
      if (cursoRevision && solicitudCursoEsDeInstructor(cursoRevision) && sesion.rol() !== "superadmin") {
        throw new Error("Las solicitudes enviadas por instructores solo pueden ser revisadas por el Súper administrador.");
      }
    } else if (ruta.endsWith("/asignacion")) permisos.exigir("asignarCursos");
    else {
      permisos.exigir(metodo === "POST" ? "crearCursos" : "editarCursos");
      if (metodo === "DELETE" && sesion.rol() !== "superadmin") throw new Error("Solo el súper administrador puede eliminar cursos.");
      if (metodo === "PATCH" && ("estado" in cuerpo || "id" in cuerpo)) throw new Error("Usa la acción de aprobación para cambiar el estado.");
      if (sesion.rol() === "instructor" && ("asignadoA" in cuerpo || "asignadoAIds" in cuerpo)) throw new Error("La asignación corresponde al administrador.");
    }
  }
  if (ruta.startsWith("/evaluaciones/") && metodo === "PATCH") permisos.exigir("editarCursos");
}
// Fecha de apertura del curso compartida por reportes y perfiles.
function formatearFechaInicioCurso(inicio) {
  if (!inicio) return "Sin fecha definida";
  if (/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return inicio;
  const fecha = new Date(inicio);
  if (Number.isNaN(fecha.getTime())) return "—";
  return [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, "0"), String(fecha.getDate()).padStart(2, "0")].join("-");
}

function normalizarDuracionCurso(datos) {
  if (datos.horas === undefined) return datos;
  const horas = Number(datos.horas);
  if (!Number.isFinite(horas) || horas < 0.5 || horas % 0.5 !== 0) {
    throw new Error("La duración debe ser de al menos media hora, en intervalos de media hora.");
  }
  return { ...datos, horas, duracion: horas + " h" };
}

function cursoParaTrabajador(curso, usuarioId) {
  const autor = DB.usuarios.find(u => String(u.id) === String(curso.solicitudCurso?.usuarioId));
  curso = { ...curso, instructorNombre: instructorDelCurso(curso)?.nombre || curso.instructorNombre || (autor?.rol === "instructor" ? autor.nombre : "Sin instructor asignado") };
  const permiso = DB.progreso[usuarioId]?.[curso.id]?.reapertura;
  if (!permiso) return curso;
  // Una nueva programacion general reemplaza las reaperturas del horario anterior.
  const horario = permiso.horarioCurso;
  if (horario) {
    if ((horario.fechaInicio || "") !== (curso.fechaInicio || "")
        || (horario.fechaFin || "") !== (curso.fechaFin || "")
        || Number(horario.horas) !== Number(curso.horas)) return curso;
  } else {
    // Compatibilidad con autorizaciones guardadas antes de registrar el horario base.
    const inicioIndividual = new Date(permiso.inicio).getTime();
    const finIndividual = new Date(permiso.fin).getTime();
    const inicioGeneral = new Date(curso.fechaInicio || "").getTime();
    const finGeneral = fechaCierreCurso(curso);
    if (inicioGeneral > inicioIndividual
        || (Date.now() >= finIndividual && (!finGeneral || finGeneral > finIndividual))) return curso;
  }
  return { ...curso, fechaInicio: permiso.inicio, fechaFin: permiso.fin,
    horas: permiso.horas, duracion: permiso.horas + " h", accesoReautorizado: true };
}

function fechaCierreCurso(curso) {
  const fin = new Date(curso?.fechaFin || "").getTime();
  return Number.isFinite(fin) ? fin : 0;
}

function normalizarHorarioCurso(datos) {
  const curso = normalizarDuracionCurso(datos);
  if (curso.fechaInicio && !Number.isFinite(new Date(curso.fechaInicio).getTime())) throw new Error("La fecha de apertura no es válida.");
  if (curso.fechaFin && !Number.isFinite(new Date(curso.fechaFin).getTime())) throw new Error("La fecha de cierre no es válida.");
  const inicio = curso.fechaInicio ? new Date(curso.fechaInicio).toISOString() : "";
  const fin = curso.fechaFin ? new Date(curso.fechaFin).toISOString() : "";
  if (inicio && fin && new Date(fin) <= new Date(inicio)) throw new Error("La fecha de cierre debe ser posterior a la fecha de apertura.");
  return { ...curso, fechaInicio: inicio, fechaFin: fin };
}

function estadoTemporalCurso(curso, ahora = new Date()) {
  const inicio = curso?.fechaInicio ? new Date(curso.fechaInicio) : null;
  const fin = fechaCierreCurso(curso);
  if (inicio && ahora < inicio) return "programado";
  if (fin && ahora >= fin) return "cerrado";
  return "abierto";
}

function obtenerLeccionesCurso(curso) {
  return (curso.modulos || []).flatMap((modulo) =>
    modulo.temas
      ? modulo.temas.flatMap((tema) => tema.subtemas || [])
      : modulo.lecciones || []
  );
}

// Versiones del cuestionario: conservar las preguntas vistas por cada trabajador.
function versionesEncuestaInstructor() {
  const inicial = { version: 1, preguntas: [
    { id: "claridad", texto: "Claridad de las explicaciones" },
    { id: "dominio", texto: "Dominio del tema" },
    { id: "organizacion", texto: "Organizaci\u00f3n del curso" },
    { id: "materiales", texto: "Utilidad de los materiales y ejemplos" },
    { id: "general", texto: "Valoraci\u00f3n general del instructor" }
  ] };
  const versiones=cargarDatosPersistidos("cicsa_preguntas_encuesta_instructor", [inicial]);
  if(!versiones.some(v=>v.fuente==="info-platforms-20261011")) {
    const version=Math.max(1,...versiones.map(v=>Number(v.version)||1))+1;
    versiones.push({version,fuente:"info-platforms-20261011",titulo:"Evaluación de experiencia de aprendizaje",preguntas:INFO_PLATFORMS.preguntas.map((p,i)=>({...p,id:`q_${version}_${i+1}`}))});
    guardarDatosPersistidos("cicsa_preguntas_encuesta_instructor",versiones);
  }
  return versiones;
}

function catalogoInstructores() {
  const fichas = cargarDatosPersistidos("cicsa_instructores", []);
  return DB.usuarios.filter(u => u.rol === "instructor").map(u => {
    const ficha = fichas.find(f => f.id === u.id);
    return { id:u.id, usuarioId:u.id, nombres:u.nombre, apellidos:"", registro:"", puesto:u.puesto || "", firma:"", agente:"", rfc:"", tipo:"interno", ...ficha,
      nombre:ficha ? [ficha.nombres,ficha.apellidos].filter(Boolean).join(" ") : u.nombre,
      correo:u.correo, cuentaActiva:u.activo, activo:u.activo && ficha?.activo !== false };
  });
}
function instructorDelCurso(curso) {
  return catalogoInstructores().find(i => i.id === Number(curso.instructorId || curso.constancia?.instructorId || curso.solicitudCurso?.usuarioId));
}
function formatoActivoDelCurso(curso) {
  const asignado=curso?.constancia?.formato;
  if(!asignado?.archivoId||asignado.archivoId==="cicsa-oficial-v1"||asignado.activo===false||asignado.autorizada===false)return null;
  const catalogo=cargarDatosPersistidos("cicsa_formatos_constancia",[]);
  const plantilla=catalogo.find(f=>f.id===asignado.archivoId);
  if(!plantilla||plantilla.activo===false)return null;
  return {...asignado,nombre:plantilla.nombre,activo:true,autorizada:true};
}
// Misma fuente para vista previa, prueba y nueva emision. El historial no se recalcula.
function datosConstanciaSistema(curso, trabajador, instructor, fecha) {
  return {
    usuarioId:trabajador.id,trabajador:trabajador.nombre || "",cursoId:Number(curso.id),curso:curso.nombre || "",
    horas:curso.horas ?? "",periodoInicio:curso.fechaInicio || "",periodoFin:curso.fechaFin || fecha,
    lugar:curso.lugar || curso.constancia?.lugar || "Ciudad del Carmen",fecha,
    instructorId:instructor?.id,instructor:instructor?.nombre || "",firmante:instructor?.nombre || "",
    instructorRegistro:instructor?.registro || "",firma:instructor?.firma || ""
  };
}
function fechaDc3Sistema(valor) {
  if(!valor)return "";
  if(/^\d{4}-\d{2}-\d{2}$/.test(valor))return valor;
  const d=new Date(valor);if(Number.isNaN(d.getTime()))return "";
  const partes=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Mexico_City",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
  const parte=tipo=>partes.find(p=>p.type===tipo).value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}
function datosDc3Sistema(registro) {
  const persona=DB.usuarios.find(u=>u.id===registro.usuarioId)||{},curso=DB.cursos.find(c=>Number(c.id)===Number(registro.cursoId))||{};
  return {
    formato:"cicsa-dc3-v1",folio:registro.folio,
    trabajadorNombre:registro.trabajadorNombreDc3||persona.nombreDc3||registro.trabajador||"",
    curp:registro.curp||persona.curp||"",puesto:registro.puesto||persona.puesto||"",
    ocupacion:registro.ocupacion||persona.ocupacion||"",areaTematica:registro.areaTematica||curso.areaTematica||"",
    periodoInicio:fechaDc3Sistema(registro.periodoInicio),periodoFin:fechaDc3Sistema(registro.periodoFin||registro.fecha),
    curso:registro.curso,horas:registro.horas,instructor:registro.instructor||"",registroInstructor:registro.instructorRegistro||"",firmaInstructor:registro.firma||"",
    agente:[registro.instructor,registro.instructorRegistro].filter(Boolean).join(" "),
    empresa:"CORPORATIVO INDUSTRIAL Y COMERCIAL S.A. DE C.V.",rfc:"CIC9303278B5",
    representanteEmpresa:"YAMILETH BRAVO ROMERO",representanteTrabajadores:"JORGE ENRIQUE CHE CENTURI\u00d3N",
    requiereRepresentanteTrabajadores:true,fecha:registro.fecha
  };
}
function vincularCatalogosCurso(datos, anterior = {}) {
  const salida = { ...datos };
  if (datos.instructorId !== undefined) {
    const instructor = catalogoInstructores().find(i => i.id === Number(datos.instructorId));
    if (!instructor || (!instructor.activo && instructor.id !== anterior.instructorId)) throw new Error("Selecciona un instructor activo del catálogo.");
    salida.instructorId = instructor.id;
    salida.instructorNombre = instructor.nombre;
  } else if (!anterior.id && sesion.rol() === "instructor") {
    const propio = catalogoInstructores().find(i => i.id === sesion.usuario().id && i.activo);
    if (!propio) throw new Error("Tu registro de instructor no está activo.");
    salida.instructorId = propio.id; salida.instructorNombre = propio.nombre;
  }
  if (datos.insigniaId === "") {
    salida.insigniaId = "";
  } else if (datos.insigniaId !== undefined) {
    const insignia = catalogoInsignias().find(i => i.id === datos.insigniaId);
    if (!insignia || insignia.eliminada || (!insignia.activa && insignia.id !== anterior.insigniaId)) throw new Error("Selecciona una insignia activa del catálogo.");
    salida.insigniaId = insignia.id;
  }
  // La autoría se deriva de la sesión; no se admite cambiar al creador desde el formulario.
  delete salida.creadoPor;
  return salida;
}

function catalogoInsignias() {
  const lista = cargarDatosPersistidos("cicsa_insignias", [
    { id:"aprobacion", nombre:"Curso aprobado", descripcion:"Reconocimiento por aprobar el curso.", imagen:"", activa:true },
    { id:"seguridad", nombre:"Seguridad y prevención", descripcion:"Formación en seguridad y prevención.", imagen:"", activa:true },
    { id:"excelencia", nombre:"Excelencia en capacitación", descripcion:"Reconocimiento de capacitación.", imagen:"", activa:true }
  ]);
  const normalizarNombre=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  for(const nueva of INFO_PLATFORMS.insignias) {
    if(!lista.some(i=>i.id===nueva.id || normalizarNombre(i.nombre)===normalizarNombre(nueva.nombre)))lista.push(JSON.parse(JSON.stringify(nueva)));
  }
  // Oculta del catálogo las insignias automáticas numeradas #10 a #14.
  // Las insignias con nombres propios se conservan sin cambios.
  const insigniasNumeradas = new Set(["logro-10", "logro-11", "logro-12", "logro-13", "logro-14"]);
  return lista.filter(i => !insigniasNumeradas.has(String(i.id)));
}

// Cada premio se conserva como una copia histórica, independiente del catálogo.
function insigniasDelTrabajador(usuarioId) {
  const usuario = DB.usuarios.find(u=>u.id===Number(usuarioId));
  if (!usuario || usuario.rol!=="trabajador") throw new Error("No se encontró el trabajador.");
  const catalogo = catalogoInsignias();
  const guardadas = cargarDatosPersistidos("cicsa_insignias_otorgadas", []);
  const propias = guardadas.filter(i=>i.usuarioId===usuario.id);
  const nuevasInsignias = [];
  const claves = new Set(propias.map(i=>i.clave));
  let cambios = false;
  const permitido = i => i.activa!==false && !i.eliminada &&
    (!i.areaTrabajo || i.areaTrabajo===usuario.area) && (!i.puesto || i.puesto===usuario.puesto) && (!i.dirigidoA || i.dirigidoA===usuario.nombre);
  function otorgar(i, clave, cursoId, curso, fecha, calificacion) {
    if (claves.has(clave)) return;
    const otorgada = {clave,usuarioId:usuario.id,id:i.id,nombre:i.nombre,descripcion:i.descripcion || "",imagen:i.imagen || "",puntos:i.puntos || 0,
      automatica:!!i.regla,cursoId:cursoId || null,curso:curso || "",calificacion:Number.isFinite(calificacion)?calificacion:null,fecha:fecha || new Date().toISOString()};
    propias.push(otorgada); nuevasInsignias.push(otorgada);
    claves.add(clave);cambios=true;
  }
  const notas = [], completados = new Set();
  let evaluacionesAprobadas = 0;
  for (const [id,avance] of Object.entries(DB.progreso[usuario.id] || {})) {
    const intentos = [...(avance.historialIntentos || []),avance];
    const ultimo = [...intentos].reverse().find(i=>Number.isFinite(i.resultadoFinal?.nota));
    if (ultimo) notas.push(ultimo.resultadoFinal.nota);
    const aprobados = intentos.filter(i=>i.estado==="completado" && i.examenAprobado===true);
    if (!aprobados.length) continue;
    completados.add(Number(id));
    evaluacionesAprobadas += aprobados.length;
    const curso = DB.cursos.find(c=>c.id===Number(id));
    // Recupera insignias emitidas antes de activar este módulo, aunque se hayan desactivado.
    for (const intento of aprobados) {
      const r = intento.reconocimiento;
      if (r?.insignia) {
        const original = r.insigniaDetalle || catalogo.find(i=>i.id===r.insignia);
        const calificacion = Number.isFinite(r.nota) ? r.nota : intento.resultadoFinal?.nota;
        if (original && !original.regla && calificacion >= 90) otorgar({...original,id:r.insignia},`curso:${id}:${r.insignia}`,Number(id),r.curso || curso?.nombre,r.fecha,calificacion);
      }
    }
    if (!curso) continue;
    const normalizarCurso=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
    const ultimoAprobado=aprobados[aprobados.length-1];
    catalogo.filter(i=>i.otorgamiento && permitido(i)).filter(i=>
      i.otorgamiento.tipo==="categoria" ? normalizarCurso(curso.categoria)===normalizarCurso(i.otorgamiento.valor)
      : i.otorgamiento.tipo==="nombre" ? normalizarCurso(curso.nombre)===normalizarCurso(i.otorgamiento.valor)
      : i.cursoIds?.includes(curso.id) || i.id===curso.insigniaId || i.id===curso.constancia?.insignia
    ).forEach(i=>otorgar(i,`curso:${id}:${i.id}`,curso.id,curso.nombre,ultimoAprobado.fechaFin,ultimoAprobado.resultadoFinal?.nota));
    const vinculadas = catalogo.filter(i=>!i.regla && !i.otorgamiento && (i.cursoIds?.includes(curso.id) || i.id===curso.insigniaId || i.id===curso.constancia?.insignia));
    const candidatas = vinculadas.length ? vinculadas : catalogo.filter(i=>i.id==="aprobacion");
    const aprobadoConInsignia = [...aprobados].reverse().find(i=>Number(i.resultadoFinal?.nota ?? i.reconocimiento?.nota) >= 90);
    if (aprobadoConInsignia) {
      const calificacion = Number(aprobadoConInsignia.resultadoFinal?.nota ?? aprobadoConInsignia.reconocimiento?.nota);
      candidatas.filter(permitido).forEach(i=>otorgar(i,`curso:${id}:${i.id}`,curso.id,curso.nombre,aprobadoConInsignia.fechaFin,calificacion));
    }
  }
  const promedio = notas.length ? notas.reduce((a,b)=>a+b,0)/notas.length : null;
  // Los premios automáticos no se cuentan a sí mismos para desbloquear otros premios.
  const insigniasDeCursos = propias.filter(i=>!i.automatica).length;
  for (const i of catalogo.filter(i=>i.regla && permitido(i))) {
    const valor = i.regla.tipo==="evaluaciones" ? evaluacionesAprobadas : i.regla.tipo==="cursos" ? completados.size : i.regla.tipo==="insignias" ? insigniasDeCursos : promedio;
    const cumplida = i.regla.tipo === "promedio" || i.regla.inclusivo ? valor >= i.regla.umbral : valor > i.regla.umbral;
    if (valor!==null && cumplida) otorgar(i,`logro:${i.id}`);
  }
  if (cambios) {
    guardarDatosPersistidos("cicsa_insignias_otorgadas",[...guardadas.filter(i=>i.usuarioId!==usuario.id),...propias]);
    nuevasInsignias.forEach(i => agregarNotificacionCICSA({
      id: `insignia-${usuario.id}-${i.clave}`, tipo: "actividad-apartado", destinatarioRol: "trabajador", destinatarioId: usuario.id,
      destino: "perfil-insignias", cursoId: i.cursoId, detalle: `Se te otorgó la insignia «${i.nombre}»${i.curso ? ` por completar «${i.curso}»` : ""}.`,
    }));
  }
  return {insignias:propias,puntos:propias.reduce((s,i)=>s+i.puntos,0),cursosCompletados:completados.size,insigniasDeCursos,promedio,
    usuario:{nombre:usuario.nombre,puesto:usuario.puesto || ""}};
}

async function simularSolicitud(metodo, ruta, cuerpo) {
  await dbListaPromise;
  // Ceder el hilo sin agregar latencia artificial a cada consulta local.
  await pausa(0);
  DB.cursos = await cargarCursosPersistidos(DB.cursos);
  DB.cursos.forEach(prepararVersionCurso);
  DB.progreso = cargarObjetoPersistido("cicsa_progreso", DB.progreso);

  if (!ruta.startsWith("/auth/") && !sesion.activa()) {
    throw new Error("Inicia sesión para continuar.");
  }

  autorizarSolicitud(metodo, ruta, cuerpo);
  DB.cursos.forEach(c=>{const instructor=instructorDelCurso(c);if(instructor)c.instructorNombre=instructor.nombre;});

  if (ruta === "/reportes/sesiones" && metodo === "GET") return cerrarSesionesVencidas();
  if (ruta === "/sesiones/pulso" && metodo === "POST") return registrarUsoDemo("pulso");
  if (ruta === "/sesiones/cerrar" && metodo === "POST") return registrarUsoDemo("cerrar", cuerpo?.motivo);


  if (ruta === "/encuestas-instructor/configuracion" && ["GET", "POST"].includes(metodo)) {
    if (sesion.rol() !== "superadmin") throw new Error("Solo el super admin puede administrar las preguntas.");
    const versiones = versionesEncuestaInstructor();
    const actual = versiones[versiones.length - 1];
    if (metodo === "GET") return actual;
    if (cuerpo?.version !== actual.version) throw new Error("Las preguntas cambiaron en otra ventana. Recarga la configuracion antes de guardar.");
    if (!Array.isArray(cuerpo.preguntas) || cuerpo.preguntas.length < 1 || cuerpo.preguntas.length > 20) throw new Error("El cuestionario debe tener entre 1 y 20 preguntas.");
    const ids = new Set();
    const preguntas = cuerpo.preguntas.map((p, indice) => {
      if (typeof p?.texto !== "string" || !p.texto.trim() || p.texto.trim().length > 300) throw new Error("Cada pregunta debe contener entre 1 y 300 caracteres.");
      const id = p.id || `q_${actual.version + 1}_${indice + 1}`;
      if (typeof id !== "string" || !/^(claridad|dominio|organizacion|materiales|general|q_[0-9]+_[0-9]+)$/.test(id) || ids.has(id)) throw new Error("Identificador de pregunta no valido o repetido.");
      if (p.id && !actual.preguntas.some(item => item.id === p.id)) throw new Error("Pregunta no encontrada en la configuracion actual.");
      ids.add(id);
      return { id, texto: p.texto.trim(), seccion:actual.preguntas.find(item=>item.id===id)?.seccion || "" };
    });
    const siguiente = { version: actual.version + 1, titulo:actual.titulo, preguntas };
    localStorage.setItem("cicsa_preguntas_encuesta_instructor", JSON.stringify([...versiones, siguiente]));
    return siguiente;
  }

  // Encuestas de imparticion: separadas de las notas y los reportes academicos.
  if (ruta === "/encuestas-instructor" && metodo === "GET") {
    if (sesion.rol() !== "superadmin") throw new Error("Solo el super admin puede consultar estas respuestas.");
    return cargarDatosPersistidos("cicsa_encuestas_instructor", []).map(registro => {
      const trabajador = DB.usuarios.find(u => String(u.id) === String(registro.usuarioId));
      return { ...registro, area: registro.area ?? trabajador?.area ?? "", puesto: registro.puesto ?? trabajador?.puesto ?? "" };
    }).sort((a,b) => b.fecha.localeCompare(a.fecha));
  }
  const encuestaCurso = ruta.match(/^\/encuestas-instructor\/curso\/(\d+)$/);
  if (encuestaCurso && ["GET", "POST"].includes(metodo)) {
    if (sesion.rol() !== "trabajador") throw new Error("Solo el trabajador puede evaluar su curso terminado.");
    const usuario = sesion.usuario();
    const cursoId = Number(encuestaCurso[1]);
    const curso = DB.cursos.find(c => c.id === cursoId);
    if (!curso) throw new Error("Curso no encontrado.");
    const avance = DB.progreso[usuario.id]?.[cursoId];
    const elegible = avance?.estado === "completado" && avance?.examenAprobado === true;
    const registros = cargarDatosPersistidos("cicsa_encuestas_instructor", []);
    const enviada = registros.some(r => r.usuarioId === usuario.id && r.cursoId === cursoId);
    const autor = DB.usuarios.find(u => String(u.id) === String(curso.solicitudCurso?.usuarioId));
    const instructor = instructorDelCurso(curso);
    // El trabajador recibe solo el estado; las respuestas se leen por la ruta exclusiva.
    const versiones = versionesEncuestaInstructor();
    const actual = versiones[versiones.length - 1];
    if (metodo === "GET") return { elegible, enviada, instructor: instructor?.nombre || "Responsable del curso", version: actual.version, titulo:actual.titulo, preguntas: actual.preguntas };
    if (!elegible) throw new Error("Completa y aprueba el curso antes de evaluar al instructor.");
    if (enviada) return { enviada: true };
    const cuestionario = versiones.find(v => v.version === (cuerpo?.version ?? 1));
    if (!cuestionario) throw new Error("Version de cuestionario no disponible. Recarga la evaluacion.");
    const claves = cuestionario.preguntas.map(p => p.id);
    const puntuaciones = {};
    for (const clave of claves) {
      const valor = cuerpo?.puntuaciones?.[clave];
      if (!Number.isInteger(valor) || valor < 1 || valor > 5) throw new Error("Responde cada criterio con una calificacion del 1 al 5.");
      puntuaciones[clave] = valor;
    }
    if (cuerpo?.comentario != null && typeof cuerpo.comentario !== "string") throw new Error("Comentario no valido.");
    const comentario = (cuerpo?.comentario || "").trim();
    if (comentario.length > 1000) throw new Error("El comentario admite hasta 1000 caracteres.");
    const trabajadorEncuesta = DB.usuarios.find(u => u.id === usuario.id);
    const registro = { id: `${usuario.id}-${cursoId}`, usuarioId: usuario.id, trabajador: usuario.nombre,
      area: trabajadorEncuesta?.area || "", puesto: trabajadorEncuesta?.puesto || "",
      cursoId, curso: curso.nombre, instructorId: instructor?.id || null,
      instructor: instructor?.nombre || "Responsable no identificado", puntuaciones, comentario, version: cuestionario.version, preguntas: cuestionario.preguntas.map(p => ({ ...p })), fecha: new Date().toISOString() };
    // No anunciar exito si falla la persistencia.
    localStorage.setItem("cicsa_encuestas_instructor", JSON.stringify([...registros, registro]));
    return { enviada: true };
  }

  // ---- Auth ----
  if (ruta === "/auth/login" && metodo === "POST") {
    const u = DB.usuarios.find(
      (x) => [x.correo, x.usuarioLogin].some(valor => valor && String(valor).toLowerCase() === String(cuerpo.correo || "").trim().toLowerCase())
    );
    if (!u || u.password !== cuerpo.password) throw new Error("Usuario o contraseña incorrectos.");
    if (!u.activo) throw new Error("Esta cuenta está desactivada. Contacta a un administrador.");
    registrarUsoDemo("cerrar", "cambio_cuenta");
    if (u.rol === "trabajador") iniciarUsoDemo(u);
    u.ultimoAcceso = new Date().toISOString();
    guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
    return { token: "token-demo." + u.id, usuario: { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, area: u.area || "", puesto: u.puesto || "", curp: u.curp || "" } };
  }
  if (ruta === "/auth/olvide-password" && metodo === "POST") {
    const usuario = DB.usuarios.find((u) => u.correo.toLowerCase() === String(cuerpo.correo).toLowerCase());
    const administrador = DB.usuarios.find((u) => u.rol === "superadmin" && u.activo);
    if (usuario && !DB.solicitudesRestablecimiento.some((s) => s.usuarioId === usuario.id && s.estado === "pendiente")) {
      DB.solicitudesRestablecimiento.push({
        id: DB.solicitudesRestablecimiento.length ? Math.max(...DB.solicitudesRestablecimiento.map((s) => s.id)) + 1 : 1,
        usuarioId: usuario.id,
        fecha: new Date().toISOString(),
        estado: "pendiente",
      });
      guardarDatosPersistidos("cicsa_solicitudes_restablecimiento", DB.solicitudesRestablecimiento);
      guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
      DB.notificacionesAdmin.unshift({
        id: `password-${usuario.id}-${Date.now()}`,
        tipo: "password",
        fecha: new Date().toISOString(),
        usuarioId: usuario.id,
        destinatario: administrador?.correo || null,
        leida: false,
      });
      guardarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
    }
    return { mensaje: "Si el correo existe, se notificó al administrador." };
  }
  if (ruta === "/auth/restablecer-password" && metodo === "POST") {
    requerirAdministrador();
    return { mensaje: "Contraseña actualizada correctamente." };
  }

  if (ruta === "/catalogos/curso" && metodo === "GET") {
    if (!["superadmin","admin","instructor"].includes(sesion.rol())) throw new Error("No tienes permiso para consultar estos catálogos.");
    return { instructores:catalogoInstructores().map(({firma,...i})=>i), insignias:catalogoInsignias().filter(i=>!i.eliminada) };
  }
  const fichaInstructor = ruta.match(/^\/instructores(?:\/(\d+))?$/);
  if (fichaInstructor) {
    const propio=sesion.rol()==="instructor";
    if (sesion.rol() !== "superadmin" && !propio) throw new Error("Solo el Super Admin puede administrar el registro de instructores.");
    if (metodo === "GET" && !fichaInstructor[1]) return catalogoInstructores().filter(i=>!propio || i.id===sesion.usuario().id);
    if(propio && (metodo!=="PATCH" || Number(fichaInstructor[1])!==sesion.usuario().id))throw new Error("Solo puedes editar tu propia ficha.");
    if(propio && Object.keys(cuerpo).some(k=>!["puesto","tipo","agente","rfc","firma"].includes(k)))throw new Error("Solo puedes modificar tus datos y firma; el estado lo administra el Super Admin.");
    if (metodo === "PATCH" && fichaInstructor[1]) {
      const actual = catalogoInstructores().find(i=>i.id===Number(fichaInstructor[1]));
      if (!actual) throw new Error("Selecciona una cuenta de Instructor registrada en Usuarios.");
      const datos = {...actual,...cuerpo};
      const ficha = {id:actual.id,usuarioId:actual.id};
      for (const [campo,maximo] of [["nombres",100],["apellidos",150],["registro",100],["puesto",150],["agente",200],["rfc",13]]) {
        ficha[campo] = String(datos[campo] || "").trim();
        if (ficha[campo].length > maximo) throw new Error("Los datos del instructor exceden el límite permitido.");
      }
      ficha.rfc = ficha.rfc.toUpperCase();
      if (!ficha.nombres || (!ficha.apellidos && (cuerpo.apellidos !== undefined || cuerpo.nombres !== undefined))) throw new Error("Completa nombres y apellidos del instructor.");
      if (!["interno","externo"].includes(datos.tipo)) throw new Error("Tipo de instructor no válido.");
      if (typeof datos.activo !== "boolean") throw new Error("Estado de instructor no válido.");
      ficha.tipo=datos.tipo;ficha.activo=datos.activo;ficha.firma=datos.firma || "";
      if (typeof ficha.firma !== "string" || ficha.firma.length>1400000 || (ficha.firma && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(ficha.firma))) throw new Error("La firma debe ser PNG, JPG o WEBP de hasta 1 MB.");
      const fichas=cargarDatosPersistidos("cicsa_instructores",[]);
      if (ficha.registro && fichas.some(i=>i.id!==ficha.id && i.registro?.toLowerCase()===ficha.registro.toLowerCase())) throw new Error("El registro pertenece a otro instructor.");
      guardarDatosPersistidos("cicsa_instructores",[...fichas.filter(i=>i.id!==ficha.id),ficha]);
      if(propio){
        const etiquetas={puesto:"Cargo / Puesto",tipo:"Tipo de instructor",agente:"Institución",rfc:"RFC",firma:"Firma"};
        const campos=Object.keys(etiquetas).filter(k=>(actual[k]||"")!==(ficha[k]||""));
        if(campos.length)agregarNotificacionCICSA({tipo:"instructor-modificado",usuarioId:actual.id,destinatarioRol:"superadmin",camposModificados:campos,detalle:`${actual.nombre} modificó su ficha de instructor: ${campos.map(k=>etiquetas[k]).join(", ")}.`});
      }
      return {...ficha,nombre:[ficha.nombres,ficha.apellidos].join(" ")};
    }
    throw new Error("Operación de instructores no disponible.");
  }
  if (ruta === "/insignias/mis" && metodo === "GET") {
    if (sesion.rol()!=="trabajador") throw new Error("Este perfil corresponde al trabajador.");
    return insigniasDelTrabajador(sesion.usuario().id);
  }
  const insigniaRuta = ruta.match(/^\/insignias(?:\/([a-z0-9-]+))?$/);
  if (insigniaRuta) {
    if (sesion.rol() !== "superadmin") throw new Error("Solo el Super Admin puede administrar insignias.");
    const lista = catalogoInsignias();
    if (metodo === "GET" && !insigniaRuta[1]) return lista.filter(i=>!i.eliminada).map(i=>({...i,puntos:i.puntos || 0}));
    if (metodo === "DELETE" && insigniaRuta[1]) {
      const insignia=lista.find(i=>i.id===insigniaRuta[1] && !i.eliminada);
      if (!insignia) throw new Error("Insignia no encontrada.");
      guardarDatosPersistidos("cicsa_insignias",lista.map(i=>i.id===insignia.id?{...i,activa:false,eliminada:true}:i));
      return {mensaje:"Insignia eliminada del catálogo. Los reconocimientos históricos se conservan."};
    }
    if ((metodo === "POST" && !insigniaRuta[1]) || (metodo === "PATCH" && insigniaRuta[1])) {
      const anterior = insigniaRuta[1] ? lista.find(i => i.id === insigniaRuta[1]) : null;
      if (insigniaRuta[1] && (!anterior || anterior.eliminada)) throw new Error("Insignia no encontrada.");
      const datos = { ...anterior, ...cuerpo };
      const nombre = String(datos.nombre || "").trim();
      const descripcion = String(datos.descripcion || "").trim();
      const imagen = datos.imagen || "";
      if (!nombre || nombre.length > 100 || descripcion.length > 500) throw new Error("Indica un nombre de hasta 100 caracteres y una descripción de hasta 500.");
      if (lista.some(i => i.id !== anterior?.id && i.nombre.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"))) throw new Error("Ya existe una insignia con ese nombre.");
      if (typeof imagen !== "string" || imagen.length > 1400000 || (imagen && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(imagen))) throw new Error("Usa una imagen PNG, JPG o WEBP de hasta 1 MB.");
      if (datos.activa !== undefined && typeof datos.activa !== "boolean") throw new Error("Estado de insignia no válido.");
      let numero = 1;
      while (lista.some(i => i.id === "insignia-" + numero)) numero++;
      const puntos = datos.puntos ?? 0;
      if (!Number.isInteger(puntos) || puntos<0 || puntos>100000) throw new Error("Los puntos deben ser un entero entre 0 y 100000.");
      const destino={};
      for(const [campo,maximo] of [["areaTrabajo",150],["puesto",150],["dirigidoA",200]]) {
        if(datos[campo]!==undefined && typeof datos[campo]!=="string") throw new Error("Área, puesto y destinatario deben ser texto.");
        destino[campo]=(datos[campo] || "").trim();
        if(destino[campo].length>maximo) throw new Error("El área, puesto o destinatario supera la longitud permitida.");
      }
      const cursoIds = datos.cursoIds ?? [];
      if (!Array.isArray(cursoIds) || cursoIds.some(id=>!Number.isInteger(id) || id<=0 || (!DB.cursos.some(c=>c.id===id) && !anterior?.cursoIds?.includes(id)))) throw new Error("Selecciona cursos válidos para la insignia.");
      if (cuerpo.regla !== undefined) throw new Error("Las reglas de las insignias automáticas están predefinidas.");
      const registro = { ...destino, regla:anterior?.regla || null, otorgamiento:anterior?.otorgamiento || null, cursoIds:anterior?.regla ? [] : [...new Set(cursoIds)], puntos, id:anterior?.id || "insignia-" + numero, nombre, descripcion, imagen, activa:datos.activa ?? true, actualizadoPor:sesion.usuario().id, fecha:new Date().toISOString() };
      guardarDatosPersistidos("cicsa_insignias", anterior ? lista.map(i=>i.id===registro.id?registro:i) : [...lista,registro]);
      return registro;
    }
    throw new Error("Operación de insignias no disponible.");
  }
  if (ruta === "/formatos-constancia" && metodo === "GET") {
    if (!["superadmin", "admin", "instructor"].includes(sesion.rol())) throw new Error("No tienes acceso a las plantillas de constancia.");
    const formatos=cargarDatosPersistidos("cicsa_formatos_constancia",[]).map(f=>({...f,activo:f.activo!==false}));
    return sesion.rol()==="superadmin"?formatos:formatos.filter(f=>f.activo&&f.mime==="application/pdf");
  }
  if (ruta === "/formatos-constancia" && metodo === "POST") {
    if (sesion.rol()!=="superadmin") throw new Error("Solo el Super Admin puede cargar formatos.");
    const nombre=String(cuerpo.nombre || "").trim(), archivo=cuerpo.archivo;
    if (!nombre || nombre.length>150) throw new Error("Indica un nombre para el formato (máximo 150 caracteres).");
    if (typeof archivo!=="string" || archivo.length>7000000 || !/^data:(application\/pdf|image\/png|image\/jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(archivo)) throw new Error("Carga un PDF, PNG o JPG de hasta 5 MB.");
    const mime=archivo.slice(5,archivo.indexOf(";"));
    const firma=archivo.split(",")[1];
    if ((mime==="application/pdf"&&!firma.startsWith("JVBERi0")) || (mime==="image/png"&&!firma.startsWith("iVBORw0KGgo")) || (mime==="image/jpeg"&&!firma.startsWith("/9j/"))) throw new Error("El contenido no corresponde a un PDF, PNG o JPG válido.");
    const id=typeof crypto!=="undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
    await guardarArchivoMedia("formato-constancia-"+id,archivo);
    const formato={id,nombre,mime,fecha:new Date().toISOString(),creadoPor:sesion.usuario().id,activo:true};
    guardarDatosPersistidos("cicsa_formatos_constancia",[...cargarDatosPersistidos("cicsa_formatos_constancia",[]),formato]);
    return formato;
  }
  if (ruta === "/formatos-constancia/asignar" && metodo === "POST") {
    if (sesion.rol()!=="superadmin") throw new Error("Solo el Super Admin puede asignar plantillas.");
    const formatos=cargarDatosPersistidos("cicsa_formatos_constancia",[]);
    const formato=formatos.find(f=>f.id===cuerpo.formatoId);
    if(!formato) throw new Error("La plantilla seleccionada ya no existe.");
    if(!Array.isArray(cuerpo.cursoIds)) throw new Error("Selecciona los cursos que utilizarán la plantilla.");
    if(!Array.isArray(cuerpo.campos)) throw new Error("No se recibieron los campos de la plantilla.");
    const permitidos=["trabajador","curso","instructor","registro","horas","nota","fecha","folio","firma","insignia","curp","puesto","empresa","domicilio","titulo","area","numeroEmpleado","categoria","periodoInicio","periodoFin","modalidad","minimaAprobatoria","resultado","instructorCargo","lugar","responsable","firmaResponsable","logo","texto","vigencia"];
    const campos=cuerpo.campos.map(c=>({...c}));
    if(campos.some(c=>!permitidos.includes(c.clave)||!Number.isFinite(c.x)||!Number.isFinite(c.y)||!Number.isFinite(c.ancho)||!Number.isFinite(c.alto)||!Number.isFinite(c.tamano)||!Number.isInteger(c.pagina)||typeof c.visible!=="boolean")) throw new Error("Los campos de la plantilla no son válidos.");
    if(formato.activo===false)throw new Error("Activa la plantilla antes de asignarla a cursos.");
    const ids=new Set(cuerpo.cursoIds.map(Number));
    const activosPorCurso=cuerpo.activosPorCurso||{};
    if(Object.values(activosPorCurso).some(activo=>typeof activo!=="boolean"))throw new Error("El estado por curso no es válido.");
    if([...ids].some(id=>!DB.cursos.some(c=>c.id===id))) throw new Error("Uno de los cursos seleccionados no existe.");
    const cursosAnteriores=DB.cursos;
    const actualizados=DB.cursos.map(c=>{
      if(ids.has(Number(c.id)))return {...c,constancia:{...(c.constancia||{}),formato:{archivoId:formato.id,nombre:formato.nombre,campos,activo:activosPorCurso[String(c.id)]!==false,autorizada:true}}};
      if(c.constancia?.formato?.archivoId===formato.id){const constancia={...c.constancia};delete constancia.formato;return {...c,constancia};}
      return c;
    });
    await guardarCursosPersistidos(actualizados);DB.cursos=actualizados;
    // Mantener el historial sincronizado con la plantilla asignada al curso.
    // Así las constancias emitidas antes de la asignación también se visualizan
    // con el formato elegido, y el progreso conserva el mismo registro actualizado.
    const cursosConFormatoActualizado=new Map();
    for(const curso of actualizados){
      const anterior=cursosAnteriores.find(c=>c.id===curso.id);
      if(ids.has(curso.id) || (anterior?.constancia?.formato?.archivoId===formato.id && curso.constancia?.formato?.archivoId!==formato.id)){
        cursosConFormatoActualizado.set(Number(curso.id),curso.constancia?.formato || null);
      }
    }
    if(cursosConFormatoActualizado.size){
      const emitidas=cargarDatosPersistidos("cicsa_constancias_emitidas",[]);
      const emitidasActualizadas=emitidas.map(registro=>{
        if(!cursosConFormatoActualizado.has(Number(registro.cursoId)))return registro;
        const nuevoFormato=cursosConFormatoActualizado.get(Number(registro.cursoId));
        if(!nuevoFormato){const copia={...registro};delete copia.formato;return copia;}
        return {...registro,formato:{...nuevoFormato,campos:[...(nuevoFormato.campos||[])]}};
      });
      guardarDatosPersistidos("cicsa_constancias_emitidas",emitidasActualizadas);
      for(const cursosProgreso of Object.values(DB.progreso)){
        for(const avance of Object.values(cursosProgreso||{})){
          const referencia=avance?.reconocimiento;
          if(!cursosConFormatoActualizado.has(Number(referencia?.cursoId)))continue;
          const registro=emitidasActualizadas.find(c=>c.folio===referencia.folio);
          if(registro)avance.reconocimiento=registro;
        }
      }
      guardarDatosPersistidos("cicsa_progreso",DB.progreso);
    }
    return {asignados:[...ids].length,nombre:formato.nombre};
  }
  const editarFormato=ruta.match(/^\/formatos-constancia\/([a-z0-9-]+)$/);
  if(editarFormato&&metodo==="PATCH"){
    if(sesion.rol()!=="superadmin")throw new Error("Solo el Super Admin puede editar plantillas.");
    const id=editarFormato[1],formatos=cargarDatosPersistidos("cicsa_formatos_constancia",[]),anterior=formatos.find(f=>f.id===id);
    if(!anterior)throw new Error("La plantilla no existe.");
    const nombre=cuerpo.nombre===undefined?anterior.nombre:String(cuerpo.nombre).trim();
    if(!nombre||nombre.length>150)throw new Error("Indica un nombre de hasta 150 caracteres.");
    if(cuerpo.activo!==undefined&&typeof cuerpo.activo!=="boolean")throw new Error("El estado debe ser activo o inactivo.");
    let mime=anterior.mime;
    if(cuerpo.archivo!==undefined){
      const archivo=cuerpo.archivo;
      if(typeof archivo!=="string"||archivo.length>7000000||!/^data:(application\/pdf|image\/png|image\/jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(archivo))throw new Error("Carga un PDF, PNG o JPG válido de hasta 5 MB.");
      mime=archivo.slice(5,archivo.indexOf(";"));
      await guardarArchivoMedia("formato-constancia-"+id,archivo);
    }
    const actualizado={...anterior,nombre,mime,activo:cuerpo.activo??anterior.activo??true,actualizado:new Date().toISOString()};
    guardarDatosPersistidos("cicsa_formatos_constancia",formatos.map(f=>f.id===id?actualizado:f));
    const actualizaFormato=valor=>valor?.archivoId===id?{...valor,nombre,activo:valor.activo!==false}:valor;
    DB.cursos=DB.cursos.map(c=>c.constancia?.formato?.archivoId===id?{...c,constancia:{...c.constancia,formato:actualizaFormato(c.constancia.formato)}}:c);
    await guardarCursosPersistidos(DB.cursos);
    const emitidas=cargarDatosPersistidos("cicsa_constancias_emitidas",[]).map(c=>c.formato?.archivoId===id?{...c,formato:actualizaFormato(c.formato)}:c);
    guardarDatosPersistidos("cicsa_constancias_emitidas",emitidas);
    return actualizado;
  }
  const eliminarFormato=ruta.match(/^\/formatos-constancia\/([a-z0-9-]+)$/);
  if(eliminarFormato && metodo==="DELETE"){
    if(sesion.rol()!=="superadmin") throw new Error("Solo el Super Admin puede eliminar formatos.");
    const id=eliminarFormato[1],formatos=cargarDatosPersistidos("cicsa_formatos_constancia",[]);
    if(!formatos.some(f=>f.id===id)) throw new Error("La plantilla no existe o ya fue eliminada.");
    if(DB.cursos.some(c=>c.constancia?.formato?.archivoId===id) || cargarDatosPersistidos("cicsa_constancias_emitidas",[]).some(c=>c.formato?.archivoId===id)) throw new Error("No se puede eliminar: la plantilla está asignada a un curso o ya se utilizó en constancias. Desasígnala primero para conservar el historial.");
    guardarDatosPersistidos("cicsa_formatos_constancia",formatos.filter(f=>f.id!==id));
    return {eliminado:true};
  }
  const archivoFormato=ruta.match(/^\/formatos-constancia\/([a-z0-9-]+)\/archivo$/);
  if (archivoFormato && metodo==="GET") {
    const id=archivoFormato[1];
    const propio=sesion.rol()==="trabajador" && cargarDatosPersistidos("cicsa_constancias_emitidas",[]).some(c=>c.usuarioId===sesion.usuario().id && c.formato?.archivoId===id);
    const catalogo=cargarDatosPersistidos("cicsa_formatos_constancia",[]),plantilla=catalogo.find(f=>f.id===id);
    const instructor=sesion.rol()==="instructor"&&plantilla?.activo!==false&&plantilla?.mime==="application/pdf";
    const cursosParaRevision=sesion.rol()==="admin"?cargarDatosPersistidos("cicsa_cursos",DB.cursos):DB.cursos;
    const admin=sesion.rol()==="admin"&&cursosParaRevision.some(c=>c.solicitudCurso?.plantillaConstancia?.archivoId===id||c.constancia?.formato?.archivoId===id);
    if (sesion.rol()!=="superadmin" && !propio && !instructor && !admin) throw new Error("No tienes acceso a este formato.");
    const archivo=await obtenerArchivoMedia("formato-constancia-"+id);
    if (!archivo) throw new Error("El archivo del formato no está disponible en este navegador.");
    return {archivo};
  }
  const configConstancia = ruta.match(/^\/constancias\/configuracion\/(\d+)$/);
  if (configConstancia && metodo === "PATCH") {
    if (sesion.rol() !== "superadmin") throw new Error("Solo el Super Admin puede configurar constancias.");
    const curso = DB.cursos.find(c => c.id === Number(configConstancia[1]));
    if (!curso) throw new Error("Curso no encontrado.");
    const instructor = catalogoInstructores().find(i => i.id === Number(cuerpo.instructorId || curso.instructorId) && i.activo);
    if (!instructor) throw new Error("Selecciona un instructor activo.");
    const insignia = catalogoInsignias().find(i => i.id === (cuerpo.insignia || curso.insigniaId) && i.activa && !i.eliminada);
    if (!insignia && cuerpo.formato?.archivoId!=="cicsa-oficial-v1") throw new Error("Selecciona una insignia activa y válida.");
    const datos = {};
    for (const [campo, maximo] of [["titulo",120],["texto",1000],["firmante",300]]) {
      const valor = String(cuerpo[campo] || "").trim();
      if (!valor || valor.length > maximo) throw new Error("Completa el título, texto y responsable de firma dentro del límite permitido.");
      datos[campo] = valor;
    }
    for(const [campo,maximo] of [["empresa",200],["domicilio",400],["modalidad",30],["responsable",200],["lugar",200],["vigencia",100]]) {
      const valor=cuerpo[campo] ?? (campo==="empresa"?"Corporativo Industrial y Comercial S.A. (CICSA)":campo==="modalidad"?"virtual":"");
      if(typeof valor!=="string"||valor.length>maximo)throw new Error("Revisa los datos de empresa y emisión.");
      datos[campo]=valor.trim();
    }
    if(!["presencial","virtual","mixta"].includes(datos.modalidad))throw new Error("Selecciona una modalidad válida.");
    for (const campo of ["logo", "firma", "firmaResponsable"]) {
      const valor = cuerpo[campo] || "";
      if (typeof valor !== "string" || valor.length > 1400000 || (valor && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(valor))) throw new Error("Usa imágenes PNG, JPG o WEBP de hasta 1 MB.");
      datos[campo] = valor;
    }
    if (cuerpo.formato) {
      const entrada=cuerpo.formato;
      const archivo=entrada.archivoId==="cicsa-oficial-v1"?{id:"cicsa-oficial-v1",nombre:"Plantilla oficial CICSA"}:cargarDatosPersistidos("cicsa_formatos_constancia",[]).find(f=>f.id===entrada.archivoId);
      const permitidos=["trabajador","curso","instructor","registro","horas","nota","fecha","folio","firma","insignia","curp","puesto","empresa","domicilio","titulo","area","numeroEmpleado","categoria","periodoInicio","periodoFin","modalidad","minimaAprobatoria","resultado","instructorCargo","lugar","responsable","firmaResponsable","logo","texto","vigencia"];
      if (!archivo || !Array.isArray(entrada.campos) || entrada.campos.length>permitidos.length) throw new Error("Selecciona un formato cargado y configura sus campos.");
      const vistos=new Set();
      const campos=entrada.campos.map(c=>{
        if (!permitidos.includes(c.clave) || vistos.has(c.clave)) throw new Error("Campo de formato no válido o duplicado.");vistos.add(c.clave);
        for (const prop of ["x","y","ancho","alto","tamano"]) if (!Number.isFinite(c[prop])) throw new Error("La posición y tamaño de los campos deben ser numéricos.");
        if(c.x<0||c.y<0||c.ancho<=0||c.alto<=0||c.x+c.ancho>100.001||c.y+c.alto>100.001||c.tamano<6||c.tamano>72||!Number.isInteger(c.pagina)||c.pagina<1||c.pagina>100||typeof c.visible!=="boolean"||!/^#[0-9a-f]{6}$/i.test(c.color)||!["izquierda","centro","derecha"].includes(c.alineacion)) throw new Error("Revisa página, posición, tamaño y color de los campos.");
        return {clave:c.clave,x:c.x,y:c.y,ancho:c.ancho,alto:c.alto,tamano:c.tamano,pagina:c.pagina,visible:c.visible,color:c.color,alineacion:c.alineacion,...(c.multilinea===true?{multilinea:true}:{})};
      });
      datos.formato={archivoId:archivo.id,nombre:archivo.nombre,campos};
    }
    const actualizado = { ...curso, instructorId:instructor.id, insigniaId:insignia?.id || "", instructorNombre: instructor.nombre, constancia: { ...datos, instructorId: instructor.id, instructor: instructor.nombre, insignia: insignia?.id || "", firma:instructor.firma, firmante:instructor.nombre, instructorRegistro:instructor.registro, instructorDetalle:instructor, insigniaDetalle: insignia ? { id:insignia.id, nombre:insignia.nombre, descripcion:insignia.descripcion, imagen:insignia.imagen, puntos:insignia.puntos || 0 } : null, actualizadoPor: sesion.usuario().id, fecha: new Date().toISOString() } };
    const cursosActualizados = DB.cursos.map(c => c.id === curso.id ? actualizado : c);
    await guardarCursosPersistidos(cursosActualizados);
    DB.cursos = cursosActualizados;
    return actualizado;
  }
  const emitirDc3 = ruta.match(/^\/constancias\/(CICSA-\d+)\/dc3$/);
  if (emitirDc3 && metodo === "GET") {
    if(sesion.rol()!=="superadmin")throw new Error("Solo el Super Admin puede preparar la DC-3.");
    const registro=cargarDatosPersistidos("cicsa_constancias_emitidas",[]).find(c=>c.folio===emitirDc3[1]);
    if(!registro)throw new Error("Primero debe existir una constancia obtenida al aprobar el curso.");
    return registro.dc3||datosDc3Sistema(registro);
  }
  if (emitirDc3 && metodo === "POST") {
    if (sesion.rol() !== "superadmin") throw new Error("Solo el Super Admin puede emitir la DC-3.");
    const emitidas=cargarDatosPersistidos("cicsa_constancias_emitidas",[]);
    const registro=emitidas.find(c=>c.folio===emitirDc3[1]);
    if (!registro) throw new Error("Primero debe existir una constancia obtenida al aprobar el curso.");
    if (registro.dc3) return registro.dc3;
    const oficial=cuerpo.formato==="cicsa-dc3-v1";
    if(oficial){
      const sistema=datosDc3Sistema(registro),completados={};
      for(const clave of ["trabajadorNombre","curp","puesto","ocupacion","areaTematica","periodoInicio","periodoFin"]){
        if(!sistema[clave])completados[clave]=cuerpo[clave];
      }
      cuerpo={...sistema,...completados};
      if(!sistema.instructor)throw new Error("La constancia no tiene instructor registrado.");
    }
    const datos={};
    for (const [campo,maximo] of [["trabajadorNombre",250],["curp",18],["puesto",150],["ocupacion",200],["empresa",250],["rfc",13],["areaTematica",200],["representanteEmpresa",200]]) {
      datos[campo]=String(cuerpo[campo] || "").trim();
      if (!datos[campo] || datos[campo].length>maximo) throw new Error("Completa los datos de trabajador, empresa, curso y representante para generar DC-3.");
    }
    datos.curp=datos.curp.toUpperCase();datos.rfc=datos.rfc.toUpperCase();
    if (!/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(datos.curp)) throw new Error("La CURP debe tener 18 caracteres con formato válido.");
    if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(datos.rfc)) throw new Error("El RFC debe incluir homoclave y tener 12 o 13 caracteres.");
    if (typeof cuerpo.requiereRepresentanteTrabajadores !== "boolean") throw new Error("Indica si corresponde representante de trabajadores.");
    datos.requiereRepresentanteTrabajadores=cuerpo.requiereRepresentanteTrabajadores;
    datos.representanteTrabajadores=String(cuerpo.representanteTrabajadores || "").trim();
    if (datos.representanteTrabajadores.length>200 || (datos.requiereRepresentanteTrabajadores && !datos.representanteTrabajadores)) throw new Error("Completa el representante de los trabajadores.");
    for (const campo of ["periodoInicio","periodoFin"]) {
      datos[campo]=String(cuerpo[campo] || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datos[campo]) || !Number.isFinite(Date.parse(datos[campo])) || new Date(datos[campo]).toISOString().slice(0,10)!==datos[campo]) throw new Error("Captura un periodo de capacitación válido.");
    }
    if (datos.periodoFin<datos.periodoInicio || datos.periodoFin>fechaDc3Sistema(registro.fecha)) throw new Error("El periodo debe ser cronológico y terminar a más tardar en la fecha de aprobación.");
    for (const campo of ["firmaEmpresa","firmaTrabajadores"]) {
      datos[campo]=cuerpo[campo] || "";
      if (typeof datos[campo]!=="string" || datos[campo].length>1400000 || (datos[campo] && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(datos[campo]))) throw new Error("Las firmas deben ser PNG, JPG o WEBP de hasta 1 MB.");
    }
    datos.agente=registro.instructorDetalle?.tipo === "externo" ? (registro.instructorDetalle.agente || registro.instructor) : datos.empresa;
    if(oficial)datos.agente=datosDc3Sistema(registro).agente;
    const dc3={...datos,...(oficial?{formato:"cicsa-dc3-v1"}:{}),folio:registro.folio,curso:registro.curso,horas:registro.horas,instructor:registro.instructor,registroInstructor:registro.instructorRegistro || "",firmaInstructor:registro.firma || "",emitidoPor:sesion.usuario().id,fecha:new Date().toISOString()};
    guardarDatosPersistidos("cicsa_constancias_emitidas",emitidas.map(c=>c.folio===registro.folio?{...c,dc3}:c));
    return dc3;
  }
  if (ruta === "/constancias" && metodo === "GET") {
    let emitidas = cargarDatosPersistidos("cicsa_constancias_emitidas", []);
    // Recupera constancias que faltaran en cursos aprobados antes de activar la emisión automática.
    // No crea duplicados: cada trabajador recibe una sola constancia por curso.
    const personas = sesion.rol() === "superadmin"
      ? DB.usuarios.filter(u=>u.rol==="trabajador")
      : sesion.rol() === "trabajador" ? DB.usuarios.filter(u=>u.id===sesion.usuario().id && u.rol==="trabajador") : [];
    let huboCambios = false;
    for (const persona of personas) {
      for (const [cursoId,avance] of Object.entries(DB.progreso[persona.id] || {})) {
        if (avance?.estado!=="completado" || avance.examenAprobado!==true) continue;
        if (emitidas.some(c=>c.usuarioId===persona.id && Number(c.cursoId)===Number(cursoId))) {
          const existente=emitidas.find(c=>c.usuarioId===persona.id && Number(c.cursoId)===Number(cursoId));
          if (!avance.reconocimiento) { avance.reconocimiento=existente; huboCambios=true; }
          continue;
        }
        const curso=DB.cursos.find(c=>Number(c.id)===Number(cursoId));
        if (!curso) continue;
        const resultado=avance.resultadoFinal || {};
        const nota=Number(resultado.nota ?? avance.nota ?? 0);
        const instructor=instructorDelCurso(curso);
        const catalogo=catalogoInsignias();
        const insignia=catalogo.find(i=>i.id===(curso.insigniaId || curso.constancia?.insignia) && i.activa!==false && !i.eliminada)
          || catalogo.find(i=>i.id==="aprobacion" && i.activa!==false && !i.eliminada)
          || catalogo.find(i=>i.activa!==false && !i.eliminada);
        const numero=Math.max(0,...emitidas.map(c=>c.numero||0))+1;
        const fecha=avance.fechaFin ? new Date(avance.fechaFin).toISOString() : new Date().toISOString();
        const {formato:_formatoCurso,...constanciaBase}=curso.constancia||{};
        const formatoCurso=formatoActivoDelCurso(curso);
        const cfg={titulo:"Constancia de aprobación",texto:"Por haber aprobado satisfactoriamente el curso",...constanciaBase,...(formatoCurso?{formato:formatoCurso}:{}),
          ...(instructor?{instructorId:instructor.id,instructor:instructor.nombre,firmante:instructor.nombre,firma:instructor.firma,instructorRegistro:instructor.registro,instructorDetalle:instructor}:{}),
          ...(insignia?{insignia:insignia.id,insigniaDetalle:{id:insignia.id,nombre:insignia.nombre,descripcion:insignia.descripcion,imagen:insignia.imagen,puntos:insignia.puntos||0}}:{})};
        const registro={numero,folio:"CICSA-"+String(numero).padStart(6,"0"),usuarioId:persona.id,trabajador:persona.nombre,cursoId:Number(cursoId),curso:curso.nombre,horas:curso.horas??"",nota,fecha,...cfg,
          empresa:cfg.empresa||"Corporativo Industrial y Comercial S.A. (CICSA)",area:persona.area||"",puesto:persona.puesto||"",numeroEmpleado:persona.numeroEmpleado||"",modalidad:cfg.modalidad||curso.modalidad||"virtual",resultado:"APROBADO",minimaAprobatoria:resultado.minimaAprobatoria??70};
        Object.assign(registro,datosConstanciaSistema(curso,persona,instructor,fecha));
        registro.numero=numero;registro.folio="CICSA-"+String(numero).padStart(6,"0");registro.nota=nota;registro.resultado="APROBADO";registro.insignia=cfg.insignia||insignia?.id||"";registro.insigniaDetalle=cfg.insigniaDetalle||registro.insigniaDetalle;
        emitidas.push(registro);avance.reconocimiento=registro;huboCambios=true;
      }
    }
    if(huboCambios){guardarDatosPersistidos("cicsa_constancias_emitidas",emitidas);guardarDatosPersistidos("cicsa_progreso",DB.progreso);}
    // Las emisiones conservan la plantilla y sus datos tal como se emitieron,
    // aunque posteriormente se desactive la plantilla del curso.
    if (sesion.rol() === "superadmin") return emitidas;
    if (sesion.rol() === "trabajador") return emitidas.filter(c => c.usuarioId === sesion.usuario().id);
    throw new Error("No tienes permiso para consultar constancias.");
  }

  // ---- Soporte: solicitudes propias y atención según el rol ----
  if (ruta === "/soporte" || /^\/soporte\/\d+$/.test(ruta)) {
    const actor = DB.usuarios.find(u => u.id === Number(sesion.usuario().id));
    const tickets = cargarDatosPersistidos("cicsa_soporte", []);
    const puedeAtender = t => actor.rol === "superadmin" || (
      actor.rol === "admin" && !t.soloSuperadmin &&
      !["admin", "superadmin"].includes(DB.usuarios.find(u => u.id === t.usuarioId)?.rol)
    );
    const presentar = t => ({ ...t, puedeAtender: puedeAtender(t) });
    if (metodo === "GET" && ruta === "/soporte") {
      return tickets.filter(t => t.usuarioId === actor.id || puedeAtender(t)).map(presentar).reverse();
    }
    if (metodo === "POST" && ruta === "/soporte") {
      const categorias = ["acceso", "password", "curso", "evaluacion", "certificado", "repetir", "otro"];
      const tipo = String(cuerpo?.tipo || "");
      const descripcion = String(cuerpo?.descripcion || "").trim();
      if (!categorias.includes(tipo)) throw new Error("Selecciona un tipo de solicitud.");
      if (descripcion.length < 10 || descripcion.length > 3000) throw new Error("Describe el problema con entre 10 y 3000 caracteres.");
      const cursoId = cuerpo.cursoId ? Number(cuerpo.cursoId) : null;
      const curso = cursoId ? DB.cursos.find(c => c.id === cursoId) : null;
      if (cursoId && (!curso || (actor.rol === "trabajador" && (curso.estado !== "publicado" || (curso.asignadoA !== "Todos" && !(curso.asignadoAIds || []).includes(actor.id)))))) throw new Error("Selecciona uno de tus cursos asignados.");
      if (tipo === "repetir" && !curso) throw new Error("Selecciona el curso que deseas repetir.");
      if (tipo === "repetir") {
        const pendiente = tickets.find(t => t.tipo === "repetir" && t.usuarioId === actor.id && t.cursoId === cursoId && t.estado !== "resuelto");
        if (pendiente) {
          // Repara avisos faltantes de solicitudes que ya estaban pendientes.
          for (const rolDestino of ["admin", "superadmin"]) {
            const yaAvisado = DB.notificacionesAdmin.some(n =>
              n.tipo === "repetir-solicitado" &&
              n.destinatarioRol === rolDestino &&
              String(n.ticketId) === String(pendiente.id)
            );
            if (!yaAvisado) agregarNotificacionCICSA({
              tipo: "repetir-solicitado", destinatarioRol: rolDestino,
              usuarioId: actor.id, cursoId,
              detalle: `${actor.nombre} solicitó autorización para repetir el curso «${curso.nombre}».`,
              ticketId: pendiente.id, leida: false,
            });
          }
          return presentar(pendiente);
        }
      }
      const captura = cuerpo.captura || "";
      if (typeof captura !== "string" || captura.length > 2800000 || (captura && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(captura))) throw new Error("La captura debe ser PNG, JPG o WEBP de hasta 2 MB.");
      const ticket = {
        id: Math.max(0, ...tickets.map(t => Number(t.id) || 0)) + 1,
        usuarioId: actor.id, nombre: actor.nombre, correo: actor.correo,
        tipo, descripcion, cursoId, curso: curso?.nombre || "", captura,
        estado: "pendiente", respuesta: "", fecha: new Date().toISOString(),
        soloSuperadmin: tipo === "password" || ["admin", "superadmin"].includes(actor.rol)
      };
      guardarDatosPersistidos("cicsa_soporte", [...tickets, ticket]);
      if (tipo === "repetir") {
        for (const rolDestino of ["admin", "superadmin"]) {
          agregarNotificacionCICSA({
            tipo: "repetir-solicitado", destinatarioRol: rolDestino,
            usuarioId: actor.id, cursoId, detalle: `${actor.nombre} solicitó autorización para repetir el curso «${curso.nombre}».`,
            ticketId: ticket.id, leida: false,
          });
        }
      }
      return presentar(ticket);
    }
    if (metodo === "PATCH") {
      const ticket = tickets.find(t => t.id === Number(ruta.split("/")[2]));
      if (!ticket || !puedeAtender(ticket)) throw new Error("No tienes permiso para atender esta solicitud.");
      const estado = String(cuerpo?.estado || "");
      const respuesta = String(cuerpo?.respuesta || "").trim();
      if (!["pendiente", "en_atencion", "resuelto"].includes(estado)) throw new Error("Estado no válido.");
      if (respuesta.length > 3000 || (estado === "resuelto" && respuesta.length < 5)) throw new Error("Indica la solución antes de marcar la solicitud como resuelta.");
      if (cuerpo?.autorizarRepeticion === true) {
        if (!["admin", "superadmin"].includes(actor.rol) || ticket.tipo !== "repetir" || ticket.estado === "resuelto") throw new Error("Esta solicitud no admite una nueva autorización.");
        await simularSolicitud("POST", `/progreso/reabrir/${ticket.cursoId}/${ticket.usuarioId}`, {});
        ticket.repeticionAutorizada = true;
      }
      Object.assign(ticket, { estado, respuesta, atendidoPor: actor.id, actualizado: new Date().toISOString() });
      guardarDatosPersistidos("cicsa_soporte", tickets);
      const solicitante = DB.usuarios.find(u => u.id === ticket.usuarioId);
      if (solicitante && estado !== "pendiente") agregarNotificacionCICSA({
        id: `soporte-respuesta-${ticket.id}-${ticket.actualizado}`,
        tipo: "actividad-apartado", destinatarioRol: solicitante.rol, destinatarioId: solicitante.id,
        usuarioId: actor.id, destino: "soporte", detalle: `Hay una actualización en tu solicitud de soporte: ${respuesta || estado}.`,
      });
      return presentar(ticket);
    }
    throw new Error("Operación de soporte no disponible.");
  }

  // Catalogos disponibles en Altas; administracion exclusiva del Super Admin.
  if (ruta === "/catalogos/organizacion" && ["GET", "POST", "PATCH"].includes(metodo)) {
    requerirAdministrador();
    const normalizar = valor => String(valor || "").trim().replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const unicos = valores => {
      const vistos = new Set();
      return valores.filter(v => typeof v === "string" && v.trim()).map(v => v.trim()).filter(v => {
        const clave = normalizar(v);
        if (vistos.has(clave)) return false;
        vistos.add(clave); return true;
      }).sort((a, b) => a.localeCompare(b, "es"));
    };
    const departamentosBase = INFO_PLATFORMS.organizacion.map(r=>r.departamento);
    const cambios = cargarDatosPersistidos("cicsa_organizacion_cambios", []);
    const originales = {
      departamentos: unicos([...departamentosBase, ...cargarDatosPersistidos("cicsa_departamentos", []), ...DB.usuarios.filter(u => !u.eliminado).map(u => u.area).filter(v => v && v !== "Sin asignar")]),
      puestos: unicos([...INFO_PLATFORMS.organizacion.map(r=>r.puesto), ...cargarDatosPersistidos("cicsa_puestos", []), ...DB.usuarios.filter(u => !u.eliminado).map(u => u.puesto)])
    };
    for (const tipo of ["departamentos", "puestos"]) originales[tipo] = unicos([...originales[tipo], ...cambios.filter(c=>c.tipo===tipo).map(c=>c.nombre)]);
    const actuales = () => {
      const catalogos = {};
      for (const tipo of ["departamentos", "puestos"]) {
        const vistos = new Set();
        catalogos[tipo] = originales[tipo].map(nombre => {
          const cambio = cambios.find(c => c.tipo === tipo && (c.id === normalizar(nombre) || normalizar(c.nombre) === normalizar(nombre)));
          return cambio ? {id:cambio.id, nombre:cambio.nombre, activo:cambio.activo} : {id:normalizar(nombre), nombre, activo:true};
        }).filter(item => { if(vistos.has(item.id)) return false; vistos.add(item.id); return true; }).sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"));
      }
      const relaciones = INFO_PLATFORMS.organizacion.map(r=>{
        const departamento=catalogos.departamentos.find(i=>i.id===normalizar(r.departamento));
        const puesto=catalogos.puestos.find(i=>i.id===normalizar(r.puesto));
        return departamento && puesto ? {departamento:departamento.nombre,puesto:puesto.nombre,activo:departamento.activo&&puesto.activo} : null;
      }).filter(Boolean);
      return {departamentos:catalogos.departamentos.filter(i=>i.activo).map(i=>i.nombre), puestos:catalogos.puestos.filter(i=>i.activo).map(i=>i.nombre), catalogos, relaciones};
    };
    if (metodo === "GET") return actuales();
    if (sesion.rol() !== "superadmin") throw new Error("Solo el Super Admin puede administrar puestos y departamentos.");
    const tipo = cuerpo?.tipo;
    if (!["departamentos", "puestos"].includes(tipo)) throw new Error("Selecciona un catalogo valido.");
    const lista = actuales().catalogos[tipo];
    const anterior = metodo === "PATCH" ? lista.find(i=>i.id===cuerpo.id) : null;
    if (metodo === "PATCH" && !anterior) throw new Error("El registro ya no existe. Actualiza el catálogo.");
    const nombre = String(cuerpo.nombre ?? anterior?.nombre ?? "").trim().replace(/\s+/g, " ");
    if (!nombre || nombre.length > 150) throw new Error("Escribe un nombre de hasta 150 caracteres.");
    if (lista.some(i=>i.id!==anterior?.id && (normalizar(i.nombre)===normalizar(nombre) || i.id===normalizar(nombre)))) throw new Error("Ese nombre ya existe en el catálogo, incluso si está inactivo.");
    if (metodo === "PATCH") {
      if (cuerpo.activo !== undefined && typeof cuerpo.activo !== "boolean") throw new Error("El estado no es válido.");
      const registro = {tipo, id:anterior.id, nombre, activo:cuerpo.activo ?? anterior.activo};
      const indice = cambios.findIndex(c=>c.tipo===tipo && c.id===anterior.id);
      if (indice<0) cambios.push(registro); else cambios[indice]=registro;
      guardarDatosPersistidos("cicsa_organizacion_cambios", cambios);
    } else {
      const clave = tipo === "departamentos" ? "cicsa_departamentos" : "cicsa_puestos";
      guardarDatosPersistidos(clave, [...cargarDatosPersistidos(clave, []), nombre]);
      originales[tipo].push(nombre);
    }
    return actuales();
  }

  // ---- Usuarios (admin) ----
  if (ruta === "/usuarios" && metodo === "GET") {
    requerirAdministrador();
    return DB.usuarios.filter(u => !u.eliminado && permisos.gestionarUsuario(u)).map(({ password, ...u }) => sesion.rol() === "superadmin" ? { ...u, password } : u);
  }
  if (ruta === "/usuarios" && metodo === "POST") {
    requerirAdministrador();
    const nuevoId = DB.usuarios.length ? Math.max(...DB.usuarios.map((u) => u.id)) + 1 : 1;
    const rol = String(cuerpo.rol || "").trim().toLowerCase();
    if (!["superadmin", "admin", "instructor", "trabajador"].includes(rol)) {
      throw new Error("El rol seleccionado no es válido.");
    }
    const correo = String(cuerpo.correo || "").trim().toLowerCase();
    if (!String(cuerpo.nombre || "").trim() || !correo || !cuerpo.password) throw new Error("Completa nombre, correo y contraseña.");
    if (DB.usuarios.some(u => u.correo.toLowerCase() === correo)) throw new Error("El correo ya está registrado.");
    const puesto = String(cuerpo.puesto || "").trim();
    const areaOcupacionClave = String(cuerpo.areaOcupacionClave || "").trim();
    if (areaOcupacionClave && !ClasificacionCursos.ocupaciones.some(item => item.clave === areaOcupacionClave)) throw new Error("Selecciona una clave válida del área/subárea.");
    const curp = String(cuerpo.curp || "").trim().toUpperCase();
    if (curp && !/^[A-Z0-9]{18}$/.test(curp)) throw new Error("La CURP debe contener 18 letras y números.");
    const claveDc3 = rol === "instructor" ? String(cuerpo.claveDc3 || "").trim() : "";
    if (claveDc3.length > 100) throw new Error("El registro de agente admite hasta 100 caracteres.");
    const firma = rol === "instructor" ? (cuerpo.firma || "") : "";
    if (typeof firma !== "string" || firma.length > 1400000 || (firma && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(firma))) throw new Error("La firma debe ser PNG, JPG o WEBP de hasta 1 MB.");
    const fichas = rol === "instructor" ? cargarDatosPersistidos("cicsa_instructores", []) : [];
    if (claveDc3 && fichas.some(i => i.registro?.toLowerCase() === claveDc3.toLowerCase())) throw new Error("El registro pertenece a otro instructor.");
    const nuevo = { puesto, areaOcupacionClave, curp, claveDc3, nombre: String(cuerpo.nombre).trim(), correo, password: String(cuerpo.password), id: nuevoId, activo: true, ultimoAcceso: null, area: String(cuerpo.area || "Sin asignar").trim(), rol };
    if (rol === "instructor") {
      fichas.push({id: nuevoId, usuarioId: nuevoId, nombres: String(cuerpo.nombres || cuerpo.nombre).trim(), apellidos: [cuerpo.apellidoPaterno, cuerpo.apellidoMaterno].filter(Boolean).join(" ").trim(), registro: claveDc3, puesto, firma, agente: "", rfc: "", tipo: "interno", activo: true});
      guardarDatosPersistidos("cicsa_instructores", fichas);
    }
    DB.usuarios.push(nuevo);
    guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
    ["admin", "superadmin"].forEach(rol => agregarNotificacionCICSA({ tipo: "usuario-nuevo", usuarioId: nuevo.id, destinatarioRol: rol, detalle: `Se registró ${nuevo.nombre}.` }));
    return nuevo;
  }
  if (ruta === "/usuarios/importar" && metodo === "POST") {
    requerirAdministrador();
    const registros = Array.isArray(cuerpo.registros) ? cuerpo.registros : [];
    if (!registros.length) throw new Error("No hay trabajadores para importar.");
    const existentes = new Set(DB.usuarios.map((u) => String(u.correo || "").toLowerCase()));
    let siguienteId = DB.usuarios.length ? Math.max(...DB.usuarios.map((u) => Number(u.id) || 0)) + 1 : 1;
    const creados = [], omitidos = [];
    registros.forEach((registro) => {
      const nombre = String(registro.nombre || "").trim();
      const area = String(registro.area || "").trim() || "Sin asignar";
      const puesto = String(registro.puesto || "").trim();
      const curp = String(registro.curp || "").trim().toUpperCase();
      if (curp && !/^[A-Z0-9]{18}$/.test(curp)) { omitidos.push({ ...registro, motivo: "La CURP debe contener 18 letras y números." }); return; }
      if (!nombre) { omitidos.push({ ...registro, motivo: "Falta el nombre" }); return; }
      const correoBase = String(registro.correo || "").trim().toLowerCase();
      const correo = correoBase || (nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(" ").filter(Boolean).slice(0,2).join(".") + "@cicsa.mx");
      if (existentes.has(correo)) { omitidos.push({ ...registro, motivo: "Correo ya registrado" }); return; }
      const password = String(registro.password || "Cicsa2026").trim() || "Cicsa2026";
      const claveDc3 = String(registro.claveDc3 || "").trim();
      if (claveDc3.length > 100) { omitidos.push({ ...registro, motivo: "La clave D-C3 admite hasta 100 caracteres." }); return; }
      const nuevo = { id: siguienteId++, nombre, correo, password, rol: "trabajador", activo: true, ultimoAcceso: null, area, puesto, curp, claveDc3 };
      DB.usuarios.push(nuevo); existentes.add(correo); creados.push(nuevo);
    });
    guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
    if (creados.length) ["admin", "superadmin"].forEach(rol => agregarNotificacionCICSA({ tipo: "usuarios-nuevos", usuarioIds: creados.map(u => u.id), destinatarioRol: rol, detalle: `Se agregaron ${creados.length} usuario${creados.length === 1 ? "" : "s"} nuevos.` }));
    return { creados, omitidos };
  }
  const eliminarUsuario = ruta.match(/^\/usuarios\/(\d+)$/);
  if (eliminarUsuario && metodo === "DELETE") {
    requerirAdministrador();
    const usuario = DB.usuarios.find(u => u.id === Number(eliminarUsuario[1]));
    if (!usuario || usuario.eliminado) throw new Error("Usuario no encontrado.");
    if (usuario.id === sesion.usuario().id) throw new Error("No puedes eliminar tu propia cuenta.");
    if (!permisos.gestionarUsuario(usuario)) throw new Error("No puedes eliminar esta cuenta.");
    usuario.eliminado = true;
    usuario.activo = false;
    usuario.fechaEliminacion = new Date().toISOString();
    guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
    return { mensaje: "Usuario eliminado. Se conserva su historial." };
  }
  const matchToggle = ruta.match(/^\/usuarios\/(\d+)\/estado$/);
  if (matchToggle && metodo === "PATCH") {
    requerirAdministrador();
    const u = DB.usuarios.find((x) => x.id == matchToggle[1]);
    if (u) u.activo = cuerpo.activo;
    guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
    return u;
  }
  const matchPassword = ruta.match(/^\/usuarios\/(\d+)\/password$/);
  if (matchPassword && metodo === "PATCH") {
    requerirAdministrador();
    const u = DB.usuarios.find((x) => x.id == matchPassword[1]);
    if (u) u.password = cuerpo.password;
    guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
    return u;
  }
  const matchRol = ruta.match(/^\/usuarios\/(\d+)\/rol$/);
  if (matchRol && metodo === "PATCH") {
    requerirAdministrador();
    const rol = String(cuerpo.rol || "").trim().toLowerCase();
    if (!["superadmin", "admin", "instructor", "trabajador"].includes(rol)) {
      throw new Error("El rol seleccionado no es válido.");
    }
    const u = DB.usuarios.find((x) => x.id == matchRol[1]);
    if (!u) throw new Error("Trabajador no encontrado.");
    u.rol = rol;
    guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
    return u;
  }

  // ---- Solicitudes de restablecimiento (admin) ----
  if (ruta === "/solicitudes-restablecimiento" && metodo === "GET") {
    requerirAdministrador();
    return DB.solicitudesRestablecimiento.map((s) => ({
      ...s,
      usuario: DB.usuarios.find((u) => u.id === s.usuarioId),
    }));
  }
  if (ruta === "/notificaciones-admin/comunicado" && metodo === "POST") {
    requerirAdministrador();
    const comunicado = cuerpo.comunicado || {};
    if (!comunicado.id || !String(comunicado.titulo || "").trim()) throw new Error("El comunicado no tiene un identificador o título válido.");
    ["admin", "superadmin"].forEach(rol => {
      const id = `comunicado-${comunicado.id}-${rol}`;
      if (!DB.notificacionesAdmin.some(n => n.id === id)) agregarNotificacionCICSA({
        id, tipo: "comunicado-publicado", destinatarioRol: rol,
        detalle: `Nuevo comunicado publicado: «${String(comunicado.titulo).trim()}».`,
      });
    });
    return { mensaje: "Se notificó a Administración y al Superadministrador." };
  }
  if (ruta === "/notificaciones-admin" && metodo === "GET") {
    if (!sesion.activa() || !["admin", "superadmin", "instructor"].includes(sesion.rol())) throw new Error("No tienes permisos para consultar notificaciones.");
    // Recordatorios de vencimiento: se crean una sola vez por curso, fecha y perfil.
    const ahoraAvisos = Date.now();
    DB.cursos.filter(c => c.estado === "publicado" && c.fechaFin && Number.isFinite(new Date(c.fechaFin).getTime()))
      .filter(c => new Date(c.fechaFin).getTime() > ahoraAvisos && new Date(c.fechaFin).getTime() - ahoraAvisos <= 7 * 24 * 60 * 60 * 1000)
      .forEach(c => ["admin", "superadmin"].forEach(rol => {
        const idAviso = `vencimiento-${rol}-${c.id}-${String(c.fechaFin).slice(0,10)}`;
        if (!DB.notificacionesAdmin.some(n => n.id === idAviso)) agregarNotificacionCICSA({ id: idAviso, tipo: "curso-vencimiento", cursoId: c.id, destinatarioRol: rol, fecha: new Date().toISOString(), leida: false });
      }));
    // Sincroniza solicitudes pendientes de repetición con la campana administrativa.
    // Esto recupera avisos que faltaban aunque el ticket ya existiera.
    if (["admin", "superadmin"].includes(sesion.rol())) {
      const ticketsRepeticion = cargarDatosPersistidos("cicsa_soporte", []);
      ticketsRepeticion.filter(t => t.tipo === "repetir" && t.estado !== "resuelto").forEach(t => {
        const actorSolicitud = DB.usuarios.find(u => String(u.id) === String(t.usuarioId));
        if (!actorSolicitud) return;
        const cursoSolicitud = DB.cursos.find(c => String(c.id) === String(t.cursoId));
        ["admin", "superadmin"].forEach(rolDestino => {
          const existe = DB.notificacionesAdmin.some(n =>
            n.tipo === "repetir-solicitado" &&
            n.destinatarioRol === rolDestino &&
            String(n.ticketId) === String(t.id)
          );
          if (!existe) agregarNotificacionCICSA({
            tipo: "repetir-solicitado", destinatarioRol: rolDestino,
            usuarioId: actorSolicitud.id, cursoId: t.cursoId,
            detalle: `${actorSolicitud.nombre} solicitó autorización para repetir el curso «${cursoSolicitud?.nombre || t.curso || "Curso"}».`,
            ticketId: t.id, leida: false,
          });
        });
      });
    }
    return DB.notificacionesAdmin.filter(notificacionVisibleParaActual).map((n) => ({
      ...n,
      usuario: DB.usuarios.find((u) => u.id === n.usuarioId),
      curso: n.cursoId ? DB.cursos.find((c) => c.id === n.cursoId) : null,
    }));
  }
  if (ruta === "/notificaciones-admin" && metodo === "DELETE") {
    if (!sesion.activa() || !["admin", "superadmin", "instructor"].includes(sesion.rol())) throw new Error("No tienes permisos para eliminar notificaciones.");
    DB.notificacionesAdmin = DB.notificacionesAdmin.filter((n) => !notificacionVisibleParaActual(n));
    guardarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
    return { mensaje: "Notificaciones eliminadas." };
  }
  const matchNotificacion = ruta.match(/^\/notificaciones-admin\/([^/]+)$/);
  if (matchNotificacion && metodo === "DELETE") {
    if (!sesion.activa() || !["admin", "superadmin", "instructor"].includes(sesion.rol())) throw new Error("No tienes permisos para eliminar notificaciones.");
    const indice = DB.notificacionesAdmin.findIndex((n) => String(n.id) === decodeURIComponent(matchNotificacion[1]));
    if (indice < 0 || !notificacionVisibleParaActual(DB.notificacionesAdmin[indice])) throw new Error("Notificación no encontrada.");
    DB.notificacionesAdmin.splice(indice, 1);
    guardarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
    return { mensaje: "Notificación eliminada." };
  }
  const matchResolverSolicitud = ruta.match(/^\/solicitudes-restablecimiento\/(\d+)\/resolver$/);
  if (matchResolverSolicitud && metodo === "POST") {
    requerirAdministrador();
    const s = DB.solicitudesRestablecimiento.find((x) => x.id == matchResolverSolicitud[1]);
    if (s) {
      s.estado = "resuelto";
      const u = DB.usuarios.find((x) => x.id === s.usuarioId);
      if (u) u.password = cuerpo.password;
      guardarDatosPersistidos("cicsa_usuarios", DB.usuarios);
      guardarDatosPersistidos("cicsa_solicitudes_restablecimiento", DB.solicitudesRestablecimiento);
    }
    return s;
  }

  // ---- Agenda compartida ----
  // La agenda es de solo lectura y muestra únicamente cursos publicados a todos los perfiles.
  if (ruta === "/agenda/cursos" && metodo === "GET") {
    if (!sesion.activa()) throw new Error("Sesión no válida.");
    return cargarCursosConMiniaturas(DB.cursos.filter((c) => c.estado === "publicado"));
  }

  // ---- Cursos ----
  if (ruta === "/cursos" && metodo === "GET") {
    if (sesion.rol() === "trabajador") {
      return cargarCursosConMiniaturas(DB.cursos.filter(c => c.estado === "publicado" && (c.asignadoA === "Todos" || (c.asignadoAIds || []).includes(Number(sesion.usuario().id)))));
    }
    if (sesion.rol() === "instructor") return cargarCursosConMiniaturas(DB.cursos.filter(cursoPropioDelInstructor));
    return cargarCursosConMiniaturas(DB.cursos);
  }
  const matchCurso = ruta.match(/^\/cursos\/(\d+)$/);
  if (matchCurso && metodo === "GET") {
    const base = DB.cursos.find((c) => c.id == matchCurso[1]);
    const curso = base && sesion.rol() === "trabajador" ? cursoParaTrabajador(base, sesion.usuario().id) : base;
    if (!curso) throw new Error("No se encontró el curso.");
    exigirCursoPropioDelInstructor(curso);
    const usuario = sesion.usuario();
    if (usuario?.rol === "trabajador" && curso.estado !== "publicado") throw new Error("Este curso no está publicado.");
    if (usuario?.rol === "trabajador" && curso && curso.asignadoA !== "Todos"
      && !(Array.isArray(curso.asignadoAIds) && curso.asignadoAIds.includes(Number(usuario.id)))) {
      throw new Error("No tienes permiso para realizar este curso.");
    }
    if (usuario?.rol === "trabajador" && curso) {
      if (DB.progreso[usuario.id]?.[curso.id]?.bloqueadoPorExamen) throw new Error("Curso bloqueado por examen no aprobado. Solicita repetir al Super Admin.");
      const temporal = estadoTemporalCurso(curso);
      if (temporal === "programado") throw new Error(`Este curso aún no está abierto. Apertura: ${new Date(curso.fechaInicio).toLocaleString("es-MX")}.`);
      if (temporal === "cerrado") throw new Error("El periodo de este curso ya terminó.");
    }
    const cursoCompleto = clonarCurso(curso);
    await resolverMediaAlCargar(cursoCompleto);
    return cursoCompleto;
  }
  if (ruta === "/cursos" && metodo === "POST") {
    permisos.exigir("crearCursos");
    cuerpo = normalizarDuracionCurso(cuerpo);
    cuerpo = vincularCatalogosCurso(cuerpo);
    const propuestaPlantilla=validarPlantillaPropuestaCurso(cuerpo.plantillaConstanciaId,cuerpo.plantillaConstanciaCampos);
    const { evaluacionesIniciales, plantillaConstanciaId, plantillaConstanciaCampos, ...datosCurso } = cuerpo;
    validarMinimaExamen(evaluacionesIniciales?.examen?.minimaAprobatoria);
    if (Array.isArray(evaluacionesIniciales?.examen?.preguntas) && evaluacionesIniciales.examen.preguntas.length > 25) {
      throw new Error("El Examen final admite un máximo de 25 preguntas.");
    }
    const nuevo = {
      modulos: [],
      ...normalizarHorarioCurso(datosCurso),
      id: DB.cursos.reduce((mayor, curso) => Math.max(mayor, Number(curso.id) || 0), 0) + 1,
      estado: "pendiente", asignadoA: "", asignadoAIds: [], creadoPor:sesion.usuario().id, solicitudCurso: agregarPlantillaPropuesta(nuevaSolicitudCurso(), propuestaPlantilla),
      versionActual: 0, historialVersiones: [],
    };
    registrarCambioVersionCurso(nuevo, ["Creacion del curso"]);
    DB.cursos.push(nuevo);
    try {
      if (evaluacionesIniciales) {
        DB.evaluaciones[nuevo.id] = { evaluacion: evaluacionesIniciales.evaluacion ? { ...evaluacionesIniciales.evaluacion, preguntas: [] } : null, examen: evaluacionesIniciales.examen || null };
        guardarDatosPersistidos("cicsa_evaluaciones", DB.evaluaciones);
      }
      await guardarCursosPersistidos(DB.cursos);
      notificarRevisionCurso(nuevo, "nuevo");
    } catch (error) {
      DB.cursos.pop();
      if (evaluacionesIniciales) {
        delete DB.evaluaciones[nuevo.id];
        guardarDatosPersistidos("cicsa_evaluaciones", DB.evaluaciones);
      }
      throw error;
    }
    return nuevo;
  }

  const asignacion = ruta.match(/^\/cursos\/(\d+)\/asignacion$/);
  if (asignacion && metodo === "PATCH") {
    const curso = DB.cursos.find(c => c.id === Number(asignacion[1]));
    if (!curso) throw new Error("Curso no encontrado.");
    const ids = [...new Set((cuerpo.asignadoAIds || []).map(Number))];
    if (ids.some(id => !DB.usuarios.some(u => u.id === id && u.rol === "trabajador" && u.activo))) throw new Error("Selecciona trabajadores activos.");
    const anterior = { ...curso };
    Object.assign(curso, { asignadoA: cuerpo.asignadoA === "Todos" ? "Todos" : ids.join(","), asignadoAIds: cuerpo.asignadoA === "Todos" ? [] : ids });
    try { await guardarCursosPersistidos(DB.cursos); }
    catch (error) { Object.assign(curso, anterior); throw error; }
    return curso;
  }
  const historialCurso = ruta.match(/^\/cursos\/(\d+)\/versiones$/);
  if (historialCurso && metodo === "GET") {
    if (!["admin", "superadmin", "instructor"].includes(sesion.rol())) throw new Error("No tienes permisos para consultar versiones.");
    const curso = DB.cursos.find(c => c.id === Number(historialCurso[1]));
    if (!curso) throw new Error("Curso no encontrado.");
    exigirCursoPropioDelInstructor(curso);
    return { curso: curso.nombre, versionActual: curso.versionActual, historial: curso.historialVersiones };
  }
  const matchEstadoCurso = ruta.match(/^\/cursos\/(\d+)\/estado$/);
  const cambioPlantillaCurso = ruta.match(/^\/cursos\/(\d+)\/plantilla-constancia-seleccion$/);
  if (cambioPlantillaCurso && metodo === "PATCH") {
    if (!["admin", "superadmin"].includes(sesion.rol())) throw new Error("Solo Administración puede cambiar la plantilla propuesta.");
    const curso=DB.cursos.find(c=>Number(c.id)===Number(cambioPlantillaCurso[1]));
    if(!curso||!solicitudCursoEsDeInstructor(curso))throw new Error("Solo se puede cambiar la plantilla de un curso enviado por un Instructor.");
    const plantilla=validarPlantillaPropuestaCurso(cuerpo.plantillaConstanciaId,cuerpo.plantillaConstanciaCampos);
    if(!plantilla)throw new Error("Selecciona una plantilla PDF activa.");
    const anterior={...curso,solicitudCurso:{...(curso.solicitudCurso||{})},historialVersiones:[...(curso.historialVersiones||[])]};
    const usuarioInstructor=curso.solicitudCurso.usuarioId;
    const comentario=String(cuerpo.comentario||`Plantilla cambiada por ${sesion.usuario().nombre} para continuar la revisión.`).trim().slice(0,2000);
    curso.solicitudCurso={...curso.solicitudCurso,plantillaConstancia:{...plantilla,estado:"aceptada",comentario,revision:{usuarioId:sesion.usuario().id,nombre:sesion.usuario().nombre,fecha:new Date().toISOString()}}};
    curso.estado="pendiente";
    curso.solicitudCurso.fecha=new Date().toISOString();
    registrarCambioVersionCurso(curso,[`Plantilla de constancia: ${plantilla.nombre}`]);
    try{
      await guardarCursosPersistidos(DB.cursos);
      agregarNotificacionCICSA({tipo:"plantilla-aceptada",cursoId:curso.id,usuarioId:usuarioInstructor,destinatarioRol:"instructor",destinatarioId:usuarioInstructor,comentario,detalle:`Administración cambió la plantilla del curso a «${plantilla.nombre}». El curso quedó pendiente de aprobación final del Superadministrador.`});
      agregarNotificacionCICSA({tipo:"curso-revision",cursoId:curso.id,usuarioId:usuarioInstructor,destinatarioRol:"superadmin",motivo:"plantilla-cambiada"});
    }catch(error){Object.assign(curso,anterior);throw error;}
    return curso;
  }
  const revisionPlantillaCurso = ruta.match(/^\/cursos\/(\d+)\/plantilla-constancia$/);
  if (revisionPlantillaCurso && metodo === "PATCH") {
    if (!["admin", "superadmin"].includes(sesion.rol())) throw new Error("Solo Administración puede revisar la plantilla propuesta.");
    const curso=DB.cursos.find(c=>Number(c.id)===Number(revisionPlantillaCurso[1]));
    if(!curso||!solicitudCursoEsDeInstructor(curso))throw new Error("No se encontró una solicitud de curso de instructor.");
    const propuesta=curso.solicitudCurso?.plantillaConstancia;
    if(!propuesta)throw new Error("Este curso no incluye una plantilla propuesta.");
    if(propuesta.estado!=="pendiente")throw new Error("La plantilla ya fue revisada. El instructor debe enviar una nueva solicitud para revisarla otra vez.");
    const decision=cuerpo.decision,comentario=String(cuerpo.comentario||"").trim().slice(0,2000);
    if(!["aceptada","rechazada"].includes(decision))throw new Error("Selecciona aceptar o rechazar la plantilla.");
    if(comentario.length<3)throw new Error("Escribe un comentario de al menos 3 caracteres para registrar la revisión.");
    const anterior=curso.solicitudCurso;
    curso.solicitudCurso={...anterior,plantillaConstancia:{...propuesta,estado:decision,comentario,revision:{usuarioId:sesion.usuario().id,nombre:sesion.usuario().nombre,fecha:new Date().toISOString()}}};
    try{
      await guardarCursosPersistidos(DB.cursos);
      const aceptada=decision==="aceptada",usuarioId=curso.solicitudCurso.usuarioId;
      agregarNotificacionCICSA({tipo:aceptada?"plantilla-aceptada":"plantilla-rechazada",cursoId:curso.id,usuarioId,destinatarioRol:"instructor",destinatarioId:usuarioId,comentario,detalle:aceptada?`La plantilla «${propuesta.nombre}» fue aceptada para revisión final del curso.`:`La plantilla «${propuesta.nombre}» fue rechazada. Revisa el comentario y envía una nueva propuesta.`});
      if(aceptada)agregarNotificacionCICSA({tipo:"curso-revision",cursoId:curso.id,usuarioId,destinatarioRol:"superadmin",motivo:"plantilla-aceptada",detalle:`La plantilla «${propuesta.nombre}» fue aceptada por Administración. El curso está listo para tu revisión final.`});
    }catch(error){curso.solicitudCurso=anterior;throw error;}
    return curso;
  }
  if (matchEstadoCurso && metodo === "PATCH") {
    requerirAdministrador();
    const c = DB.cursos.find((x) => x.id == matchEstadoCurso[1]);
    if (!c) throw new Error("Curso no encontrado.");
    if (cuerpo.estado === "inactivo" && ["pendiente", "rechazado"].includes(c.estado)) throw new Error("Resuelve la revision pendiente antes de desactivar el curso.");
    if (["publicado", "rechazado"].includes(cuerpo.estado)) {
      if (c.estado === cuerpo.estado) return c;
      if (c.estado === "rechazado" || (cuerpo.estado === "rechazado" && c.estado !== "pendiente")) throw new Error("Envia modificaciones pendientes antes de revisar nuevamente.");
    }
    if(cuerpo.estado==="publicado"&&solicitudCursoEsDeInstructor(c)&&c.solicitudCurso?.plantillaConstancia&&c.solicitudCurso.plantillaConstancia.estado!=="aceptada"){
      throw new Error("La plantilla propuesta debe ser aceptada por Administración antes de la aprobación final del Superadministrador.");
    }
    const anterior = { ...c, solicitudCurso: c.solicitudCurso ? { ...c.solicitudCurso } : c.solicitudCurso };
    const comentario = String(cuerpo.comentario ?? c.solicitudCurso?.comentario ?? "").trim().slice(0, 2000);
    if (cuerpo.estado === "rechazado" && solicitudCursoEsDeInstructor(c) && comentario.length < 3) {
      throw new Error("Escribe un comentario indicando al Instructor qué debe corregir.");
    }
    if (cuerpo.estado === "publicado") {
      const horario = normalizarHorarioCurso(c);
      if (estadoTemporalCurso(horario) === "cerrado") throw new Error("El horario ya terminó. Solicita al instructor o súper administrador actualizar la apertura antes de aprobar.");
      const propuesta=c.solicitudCurso?.plantillaConstancia;
      if(solicitudCursoEsDeInstructor(c)&&propuesta?.estado==="aceptada"){
        const formato=cargarDatosPersistidos("cicsa_formatos_constancia",[]).find(f=>f.id===propuesta.archivoId&&f.activo!==false&&f.mime==="application/pdf");
        if(!formato)throw new Error("La plantilla aceptada ya no está activa. Solicita al instructor una nueva propuesta.");
        horario.constancia={...(horario.constancia||{}),formato:{archivoId:formato.id,nombre:formato.nombre,campos:(propuesta.campos||[]).map(campo=>({...campo})),activo:true,autorizada:true}};
      }
      Object.assign(c, horario);
    }
    if (c.solicitudCurso) c.solicitudCurso = {
      ...c.solicitudCurso,
      comentario,
      revisadoPor: sesion.usuario().id,
      fechaRevision: new Date().toISOString(),
      resultado: cuerpo.estado === "publicado" ? "aprobado" : cuerpo.estado === "rechazado" ? "cambios" : cuerpo.estado,
    };
    if (["publicado", "rechazado"].includes(cuerpo.estado)) resolverVersionCurso(c, cuerpo.estado, comentario);
    c.estado = cuerpo.estado;
    try {
      await guardarCursosPersistidos(DB.cursos);
      if (solicitudCursoEsDeInstructor(c) && ["publicado", "rechazado"].includes(cuerpo.estado)) {
        retirarNotificacionesRevisionCurso(c.id);
        const tipoInstructor = cuerpo.estado === "publicado" ? "curso-aprobado" : "curso-rechazado";
        agregarNotificacionCICSA({ tipo: tipoInstructor, cursoId: c.id, usuarioId: c.solicitudCurso?.usuarioId, destinatarioRol: "instructor", destinatarioId: c.solicitudCurso?.usuarioId, comentario, detalle: cuerpo.estado === "publicado" ? "Tu curso fue autorizado y publicado." : "Tu curso fue rechazado. Revisa el comentario del revisor." });
      }
      if (["publicado", "rechazado"].includes(cuerpo.estado)) {
        const tipoAviso = cuerpo.estado === "publicado" ? "curso-autorizado" : "curso-observado";
        ["admin", "superadmin"].forEach(rol => agregarNotificacionCICSA({ tipo: tipoAviso, cursoId: c.id, usuarioId: sesion.usuario().id, destinatarioRol: rol, comentario, detalle: cuerpo.estado === "publicado" ? `Se autorizó el curso «${c.nombre}».` : `Se rechazó el curso «${c.nombre}». ${comentario}` }));
      }
    } catch (error) {
      Object.assign(c, anterior);
      throw error;
    }
    return c;
  }
  const matchEditarCurso = ruta.match(/^\/cursos\/(\d+)$/);
  if (matchEditarCurso && metodo === "PATCH") {
    permisos.exigir("editarCursos");
    cuerpo = normalizarDuracionCurso(cuerpo);
    const c = DB.cursos.find((x) => x.id == matchEditarCurso[1]);
    const anterior = c ? { ...c } : null;
    if (!c) throw new Error("Curso no encontrado.");
    exigirCursoPropioDelInstructor(c);
    const propuestaPlantilla=Object.prototype.hasOwnProperty.call(cuerpo,"plantillaConstanciaId")?validarPlantillaPropuestaCurso(cuerpo.plantillaConstanciaId,cuerpo.plantillaConstanciaCampos):undefined;
    const { plantillaConstanciaId, plantillaConstanciaCampos, ...cuerpoCurso }=cuerpo;
    cuerpo = vincularCatalogosCurso(cuerpoCurso,c);
    registrarCambioVersionCurso(c, Object.keys(cuerpo).filter(clave => !["comentarioCorreccion", "solicitudCurso"].includes(clave)));
    Object.assign(c, normalizarHorarioCurso({ ...c, ...cuerpo }), { estado: "pendiente", solicitudCurso: agregarPlantillaPropuesta(solicitudCursoCorregida(c, cuerpo.comentarioCorreccion), propuestaPlantilla) });
    try {
      await guardarCursosPersistidos(DB.cursos);
      notificarRevisionCurso(c, "actualizacion");
    } catch (error) {
      if (c && anterior) Object.assign(c, anterior);
      throw error;
    }
    return c;
  }
  if (matchEditarCurso && metodo === "DELETE") {
    permisos.exigir("crearCursos");
    const anteriores = DB.cursos;
    DB.cursos = DB.cursos.filter((x) => x.id != matchEditarCurso[1]);
    try {
      await guardarCursosPersistidos(DB.cursos);
    } catch (error) {
      DB.cursos = anteriores;
      throw error;
    }
    return { ok: true };
  }

  // Nueva oportunidad individual, autorizada únicamente por administración.
  const reapertura = ruta.match(/^\/progreso\/reabrir\/(\d+)\/(\d+)$/);
  if (reapertura && metodo === "POST") {
    if (sesion.rol() !== "superadmin") throw new Error("Solo el Super Admin puede autorizar repetir el curso.");
    const curso = DB.cursos.find(c => c.id === Number(reapertura[1]));
    const trabajador = DB.usuarios.find(u => u.id === Number(reapertura[2]) && u.rol === "trabajador" && u.activo);
    if (!curso || curso.estado !== "publicado") throw new Error("El curso debe estar aprobado y publicado.");
    if (!trabajador) throw new Error("Selecciona un trabajador activo.");
    if (curso.asignadoA !== "Todos" && !(curso.asignadoAIds || []).includes(trabajador.id)) throw new Error("Primero asigna el curso al trabajador.");
    if (!Number.isFinite(Number(curso.horas)) || Number(curso.horas) <= 0) throw new Error("Configura la duración del curso.");
    const primeraEvaluacion = recuperarEvaluacionInicial(trabajador.id, curso.id);
    const propio = DB.progreso[trabajador.id] || {};
    const anterior = propio[curso.id];
    const historial = [...(anterior?.historialIntentos || [])];
    const inicio = new Date().toISOString();
    if (anterior) {
      const { historialIntentos, ...resumen } = anterior;
      historial.push({ ...resumen, archivadoEn: inicio });
    }
    const nuevo = {
      porcentaje: 0, estado: "no_iniciado", completadas: [],
      evaluacionInicialRealizada: !!primeraEvaluacion,
      evaluacionInicialAprobada: primeraEvaluacion?.aprobado ?? anterior?.evaluacionInicialAprobada ?? false,
      ...(primeraEvaluacion ? { resultadoEvaluacionInicial: primeraEvaluacion } : {}),
      examenAprobado: false,
      historialIntentos: historial,
      reapertura: {
        inicio, fin: new Date(Date.now() + Number(curso.horas) * 3600000).toISOString(),
        horas: Number(curso.horas), autorizadoPor: sesion.usuario().id,
        horarioCurso: { fechaInicio: curso.fechaInicio || "", fechaFin: curso.fechaFin || "", horas: Number(curso.horas) }
      }
    };
    const actualizado = { ...DB.progreso, [trabajador.id]: { ...propio, [curso.id]: nuevo } };
    guardarDatosPersistidos("cicsa_progreso", actualizado);
    DB.progreso = actualizado;
    return nuevo;
  }

  // ---- Progreso ----
  if (ruta === "/progreso/mis-cursos" && metodo === "GET") {
    const idUsuario = sesion.usuario()?.id;
    DB.cursos.forEach(c => recuperarEvaluacionInicial(idUsuario, c.id));
    const propio = DB.progreso[idUsuario] || {};
    const resultados = DB.cursos
      .filter((c) => c.estado === "publicado")
      .map((c) => {
        const asignado = c.asignadoA === "Todos" || (Array.isArray(c.asignadoAIds) && c.asignadoAIds.includes(Number(idUsuario)));
        const avance = propio[c.id] || { porcentaje: 0, estado: "no_iniciado", completadas: [] };
        const lecciones = obtenerLeccionesCurso(c);
        const idsValidos = new Set(lecciones.map((l) => String(l.id)));
        const completadas = [...new Set((avance.completadas || []).map(String))].filter((id) => idsValidos.has(id));
        const porcentaje = lecciones.length ? Math.min(100, Math.round(completadas.length / lecciones.length * 100)) : 0;
        avance.completadas = completadas.map(Number);
        avance.porcentaje = porcentaje;
        if (avance.estado !== "completado" && !avance.bloqueadoPorExamen) avance.estado = porcentaje === 100 ? "listo_examen" : porcentaje > 0 ? "en_proceso" : "no_iniciado";
        const acceso = cursoParaTrabajador(c, idUsuario);
        return { curso: acceso, estadoTemporal: estadoTemporalCurso(acceso), progreso: avance, asignado };
      });
    await Promise.all(resultados.map(({ curso }) => resolverMediaAlCargar(curso, { soloImagenes: true })));
    return resultados;
  }
  const matchCompletar = ruta.match(/^\/progreso\/leccion\/(\d+)\/completar$/);
  if (matchCompletar && metodo === "POST") {
    const usuario = sesion.usuario();
    const curso = DB.cursos.find((c) => obtenerLeccionesCurso(c).some((l) => l.id == matchCompletar[1]));
    const autorizado = curso && !DB.progreso[usuario.id]?.[curso.id]?.bloqueadoPorExamen && curso.estado === "publicado" && estadoTemporalCurso(cursoParaTrabajador(curso, usuario.id)) === "abierto" && (curso.asignadoA === "Todos"
      || (Array.isArray(curso.asignadoAIds) && curso.asignadoAIds.includes(Number(usuario?.id))));
    if (usuario?.rol === "trabajador" && autorizado) {
      recuperarEvaluacionInicial(usuario.id, curso.id);
      const propio = DB.progreso[usuario.id] || (DB.progreso[usuario.id] = {});
      const progreso = propio[curso.id] || (propio[curso.id] = { porcentaje: 0, estado: "no_iniciado", completadas: [] });
      const leccionId = Number(matchCompletar[1]);
      const lista = obtenerLeccionesCurso(curso);
      const leccion = lista.find(l => Number(l.id) === leccionId);
      if (!progreso.completadas.includes(leccionId)) {
        if (!(progreso.evaluacionInicialRealizada || progreso.evaluacionInicialAprobada)) throw new Error("Contesta primero la Evaluación del curso.");
        if (lista.slice(0, lista.indexOf(leccion)).some(l => !progreso.completadas.includes(Number(l.id)))) throw new Error("Completa las unidades anteriores.");
        const contenido = DB.contenidoLecciones[leccionId] || {};
        if (!cumpleConsumoLeccion(reglaConsumoLeccion(leccion, contenido), cuerpo?.evidencia)) throw new Error("Termina de ver el video completo antes de continuar.");
        progreso.evidencias = progreso.evidencias || {};
        progreso.evidencias[leccionId] = { ...cuerpo.evidencia, completadoEn: new Date().toISOString() };
      }
      if (!progreso.completadas.includes(leccionId)) progreso.completadas.push(leccionId);
      const totalLecciones = obtenerLeccionesCurso(curso).length;
      const idsValidos = new Set(obtenerLeccionesCurso(curso).map((l) => String(l.id)));
      progreso.completadas = [...new Set((progreso.completadas || []).map(String))]
        .filter((id) => idsValidos.has(id)).map(Number);
      progreso.porcentaje = totalLecciones ? Math.min(100, Math.round((progreso.completadas.length / totalLecciones) * 100)) : 0;
      progreso.estado = progreso.examenAprobado ? "completado" : progreso.porcentaje === 100 ? "listo_examen" : progreso.porcentaje > 0 ? "en_proceso" : "no_iniciado";
      guardarDatosPersistidos("cicsa_progreso", DB.progreso);
      if (progreso.estado === "listo_examen" && !DB.notificacionesAdmin.some((n) => n.tipo === "curso-listo" && n.usuarioId === usuario.id && n.cursoId === curso.id)) {
        DB.notificacionesAdmin.unshift({
          id: `curso-listo-${usuario.id}-${curso.id}`,
          tipo: "curso-listo",
          fecha: new Date().toISOString(),
          usuarioId: usuario.id,
          cursoId: curso.id,
          leida: false,
        });
        guardarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
      }
    }
    if (usuario?.rol === "trabajador" && !autorizado) {
      throw new Error("No tienes permiso para realizar este curso.");
    }
    return { ok: true };
  }

  // ---- Reportes (admin) ----
  const matchPerfilTrabajador = ruta.match(/^\/reportes\/trabajador\/(\d+)\/perfil$/);
  if (matchPerfilTrabajador && metodo === "GET") {
    requerirAdministrador();
    const usuarioId = Number(matchPerfilTrabajador[1]);
    const usuario = DB.usuarios.find((u) => u.id === usuarioId && u.rol === "trabajador");
    if (!usuario) throw new Error("No se encontró el trabajador.");

    const cursosAsignados = DB.cursos.filter((c) => c.estado === "publicado" && (
      c.asignadoA === "Todos" || (Array.isArray(c.asignadoAIds) && c.asignadoAIds.includes(usuarioId))
    ));
    const propio = DB.progreso[usuarioId] || {};
    const cursos = cursosAsignados.map((curso) => {
      const avance = propio[curso.id] || { porcentaje: 0, estado: "no_iniciado" };
      const resultadosCurso = DB.evaluacionesResultado
        .filter((r) => (r.usuarioId === usuarioId || (!r.usuarioId && r.usuario === usuario.nombre)) && (String(r.cursoId) === String(curso.id) || r.curso === curso.nombre))
        .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
      const resultado = resultadosCurso.find(r => String(r.tipo || "examen").toLowerCase() === "examen");
      const evaluacion = resultadosCurso.find(r => String(r.tipo || "examen").toLowerCase() === "evaluacion");
      return {
        id: curso.id,
        nombre: curso.nombre,
        reapertura: avance.reapertura || null,
        fechaInicio: curso.fechaInicio || null,
        porcentaje: avance.porcentaje || 0,
        completado: avance.estado === "completado",
        calificacion: resultado?.nota ?? null,
        calificacionEvaluacion: evaluacion?.nota ?? null,
        estadoEvaluacion: evaluacion?.estado ?? null,
      };
    });
    const calificaciones = DB.evaluacionesResultado
      .filter((r) => r.usuarioId === usuarioId || (!r.usuarioId && r.usuario === usuario.nombre))
      .map((r) => r.nota)
      .filter(Number.isFinite);
    const promedio = calificaciones.length ? Math.round(calificaciones.reduce((suma, nota) => suma + nota, 0) / calificaciones.length) : null;
    const cursosCompletados = cursos.filter((curso) => curso.completado).length;
    const avanceGeneral = cursos.length ? Math.round(cursos.reduce((suma, curso) => suma + curso.porcentaje, 0) / cursos.length) : 0;
    const horasHechas = cursosAsignados.reduce((suma, curso) => suma + ((propio[curso.id]?.porcentaje || 0) / 100) * (curso.horas || 0), 0);
    const logros = insigniasDelTrabajador(usuarioId);
    const insignias = logros.insignias.map(i=>i.nombre);
    return {
      usuario: { nombre: usuario.nombre, correo: usuario.correo, area: usuario.area || "Sin asignar", puesto:usuario.puesto || "", claveDc3:usuario.claveDc3 || "" }, avanceGeneral,
      horasHechas: Math.round(horasHechas * 10) / 10, cursosCompletados,
      cursosTotal: cursos.length, promedio, insignias, insigniasDetalle:logros.insignias, puntosInsignias:logros.puntos, cursos,
    };
  }
  if (ruta.startsWith("/reportes/seguimiento-trabajadores") && metodo === "GET") {
    requerirAdministrador();
    const cursosPublicados = DB.cursos.filter((c) => c.estado === "publicado");
    return DB.usuarios
      .filter((u) => u.rol === "trabajador")
      .map((u) => {
        const cursosAsignados = cursosPublicados.filter((c) => c.asignadoA === "Todos" || c.asignadoAIds?.includes(Number(u.id)));
        const totalHoras = cursosAsignados.reduce((sum, c) => sum + (c.horas || 0), 0);
        const propio = DB.progreso[u.id] || {};
        const cursosCompletados = cursosAsignados.filter((c) => propio[c.id]?.estado === "completado").length;
        const horasHechas = cursosAsignados.reduce(
          (sum, c) => sum + ((propio[c.id]?.porcentaje || 0) / 100) * (c.horas || 0), 0
        );
        const avance = cursosAsignados.length
          ? Math.round(cursosAsignados.reduce((sum, c) => sum + (propio[c.id]?.porcentaje || 0), 0) / cursosAsignados.length)
          : 0;
        let estado = "Sin iniciar";
        if (cursosAsignados.length > 0 && cursosCompletados === cursosAsignados.length) estado = "Completado";
        else if (avance > 0) estado = "En progreso";
        return {
          usuarioId: u.id, nombre: u.nombre, area: u.area || "Sin asignar", avance,
          cursosCompletados, cursosTotal: cursosAsignados.length,
          horasHechas: Math.round(horasHechas * 10) / 10, horasTotal: totalHoras,
          estado,
        };
      });
  }
  if (ruta.startsWith("/reportes/seguimiento") && metodo === "GET") {
    requerirAdministrador();
    return DB.evaluacionesResultado;
  }
  if (ruta === "/reportes/mis-resultados" && metodo === "GET") {
    const usuario = sesion.usuario();
    return DB.evaluacionesResultado.filter((resultado) => resultado.usuarioId === usuario?.id || (!resultado.usuarioId && resultado.usuario === usuario?.nombre));
  }

  // ---- Contenido de lección ----
  const matchLeccion = ruta.match(/^\/lecciones\/(\d+)$/);
  if (matchLeccion && metodo === "GET") {
    const curso = DB.cursos.find(c => obtenerLeccionesCurso(c).some(l => Number(l.id) === Number(matchLeccion[1])));
    if (!curso) throw new Error("Lección no encontrada.");
    await simularSolicitud("GET", "/cursos/" + curso.id);
    return DB.contenidoLecciones[matchLeccion[1]];
  }

  // ---- Evaluaciones (RF-030..036) ----
  // La Evaluación del curso ya no tiene un banco independiente.
  // Se construye con 5 preguntas tomadas del mismo banco del Examen final.
  const matchEvalTipo = ruta.match(/^\/evaluaciones\/curso\/(\d+)\/(evaluacion|examen)$/);
  if (matchEvalTipo && metodo === "GET") {
    await simularSolicitud("GET", "/cursos/" + matchEvalTipo[1]);
    const id = matchEvalTipo[1];
    const tipo = matchEvalTipo[2];
    if (tipo === "evaluacion" && sesion.rol() === "trabajador") {
      const resultado = recuperarEvaluacionInicial(sesion.usuario().id, id);
      if (resultado) return { preguntas: [], resultadoConservado: resultado };
    }
    const actual = DB.evaluaciones[id];
    if (!actual) return null;

    // Compatibilidad con datos antiguos: un objeto raíz con `preguntas` era el examen final.
    const examen = actual.examen || (Array.isArray(actual.preguntas) ? actual : null);
    if (!examen || !Array.isArray(examen.preguntas)) return null;
    const copiar = (preguntas) => preguntas.map(p => ({ ...p, opciones: (p.opciones || []).map(o => ({ ...o })) }));
    const barajar = (preguntas) => {
      const copia = copiar(preguntas);
      for (let i = copia.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
      }
      return copia;
    };

    if (tipo === "evaluacion") {
      const preguntas = examen.preguntas.length >= 5 ? barajar(examen.preguntas).slice(0, 5) : [];
      return {
        minimaAprobatoria: Number(actual.evaluacion?.minimaAprobatoria ?? 70),
        preguntas,
        generadaDesdeExamen: true,
      };
    }

    const preguntas = sesion.rol() === "trabajador"
      ? barajar(examen.preguntas).slice(0, 25)
      : copiar(examen.preguntas).slice(0, 25);
    return { ...examen, minimaAprobatoria: minimaExamen(examen.minimaAprobatoria), preguntas };
  }
  if (matchEvalTipo && metodo === "PATCH") {
    permisos.exigir("editarCursos");
    const id = matchEvalTipo[1];
    const tipo = matchEvalTipo[2];
    const cursoEditado = DB.cursos.find(c => c.id === Number(id));
    if (!cursoEditado) throw new Error("Curso no encontrado.");
    exigirCursoPropioDelInstructor(cursoEditado);
    if (tipo === "examen" && Array.isArray(cuerpo?.preguntas) && cuerpo.preguntas.length > 25) {
      throw new Error("El Examen final admite un máximo de 25 preguntas.");
    }
    if (tipo === "examen") validarMinimaExamen(cuerpo?.minimaAprobatoria);
    const previo = DB.evaluaciones[id];
    const base = previo && previo.preguntas && !previo.examen && !previo.evaluacion
      ? { evaluacion: null, examen: previo }
      : { evaluacion: null, examen: null, ...(previo || {}) };
    base[tipo] = { ...(base[tipo] || {}), ...cuerpo };
    if (tipo === "evaluacion") base[tipo].preguntas = [];
    DB.evaluaciones[id] = base;
    registrarCambioVersionCurso(cursoEditado, ["Preguntas del examen"]);
    cursoEditado.estado = "pendiente"; cursoEditado.solicitudCurso = solicitudCursoCorregida(cursoEditado); await guardarCursosPersistidos(DB.cursos);
    guardarDatosPersistidos("cicsa_evaluaciones", DB.evaluaciones);
    return tipo === "evaluacion" ? { ...base[tipo], preguntas: [] } : base[tipo];
  }
  const matchEval = ruta.match(/^\/evaluaciones\/curso\/(\d+)$/);
  if (matchEval && metodo === "GET") {
    await simularSolicitud("GET", "/cursos/" + matchEval[1]);
    const actual = DB.evaluaciones[matchEval[1]];
    const examen = actual?.examen || actual?.evaluacion || actual;
    return examen ? { ...examen, minimaAprobatoria: minimaExamen(examen.minimaAprobatoria) } : null;
  }
  if (matchEval && metodo === "PATCH") {
    validarMinimaExamen(cuerpo?.minimaAprobatoria);
    permisos.exigir("editarCursos");
    if (Array.isArray(cuerpo?.preguntas) && cuerpo.preguntas.length > 25) throw new Error("El Examen final admite un máximo de 25 preguntas.");
    const cursoEditado = DB.cursos.find(c => c.id === Number(matchEval[1]));
    if (!cursoEditado) throw new Error("Curso no encontrado.");
    exigirCursoPropioDelInstructor(cursoEditado);
    const actual = DB.evaluaciones[matchEval[1]] || { preguntas: [] };
    DB.evaluaciones[matchEval[1]] = { ...actual, ...cuerpo };
    registrarCambioVersionCurso(cursoEditado, ["Preguntas del examen"]);
    cursoEditado.estado = "pendiente"; cursoEditado.solicitudCurso = solicitudCursoCorregida(cursoEditado); await guardarCursosPersistidos(DB.cursos);
    guardarDatosPersistidos("cicsa_evaluaciones", DB.evaluaciones);
    return DB.evaluaciones[matchEval[1]];
  }
  const matchIntento = ruta.match(/^\/evaluaciones\/curso\/(\d+)\/(evaluacion|examen)\/intento$/);
  const matchIntentoLegacy = ruta.match(/^\/evaluaciones\/curso\/(\d+)\/intento$/);
  if ((matchIntento || matchIntentoLegacy) && metodo === "POST") {
    const idCursoIntento = matchIntento ? matchIntento[1] : matchIntentoLegacy[1];
    const tipoIntento = matchIntento ? matchIntento[2] : "examen";
    const cursoIntento = await simularSolicitud("GET", `/cursos/${idCursoIntento}`);
    const primerResultado = recuperarEvaluacionInicial(sesion.usuario().id, idCursoIntento);
    if (tipoIntento === "evaluacion" && primerResultado) return { ...primerResultado, conservado: true };
    const avanceIntento = DB.progreso[sesion.usuario().id]?.[idCursoIntento];
    if (tipoIntento === "examen" && !(avanceIntento?.evaluacionInicialRealizada || avanceIntento?.evaluacionInicialAprobada)) {
      throw new Error("Contesta la Evaluación del curso antes de presentar el Examen final.");
    }
    if (tipoIntento === "examen" && obtenerLeccionesCurso(cursoIntento).some((l) => !avanceIntento?.completadas?.includes(l.id))) {
      throw new Error("Completa todas las lecciones antes del examen final.");
    }
    const registro = DB.evaluaciones[idCursoIntento];
    const bancoExamen = registro?.examen || (Array.isArray(registro?.preguntas) ? registro : null);
    if (!bancoExamen?.preguntas?.length) {
      throw new Error("Este curso todavía no tiene preguntas configuradas en el Examen final.");
    }
    if (tipoIntento === "evaluacion" && bancoExamen.preguntas.length < 5) {
      throw new Error("El Examen final debe tener al menos 5 preguntas para generar la Evaluación del curso.");
    }

    const respuestas = cuerpo?.respuestas || {};
    const mapaPreguntas = new Map(bancoExamen.preguntas.map(p => [String(p.id), p]));
    const idsRespondidos = Object.keys(respuestas).filter(id => mapaPreguntas.has(String(id)));
    const totalEsperado = tipoIntento === "evaluacion" ? 5 : Math.min(25, bancoExamen.preguntas.length);
    if (idsRespondidos.length !== totalEsperado) {
      throw new Error(tipoIntento === "evaluacion"
        ? "Responde las 5 preguntas de la Evaluación del curso."
        : "Responde todas las preguntas del Examen final.");
    }
    const preguntasIntento = idsRespondidos.map(id => mapaPreguntas.get(String(id)));
    const total = preguntasIntento.length;
    const correctas = preguntasIntento.filter((p) => String(respuestas[p.id]) === String(p.correcta)).length;
    const minimaAprobatoria = tipoIntento === "evaluacion"
      ? Number(registro?.evaluacion?.minimaAprobatoria ?? 70)
      : minimaExamen(bancoExamen.minimaAprobatoria);
    const nota = Math.round((correctas / total) * 100);
    // Validar de nuevo al finalizar, antes de registrar el resultado o emitir reconocimientos.
    if (estadoTemporalCurso(cursoIntento) !== "abierto") throw new Error("Terminó el tiempo disponible del curso. Solicita autorización para repetir.");
    const aprobado = (correctas / total) * 100 >= minimaAprobatoria;
    const usuario = sesion.usuario();
    DB.evaluacionesResultado.unshift({
      usuarioId: usuario?.id,
      usuario: usuario?.nombre || "Trabajador",
      curso: DB.cursos.find((curso) => curso.id === Number(idCursoIntento))?.nombre || "Curso",
      tipo: tipoIntento,
      cursoId: Number(idCursoIntento),
      minimaAprobatoria,
      correctas, total, respuestas: { ...respuestas },
      nota,
      estado: aprobado ? "aprobado" : "no aprobado",
      fecha: new Date().toISOString().slice(0, 10),
    });
    guardarDatosPersistidos("cicsa_evaluaciones_resultado", DB.evaluacionesResultado);
    const cursoResultado = DB.cursos.find((curso) => curso.id === Number(idCursoIntento));
    ["admin", "superadmin", "instructor"].forEach(rolDestino => agregarNotificacionCICSA({
      id: `resultado-${tipoIntento}-${usuario?.id}-${idCursoIntento}-${Date.now()}-${rolDestino}`,
      tipo: "evaluacion-terminada", destinatarioRol: rolDestino,
      usuarioId: usuario?.id, cursoId: Number(idCursoIntento), leida: false,
      detalle: `${usuario?.nombre || "Trabajador"} terminó ${tipoIntento === "evaluacion" ? "la evaluación del curso" : "el examen final"} «${cursoResultado?.nombre || "Curso"}" con ${nota}/100. Resultado: ${aprobado ? "Aprobado" : "No aprobado"}.`
    }));
    if (!aprobado && tipoIntento === "examen") {
      const propio = DB.progreso[usuario.id] || (DB.progreso[usuario.id] = {});
      const avance = propio[idCursoIntento] || (propio[idCursoIntento] = { porcentaje: 0, completadas: [] });
      avance.resultadoFinal = { nota, aprobado, correctas, total, minimaAprobatoria, fecha: new Date().toISOString() };
      avance.bloqueadoPorExamen = true;
      avance.examenAprobado = false;
      avance.estado = "bloqueado";
      guardarDatosPersistidos("cicsa_progreso", DB.progreso);
    }
    if (tipoIntento === "evaluacion") {
      const propio = DB.progreso[usuario.id] || (DB.progreso[usuario.id] = {});
      const progresoInicial = propio[idCursoIntento] || (propio[idCursoIntento] = { porcentaje: 0, estado: "no_iniciado", completadas: [] });
      progresoInicial.evaluacionInicialRealizada = true;
      progresoInicial.evaluacionInicialAprobada = aprobado;
      progresoInicial.resultadoEvaluacionInicial = { nota, aprobado, correctas, total, minimaAprobatoria, respuestas: { ...respuestas }, fecha: new Date().toISOString() };
      guardarDatosPersistidos("cicsa_progreso", DB.progreso);
    }
    if (aprobado && tipoIntento === "examen") {
      const propio = DB.progreso[usuario.id] || (DB.progreso[usuario.id] = {});
      const progresoCurso = propio[idCursoIntento] || (propio[idCursoIntento] = { porcentaje: 100, completadas: [] });
      if (progresoCurso) {
        progresoCurso.estado = "completado";
        progresoCurso.fechaFin = new Date().toISOString().slice(0, 10);
        progresoCurso.examenAprobado = true;
        if (!progresoCurso.reconocimiento) {
          const emitidas = cargarDatosPersistidos("cicsa_constancias_emitidas", []);
          // Siempre emitir una constancia al aprobar el examen final, aunque el curso aún no tenga plantilla configurada.
          // Evita duplicados si el registro existe pero el progreso no conservó el vínculo.
          const yaEmitida = emitidas.find(c => c.usuarioId === usuario.id && Number(c.cursoId) === Number(idCursoIntento));
          if (yaEmitida) {
            progresoCurso.reconocimiento = yaEmitida;
          } else {
          const numero = Math.max(0, ...emitidas.map(c => c.numero || 0)) + 1;
          const ficha = instructorDelCurso(cursoIntento);
          const catalogo = catalogoInsignias();
          const elegida = catalogo.find(i=>i.id===(cursoIntento.insigniaId || cursoIntento.constancia?.insignia) && i.activa!==false && !i.eliminada)
            || catalogo.find(i=>i.id==="aprobacion" && i.activa!==false && !i.eliminada)
            || catalogo.find(i=>i.activa!==false && !i.eliminada);
          const {formato:_formatoCurso,...constanciaBase}=cursoIntento.constancia||{};
          const formatoCurso=formatoActivoDelCurso(cursoIntento);
          const configuracion = { titulo:"Constancia de aprobación", texto:"Por haber aprobado satisfactoriamente el curso", ...constanciaBase, ...(formatoCurso?{formato:formatoCurso}:{}),
            ...(ficha ? {instructorId:ficha.id,instructor:ficha.nombre,firma:ficha.firma,firmante:ficha.nombre,instructorRegistro:ficha.registro,instructorDetalle:ficha} : {}),
            ...(elegida ? {insignia:elegida.id,insigniaDetalle:{id:elegida.id,nombre:elegida.nombre,descripcion:elegida.descripcion,imagen:elegida.imagen,puntos:elegida.puntos || 0}} : {}) };
          const cuenta = DB.usuarios.find(u=>u.id===usuario.id);
          const reconocimiento = { curp:cuenta?.curp || "", puesto:cuenta?.puesto || "", periodoInicio:cursoIntento.fechaInicio || "", periodoFin:new Date().toISOString(), numero, folio: "CICSA-" + String(numero).padStart(6, "0"), usuarioId: usuario.id, trabajador: usuario.nombre, cursoId: Number(idCursoIntento), curso: cursoIntento.nombre, horas: cursoIntento.horas, nota, fecha: new Date().toISOString(), ...configuracion };
          // La fecha de emisión corresponde a la aprobación, no a la edición de la plantilla.
          reconocimiento.fecha = new Date().toISOString();
          Object.assign(reconocimiento,{
            empresa:configuracion.empresa || "Corporativo Industrial y Comercial S.A. (CICSA)",
            area:cuenta?.area || "",numeroEmpleado:cuenta?.numeroEmpleado || "",
            categoria:cursoIntento.categoria || "",periodoInicio:cursoIntento.fechaInicio || "",
            periodoFin:cursoIntento.fechaFin || progresoCurso.fechaFin,
            modalidad:configuracion.modalidad || cursoIntento.modalidad || "virtual",
            minimaAprobatoria,resultado:"APROBADO",instructorCargo:ficha?.puesto || "",
            instructorRegistro:ficha?.registro || ""
          });
          Object.assign(reconocimiento,datosConstanciaSistema(cursoIntento,cuenta || usuario,ficha,reconocimiento.fecha));
          guardarDatosPersistidos("cicsa_constancias_emitidas", [...emitidas, reconocimiento]);
          agregarNotificacionCICSA({
            id: `constancia-emitida-${reconocimiento.folio}`, tipo: "actividad-apartado", destinatarioRol: "trabajador", destinatarioId: usuario.id,
            destino: "perfil-insignias", cursoId: Number(idCursoIntento), detalle: `Tu constancia de «${cursoIntento.nombre}» ya está disponible en tu perfil.`,
          });
          progresoCurso.reconocimiento = reconocimiento;
          }
        }
        progresoCurso.resultadoFinal = { nota, aprobado, correctas, total, minimaAprobatoria, fecha: new Date().toISOString() };
        guardarDatosPersistidos("cicsa_progreso", DB.progreso);
      }
      const cursoTerminado = DB.cursos.find((curso) => curso.id === Number(idCursoIntento));
      if (usuario?.id && cursoTerminado && !DB.notificacionesAdmin.some((n) => n.tipo === "curso-completado" && n.usuarioId === usuario.id && n.cursoId === cursoTerminado.id)) {
        DB.notificacionesAdmin.unshift({
          id: `curso-completado-${usuario.id}-${cursoTerminado.id}`,
          tipo: "curso-completado",
          fecha: new Date().toISOString(),
          usuarioId: usuario.id,
          cursoId: cursoTerminado.id,
          nota,
          leida: false,
        });
        guardarDatosPersistidos("cicsa_notificaciones_admin", DB.notificacionesAdmin);
      }
    }
    if (tipoIntento === "examen") insigniasDelTrabajador(usuario.id);
    return { nota, aprobado, correctas, total, minimaAprobatoria, reconocimiento: tipoIntento === "examen" && aprobado ? DB.progreso[usuario.id]?.[idCursoIntento]?.reconocimiento : null };
  }

  throw new Error(`Endpoint simulado no implementado: ${metodo} ${ruta}`);
}

// ---------------------------------------------------------------
// API pública usada por las páginas
// ---------------------------------------------------------------
const auth = {
  login: (correo, password) => solicitar("POST", "/auth/login", { correo, password }),
  olvidePassword: (correo) => solicitar("POST", "/auth/olvide-password", { correo }),
  restablecerPassword: (token, password) =>
    solicitar("POST", "/auth/restablecer-password", { token, password }),
};

const usuarios = {
  listar: () => solicitar("GET", "/usuarios"),
  eliminar: id => solicitar("DELETE", `/usuarios/${id}`),
  crear: (datos) => solicitar("POST", "/usuarios", datos),
  cambiarEstado: (id, activo) => solicitar("PATCH", `/usuarios/${id}/estado`, { activo }),
  cambiarPassword: (id, password) => solicitar("PATCH", `/usuarios/${id}/password`, { password }),
  cambiarRol: (id, rol) => solicitar("PATCH", `/usuarios/${id}/rol`, { rol }),
  importar: (registros) => solicitar("POST", "/usuarios/importar", { registros }),
};

const solicitudesReset = {
  listar: () => solicitar("GET", "/solicitudes-restablecimiento"),
  resolver: (id, password) => solicitar("POST", `/solicitudes-restablecimiento/${id}/resolver`, { password }),
};

const notificacionesAdmin = {
  listar: () => solicitar("GET", "/notificaciones-admin"),
  comunicado: comunicado => solicitar("POST", "/notificaciones-admin/comunicado", { comunicado }),
  eliminar: (id) => solicitar("DELETE", `/notificaciones-admin/${encodeURIComponent(id)}`),
  eliminarTodas: () => solicitar("DELETE", "/notificaciones-admin"),
};

const agenda = {
  listar: async () => {
    try {
      return await solicitar("GET", "/agenda/cursos");
    } catch (error) {
      // Compatibilidad: si el backend aún no tiene el endpoint de agenda,
      // la vista conserva el comportamiento usando el catálogo existente.
      return cursos.listar();
    }
  },
};

const cursos = {
  versiones: id => solicitar("GET", `/cursos/${id}/versiones`),
  asignar: (id, datos) => solicitar("PATCH", "/cursos/" + id + "/asignacion", datos),
  listar: () => solicitar("GET", "/cursos"),
  obtener: (id) => solicitar("GET", `/cursos/${id}`),
  crear: (datos) => solicitar("POST", "/cursos", datos),
  actualizar: (id, datos) => solicitar("PATCH", `/cursos/${id}`, datos),
  eliminar: (id) => solicitar("DELETE", `/cursos/${id}`),
  cambiarEstado: (id, estado, comentario) => solicitar("PATCH", `/cursos/${id}/estado`, { estado, comentario }),
  revisarPlantillaConstancia: (id, decision, comentario) => solicitar("PATCH", `/cursos/${id}/plantilla-constancia`, { decision, comentario }),
};

const progreso = {
  reabrir: (cursoId, usuarioId) => solicitar("POST", "/progreso/reabrir/" + cursoId + "/" + usuarioId),
  misCursos: () => solicitar("GET", "/progreso/mis-cursos"),
  completarLeccion: (idLeccion, evidencia) => solicitar("POST", `/progreso/leccion/${idLeccion}/completar`, { evidencia }),
};

const lecciones = {
  obtener: (id) => solicitar("GET", `/lecciones/${id}`),
};

const encuestasInstructor = {
  configuracion: () => solicitar("GET", "/encuestas-instructor/configuracion"),
  guardarConfiguracion: datos => solicitar("POST", "/encuestas-instructor/configuracion", datos),
  estado: id => solicitar("GET", `/encuestas-instructor/curso/${id}`),
  enviar: (id, datos) => solicitar("POST", `/encuestas-instructor/curso/${id}`, datos),
  listar: () => solicitar("GET", "/encuestas-instructor")
};

const evaluaciones = {
  obtenerPorCurso: (idCurso) => solicitar("GET", `/evaluaciones/curso/${idCurso}`),
  obtenerPorCursoTipo: (idCurso, tipo = "examen") => solicitar("GET", `/evaluaciones/curso/${idCurso}/${tipo}`),
  actualizar: (idCurso, datos) => solicitar("PATCH", `/evaluaciones/curso/${idCurso}`, datos),
  actualizarTipo: (idCurso, tipo, datos) => solicitar("PATCH", `/evaluaciones/curso/${idCurso}/${tipo}`, datos),
  enviarIntento: (idCurso, respuestas, tipo = "examen") =>
    solicitar("POST", `/evaluaciones/curso/${idCurso}/${tipo}/intento`, { respuestas }),
};

const reportes = {
  sesiones: () => solicitar("GET", "/reportes/sesiones"),
  seguimiento: (filtros = {}) => {
    const qs = new URLSearchParams(filtros).toString();
    return solicitar("GET", `/reportes/seguimiento?${qs}`);
  },
  seguimientoTrabajadores: () => solicitar("GET", "/reportes/seguimiento-trabajadores"),
  perfilTrabajador: (id) => solicitar("GET", `/reportes/trabajador/${id}/perfil`),
  misResultados: () => solicitar("GET", "/reportes/mis-resultados"),
  exportarCSV(filas, nombreArchivo = "reporte-cicsa-capacita.csv") {
    const encabezados = Object.keys(filas[0] || {});
    const escaparCSV = valor => `"${String(valor ?? "").replace(/"/g, '""')}"`;
    const lineas = [
      encabezados.map(escaparCSV).join(","),
      ...filas.map(f => encabezados.map(h => escaparCSV(f[h])).join(",")),
    ];
    const blob = new Blob([lineas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  },
};


// API de soporte; el backend real debe aplicar los mismos permisos.
const soporte = {
  listar: () => solicitar("GET", "/soporte"),
  crear: datos => solicitar("POST", "/soporte", datos),
  actualizar: (id, datos) => solicitar("PATCH", "/soporte/" + id, datos)
};

// En producción, el servidor mantiene las sesiones y su reloj.
function cerrarSesionesVencidas() {
  const registros = cargarDatosPersistidos("cicsa_sesiones_uso", []);
  let cambios = false;
  registros.forEach(r => {
    if (!r.salida && Date.now() - Date.parse(r.ultimaSenal) > 120000) {
      r.salida = r.ultimaSenal;
      r.motivo = "sin_senal";
      r.estimada = true;
      cambios = true;
    }
  });
  if (cambios) guardarDatosPersistidos("cicsa_sesiones_uso", registros);
  return registros;
}
function iniciarUsoDemo(usuario) {
  const registros = cerrarSesionesVencidas();
  const ahora = new Date().toISOString();
  const id = registros.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  registros.push({id, usuarioId: usuario.id, nombre: usuario.nombre, entrada: ahora,
    ultimaSenal: ahora, salida: null, motivo: null, estimada: false});
  guardarDatosPersistidos("cicsa_sesiones_uso", registros);
  localStorage.setItem("cicsa_sesion_uso", String(id));
  return id;
}
function registrarUsoDemo(evento, motivo) {
  const usuario = sesion.usuario();
  if (!usuario || usuario.rol !== "trabajador") return null;
  const cuenta = cargarDatosPersistidos("cicsa_usuarios", []).find(u => u.id === usuario.id);
  if (!cuenta?.activo || cuenta.rol !== "trabajador" || sesion.token() !== "token-demo." + cuenta.id) return null;
  const registros = cerrarSesionesVencidas();
  const registro = registros.find(r => r.id === Number(localStorage.getItem("cicsa_sesion_uso")) && r.usuarioId === usuario.id);
  if (!registro || registro.salida) {
    if (evento === "pulso") iniciarUsoDemo(cuenta);
    return null;
  }
  const ahora = new Date().toISOString();
  registro.ultimaSenal = ahora;
  if (evento === "cerrar") {
    registro.salida = ahora;
    registro.motivo = ["inactividad", "cambio_cuenta"].includes(motivo) ? motivo : "cierre_manual";
  }
  guardarDatosPersistidos("cicsa_sesiones_uso", registros);
  return registro;
}
function enviarPulsoUso(evento = "pulso", motivo) {
  if (!sesion.activa() || sesion.rol() !== "trabajador") return;
  try {
    if (MOCK_MODE) return registrarUsoDemo(evento, motivo);
    return conLimiteDeEspera(async signal => {
      const res = await fetch(API_BASE + "/sesiones/" + evento, {
        signal,
        method: "POST", keepalive: true,
        headers: {"Content-Type": "application/json", Authorization: "Bearer " + sesion.token()},
        body: JSON.stringify({motivo})
      });
      if (!res.ok) throw new Error("No se pudo registrar la sesión.");
    }).catch(error => console.warn("Registro de uso:", error.message));
  } catch (error) { console.warn("Registro de uso:", error.message); }
}


const REGLAS_CONSUMO = Object.freeze({video: 1, lectura: 120});
function reglaConsumoLeccion(leccion, contenido = {}) {
  const url = leccion.url || leccion.video || leccion.mediaUrl || contenido.url || contenido.video || "";
  const tipo = String(leccion.tipo || contenido.tipo || "").toLowerCase();
  if (tipo === "video" || /^data:video\//i.test(url) || /\.(mp4|webm|ogg|mov)([?#].*)?$/i.test(url)) return {tipo: "video", disponible: !!url};
  if (url && (["documento", "pdf"].includes(tipo) || /^data:application\/pdf/i.test(url) || /\.pdf([?#].*)?$/i.test(url))) return {tipo: "documento", disponible: true};
  return {tipo: "lectura", disponible: !!(url || leccion.informacion || contenido.cuerpo)};
}
function unirTramosVideo(tramos, duracion) {
  const validos = (Array.isArray(tramos) ? tramos : []).filter(t => Array.isArray(t) && t.length === 2 && t.every(Number.isFinite) && t[0] >= 0 && t[1] > t[0] && t[1] <= duracion).map(t => [...t]).sort((a,b) => a[0]-b[0]);
  return validos.reduce((r,t) => { const ultimo=r[r.length-1]; if(ultimo && t[0]<=ultimo[1]) ultimo[1]=Math.max(ultimo[1],t[1]); else r.push(t); return r; }, []);
}
function segundosVideoVistos(evidencia) {
  return unirTramosVideo(evidencia?.tramos, evidencia?.duracion).reduce((s,t)=>s+t[1]-t[0],0);
}
function cumpleConsumoLeccion(regla, evidencia) {
  if (!regla.disponible) return false;
  // Solo los subtemas con video requieren consumir el video completo.
  // Lecturas, imágenes y documentos no tienen espera obligatoria.
  if (regla.tipo !== "video") return true;
  if (!evidencia) return false;
  return evidencia.terminado === true && Number.isFinite(evidencia.duracion) && evidencia.duracion > 0 && segundosVideoVistos(evidencia) / evidencia.duracion >= REGLAS_CONSUMO.video;
}
