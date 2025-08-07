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
          <td>${comida.Fecha_Consumo}</td>
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
