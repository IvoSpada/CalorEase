<?php
header('Content-Type: application/json');

$host = "localhost";
$db = "calorease";
$user = "root";
$pass = "";
$charset = "utf8mb4";

$id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : 0;

if ($id_usuario <= 0) {
    echo json_encode(["error" => "ID de usuario inválido"]);
    exit;
}

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Obtener comidas del usuario
    $sql = "
        SELECT 
            cu.ID_Registro,
            cu.Fecha_Consumo,
            cu.Cantidad,
            c.ID_Comida,
            c.Nombre AS Nombre_Comida,
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
    $comidas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Obtener platos de cada comida
    foreach ($comidas as &$comida) {
        $sqlPlatos = "
            SELECT p.Nombre 
            FROM platos_comida pc
            INNER JOIN platos p ON pc.ID_Plato = p.ID_Plato
            WHERE pc.ID_Comida = :id_comida
        ";
        $stmtPlatos = $pdo->prepare($sqlPlatos);
        $stmtPlatos->execute(['id_comida' => $comida['ID_Comida']]);
        $platos = $stmtPlatos->fetchAll(PDO::FETCH_COLUMN);

        $comida['Platos'] = $platos;
    }

    echo json_encode($comidas);

} catch (PDOException $e) {
    echo json_encode(["error" => "Error en la base de datos: " . $e->getMessage()]);
}
