let nombreUsuario = "usuario"; // fallback

// Obtener nombre del usuario al cargar
fetch("http://calorease.com/assets/php/logged-resources/obtenerUsuario.php")
  .then(res => {
    if (!res.ok) throw new Error("No se pudo obtener el usuario");
    return res.json();
  })
  .then(data => {
    if (data.nombre) {
      nombreUsuario = data.nombre;
      console.log("👤 Nombre del usuario:", nombreUsuario);
    }
  })
  .catch(err => {
    console.error("⚠️ Error al obtener el nombre del usuario:", err.message);
  });

const sendButton = document.getElementById("sendButton");
      const inputText = document.getElementById("inputText");
      const responseDiv = document.getElementById("response");

      const prePrompt = `Actúa como un nutricionista profesional. Analiza el siguiente alimento y su porción aproximada. Incluye en tu respuesta:

- Sus valores nutricionales estimados (calorías, carbohidratos, grasas, proteínas).
- Qué tan saludable es y en qué contextos puede ser adecuado o no.
- A qué tipo de dieta puede pertenecer o en cuáles se recomienda (ej. baja en carbohidratos, alta en proteínas, etc.).
- Qué beneficios aporta o qué precauciones deberían tomarse al consumirlo.
- Una conclusión breve con recomendaciones.
- Si es una comida apta o no para celíacos, diabéticos o alguna otra enfermedad.

Utiliza un lenguaje claro, profesional y accesible, como si estuvieras asesorando a un paciente: `;

      sendButton.addEventListener("click", async () => {
        const userInput = inputText.value.trim();
        if (!userInput) return;

        addMessage(userInput, "user");
        inputText.value = "";

        addMessage("Cargando...", "bot");

      const prompt = `Me llamo ${nombreUsuario}, ` + prePrompt + userInput;


        try {
          const res = await fetch("http://localhost:3000/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });

          if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
          const data = await res.text();

          const formatted = formatAsHTML(data);
          updateLastBotMessage(formatted);
        } catch (err) {
          updateLastBotMessage(`Error: ${err.message}`);
        }

        responseDiv.scrollTop = responseDiv.scrollHeight;
      });

      function addMessage(text, sender) {
        const msg = document.createElement("div");
        msg.className = `message ${sender}`;
        msg.innerHTML = text;
        responseDiv.appendChild(msg);
      }

      function updateLastBotMessage(html) {
        const last = responseDiv.querySelector(".bot:last-child");
        if (last) last.innerHTML = html;
      }

      function formatAsHTML(text) {
        const escapeHTML = (str) =>
          str.replace(
            /[&<>]/g,
            (tag) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
              }[tag])
          );

        let escaped = escapeHTML(text);

        escaped = escaped.replace(
          /\*\*(?!\s)(.+?)(?!\s)\*\*/g,
          "<strong><em>$1</em></strong>"
        );
        escaped = escaped.replace(/\*(?!\s)(.+?)(?!\s)\*/g, "<em>$1</em>");

        const lines = escaped.split("\n");
        let html = "";
        let inList = false;

        lines.forEach((line) => {
          if (line.startsWith("* ")) {
            if (!inList) {
              html += "<ul>";
              inList = true;
            }
            html += `<li>${line.replace(/^\* /, "")}</li>`;
          } else {
            if (inList) {
              html += "</ul>";
              inList = false;
            }
            if (line.trim() !== "") {
              html += `<p>${line}</p>`;
            }
          }
        });

        if (inList) html += "</ul>";
        return html;
      }