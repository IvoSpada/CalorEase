document.addEventListener("DOMContentLoaded", () => {
  const slidePage = document.querySelector(".slide-page");
  const nextBtnFirst = document.querySelector(".firstNext");
  const prevBtnSec = document.querySelector(".prev-1");
  const nextBtnSec = document.querySelector(".next-1");
  const prevBtnThird = document.querySelector(".prev-2");
  const nextBtnThird = document.querySelector(".next-2");
  const prevBtnFourth = document.querySelector(".prev-3");
  const submitBtn = document.querySelector(".submit");
  const progressText = document.querySelectorAll(".step p");
  const progressCheck = document.querySelectorAll(".step .check");
  const bullet = document.querySelectorAll(".step .bullet");
  const form = document.getElementById("form-registro");
  let current = 1;

  // Eventos de avance
  nextBtnFirst.addEventListener("click", (e) => {
    e.preventDefault();
    slidePage.style.marginLeft = "-25%";
    marcarPaso();
  });
  nextBtnSec.addEventListener("click", (e) => {
    e.preventDefault();
    slidePage.style.marginLeft = "-50%";
    marcarPaso();
  });
  nextBtnThird.addEventListener("click", (e) => {
    e.preventDefault();
    slidePage.style.marginLeft = "-75%";
    marcarPaso();
  });

  // Eventos de retroceso
  prevBtnSec.addEventListener("click", (e) => retrocederPaso(e, "0%"));
  prevBtnThird.addEventListener("click", (e) => retrocederPaso(e, "-25%"));
  prevBtnFourth.addEventListener("click", (e) => retrocederPaso(e, "-50%"));

  function marcarPaso() {
    bullet[current - 1].classList.add("active");
    progressCheck[current - 1].classList.add("active");
    progressText[current - 1].classList.add("active");
    current += 1;
  }

  function retrocederPaso(event, margen) {
    event.preventDefault();
    slidePage.style.marginLeft = margen;
    bullet[current - 2].classList.remove("active");
    progressCheck[current - 2].classList.remove("active");
    progressText[current - 2].classList.remove("active");
    current -= 1;
  }

  // Evento de "submit"
//   submitBtn.addEventListener("click", (e) => {
//     e.preventDefault(); // <- prevenir envío por defecto

//     marcarPaso();

//     const formData = new FormData(form);
//     fetch("../../assets/php/logged-resources/data-register.php", {
//       method: "POST",
//       body: formData,
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.estado === "ok") {
//           localStorage.setItem("registroExitoso", "true");
//           console.log("el archivo leyo el json, ok");
//           window.location.href = "../../index.html";
//         } else {
//           alert(data.mensaje || "Error al registrar.");
//         }
//       })
//       .catch((error) => {
//         console.error("Error:", error);
//         alert("Hubo un error al enviar el formulario.");
//       });
//   });
});