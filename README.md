# 📊 Personal Expense Tracking App

Aplicación móvil híbrida **Full-Stack** para la gestión de finanzas personales.  
Permite registrar ingresos y gastos, consultar el balance mediante gráficos y continuar utilizando la aplicación incluso cuando no existe conexión a Internet.

---

## ✨ Características

- 💰 Registro y gestión de **ingresos y gastos**.
- 📊 Dashboard con visualización gráfica del balance.
- 📱 Aplicación híbrida desarrollada con **Ionic + Angular**.
- 🌐 Configuración de **IP dinámica** para conectarse al backend desde dispositivos móviles o emuladores.
- 📴 Funcionamiento **Offline-First** mediante almacenamiento local.
- 🔄 Recuperación automática de información almacenada cuando el servidor no está disponible.
- 🔔 Alertas visuales mediante `ion-toast` cuando se pierde la conexión.
- 🔒 Bloqueo de operaciones de escritura cuando la aplicación está offline para proteger la integridad de los datos.
- 📈 Gráficas de barras utilizando **Chart.js**.

---

## 🛠️ Tecnologías utilizadas

### Frontend

- [Ionic Framework](https://ionicframework.com/)
- [Angular](https://angular.dev/)
- TypeScript
- [Chart.js](https://www.chartjs.org/)

### Aplicación nativa

- [Capacitor](https://capacitorjs.com/)
- `@capacitor/network`
- Android Studio

### Backend

- PHP
- REST API

### Base de datos

- MySQL
- XAMPP
- phpMyAdmin

### Persistencia local

- `localStorage`
- RxJS
- `tap`
- `catchError`

---

## 🏗️ Arquitectura

La aplicación utiliza una arquitectura cliente-servidor:

```text
┌──────────────────────────┐
│      Aplicación móvil    │
│                          │
│ Ionic + Angular          │
│ TypeScript + Chart.js    │
└────────────┬─────────────┘
             │
             │ HTTP / REST API
             ▼
┌──────────────────────────┐
│        Backend           │
│                          │
│ PHP REST API             │
└────────────┬─────────────┘
             │
             │ SQL
             ▼
┌──────────────────────────┐
│        MySQL             │
│                          │
│      finanzas_db         │
└──────────────────────────┘
