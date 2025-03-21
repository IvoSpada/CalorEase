<?php
require_once "./modelos/Dieta.php";

class DietaController {
    private $dietaModel;

    public function __construct($pdo) {
        $this->dietaModel = new Dieta($pdo);
    }

    public function listarDietas() {
        return $this->dietaModel->obtenerDietas();
    }

    public function verDieta($id) {
        return $this->dietaModel->obtenerDietaPorId($id);
    }
}
?>
