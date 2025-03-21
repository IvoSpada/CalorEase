<?php
class Dieta {
    private $conexion;

    public function __construct() {
        $this->conexion = new mysqli("localhost", "root", "", "nutricionista");
    }

    public function obtenerDietaPorId($id) {
        $stmt = $this->conexion->prepare("SELECT * FROM dietas WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $resultado = $stmt->get_result();
        return $resultado->fetch_assoc();
    }
}
?>
