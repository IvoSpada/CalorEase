<?php
header('Content-Type: application/json');

// Configuración de conexión (ajustá según tu entorno)
$host = "localhost";
$db = "calorease";
$user = "root";
$pass = ""; // o tu contraseña
$charset = "utf8mb4";

// Obtener ID del usuario (por GET o POST)
$id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : 0;

if ($id_usuario <= 0) {
    echo json_encode(["error" => "ID de usuario inválido"]);
    exit;
}

// Conectar a la base de datos con PDO
try {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Consulta: comidas del usuario con detalles
    $sql = "
        SELECT 
            cu.ID_Registro,
            cu.Fecha_Consumo,
            c.Nombre AS Nombre_Comida,
            cu.Cantidad,
            c.Calorias * cu.Cantidad AS Calorias,
            c.Proteinas * cu.Cantidad AS Proteinas,
            c.Carbohidratos * cu.Cantidad AS Carbohidratos,
            c.Grasas * cu.Cantidad AS Grasas
        FROM comidas_usuario cu
        INNER JOIN comidas c ON cu.ID_Comida = c.ID_Comida
        WHERE cu.ID_Usuario = :id_usuario
        ORDER BY cu.Fecha_Consumo DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id_usuario' => $id_usuario]);
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($resultados);

} catch (PDOException $e) {
    echo json_encode(["error" => "Error en la base de datos: " . $e->getMessage()]);
}
?>