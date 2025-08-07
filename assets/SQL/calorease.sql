-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 11-05-2025 a las 22:11:04
-- Versión del servidor: 8.2.0
-- Versión de PHP: 8.2.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `calorease`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comidas`
--

DROP TABLE IF EXISTS `comidas`;
CREATE TABLE IF NOT EXISTS `comidas` (
  `ID_Comida` int NOT NULL,
  `Nombre` varchar(50) DEFAULT NULL,
  `Calorias` int DEFAULT NULL,
  `Proteinas` decimal(5,2) DEFAULT NULL,
  `Carbohidratos` decimal(5,2) DEFAULT NULL,
  `Grasas` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`ID_Comida`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `comidas`
--

INSERT INTO `comidas` (`ID_Comida`, `Nombre`, `Calorias`, `Proteinas`, `Carbohidratos`, `Grasas`) VALUES
(1, 'Pollo a la plancha', 200, 35.00, 0.00, 5.00),
(2, 'Arroz integral', 180, 5.00, 38.00, 1.00),
(3, 'Aguacate', 250, 3.00, 12.00, 22.00),
(4, 'Ensalada mixta', 150, 2.00, 15.00, 10.00),
(5, 'Atún en agua', 180, 40.00, 0.00, 1.00),
(6, 'Batido proteico', 300, 30.00, 20.00, 5.00),
(7, 'Salmón al horno', 280, 35.00, 0.00, 15.00),
(8, 'Pan integral', 120, 5.00, 22.00, 2.00),
(9, 'Frutas variadas', 200, 3.00, 50.00, 1.00),
(10, 'Omelette', 250, 20.00, 2.00, 18.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comidas_dieta`
--

