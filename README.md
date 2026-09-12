# GitHub Repository
https://github.com/Oroxco/proyecto_finanzas_orozco.git

# Personal Expense Tracking App 📊

Aplicación Full-Stack para el control de finanzas personales desarrollada como proyecto escolar. Permite la gestión de transacciones y su visualización en un panel interactivo.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** Ionic Framework, Angular, TypeScript, Chart.js
* **Backend:** Node.js, Express.js (REST API)
* **Base de Datos:** MySQL (gestionado con phpMyAdmin / XAMPP)

---

## 🚀 Requisitos e Instalación

### 1. Base de Datos
1. Iniciar **MySQL** en XAMPP.
2. Abrir **phpMyAdmin** (`http://localhost/phpmyadmin`).
3. Importar y ejecutar el script `api-backend/db.sql` para crear la base de datos `finanzas_db` y la tabla `transacciones`.

### 2. Configurar e Iniciar el Backend
```bash
cd api-backend
npm install
node index.js