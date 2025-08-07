<?php
if (!isset($_SESSION))
    session_start();

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["estado" => "error", "mensaje" => "Sesión no iniciada"]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

$conexion = new mysqli("localhost", "root", "", "calorease");
if ($conexion->connect_error) {
    echo json_encode(["estado" => "error", "mensaje" => "Error de conexión"]);
    exit;
}

// Antes del UPDATE, verificamos si ya estaba confirmado
$verificar = $conexion->prepare("SELECT registro_confirmado FROM usuario WHERE ID_usuario = ?");
$verificar->bind_param("i", $id_usuario);
$verificar->execute();
$verificar->bind_result($registroConfirmado);
$verificar->fetch();
$verificar->close();

if ($registroConfirmado == 1) {
    echo json_encode(["estado" => "ya_registrado"]);
    $conexion->close();
    exit;
}

// Si no estaba registrado, actualizamos y marcamos como confirmado
$confirmar = 1;
$stmt = $conexion->prepare(query:
    "UPDATE usuario 
                SET registro_confirmado = ? 
                WHERE ID_usuario = ?");
$stmt->bind_param("ii", $confirmar, $id_usuario);

if ($stmt->execute()) {
    echo json_encode(["estado" => "ok"]);
} else {
    echo json_encode(["estado" => "error", "mensaje" => $stmt->error]);
}

$stmt->close();
$conexion->close();