DROP TABLE IF EXISTS `comidas_dieta`;
CREATE TABLE IF NOT EXISTS `comidas_dieta` (
  `ID_Comida` int NOT NULL,
  `ID_Dieta` int NOT NULL,
  `Fecha_Consumo` date NOT NULL,
  `Platos` int DEFAULT NULL,
  `Permitido` char(2) DEFAULT NULL,
  PRIMARY KEY (`ID_Comida`,`ID_Dieta`,`Fecha_Consumo`),
  KEY `ID_Dieta` (`ID_Dieta`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `comidas_dieta`
--

INSERT INTO `comidas_dieta` (`ID_Comida`, `ID_Dieta`, `Fecha_Consumo`, `Platos`, `Permitido`) VALUES
(1, 1, '2024-03-10', 1, 'Si'),
(2, 2, '2024-03-11', 1, 'Si'),
(3, 3, '2024-03-12', 1, 'Si'),
(4, 4, '2024-03-13', 1, 'Si'),
(5, 5, '2024-03-14', 1, 'Si'),
(6, 6, '2024-03-15', 1, 'Si'),
(7, 7, '2024-03-16', 1, 'Si'),
(8, 8, '2024-03-17', 1, 'Si'),
(9, 9, '2024-03-18', 1, 'Si'),
(10, 10, '2024-03-19', 1, 'Si');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dietas`
--

DROP TABLE IF EXISTS `dietas`;
CREATE TABLE IF NOT EXISTS `dietas` (
  `ID_Dieta` int NOT NULL,
  `Nombre` varchar(50) DEFAULT NULL,
  `Descripcion` text,
  PRIMARY KEY (`ID_Dieta`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `dietas`
--

INSERT INTO `dietas` (`ID_Dieta`, `Nombre`, `Descripcion`) VALUES
(1, 'Déficit calórico', 'Reducir calorías diarias'),
(2, 'Hipertrofia', 'Aumento muscular'),
(3, 'Keto', 'Baja en carbohidratos'),
(4, 'Equilibrada', 'Balance en nutrientes'),
(5, 'Alta proteína', 'Mucho aporte proteico'),
(6, 'Vegana', 'Sin productos animales'),
(7, 'Mediterránea', 'Rica en frutas y verduras'),
(8, 'Baja en carbos', 'Menos carbohidratos'),
(9, 'Paleo', 'Alimentos naturales'),
(10, 'Deportiva', 'Para deportistas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dietas_usuario`
--

DROP TABLE IF EXISTS `dietas_usuario`;
CREATE TABLE IF NOT EXISTS `dietas_usuario` (
  `ID_Dieta` int NOT NULL,
  `ID_Usuario` int NOT NULL,
  `Nombre` varchar(50) DEFAULT NULL,
  `Descripcion` text,
  PRIMARY KEY (`ID_Dieta`,`ID_Usuario`),
  KEY `ID_Usuario` (`ID_Usuario`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `dietas_usuario`
--

INSERT INTO `dietas_usuario` (`ID_Dieta`, `ID_Usuario`, `Nombre`, `Descripcion`) VALUES
(1, 1, 'Déficit calórico', 'Reducir calorías para bajar grasa'),
(2, 2, 'Hipertrofia', 'Aumento de músculo'),
(3, 3, 'Keto', 'Dieta alta en grasas, baja en carbs'),
(4, 4, 'Equilibrada', 'Balance entre macronutrientes'),
(5, 5, 'Alta proteína', 'Enfoque en proteínas'),
(6, 6, 'Vegana', 'Sin productos de origen animal'),
(7, 7, 'Mediterránea', 'Rica en frutas, verduras y pescado'),
(8, 8, 'Baja en carbohidratos', 'Reducción de carbohidratos'),
(9, 9, 'Paleo', 'Basada en alimentos naturales'),
(10, 10, 'Deportiva', 'Alta en calorías para atletas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registrados`
--

DROP TABLE IF EXISTS `registrados`;
CREATE TABLE IF NOT EXISTS `registrados` (
  `id` int DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

DROP TABLE IF EXISTS `usuario`;
CREATE TABLE IF NOT EXISTS `usuario` (
  `ID_Usuario` int NOT NULL AUTO_INCREMENT,
  `registro_confirmado` bit(1) NOT NULL DEFAULT b'0',
  `email` varchar(50) NOT NULL,
  `nombre` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `apellido` varchar(60) DEFAULT NULL,
  `contraseña` varchar(250) NOT NULL,
  `Peso` decimal(5,2) DEFAULT NULL,
  `Altura` decimal(5,2) DEFAULT NULL,
  `IMC` decimal(5,2) DEFAULT NULL,
  `Obj_KCAL` int DEFAULT NULL,
  `Obj_Fisico` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ID_Usuario`)
) ENGINE=MyISAM AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`ID_Usuario`, `registro_confirmado`, `email`, `nombre`, `apellido`, `contraseña`, `Peso`, `Altura`, `IMC`, `Obj_KCAL`, `Obj_Fisico`) VALUES
(47, b'0', 'ivo500@mail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(45, b'0', 'iv@ivo.com', NULL, NULL, 'hola', NULL, NULL, NULL, NULL, NULL),
(46, b'0', 'ivo500@mail.com', 'ivo', 'ivo', 'ivo', 123.00, 123.00, 0.01, 123, 'Bajar peso'),
(44, b'0', 'iv@ivo.com', 'fgh', 'fgh', 'hola', 45.00, 456.00, 0.00, 45645, 'Subir peso'),
(43, b'0', 'iv@ivo.com', NULL, NULL, 'hola', NULL, NULL, NULL, NULL, NULL),
(42, b'0', 'iv@ivo.com', NULL, NULL, 'hola', NULL, NULL, NULL, NULL, NULL),
(41, b'0', 'iv@ivo.com', NULL, NULL, 'hola', NULL, NULL, NULL, NULL, NULL),
(40, b'0', 'iv@ivo.com', NULL, NULL, 'hola', NULL, NULL, NULL, NULL, NULL),
(39, b'0', 'iv@ivo.com', NULL, NULL, 'hola', NULL, NULL, NULL, NULL, NULL),
(38, b'0', 'iv@ivo.com', NULL, NULL, 'hola', NULL, NULL, NULL, NULL, NULL),
(37, b'0', 'iv@ivo.com', NULL, NULL, 'hola', NULL, NULL, NULL, NULL, NULL),
(36, b'0', 'ivo2@mail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(35, b'0', 'ivo2@mail.com', 'sdf', 'sdf', 'ivo', 234.00, 234.00, 0.00, 23423, 'Bajar peso'),
(34, b'1', 'ivo@prueba.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(48, b'0', 'prueba123@mail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(49, b'0', 'prueba123@mail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(50, b'1', 'hola@hola.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(51, b'0', 'hola@hola.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(52, b'1', 'LOCURA@mai.com', 'ivo', 'MESSI', 'ivo', 68.00, 1.86, 19.66, 4000, 'Subir peso'),
(53, b'0', 'LOCURA@mai.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(54, b'1', 'hola2@mail.com', 'ivo', 'la cabra spada', 'ivo', 67.00, 1.86, 19.37, 4500, 'Mantener peso'),
(55, b'0', 'hola2@mail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(56, b'1', 'puto@mail.com', 'dsfg', 'dfg', 'ivo', 234.00, 234.00, 0.00, 23423, 'Bajar peso'),
(57, b'0', 'puto@mail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(58, b'0', 'puto@mail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(59, b'1', 'ivospada03@gmail.com', 'ivo', 'ivo', 'ivo', 123.00, 123.00, 0.01, 123, 'Subir peso'),
(60, b'0', 'ivospada03@gmail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(61, b'0', 'ivospada03@gmail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(62, b'0', 'ivospada03@gmail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(63, b'0', 'ivospada03@gmail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(64, b'0', 'ivospada03@gmail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(65, b'0', 'ivospada03@gmail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(66, b'0', 'ivospada03@gmail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(67, b'0', 'ivospada03@gmail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(68, b'0', 'ivospada03@gmail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(69, b'0', 'ivoprueba@mail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(70, b'1', 'ivoprueba@mail.com', NULL, NULL, 'ivo', NULL, NULL, NULL, NULL, NULL),
(71, b'1', 'ivospada03@gmail.com', 'Ivo', 'daGoat', 'ivo', 67.00, 1.78, 21.15, 12333, 'Bajar peso');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
