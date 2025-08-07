<?php


//conexion
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "calorease";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
  die("error en conexion: " . $conn->connect_error);
}
//cargar macros y nombree
$macrosextract = $_POST["response"];

$macros = explode("|", $macrosextract);

echo $macros[0];
echo " ";
echo $macros[1];
echo " ";
echo $macros[2];
echo " ";
echo $macros[3];
echo " ";
echo $macros[4];
echo " ";
echo $macros[5];

$sql = "INSERT INTO comidas (id_comida, nombre, calorias, proteinas, carbohidratos, grasas)
VALUES ('', '$macros[0]', '$macros[1]', '$macros[2]', '$macros[3]', '$macros[4]');";

//cargar cantidad
$sql2 = "INSERT INTO comidas_dieta (platos)
VALUES ('$macros[5]')";
//querry msj

if ($conn->query($sql) === TRUE) {
  echo "cargado";
} else {
  echo "Error: " . $sql . "<br>" . $conn->error;
}
if ($conn->query($sql2) === TRUE) {
  echo "cargado";
} else {
  echo "Error: " . $sql2 . "<br>" . $conn->error;
}
$conn->close();


?>

