CREATE DATABASE IF NOT EXISTS app_ionic;
USE app_ionic;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(100),
    username VARCHAR(50),
    password VARCHAR(255),
    fecha_creacion DATETIME,
    rol_id INT,
    activo TINYINT(1),
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE mensajes_contacto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    empresa VARCHAR(100),
    email VARCHAR(100),
    mensaje TEXT,
    fecha DATETIME
);