<?php
if (!isset($_SESSION)) session_start();

// Opcional: establecer un nombre de usuario simulado si no está
if (!isset($_SESSION['nombre'])) {
    $_SESSION['nombre'] = "Invitado";
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Consulta de Macronutrientes</title>
    <style>
        body {
            background-color: #1c2b3a;
            color: white;
            font-family: Arial, sans-serif;
            padding: 20px;
        }

        h1, h2 {
            color: #00bfff;
        }

        input, button {
            padding: 10px;
            font-size: 16px;
            border-radius: 6px;
            border: none;
        }

        input {
            width: 300px;
        }

        button {
            background-color: #007bff;
            color: white;
            cursor: pointer;
            margin-left: 10px;
        }

        button:hover {
            background-color: #0056b3;
        }

        #resultado {
            background-color: #0e1621;
            padding: 20px;
            margin-top: 20px;
            border-radius: 10px;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>

    <h1>Hola, <?php echo htmlspecialchars($_SESSION['nombre']); ?> 👋</h1>
    <h2>Calculadora de Macronutrientes (con Gemini)</h2>

    <form id="macroForm">
        <label for="alimento">Nombre del alimento:</label><br><br>
        <input type="text" id="alimento" name="alimento" placeholder="Ej: arroz, 150g" required>
        <button type="submit">Calcular</button>
    </form>

    <div id="resultado"></div>

    <script>
        document.getElementById("macroForm").addEventListener("submit", function (e) {
            e.preventDefault();

            const alimento = document.getElementById("alimento").value.trim();
            if (!alimento) return;

            fetch("http://localhost:3001/api/macros", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ alimento })
            })
            .then(response => response.json())
            .then(data => {
                const resultado = document.getElementById("resultado");
                resultado.innerHTML = "<h3>Resultado:</h3><pre>" + JSON.stringify(data, null, 2) + "</pre>";
            })
            .catch(error => {
                console.error("Error:", error);
                document.getElementById("resultado").innerHTML = "Ocurrió un error al consultar la API.";
            });
        });
    </script>
</body>
</html>
