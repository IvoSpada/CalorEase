<?php
require_once "controladores/DietaController.php";

$ruta = $_GET['ruta'] ?? 'home';
$id = $_GET['id'] ?? null;

if ($ruta === 'dieta' && $id) {
    require "vistas/dieta.php";
} else {
    echo "Página no encontrada";
}
