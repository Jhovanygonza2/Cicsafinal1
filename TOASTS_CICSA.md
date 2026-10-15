# Avisos flotantes de CICSA

Componente compartido: js/toasts.js y css/toasts.css. Se carga antes de api.js en las 13 páginas que utilizan la API.

## Comportamiento
- Éxito, error, advertencia e información, identificados con texto e icono.
- Máximo cuatro avisos, cierre manual y mensajes sin interpretar HTML.
- Todos los tipos, incluidos los errores, duran 1 segundo y se desvanecen durante 0.3 segundos antes de retirarse. Se pausan al pasar el puntero o enfocar el aviso. El cierre manual sigue disponible; los errores junto a los campos permanecen visibles.
- Supresión de avisos idénticos durante cuatro segundos; errores de consultas periódicas durante un minuto.
- Acceso correcto y cierre de sesión se conservan en sessionStorage para mostrarse tras navegar, con vencimiento de un minuto.
- Los errores junto al formulario y los resultados de evaluaciones permanecen en su lugar.
- Avisos de pérdida/recuperación de conexión. No significan que el servidor esté disponible.
- Los formularios de cursos, comunicados, trabajadores y soporte avisan de cambios pendientes. Al reiniciarse se limpia ese estado. Los cursos también lo limpian al finalizar el guardado.

## Integraciones
Acceso y permisos; recuperación; altas e importación de trabajadores; roles y estado; creación y revisión de cursos; selección de materiales; edición de temas/unidades/subtemas; asignación; errores de calendario y consultas; progreso y evaluaciones; generación de constancia y datos faltantes; comunicados; descarte de notificaciones; soporte y solicitud/autorización de nuevo intento; reportes y errores de historial de conexiones.

La constancia avisa que está preparada para imprimir o guardar: el navegador no confirma que el archivo se haya descargado. Seleccionar material o modificar una lección en el editor no se presenta como un guardado definitivo.

## Apartados sin función implementada
No existen todavía interfaces para editar datos personales o foto, configurar push, enviar feedback, guardar preferencias generales, marcar avisos como leídos, asignar reconocimientos manualmente ni reordenar lecciones. Tampoco existe un guardado independiente de borradores. No se inventaron esas operaciones ni sus confirmaciones. Los cursos completados conservan su aviso de finalización existente.

Cuando se implementen, conectar la confirmación después de guardar:
window.CicsaToast.mostrar("Cambios guardados.", "exito");
En fallos: window.CicsaToast.mostrar(error.message, "error");
Para formularios nuevos usar marcarPendiente(form) y guardado(form) solo tras persistir.

Validación: node tests/toasts.cjs y pruebas existentes de roles, soporte y sesiones.
