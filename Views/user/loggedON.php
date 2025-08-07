<?php
session_start();
// include '../../assets/php/logged-resources/obtenerUsuario.php';
include '../../assets/php/logged-resources/obtenerDatos.php';

// Verificar si el usuario ha iniciado sesión
if (!isset($_SESSION['id_usuario'])) {
    echo "Acceso denegado. Por favor inicia sesión.";
    exit;
}

// Mostrar contenido de sesión
$id_usuario = $_SESSION['id_usuario'];
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Sesión iniciada</title>
</head>
<body>
    <h1>Bienvenido</h1>
    <p>Has iniciado sesión exitosamente.</p>
    <h1>Hola, <?php echo htmlspecialchars($_SESSION['nombre'] . " " . $_SESSION['apellido']); ?></h1>
    <p>Tu ID de usuario es: <?php echo htmlspecialchars($id_usuario); ?></p>
    <p>Tu peso es: <?php echo $_SESSION['peso']; ?> kg</p>
    <p>Tu altura es: <?php echo $_SESSION['altura']; ?> cm</p>
    <p>Tu IMC es: <?php echo $_SESSION['imc']; ?></p>
    <p>Tu objetivo calórico: <?php echo $_SESSION['obj_kcal']; ?> kcal</p>
    <p>Tu objetivo físico: <?php echo $_SESSION['obj_fisico']; ?></p>
    <a href="../../assets/php/logged-resources/cerrarsesion.php">Cerrar sesión</a>
    <a href="data-register.html">Ingresar resto de datos</a>
</body>
</html>