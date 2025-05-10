<?php
if (!isset($_SESSION))
    session_start();

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "calorease";

// Conexión
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Error en conexión: " . $conn->connect_error);
}

$id_usuario = $_SESSION['id_usuario'];

$sql = "SELECT peso, altura, imc, obj_kcal, obj_fisico, nombre, apellido FROM usuario WHERE id_usuario = $id_usuario";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $datos = $result->fetch_assoc();

    // Guardar en sesión
    $_SESSION['peso'] = $datos['peso'];
    $_SESSION['altura'] = $datos['altura'];
    $_SESSION['imc'] = $datos['imc'];
    $_SESSION['obj_kcal'] = $datos['obj_kcal'];
    $_SESSION['obj_fisico'] = $datos['obj_fisico'];
    $_SESSION['nombre'] = $datos['nombre'];
    $_SESSION['apellido'] = $datos['apellido'];

    echo json_encode([
        'estado' => 'ok',
        'nombre' => $datos['nombre'],
        'apellido' => $datos['apellido'],
        'peso' => $datos['peso'],
        'altura' => $datos['altura'],
        'imc' => $datos['imc'],
        'obj_kcal' => $datos['obj_kcal'],
        'obj_fisico' => $datos['obj_fisico']
    ]);
} else {
    echo json_encode(['estado' => 'usuario_no_encontrado']);
}

$conn->close();
?>