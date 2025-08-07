<?php
if (!isset($_SESSION))
    session_start();

// Verificar que el usuario esté logueado
if (!isset($_SESSION['id_usuario'])) {
    echo "Sesión no iniciada.";
    exit;
}

$id_usuario = $_SESSION['id_usuario'];



$conn = new mysqli(hostname: "localhost", username: "root", password: "", database: "calorease");
if ($conn->connect_error) {
    die("Error en conexión: " . $conn->connect_error);
}

$result = $conn->query(query: "SELECT nombre FROM usuario WHERE id_usuario = $id_usuario");

if ($result->num_rows > 0) {
    $datos = $result->fetch_assoc();
    if (isset($datos['nombre'])) {
        echo json_encode(value: [
            'estado' => 'ok',
            'id' => $id_usuario,
            'sesion' => 'ya-iniciada'
        ]);
    } else {
        //EN TEORIA si no esta seteado el nombre, cosa que solo ocurre al completar el formulario, se accede a este, si esta seteado, este php
        //comunica un json 'ok', que luego lo accede el JS del index con un fetch, para mostrar un pop-up.


        // Verificar conexión
        $conexion = new mysqli("localhost", "root", "", "calorease");
        if ($conexion->connect_error) {
            die("Error de conexión: " . $conexion->connect_error);
        }

        // Función para limpiar datos
        function limpiar($valor)
        {
            return htmlspecialchars(strip_tags(trim($valor)));
        }

        // Verificar que se enviaron los datos requeridos
        if (!isset($_POST['nombre']) || empty(trim($_POST['nombre']))) {
            echo "Error: el campo 'nombre' es obligatorio.";
        } elseif (!isset($_POST['apellido']) || empty(trim($_POST['apellido']))) {
            echo "Error: el campo 'apellido' es obligatorio.";
        } elseif (!isset($_POST['altura']) || !is_numeric($_POST['altura'])) {
            echo "Error: el campo 'altura' es obligatorio y debe ser un número.";
        } elseif (!isset($_POST['peso']) || !is_numeric($_POST['peso'])) {
            echo "Error: el campo 'peso' es obligatorio y debe ser un número.";
        } elseif (!isset($_POST['objKCAL']) || !is_numeric($_POST['objKCAL'])) {
            echo "Error: el campo 'objKCAL' es obligatorio y debe ser un número.";
        } elseif (!isset($_POST['objetivo_fisico']) || empty(trim($_POST['objetivo_fisico']))) {
            echo "Error: debes seleccionar un objetivo físico.";
        } else {
            // Si todos los datos están bien, seguir con la lógica
            $nombre = limpiar($_POST['nombre']);
            $apellido = limpiar($_POST['apellido']);
            $altura = floatval($_POST['altura']);
            $peso = floatval($_POST['peso']);
            $objKCAL = intval($_POST['objKCAL']);
            $objetivo = limpiar($_POST['objetivo_fisico']);

            $imc = $peso / pow(num: $altura, exponent: 2);

            error_log("Datos recibidos: $nombre, $apellido, $altura, $peso, $imc, $objKCAL, $objetivo, ID: $id_usuario");
            $confirmar = 0;
            $stmt = $conexion->prepare(query:
                "UPDATE usuario 
                SET Nombre = ?, Apellido = ?, Altura = ?, Peso = ?, IMC = ?, Obj_KCAL = ?, Obj_Fisico = ?, registro_confirmado = ? 
                WHERE ID_usuario = ?");
                $stmt->bind_param("ssdddssii", $nombre, $apellido, $altura, $peso, $imc, $objKCAL, $objetivo, $confirmar, $id_usuario);

            if ($stmt->execute()) {
                echo json_encode(["estado" => "ok"]);
                header("Location: ../../../index.html");
            } else {
                echo json_encode(["estado" => "error", "mensaje" => "Error al actualizar: " . $stmt->error]);
            }

            $stmt->close();
        }
        $conexion->close();
    }
}
?>