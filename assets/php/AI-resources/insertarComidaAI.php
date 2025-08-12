<?php
// AI-resources/insertarComidaAI.php

header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos
$servername = "localhost";
$username = "root"; // cambiar si corresponde
$password = "";     // cambiar si corresponde
$dbname = "calorease"; // tu base de datos

$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $conn->connect_error]);
    exit;
}

// Leer el JSON recibido
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Validar JSON
if (!$data || !isset($data["Nombre_Comida"]) || !isset($data["Calorias"])) {
    http_response_code(400);
    echo json_encode(["error" => "Datos inválidos o incompletos"]);
    exit;
}

// Extraer y sanitizar valores
$nombre = $conn->real_escape_string($data["Nombre_Comida"]);
$calorias = (int) $data["Calorias"];
$proteinas = (float) $data["Proteinas"];
$carbohidratos = (float) $data["Carbohidratos"];
$grasas = (float) $data["Grasas"];

// Insertar en la base de datos
$sql = "INSERT INTO comidas (Nombre, Calorias, Proteinas, Carbohidratos, Grasas) 
        VALUES ('$nombre', $calorias, $proteinas, $carbohidratos, $grasas)";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["success" => true, "message" => "Comida insertada correctamente"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error al insertar: " . $conn->error]);
}

$conn->close();
