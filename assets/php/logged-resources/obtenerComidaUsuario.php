<?php
if (!isset($_SESSION)) session_start();
header('Content-Type: application/json');

$host = "localhost";
$db = "calorease";
$user = "root";
$pass = "";
$charset = "utf8mb4";

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["error" => "Usuario no autenticado"]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Consulta principal
    $sql = "
        SELECT 
            cu.Fecha_Consumo,
            cu.Platos,
            c.ID_Comida,
            c.Nombre AS Nombre_Comida,
            (c.Calorias * cu.Platos) AS Calorias,
            (c.Proteinas * cu.Platos) AS Proteinas,
            (c.Carbohidratos * cu.Platos) AS Carbohidratos,
            (c.Grasas * cu.Platos) AS Grasas
        FROM comidas_usuario cu
        INNER JOIN comidas c ON cu.ID_Comida = c.ID_Comida
        WHERE cu.ID_Usuario = :id_usuario
        ORDER BY cu.Fecha_Consumo DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id_usuario' => $id_usuario]);
    $comidas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($comidas);

} catch (PDOException $e) {
    echo json_encode(["error" => "Error en la base de datos: " . $e->getMessage()]);
}