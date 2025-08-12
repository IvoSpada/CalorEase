document.addEventListener("DOMContentLoaded", function () {
  cargarNombreUsuario();
  cargarObjetivos();
  cargarComidasUsuario();

  document
    .getElementById("btn-ver-comidas")
    .addEventListener("click", function () {
      mostrarPopupComidas();
    });
});

// 🧠 Cargar nombre del usuario desde PHP
function cargarNombreUsuario() {
  fetch("../../assets/php/logged-resources/obtenerUsuario.php")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("nombre-usuario").textContent = data.nombre || "";
    })
    .catch((err) => console.error("Error al obtener nombre:", err));
}

// 🎯 Cargar objetivos nutricionales (ejemplo fijo)
function cargarObjetivos() {
  document.getElementById("objetivo-kcal").textContent = "2000";
  document.getElementById("objetivo-proteinas").textContent = "100";
  document.getElementById("objetivo-carbs").textContent = "150";
  document.getElementById("objetivo-grasas").textContent = "40";
}

// 🍽️ Cargar lista de comidas del usuario desde PHP
function cargarComidasUsuario() {
  fetch("../../assets/php/logged-resources/obtenerComidaUsuario.php")
    .then((res) => {
      // Asegura que la respuesta sea JSON válida
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respuesta no es JSON válida");
      }
      return res.json();
    })
    .then((comidas) => {
      const tabla = document.getElementById("tabla-comidas");
      tabla.innerHTML = ""; // Limpiar tabla

      if (comidas.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 7;
        celda.textContent = "No hay comidas registradas.";
        fila.appendChild(celda);
        tabla.appendChild(fila);
        return;
      }

      comidas.forEach((comida) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${comida.Nombre_Comida}</td>
          <td>${comida.Platos}</td>
          <td>${comida.Calorias}</td>
          <td>${comida.Proteinas}</td>
          <td>${comida.Carbohidratos}</td>
          <td>${comida.Grasas}</td>
        `;
        tabla.appendChild(fila);
      });
    })
    .catch((error) => {
      console.error("❌ Error al obtener las comidas:", error.message);
    });
}

// 🔍 Mostrar el popup de comidas
function mostrarPopupComidas() {
  document.getElementById("popup-comidas").style.display = "flex";
  cargarComidasUsuario(); // Refresca la tabla al abrir
}

// ❌ Cerrar el popup
function cerrarPopupComidas() {
  document.getElementById("popup-comidas").style.display = "none";
}

// 🔧 Modal comida (ya existente, si lo usás)
function cerrarModal() {
  document.getElementById("modalComida").style.display = "none";
}

function verLista() {
  mostrarPopupComidas();
}

// Ejemplo si usás esto para pruebas
function agregarALista() {
  alert("Función agregarALista aún no implementada");
}

/*------------------------------------------------
---------FUNCION AGREGAR COMIDAS CON IA-----------
-------------------------------------------------- */
document
  .getElementById("btn-agregar-comida")
  .addEventListener("click", function () {
    document.getElementById("popup-agregar-comida").style.display = "flex";
  });

document
  .getElementById("btn-modo-manual")
  .addEventListener("click", function () {
    const campos = document.getElementById("campos-manuales");
    campos.style.display = campos.style.display === "none" ? "block" : "none";
  });

function cerrarPopupAgregarComida() {
  document.getElementById("popup-agregar-comida").style.display = "none";
  document.getElementById("descripcion-comida").value = "";
  document.getElementById("campos-manuales").style.display = "none";
  document.getElementById("input-calorias").value = "";
  document.getElementById("input-proteinas").value = "";
  document.getElementById("input-carbohidratos").value = "";
  document.getElementById("input-grasas").value = "";
}

document
  .getElementById("btn-enviar-ia")
  .addEventListener("click", async function () {
    console.log("boton cargar apretado");
    const inputTexto = document.getElementById("input-comida").value.trim();

    if (!inputTexto) {
      alert("Por favor, escribe una comida para analizar.");
      return;
    }

    try {
      // Mostrar carga
      document.getElementById("respuesta-ia").innerHTML =
        "⏳ Analizando comida con IA...";

      const response = await fetch("http://localhost:3000/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analiza esta comida y devolveme un EXCUSIVAMENTE UN JSON con los siguientes campos: Platos (sera la cantidad especificada, no los platos que contiene la comida, si no se especifica será 1), Nombre_Comida, Calorias, Proteinas, Carbohidratos y Grasas. Solo devuelve el JSON sin explicaciones, ni textos anteriores, ni contextos. Comida: ${inputTexto}`,
        }),
      });

      const rawText = await response.text();

      // Intentar parsear JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        document.getElementById("respuesta-ia").innerHTML =
          "❌ Error: la IA no devolvió un JSON válido.";
        console.error("Respuesta no JSON:", rawText);
        return;
      }

      // Mostrar el resultado
      document.getElementById("respuesta-ia").innerHTML = `
      <h3>Resultado del análisis</h3>
      <ul>
        <li><strong>Nombre:</strong> ${data.Nombre_Comida}</li>
        
        <li><strong>Platos:</strong> ${data.Platos}</li>
        <li><strong>Calorías:</strong> ${data.Calorias}</li>
        <li><strong>Proteínas:</strong> ${data.Proteinas}</li>
        <li><strong>Carbohidratos:</strong> ${data.Carbohidratos}</li>
        <li><strong>Grasas:</strong> ${data.Grasas}</li>
      </ul>
    `;

      // 🔄 POST a PHP para guardar en la base de datos

      try {
        const phpResponse = await fetch(
          "../../assets/php/AI-resources/insertarComidaAI.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        console.log(
          "📡 Estado respuesta PHP:",
          phpResponse.status,
          phpResponse.statusText
        );

        if (!phpResponse.ok) {
          throw new Error(`Error en el PHP: ${phpResponse.status}`);
        }

        const phpResult = await phpResponse.text();
        console.log("✅ Respuesta de PHP:", phpResult);
      } catch (phpError) {
        console.error("❌ Error al enviar datos a PHP:", phpError);
      }
    } catch (error) {
      console.error("Error al enviar a Gemini:", error);
      document.getElementById("respuesta-ia").innerHTML =
        "❌ Error al conectarse con la IA.";
    }
  });
