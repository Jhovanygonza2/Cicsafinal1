# Notificaciones por perfil — CICSA Capacita

Este paquete incorpora notificaciones diferenciadas por rol, conservando los módulos y archivos previos del proyecto.

## Administrador
- Aviso de cursos nuevos enviados por el instructor y cambios reenviados para revisión.
- Avisos de autorizaciones, observaciones y vencimientos próximos (dentro de los siguientes 7 días).
- Avisos de usuarios nuevos o importados.

## Súper administrador
- Recibe avisos de cursos enviados para revisión, cambios de estado, nuevos usuarios y vencimientos próximos.
- Conserva el flujo de autorización exclusiva de cursos creados por instructores.

## Instructor
- Sección de notificaciones en su panel.
- Avisos de autorización o rechazo de cursos.
- El rechazo muestra el comentario del revisor para indicar qué debe corregir.

## Trabajador
- Avisos de cursos publicados y próximos a abrir.
- Avisos de cursos asignados pendientes, en proceso o con examen pendiente.
- Recordatorio de vencimiento cuando faltan 7 días o menos para el cierre.

## Nota técnica
La versión demo conserva las notificaciones en el almacenamiento local del navegador. Para sincronización entre dispositivos o usuarios distintos se requiere conectar la plataforma a una base de datos/backend compartido.

## Accesos directos desde los avisos
- La campana y los centros de notificaciones usan el mismo destino por tipo y perfil.
- Contraseñas: campo de nueva contraseña del usuario solicitado.
- Usuarios: registro individual o lote importado; el botón Mostrar todos los usuarios permite quitar el filtro. Los avisos anteriores sin IDs de lote abren el listado e informan de esta limitación.
- Revisión: solicitud concreta para super admin; tarjeta del curso para admin.
- Observaciones o rechazo: editor del curso con el comentario actual del revisor.
- Vencimiento: editor con foco en la fecha de cierre.
- Autorización: tarjeta administrativa o solicitud del instructor.
- Avance o aprobación del trabajador: seguimiento filtrado por trabajador y curso.
- Se validan los permisos y la propiedad del instructor antes de abrir el destino; los registros no disponibles muestran un aviso.
- Verificación: `node tests/notificaciones-destinos.cjs`, `node tests/aprobacion-cursos.cjs` y `node tests/roles.cjs`.

## Evaluación del instructor al finalizar
- Aparece al aprobar el examen final y al volver a abrir un curso completado.
- Cinco criterios del 1 al 5: claridad, dominio, organización, materiales y valoración general; comentario opcional de hasta 1000 caracteres.
- Un envío por trabajador y curso. No modifica la calificación académica ni condiciona el certificado.
- Solo super admin consulta respuestas, comentarios y promedio en Evaluaciones de instructores. Admin e instructor no tienen acceso al endpoint de consulta. El trabajador solo consulta si ya envió su respuesta.
- Se identifica como instructor al autor del curso cuando su rol es instructor; los cursos anteriores sin ese dato aparecen como responsable no identificado.
- API: GET /encuestas-instructor (superadmin); GET /encuestas-instructor/curso/:id (trabajador, solo estado); POST /encuestas-instructor/curso/:id (trabajador con curso aprobado, puntuaciones y comentario).
- Modo demo: almacenamiento local del navegador, sin confidencialidad frente a quien inspeccione ese almacenamiento y sin sincronización entre dispositivos. Al conectar un backend se deben implementar estos endpoints con autenticación, validación del rol en servidor y restricción única trabajador/curso en base de datos.
- Prueba: node tests/encuestas-instructor.cjs.
