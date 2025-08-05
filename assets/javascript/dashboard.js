document.addEventListener("DOMContentLoaded", () => {
  const nombre = localStorage.getItem("nombre");
  const apellido = localStorage.getItem("apellido");
  const idUsuario = localStorage.getItem("id_usuario");
  const nombreUsuarioSpan = document.getElementById("nombre-usuario");

  if (nombre && apellido && nombreUsuarioSpan) {
    nombreUsuarioSpan.textContent = `${nombre} ${apellido}`;
    nombreUsuarioSpan.style.marginLeft = "10px";
    nombreUsuarioSpan.style.fontWeight = "bold";
  } else {
    console.warn(
      "⚠️ No se encontraron datos de nombre o apellido en localStorage."
    );
  }

  // Mostrar ID de sesión (para comparación con localStorage)
  fetch("/assets/php/logged-resources/obtenerDatos.php")
    .then((res) => res.json())
    .then((sessionData) => {
      console.log("🧠 SESSION desde PHP:", sessionData);
      console.log("💾 ID desde localStorage:", idUsuario);
      if (
        sessionData.id_usuario &&
        idUsuario &&
        sessionData.id_usuario !== idUsuario
      ) {
        console.warn("❗ Diferencia entre sesión PHP y localStorage.");
      }
    })
    .catch((err) => {
      console.error("❌ No se pudo obtener la sesión desde PHP:", err);
    });

  // Mostrar IMC
  const imc = localStorage.getItem("imc");
  if (imc) {
    const valorIMC = document.getElementById("valor-imc");
    const barraIMC = document.getElementById("barra-imc");
    valorIMC.textContent = `${imc} (IMC)`;

    const imcFloat = parseFloat(imc);
    if (imcFloat < 18.5) barraIMC.style.background = "yellow";
    else if (imcFloat < 25) barraIMC.style.background = "green";
    else if (imcFloat < 30) barraIMC.style.background = "orange";
    else barraIMC.style.background = "red";
  } else {
    console.warn("⚠️ IMC no encontrado en localStorage.");
  }

  // Objetivo calórico
  const objKcal = localStorage.getItem("obj_kcal");
  if (objKcal) {
    document.getElementById("objetivo-kcal").textContent = objKcal;
  } else {
    console.warn("⚠️ Objetivo calórico no encontrado.");
  }

  // Objetivo de macros (hardcodeado por ahora)
  document.getElementById("objetivo-proteinas").textContent = "100";
  document.getElementById("objetivo-carbs").textContent = "150";
  document.getElementById("objetivo-grasas").textContent = "40";

  // Modal lógica
  const modal = document.getElementById("modalComida");
  const btnAbrir = document.getElementById("btn-agregar-comida");
  if (btnAbrir && modal) {
    btnAbrir.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  }

  window.cerrarModal = function () {
    modal.style.display = "none";
  };

  window.agregarALista = function () {
    alert("Comida agregada (funcionalidad pendiente)");
  };

  window.verLista = function () {
    alert("Ver lista (funcionalidad pendiente)");
  };

  // Botón "Ver mis comidas"
  const btnVerComidas = document.getElementById("btn-ver-comidas");
  const listaComidas = document.getElementById("lista-comidas");
  const contenedorComidas = document.getElementById("contenedor-comidas");

  btnVerComidas.addEventListener("click", () => {
    if (!idUsuario) {
      alert("⚠️ ID de usuario no encontrado en localStorage.");
      return;
    }

    fetch(
      `/assets/php/logged-resources/obtenercomidausuario.php?id_usuario=${idUsuario}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        return res.json();
      })
      .then((comidas) => {
        console.log("✅ Comidas obtenidas:", comidas);

        if (comidas.error) {
          contenedorComidas.innerHTML = `<p style="color:red;"><strong>Error:</strong> ${comidas.error}</p>`;
        } else if (!Array.isArray(comidas) || comidas.length === 0) {
          contenedorComidas.innerHTML = "<p>No hay comidas registradas.</p>";
        } else {
          contenedorComidas.innerHTML = comidas
            .map((c) => {
              return `
                <div class="comida-item">
                  <strong>${c.Nombre_Comida}</strong><br />
                  Fecha: ${c.Fecha_Consumo}<br />
                  Cantidad: ${c.Cantidad}<br />
                  Calorías: ${c.Calorias}<br />
                  Proteínas: ${c.Proteinas}g<br />
                  Carbs: ${c.Carbohidratos}g<br />
                  Grasas: ${c.Grasas}g
                </div>
              `;
            })
            .join("");
        }

        listaComidas.style.display = "block";
      })
      .catch((err) => {
        console.error("❌ Error al obtener las comidas:", err);
        contenedorComidas.innerHTML = `<p style="color:red;">Ocurrió un error al cargar tus comidas.</p>`;
        listaComidas.style.display = "block";
      });
  });
});
