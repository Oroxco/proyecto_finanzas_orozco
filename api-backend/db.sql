-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS finanzas_db;
USE finanzas_db;

-- Crear la tabla de transacciones
CREATE TABLE transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('ingreso', 'gasto') NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    descripcion VARCHAR(255)
);

-- Insertar datos de prueba (para que tu API tenga algo que mostrar)
INSERT INTO transacciones (tipo, monto, categoria, fecha, descripcion) VALUES 
('ingreso', 12000.00, 'Salario', '2026-09-01', 'Pago de nómina'),
('gasto', 4500.00, 'Renta', '2026-09-05', 'Renta del mes');