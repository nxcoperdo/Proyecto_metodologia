-- =====================================================
-- BASE DE DATOS SISTEMA DE INVENTARIO DEPORTIVO FET
-- =====================================================
-- Script para crear la estructura completa de la base de datos
-- Ejecutar este script en MySQL para instalar el sistema

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS inventario_fet;
USE inventario_fet;

-- =====================================================
-- TABLA: CATEGORÍA
-- =====================================================
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: UBICACIÓN (Bodegas/almacenes)
-- =====================================================
CREATE TABLE IF NOT EXISTS ubicacion (
  id_ubicacion INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: PRODUCTO
-- =====================================================
CREATE TABLE IF NOT EXISTS producto (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  numero_item INT NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  stock_total INT DEFAULT 0,
  stock_minimo INT DEFAULT 0,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  id_categoria INT,
  id_ubicacion INT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
  FOREIGN KEY (id_ubicacion) REFERENCES ubicacion(id_ubicacion),
  INDEX idx_nombre (nombre),
  INDEX idx_categoria (id_categoria),
  INDEX idx_ubicacion (id_ubicacion)
);

-- =====================================================
-- TABLA: ENTRADA DE INVENTARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS entrada_inv (
  id_entrada INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE DEFAULT CURDATE(),
  costo DECIMAL(10,2),
  cantidad INT,
  id_producto INT NOT NULL,
  id_proveedor INT,
  empleado_recibe VARCHAR(100),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
  INDEX idx_fecha (fecha),
  INDEX idx_producto (id_producto)
);

-- =====================================================
-- TABLA: SALIDA DE INVENTARIO (Préstamos, Devoluciones, Rechazos)
-- =====================================================
CREATE TABLE IF NOT EXISTS salida_inv (
  id_salida INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE DEFAULT CURDATE(),
  cantidad INT,
  tipo_salida VARCHAR(50),
  id_producto INT NOT NULL,
  responsable_entrega VARCHAR(150),
  observacion_rechazo TEXT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
  INDEX idx_fecha (fecha),
  INDEX idx_tipo_salida (tipo_salida),
  INDEX idx_producto (id_producto),
  INDEX idx_responsable (responsable_entrega)
);

-- =====================================================
-- TABLA: USUARIO (Estudiantes)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombres_apellidos VARCHAR(150),
  correo VARCHAR(150) NOT NULL UNIQUE,
  nu_identificacion VARCHAR(20) NOT NULL UNIQUE,
  carrera VARCHAR(100),
  semestre INT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_correo (correo),
  INDEX idx_identificacion (nu_identificacion)
);

-- =====================================================
-- TABLA: USUARIO DEL SISTEMA (Administradores)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuario_sistema (
  id_usuario_sistema INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(100) NOT NULL,
  rol VARCHAR(50),
  correo VARCHAR(150),
  estado VARCHAR(20) DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuario (usuario)
);

-- =====================================================
-- DATOS DE EJEMPLO - CATEGORÍAS
-- =====================================================
INSERT INTO categoria (nombre, descripcion) VALUES
('Balones', 'Balones de diferentes deportes'),
('Uniformes', 'Uniformes deportivos para entrenamientos y competencias'),
('Equipos de Protección', 'Protecciones, cascos, rodilleras y otros equipos de seguridad'),
('Accesorios', 'Accesorios de entrenamiento y competencia');

-- =====================================================
-- DATOS DE EJEMPLO - UBICACIONES
-- =====================================================
INSERT INTO ubicacion (nombre, descripcion) VALUES
('Bodega Central', 'Bodega principal de almacenamiento'),
('Cancha Principal', 'Ubicación en la cancha principal del campus'),
('Gimnasio', 'Equipo ubicado en el gimnasio'),
('Vestiarios', 'Equipos en los vestiarios y áreas de cambio');

-- =====================================================
-- DATOS DE EJEMPLO - PRODUCTOS
-- =====================================================
INSERT INTO producto (numero_item, nombre, stock_total, stock_minimo, marca, modelo, id_categoria, id_ubicacion) VALUES
(1, 'Balón de Fútbol', 15, 3, 'Adidas', 'FIFA 2024', 1, 1),
(2, 'Balón de Voleibol', 12, 2, 'Mikasa', 'MVA200', 1, 1),
(3, 'Balón de Básquetbol', 8, 2, 'Spalding', 'NBA Official', 1, 2),
(4, 'Kit de Uniformes Futbol', 20, 5, 'Umbro', 'Elite', 2, 1),
(5, 'Rodilleras', 30, 5, 'McDavid', 'HEX Pad', 3, 3),
(6, 'Conos de Entrenamiento', 50, 10, 'Sklz', 'Training Set', 4, 4);

-- =====================================================
-- DATOS DE EJEMPLO - USUARIOS DEL SISTEMA (Admin)
-- =====================================================
INSERT INTO usuario_sistema (nombre, apellido, usuario, contrasena, rol, correo) VALUES
('Admin', 'Sistema', 'admin', 'admin123', 'Administrador', 'admin@fet.edu.co');

-- =====================================================
-- DATOS DE EJEMPLO - USUARIOS (Estudiantes)
-- =====================================================
INSERT INTO usuario (nombres_apellidos, correo, nu_identificacion, carrera, semestre) VALUES
('Juan Pérez López', 'juan@ejemplo.com', '123456789', 'Ingeniería en Sistemas', 3),
('María García Rodríguez', 'maria@ejemplo.com', '987654321', 'Ingeniería Mecánica', 4),
('Carlos Martínez González', 'carlos@ejemplo.com', '456789123', 'Ingeniería Civil', 2),
('Ana López Sánchez', 'ana@ejemplo.com', '789123456', 'Administración de Empresas', 3),
('David Fernández Torres', 'david@ejemplo.com', '321654987', 'Ingeniería en Sistemas', 5);

-- =====================================================
-- DATOS DE EJEMPLO - ENTRADAS DE INVENTARIO
-- =====================================================
INSERT INTO entrada_inv (fecha, costo, cantidad, id_producto, empleado_recibe) VALUES
('2024-01-15', 450.00, 15, 1, 'Juan García'),
('2024-01-20', 350.00, 12, 2, 'Juan García'),
('2024-02-01', 500.00, 8, 3, 'María López'),
('2024-02-10', 2000.00, 20, 4, 'Juan García'),
('2024-02-15', 300.00, 30, 5, 'María López'),
('2024-03-01', 150.00, 50, 6, 'Juan García');

-- =====================================================
-- DATOS DE EJEMPLO - SALIDAS DE INVENTARIO
-- =====================================================
INSERT INTO salida_inv (fecha, cantidad, tipo_salida, id_producto, responsable_entrega) VALUES
('2024-05-01', 2, 'Prestamo', 1, 'juan@ejemplo.com'),
('2024-05-02', 1, 'Prestamo', 2, 'maria@ejemplo.com'),
('2024-05-03', 2, 'Prestamo', 1, 'carlos@ejemplo.com'),
('2024-05-04', 3, 'Prestamo', 5, 'ana@ejemplo.com'),
('2024-05-05', 1, 'Devolucion', 1, 'juan@ejemplo.com'),
('2024-05-06', 2, 'Solicitud Pendiente', 3, 'david@ejemplo.com'),
('2024-05-07', 5, 'Solicitud Pendiente', 4, 'juan@ejemplo.com');

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- Base de datos lista para usar
-- Usuario por defecto: admin / admin123
-- Estudiantes de prueba creados
-- Productos de ejemplo añadidos

