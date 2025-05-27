document.addEventListener("DOMContentLoaded", () => {
  // --- Verificar sesión ---
  fetch("../../assets/php/estado_sesion.php")
    .then((response) => response.json())
    .then((data) => {
      const navbar = document.querySelector(".navbar__links");
      if (data.sesion_iniciada) {
        const cerrarSesion = document.createElement("a");
        cerrarSesion.href = "/assets/php/logged-resources/cerrarsesion.php";
        cerrarSesion.id = "close-session";
        cerrarSesion.textContent = "Cerrar Sesión";
        navbar.appendChild(cerrarSesion);
        const loginLink = document.getElementById("login-link");
        if (loginLink) loginLink.style.display = "none";
      }
    })
    .catch((err) => console.error("Error al verificar sesión:", err));

  // --- Obtener datos del usuario logueado ---
  fetch("assets/php/logged-resources/obtenerDatos.php")
    .then((response) => response.json())
    .then((data) => {
      const h1 = document.querySelector("h1");
      const btn1 = document.getElementById("btn--primary");
      const btn2 = document.getElementById("btn--secondary");
      if (h1 && data.estado === "ok") {
        h1.textContent = `¡Hola, ${data.nombre} ${data.apellido}!`;
        btn1.textContent = "Ir al Panel";
        btn1.href = "../../assets/php/logged-resources/Dashboard.php";
        btn2.textContent = "Configuración";
        btn2.href = "/views/user/micuenta.html";
      }
    })
    .catch((error) =>
      console.error("Error al obtener datos de sesión:", error)
    );

  // --- Mostrar alerta por registro exitoso ---
  if (localStorage.getItem("registroExitoso") === "true") {
    alert("¡Registro exitoso! Bienvenido a CalorEase.");
    localStorage.removeItem("registroExitoso");
  }

  // --- Mostrar popup por registro (una sola vez) ---
  fetch("/assets/php/logged-resources/actualizarPopupMostrado.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.estado === "ok") {
        document.getElementById("registroExitosoPopup").style.display = "flex";
      } else if (data.estado !== "ya_registrado") {
        console.warn("Respuesta desconocida:", data);
      }
    })
    .catch((error) =>
      console.error("Error al verificar si mostrar el popup:", error)
    );

  // --- Popup búsqueda (formulario) ---
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  const popup = document.getElementById("searchPopup");
  const popupText = document.getElementById("popup-text");
  const popupClose = document.getElementById("popup-close");
  if (!form || !input || !popup || !popupText || !popupClose) {
    console.error("Uno o más elementos no fueron encontrados en el DOM");
    if (!form) console.error("Falta el elemento #searchForm");
    if (!input) console.error("Falta el elemento #searchInput");
    if (!popup) console.error("Falta el elemento #searchPopup");
    if (!popupText) console.error("Falta el elemento #popup-text");
    if (!popupClose) console.error("Falta el elemento #popup-close");

    // No seguir si hay elementos faltantes
    if (!form || !input || !popup || !popupText || !popupClose) return;
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const value = input.value.trim();
    console.log("Form enviado, valor:", value);
    if (value !== "") {
      popupText.textContent = `Buscaste: "${value}"`;
      popup.classList.remove("hidden");
      popup.classList.add("show");
      console.log("Popup mostrado");
    }
  });

  if (form && input && popup && popupText && popupClose) {
    form.addEventListener("submit", function (e) {
      e.preventDefault(); // Evita recargar
      const value = input.value.trim();
      if (value !== "") {
        popupText.textContent = `Buscaste: "${value}"`;
        popup.classList.remove("hidden");
        popup.classList.add("show");
      }
    });

    popupClose.addEventListener("click", function () {
      popup.classList.remove("show");
      popup.classList.add("hidden");
    });

    window.addEventListener("click", function (e) {
      if (e.target === popup) {
        popup.classList.remove("show");
        popup.classList.add("hidden");
      }
    });
  }
});

// Función para cerrar popup del registro (si se llama desde el botón)
function cerrarPopupRegistro() {
  const popup = document.getElementById("registroExitosoPopup");
  if (popup) popup.style.display = "none";
}
