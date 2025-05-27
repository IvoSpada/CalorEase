<?php
if (!isset($_SESSION))
    session_start();

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "calorease";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Error en conexión: " . $conn->connect_error);
}

$id_usuario = $_SESSION['id_usuario'];

$sql = "SELECT nombre FROM usuario WHERE id_usuario = $id_usuario";
$result = $conn->query($sql);

$nombre_usuario = "Desconocido";
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $nombre_usuario = $row['nombre'];
    $data = [
        "nombre" => $nombre_usuario
    ];
    $json = json_encode(value: $data);
    echo $json;
}

$conn->close();
?>