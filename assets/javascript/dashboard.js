document.addEventListener("DOMContentLoaded", () => {
  const nombre = localStorage.getItem("nombre");
  const apellido = localStorage.getItem("apellido");
  const idUsuario = localStorage.getItem("id_usuario");
  const nombreUsuarioSpan = document.getElementById("nombre-usuario");

  if (nombre && apellido && nombreUsuarioSpan) {
    nombreUsuarioSpan.textContent = `${nombre} ${apellido}`;
    nombreUsuarioSpan.style.marginLeft = "10px";
    nombreUsuarioSpan.style.fontWeight = "bold";
  }

  fetch("/assets/php/logged-resources/obtenerDatos.php")
    .then((res) => res.json())
    .then((sessionData) => {
      console.log("🧠 SESSION desde PHP:", sessionData);
      console.log("💾 ID desde localStorage:", idUsuario);
    })
    .catch((err) => {
      console.error("❌ No se pudo obtener la sesión desde PHP:", err);
    });

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
  }

  const objKcal = localStorage.getItem("obj_kcal");
  if (objKcal) {
    document.getElementById("objetivo-kcal").textContent = objKcal;
  }

  document.getElementById("objetivo-proteinas").textContent = "100";
  document.getElementById("objetivo-carbs").textContent = "150";
  document.getElementById("objetivo-grasas").textContent = "40";

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

  const btnVerComidas = document.getElementById("btn-ver-comidas");
  const listaComidas = document.getElementById("lista-comidas");
  const contenedorComidas = document.getElementById("contenedor-comidas");
  let comidasYaCargadas = false;

  function cargarComidasUsuario() {
    if (!idUsuario) {
      alert("⚠️ ID de usuario no encontrado en localStorage.");
      return;
    }

    contenedorComidas.innerHTML = '<div class="spinner">⏳ Cargando comidas...</div>';
    listaComidas.style.display = "block";

    fetch(`/assets/php/logged-resources/obtenercomidausuario.php?id_usuario=${idUsuario}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        return res.text(); // 👈 leemos como texto para debug
      })
      .then((text) => {
        console.log("📦 Respuesta cruda del servidor:", text);

        let comidas;
        try {
          comidas = JSON.parse(text);
        } catch (err) {
          throw new Error("La respuesta no es un JSON válido.");
        }

        if (!Array.isArray(comidas) || comidas.length === 0) {
          contenedorComidas.innerHTML = `<p style="color:gray;">No se encontraron comidas registradas.</p>`;
          return;
        }

        contenedorComidas.innerHTML = comidas
          .map((c) => {
            const platosHTML = c.Platos && c.Platos.length > 0
              ? `<ul>${c.Platos.map(p => `<li>${p.Nombre_Plato} (x${p.Cantidad_Plato})</li>`).join("")}</ul>`
              : `<p style="color:gray;">Sin platos registrados</p>`;

            return `
              <div class="comida-item">
                <strong>${c.Nombre_Comida}</strong><br />
                Fecha: ${c.Fecha_Consumo}<br />
                Cantidad: ${c.Cantidad}<br />
                Calorías: ${c.Calorias} kcal<br />
                Proteínas: ${c.Proteinas}g<br />
                Carbs: ${c.Carbohidratos}g<br />
                Grasas: ${c.Grasas}g
                <div style="margin-top:5px;"><u>Platos:</u>${platosHTML}</div>
              </div>
            `;
          })
          .join("");

        comidasYaCargadas = true;
      })
      .catch((err) => {
        console.error("❌ Error al obtener las comidas:", err);
        contenedorComidas.innerHTML = `<p style="color:red;">Ocurrió un error al cargar tus comidas.</p>`;
      });
  }

  btnVerComidas.addEventListener("click", () => {
    if (!comidasYaCargadas) {
      cargarComidasUsuario();
    } else {
      listaComidas.style.display = listaComidas.style.display === "block" ? "none" : "block";
    }
  });

  // Cargar automáticamente al entrar
  cargarComidasUsuario();
});
