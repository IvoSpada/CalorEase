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

try {
    if (!isset($_SESSION['id_usuario'])) {
        throw new Exception("ID de usuario no disponible en la sesion.");
    } else {
        $id_usuario = $_SESSION['id_usuario'];
    }
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $sql = "SELECT nombre FROM usuario WHERE id_usuario = $id_usuario";
    $result = $conn->query($sql);

    $nombre_usuario = "Desconocido";
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $nombre_usuario = $row['nombre'];
        $data = [
            "nombre" => $nombre_usuario
        ];
    } else {
        $data = [
            "nombre" => "usuario"
        ];
    }

    echo json_encode($data);
} catch (Exception $e) {
    http_response_code(500); // Código de error del servidor
    echo json_encode([
        "error" => "Error al obtener el nombre de usuario",
        "detalle" => $e->getMessage()
    ]);
}

$conn->close();
?>