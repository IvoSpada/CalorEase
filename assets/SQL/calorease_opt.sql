-- --------------------------------------------------------
-- Base de datos: `calorease` optimizada
-- --------------------------------------------------------

DROP DATABASE IF EXISTS calorease;
CREATE DATABASE calorease CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE calorease;

-- --------------------------------------------------------
-- Tabla: usuario
-- --------------------------------------------------------
CREATE TABLE usuario (
  ID_Usuario INT NOT NULL AUTO_INCREMENT,
  registro_confirmado BIT(1) NOT NULL DEFAULT b'0',
  email VARCHAR(100) NOT NULL UNIQUE,
  nombre VARCHAR(30),
  apellido VARCHAR(60),
  contraseña VARCHAR(255) NOT NULL,
  Peso DECIMAL(5,2),
  Altura DECIMAL(5,2),
  IMC DECIMAL(5,2),
  Obj_KCAL INT,
  Obj_Fisico VARCHAR(50),
  PRIMARY KEY (ID_Usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Tabla: dietas
-- --------------------------------------------------------
CREATE TABLE dietas (
  ID_Dieta INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(50),
  Descripcion TEXT,
  PRIMARY KEY (ID_Dieta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Tabla: comidas
-- --------------------------------------------------------
CREATE TABLE comidas (
  ID_Comida INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(50),
  Calorias INT,
  Proteinas DECIMAL(5,2),
  Carbohidratos DECIMAL(5,2),
  Grasas DECIMAL(5,2),
  PRIMARY KEY (ID_Comida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Tabla: dietas_usuario (usuarios que siguen dietas)
-- --------------------------------------------------------
CREATE TABLE dietas_usuario (
  ID_Dieta INT NOT NULL,
  ID_Usuario INT NOT NULL,
  Fecha_Asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ID_Dieta, ID_Usuario),
  FOREIGN KEY (ID_Dieta) REFERENCES dietas(ID_Dieta) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Usuario) REFERENCES usuario(ID_Usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Tabla: comidas_dieta (comidas asignadas a dietas con fecha)
-- --------------------------------------------------------
CREATE TABLE comidas_dieta (
  ID_Comida INT NOT NULL,
  ID_Dieta INT NOT NULL,
  Fecha_Consumo DATE NOT NULL,
  Platos INT DEFAULT 1,
  Permitido ENUM('Si','No') DEFAULT 'Si',
  PRIMARY KEY (ID_Comida, ID_Dieta, Fecha_Consumo),
  FOREIGN KEY (ID_Comida) REFERENCES comidas(ID_Comida) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Dieta) REFERENCES dietas(ID_Dieta) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Tabla: registrados (posible tabla de usuarios o acceso)
-- --------------------------------------------------------
CREATE TABLE registrados (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(50),
  password VARCHAR(255),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Inserción ejemplo datos para comidas
-- --------------------------------------------------------
INSERT INTO comidas (Nombre, Calorias, Proteinas, Carbohidratos, Grasas) VALUES
('Pollo a la plancha', 200, 35.00, 0.00, 5.00),
('Arroz integral', 180, 5.00, 38.00, 1.00),
('Aguacate', 250, 3.00, 12.00, 22.00),
('Ensalada mixta', 150, 2.00, 15.00, 10.00),
('Atún en agua', 180, 40.00, 0.00, 1.00),
('Batido proteico', 300, 30.00, 20.00, 5.00),
('Salmón al horno', 280, 35.00, 0.00, 15.00),
('Pan integral', 120, 5.00, 22.00, 2.00),
('Frutas variadas', 200, 3.00, 50.00, 1.00),
('Omelette', 250, 20.00, 2.00, 18.00);

-- --------------------------------------------------------
-- Inserción ejemplo datos para dietas
-- --------------------------------------------------------
INSERT INTO dietas (Nombre, Descripcion) VALUES
('Déficit calórico', 'Reducir calorías diarias'),
('Hipertrofia', 'Aumento muscular'),
('Keto', 'Baja en carbohidratos'),
('Equilibrada', 'Balance en nutrientes'),
('Alta proteína', 'Mucho aporte proteico'),
('Vegana', 'Sin productos animales'),
('Mediterránea', 'Rica en frutas y verduras'),
('Baja en carbohidratos', 'Menos carbohidratos'),
('Paleo', 'Alimentos naturales'),
('Deportiva', 'Para deportistas');

-- --------------------------------------------------------
-- Inserción ejemplo usuario
-- --------------------------------------------------------
INSERT INTO usuario (registro_confirmado, email, nombre, apellido, contraseña, Peso, Altura, IMC, Obj_KCAL, Obj_Fisico) VALUES
(b'1', 'ivo@ejemplo.com', 'Ivo', 'DaGoat', 'hashed_password', 67.00, 1.78, 21.15, 12333, 'Bajar peso');