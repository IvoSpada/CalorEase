document.addEventListener("DOMContentLoaded", () => {
  const nombre = localStorage.getItem("nombre");
  const apellido = localStorage.getItem("apellido");
  const nombreUsuarioSpan = document.getElementById("nombre-usuario");

  if (nombre && apellido && nombreUsuarioSpan) {
    nombreUsuarioSpan.textContent = `${nombre} ${apellido}`;
    nombreUsuarioSpan.style.marginLeft = "10px";
    nombreUsuarioSpan.style.fontWeight = "bold";
  }

  // Insertar IMC
  const imc = localStorage.getItem("imc");
  if (imc) {
    const valorIMC = document.getElementById("valor-imc");
    const barraIMC = document.getElementById("barra-imc");

    valorIMC.textContent = `${imc} (IMC)`;

    // Color de la barra según valor (simplificado)
    const imcFloat = parseFloat(imc);
    if (imcFloat < 18.5) {
      barraIMC.style.background = "yellow";
    } else if (imcFloat < 25) {
      barraIMC.style.background = "green";
    } else if (imcFloat < 30) {
      barraIMC.style.background = "orange";
    } else {
      barraIMC.style.background = "red";
    }
  }

  // Objetivo calórico
  const objKcal = localStorage.getItem("obj_kcal");
  if (objKcal) {
    document.getElementById("objetivo-kcal").textContent = objKcal;
  }

  // Macros (simulados por ahora, puedes extender)
  document.getElementById("objetivo-proteinas").textContent = "100";
  document.getElementById("objetivo-carbs").textContent = "150";
  document.getElementById("objetivo-grasas").textContent = "40";

  // Debug info
  console.log("ID Usuario:", localStorage.getItem("id_usuario"));
  console.log("Nombre:", nombre);
  console.log("Apellido:", apellido);
  console.log("Peso:", localStorage.getItem("peso"));
  console.log("Altura:", localStorage.getItem("altura"));
  console.log("IMC:", imc);
  console.log("Objetivo Calórico:", objKcal);
  console.log("Objetivo Físico:", localStorage.getItem("obj_fisico"));
  console.log(
    "Registro Confirmado:",
    localStorage.getItem("registro_confirmado")
  );

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
});
