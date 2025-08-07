<?php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "calorease";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("error en conexion: " . $conn->connect_error);
}
//cargar 
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'] ?? '';
    $usuario = $_POST['usuario'] ?? '';
    $contrasena = $_POST['contrasena'] ?? '';
    $contrasena2 = $_POST['contrasena2'] ?? '';

    if ($contrasena === $contrasena2) {
        $sql = "INSERT INTO usuario (email, contraseña) VALUES ('$email', '$contrasena')";

        if ($conn->query($sql) === TRUE) {
            $id = $conn->insert_id; // OBTENÉS el ID recién insertado

            session_start();
            $_SESSION['id_usuario'] = $id;

            echo '
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Registro Exitoso</title>
                    <style>
                        :root {
                            --color-secundario: #0e1621;
                            --color-texto: #ffffff;
                            --color-primario: #007bff;
                            --color-primario-hover: #0056b3;
                            --color-fondo: #1c2b3a;
                            --color-boton: #007bff;
                            --color-boton-hover: #0056b3;
                            --fuente-primaria: "Arial", sans-serif;
                        }
                        
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                        }
                        
                        body {
                            background-color: var(--color-fondo);
                            color: var(--color-texto);
                            font-family: var(--fuente-primaria);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            padding: 20px;
                        }
                        
                        .registro-exitoso__container {
                            background-color: var(--color-secundario);
                            padding: 40px;
                            border-radius: 12px;
                            text-align: center;
                            box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
                            max-width: 400px;
                            width: 100%;
                        }
                        
                        .registro-exitoso__titulo {
                            font-size: 28px;
                            margin-bottom: 20px;
                        }
                        
                        .registro-exitoso__texto {
                            font-size: 18px;
                            margin-bottom: 10px;
                        }
                        
                        .registro-exitoso__dato {
                            font-weight: bold;
                            color: var(--color-primario);
                        }
                        
                        .registro-exitoso__botones {
                            margin-top: 25px;
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                        }
                        
                        .registro-exitoso__btn {
                            text-decoration: none;
                            background-color: var(--color-boton);
                            color: var(--color-texto);
                            padding: 12px;
                            border-radius: 6px;
                            transition: background-color 0.3s ease;
                        }
                        
                        .registro-exitoso__btn:hover {
                            background-color: var(--color-boton-hover);
                        }
                    </style>
                </head>
                <body>
                    <div class="registro-exitoso__container">
                        <h1 class="registro-exitoso__titulo">¡Registro exitoso!</h1>
                        <p class="registro-exitoso__texto">Bienvenido! Tu correo es: <span class="registro-exitoso__dato">' . htmlspecialchars($email) . '</span></p>
                        <p class="registro-exitoso__texto">Necesitamos unos ultimos datos para terminar de registrarte!</p>
                        <div class="registro-exitoso__botones">
                            <a href="../../views/user/data-register.html" class="registro-exitoso__btn">Completar Datos Necesarios</a>
                        </div>
                    </div>
                </body>
                </html>
                ';
        } else {
            echo "Error al registrar: " . $conn->error;
        }

    } else {
        echo "Error: " . $sql . "<br>" . $conn->error;
    }
} else {
    echo "contraseñas distintas";
}
?>