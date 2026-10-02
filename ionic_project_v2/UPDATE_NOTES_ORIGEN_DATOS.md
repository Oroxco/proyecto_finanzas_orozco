# Actualización: diagnóstico API y Origen de datos

## Cambios
- Debajo del campo contraseña, el login muestra un panel de diagnóstico después de un error de autenticación/conexión.
- El diagnóstico guarda fecha, URL, host/IP destino configurado, puerto API, protocolo, payload con contraseña redactada, cabeceras de solicitud y metadatos de conexión a DB.
- Se agregó el botón/modal “Diagnóstico API” a las vistas Historial, Gestión y Resumen.
- Se agregó la pantalla “Origen de datos” como pestaña para editar host, protocolo, puerto/ruta API y metadatos de la base de datos.
- Las llamadas API ahora construyen su URL desde esta configuración.
- La pantalla permite descargar el JSON actualizado.

## Importante
1. La configuración editable se persiste en `localStorage` como JSON (`origen_datos_config`) para que el navegador pueda modificarla. `src/assets/origen-datos.json` es la plantilla inicial; por seguridad, una app web no puede reescribir ese archivo estático en el servidor.
2. El archivo `src/assets/origen-datos.json` no se lee automáticamente por HTTP en esta actualización; contiene los valores iniciales documentados. Si se requiere que múltiples dispositivos compartan y editen el mismo JSON del servidor, hace falta crear un endpoint PHP con validación y permisos de administrador.
3. La IP mostrada es el host/IP de destino configurado, no la IP pública del cliente. El navegador no puede conocer de forma fiable la IP pública real del servidor ni leer cabeceras de respuesta no expuestas por CORS.
4. El payload oculta la contraseña como `[REDACTADO]`; no se recomienda registrar contraseñas reales en logs.
5. Los campos de DB son metadatos de configuración para diagnóstico; Ionic no conecta directamente con MySQL. La conexión real a MySQL debe permanecer en PHP.
6. Configuración inicial: API `http://localhost:8080/api_ionic/api.php`, DB `mysql://localhost:3306/app_ionic`. Ajusta el host/puerto en Origen de datos según tu entorno.
