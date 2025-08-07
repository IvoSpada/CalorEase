<?php
session_start();
echo json_encode([
    "sesion_iniciada" => isset($_SESSION['id_usuario']),
    "usuario" => $_SESSION['nombre'] ?? null,
    "id" => $_SESSION['id_usuario'] ?? null
]);
