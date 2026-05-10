-- Crear base de datos
CREATE DATABASE IF NOT EXISTS inventario_fet;
USE inventario_fet;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT
);

-- Tabla de ubicaciones
CREATE TABLE IF NOT EXISTS ubicacion (
  id_ubicacion INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT
);

-- Tabla de productos
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
  FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
  FOREIGN KEY (id_ubicacion) REFERENCES ubicacion(id_ubicacion)
);

-- Tabla de entrada de inventario
CREATE TABLE IF NOT EXISTS entrada_inv (
  id_entrada INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE DEFAULT CURDATE(),
  costo DECIMAL(10,2),
  cantidad INT,
  id_producto INT NOT NULL,
  id_proveedor INT,
  empleado_recibe VARCHAR(100),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- Tabla de salida de inventario (préstamos, devoluciones)
CREATE TABLE IF NOT EXISTS salida_inv (
  id_salida INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE DEFAULT CURDATE(),
  cantidad INT,
  tipo_salida VARCHAR(50),
  id_producto INT NOT NULL,
  responsable_entrega VARCHAR(150),
  observacion_rechazo TEXT NULL,
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- Tabla de usuarios estudiantes
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombres_apellidos VARCHAR(150),
  correo VARCHAR(150) NOT NULL UNIQUE,
  nu_identificacion VARCHAR(20) NOT NULL,
  carrera VARCHAR(100),
  semestre INT
);

-- Tabla de usuarios del sistema (administradores)
CREATE TABLE IF NOT EXISTS usuario_sistema (
  id_usuario_sistema INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(100) NOT NULL,
  rol VARCHAR(50),
  correo VARCHAR(150)
);