# Personal Expense Tracking App 📊

Aplicación móvil híbrida Full-Stack y resiliente para el control de finanzas personales. Permite la gestión de ingresos/gastos, visualización gráfica del balance en tiempo real y soporte para funcionamiento sin conexión a internet (*Offline-First*).

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** Ionic Framework, Angular, TypeScript, Chart.js
- **Nativo & Plugins:** Capacitor (`@capacitor/network`), Android Studio
- **Backend:** PHP (REST API)
- **Base de Datos:** MySQL (XAMPP / phpMyAdmin)
- **Persistencia Local:** `localStorage`, RxJS (`tap`, `catchError`)

---

## ⚡ Características Principales

- **Conexión IP Dinámica:** Configuración de la dirección IP del servidor desde la pantalla de Login para pruebas en red local con dispositivos móviles/emuladores.
- **Modo Offline & Cache-First:** Almacenamiento local automático de datos. Ante fallas de red o caída del servidor, la app recupera la información guardada sin interrumpir la experiencia.
- **Alertas Visuales Globales:** Notificación flotante personalizada (`ion-toast`) al navegar sin conexión a internet.
- **Protección de Transacciones:** Bloqueo defensivo de operaciones de escritura (crear/eliminar) durante el modo offline para preservar la integridad de los datos.
- **Dashboard Interactivo:** Gráficas de barras con Chart.js para el desglose diario de ingresos y gastos.

---

## 🚀 Requisitos e Instalación

### 1. Base de Datos & Backend (XAMPP)
1. Inicia los servicios de **Apache** y **MySQL** en XAMPP.
2. Coloca la carpeta `api-backend` dentro de la ruta `htdocs` de XAMPP.
3. Abre **phpMyAdmin** (`http://localhost/phpmyadmin`).
4. Importa y ejecuta el script `db.sql` localizado en `api-backend/` para crear la base de datos `finanzas_db`.

### 2. Configurar e Iniciar la Aplicación Móvil
```bash
# Instalar dependencias del frontend
npm install

# Iniciar servidor de desarrollo web
ionic serve

3. Compilación para Android / Generar APK
Bash
# Compilar proyecto web y sincronizar con Capacitor
ionic build
npx cap sync android

# Abrir el proyecto en Android Studio para generar el app-debug.apk
npx cap open android

---

### Sincronizar el cambio en GitHub:
Una vez guardado el archivo `README.md`, sube la actualización con:

```bash
git add README.md
git commit -m "Docs: Actualizacion del README con arquitectura PHP, Capacitor y soporte Offline"
git push