<?php
header("Content-Type: application/json");

// Conexión a la base de datos
$host = "localhost";
$usuario = "root";
$contrasena = ""; // ajusta si tienes clave
$base_datos = "calorease";

$conn = new mysqli($host, $usuario, $contrasena, $base_datos);

// Verificar conexión
if ($conn->connect_error) {
  echo json_encode(["error" => "Conexión fallida: " . $conn->connect_error]);
  exit();
}

// Consulta para obtener todas las comidas
$sql = "SELECT ID_Comida, Nombre, Calorias, Proteinas, Carbohidratos, Grasas FROM comidas";
$resultado = $conn->query($sql);

$comidas = [];

if ($resultado->num_rows > 0) {
  while ($fila = $resultado->fetch_assoc()) {
    $comidas[] = $fila;
  }
}

// Devolver en formato JSON
echo json_encode($comidas);

// Cerrar conexión
$conn->close();
?>