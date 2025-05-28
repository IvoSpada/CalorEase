function scrollToBottom() {
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

let nombreUsuario = "anon"; // fallback

// Obtener nombre del usuario al cargar
fetch("http://calorease.com/assets/php/logged-resources/obtenerUsuario.php")
  .then((res) => {
    if (!res.ok) throw new Error("No se pudo obtener el usuario");
    return res.json();
  })
  .then((data) => {
    if (
      data.error &&
      data.detalle === "ID de usuario no disponible en la sesion."
    ) {
      console.log("ℹ️ Sesión no iniciada. Usuario no disponible.");
      return;
    }

    if (data.nombre) {
      nombreUsuario = data.nombre;
      console.log("👤 Nombre del usuario:", nombreUsuario);
    }
  })
  .catch((err) => {
    // No mostrar detalles técnicos si ya manejamos el error arriba
    console.log(
      "⚠️ No se pudo obtener el nombre del usuario (posiblemente sin sesión)."
    );
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
  scrollToBottom(); // 👈 SOLO AQUÍ

  addMessage(
    `<span id="loadingDots">Cargando<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>`,
    "bot"
  );

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

    await updateLastBotMessageAnimated(formatted);
  } catch (err) {
    updateLastBotMessage(`Error: ${err.message}`);
  }

  // responseDiv.scrollTop = responseDiv.scrollHeight;
});

function addMessage(message, sender) {
  const responseDiv = document.getElementById("response");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  // Permitir HTML solo si es del bot
  if (sender === "bot") {
    messageDiv.innerHTML = message;
  } else {
    messageDiv.textContent = message;
  }

  responseDiv.appendChild(messageDiv);
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

async function updateLastBotMessageAnimated(html) {
  const last = responseDiv.querySelector(".bot:last-child");
  if (!last) return;

  last.innerHTML = ""; // Vaciar el contenido anterior

  // Cursor parpadeante
  const cursor = document.createElement("span");
  cursor.className = "typing-cursor";
  cursor.textContent = "▋";
  last.appendChild(cursor);

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const nodes = Array.from(tempDiv.childNodes);

  for (let node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      await typeWords(last, node.textContent, cursor);
    } else {
      const clone = node.cloneNode(false);
      last.insertBefore(clone, cursor);
      await typeWords(clone, node.textContent || "", cursor);
    }
  }

  cursor.remove(); // Eliminar cursor al terminar
//   scrollToBottom(); esto hace que cuando escriba vaya siempre abajo, depende de los gustos
}

function typeWords(element, text, cursor) {
  return new Promise((resolve) => {
    const words = text.split(/(\s+)/); // Conserva los espacios
    let i = 0;

    const interval = setInterval(() => {
      if (i < words.length) {
        element.textContent += words[i++];
        // scrollToBottom();
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 10); // Velocidad por palabra
  });
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
