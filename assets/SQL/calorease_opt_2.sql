-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 01-08-2025 a las 14:42:47
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
  `ID_Comida` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) DEFAULT NULL,
  `Calorias` int DEFAULT NULL,
  `Proteinas` decimal(5,2) DEFAULT NULL,
  `Carbohidratos` decimal(5,2) DEFAULT NULL,
  `Grasas` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`ID_Comida`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `comidas`
--

INSERT INTO `comidas` (`ID_Comida`, `Nombre`, `Calorias`, `Proteinas`, `Carbohidratos`, `Grasas`) VALUES
(1, 'Pechuga de pollo', 165, 31.00, 0.00, 3.60),
(2, 'Arroz integral', 215, 5.00, 45.00, 1.80),
(3, 'Aguacate', 240, 3.00, 12.00, 22.00),
(4, 'Omelette de claras', 120, 20.00, 2.00, 4.00),
(5, 'Pan integral', 120, 5.00, 20.00, 2.00),
(6, 'Ensalada verde', 80, 2.00, 10.00, 4.00),
(7, 'Yogur griego', 150, 10.00, 5.00, 8.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comidas_dieta`
--

DROP TABLE IF EXISTS `comidas_dieta`;
CREATE TABLE IF NOT EXISTS `comidas_dieta` (
  `ID_Comida` int NOT NULL,
  `ID_Dieta` int NOT NULL,
  `Fecha_Consumo` date NOT NULL,
  `Platos` int DEFAULT '1',
  `Permitido` enum('Si','No') DEFAULT NULL,
  PRIMARY KEY (`ID_Comida`,`ID_Dieta`,`Fecha_Consumo`),
  KEY `ID_Dieta` (`ID_Dieta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `comidas_dieta`
--

INSERT INTO `comidas_dieta` (`ID_Comida`, `ID_Dieta`, `Fecha_Consumo`, `Platos`, `Permitido`) VALUES
(1, 1, '2025-08-01', 1, 'Si'),
(2, 1, '2025-08-01', 1, 'Si'),
(3, 3, '2025-08-01', 1, 'Si'),
(4, 2, '2025-08-01', 1, 'Si'),
(6, 4, '2025-08-01', 1, 'Si'),
(7, 2, '2025-08-01', 1, 'Si');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comidas_usuario`
--

DROP TABLE IF EXISTS `comidas_usuario`;
CREATE TABLE IF NOT EXISTS `comidas_usuario` (
  `ID_Usuario` int NOT NULL,
  `ID_Comida` int NOT NULL,
  `Fecha_Consumo` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Platos` int DEFAULT '1',
  PRIMARY KEY (`ID_Usuario`,`ID_Comida`,`Fecha_Consumo`),
  KEY `ID_Comida` (`ID_Comida`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `comidas_usuario`
--

INSERT INTO `comidas_usuario` (`ID_Usuario`, `ID_Comida`, `Fecha_Consumo`, `Platos`) VALUES
(1, 1, '2025-08-01 14:41:37', 1),
(1, 2, '2025-08-01 14:41:37', 1),
(2, 4, '2025-08-01 14:41:37', 1),
(2, 7, '2025-08-01 14:41:37', 1),
(3, 3, '2025-08-01 14:41:37', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dietas`
--

DROP TABLE IF EXISTS `dietas`;
CREATE TABLE IF NOT EXISTS `dietas` (
  `ID_Dieta` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) DEFAULT NULL,
  `Descripcion` text,
  PRIMARY KEY (`ID_Dieta`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `dietas`
--

INSERT INTO `dietas` (`ID_Dieta`, `Nombre`, `Descripcion`) VALUES
(1, 'Déficit calórico', 'Reducir la ingesta calórica para perder peso'),
(2, 'Hipertrofia', 'Aumento del tamaño muscular con dieta alta en proteínas'),
(3, 'Keto', 'Dieta baja en carbohidratos y alta en grasas'),
(4, 'Mediterránea', 'Rica en frutas, verduras, pescado y aceite de oliva');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dietas_usuario`
--

DROP TABLE IF EXISTS `dietas_usuario`;
CREATE TABLE IF NOT EXISTS `dietas_usuario` (
  `ID_Dieta` int NOT NULL,
  `ID_Usuario` int NOT NULL,
  `Fecha_Asignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_Dieta`,`ID_Usuario`),
  KEY `ID_Usuario` (`ID_Usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `dietas_usuario`
--

INSERT INTO `dietas_usuario` (`ID_Dieta`, `ID_Usuario`, `Fecha_Asignacion`) VALUES
(1, 1, '2025-08-01 14:38:22'),
(2, 2, '2025-08-01 14:38:22'),
(3, 3, '2025-08-01 14:38:22'),
(4, 1, '2025-08-01 14:38:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

DROP TABLE IF EXISTS `usuario`;
CREATE TABLE IF NOT EXISTS `usuario` (
  `ID_Usuario` int NOT NULL AUTO_INCREMENT,
  `registro_confirmado` bit(1) DEFAULT b'0',
  `email` varchar(50) NOT NULL,
  `nombre` varchar(30) DEFAULT NULL,
  `apellido` varchar(60) DEFAULT NULL,
  `contraseña` varchar(250) NOT NULL,
  `Peso` decimal(5,2) DEFAULT NULL,
  `Altura` decimal(5,2) DEFAULT NULL,
  `IMC` decimal(5,2) DEFAULT NULL,
  `Obj_KCAL` int DEFAULT NULL,
  `Obj_Fisico` varchar(50) DEFAULT NULL,
  `Fecha_Registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_Usuario`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`ID_Usuario`, `registro_confirmado`, `email`, `nombre`, `apellido`, `contraseña`, `Peso`, `Altura`, `IMC`, `Obj_KCAL`, `Obj_Fisico`, `Fecha_Registro`) VALUES
(1, b'0', 'ana@mail.com', 'Ana', 'Pérez', 'ana123', 65.00, 1.65, 23.88, 2000, 'Mantener peso', '2025-08-01 14:37:17'),
(2, b'0', 'juan@mail.com', 'Juan', 'López', 'juan456', 75.00, 1.78, 23.67, 2500, 'Subir peso', '2025-08-01 14:37:17'),
(3, b'0', 'luisa@mail.com', 'Luisa', 'Martínez', 'luisa789', 55.00, 1.60, 21.48, 1800, 'Bajar peso', '2025-08-01 14:37:17');

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `comidas_dieta`
--
ALTER TABLE `comidas_dieta`
  ADD CONSTRAINT `comidas_dieta_ibfk_1` FOREIGN KEY (`ID_Comida`) REFERENCES `comidas` (`ID_Comida`) ON DELETE CASCADE,
  ADD CONSTRAINT `comidas_dieta_ibfk_2` FOREIGN KEY (`ID_Dieta`) REFERENCES `dietas` (`ID_Dieta`) ON DELETE CASCADE;

--
-- Filtros para la tabla `comidas_usuario`
--
ALTER TABLE `comidas_usuario`
  ADD CONSTRAINT `comidas_usuario_ibfk_1` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `comidas_usuario_ibfk_2` FOREIGN KEY (`ID_Comida`) REFERENCES `comidas` (`ID_Comida`) ON DELETE CASCADE;

--
-- Filtros para la tabla `dietas_usuario`
--
ALTER TABLE `dietas_usuario`
  ADD CONSTRAINT `dietas_usuario_ibfk_1` FOREIGN KEY (`ID_Dieta`) REFERENCES `dietas` (`ID_Dieta`) ON DELETE CASCADE,
  ADD CONSTRAINT `dietas_usuario_ibfk_2` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
