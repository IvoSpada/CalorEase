<?php
session_start();
if (!isset($_SESSION['nombre'])) {
    header("Location: login.html");
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Bienvenido</title>
</head>
<body>
    <h2>Bienvenido, <?php echo $_SESSION['nombre']; ?>!</h2>
    <p>Has iniciado sesión como <?php echo $_SESSION['nombre'], ' ',$_SESSION['apellido']; ?>.</p>
    <a href="cerrarsesion.php">Cerrar sesión</a>
</body>
</html>