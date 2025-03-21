<?php
require_once "modelos/Dieta.php";
$dieta_id = $_GET['id'] ?? null;
$dieta = null;

if ($dieta_id) {
    $dietaModel = new Dieta();
    $dieta = $dietaModel->obtenerDietaPorId($dieta_id);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ver Dieta</title>
</head>
<body>
    <h1>Seleccione una dieta:</h1>
    <form action="/dieta/" method="get">
        <select name="id">
            <option value="1">Dieta 1</option>
            <option value="2">Dieta 2</option>
        </select>
        <button type="submit">Ver Dieta</button>
    </form>

    <?php if ($dieta): ?>
        <h2>Dieta Seleccionada</h2>
        <p><strong>Nombre:</strong> <?= $dieta['nombre'] ?></p>
        <p><strong>Descripción:</strong> <?= $dieta['descripcion'] ?></p>
    <?php endif; ?>
</body>
</html>
