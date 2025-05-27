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
  responseDiv.innerHTML = "<em>Cargando...</em>";

  const prompt = prePrompt + userInput;

  try {
    const res = await fetch("http://localhost:3000/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    const data = await res.text();

    const formatted = formatAsHTML(data);
    responseDiv.innerHTML = formatted;
  } catch (err) {
    responseDiv.textContent = `Error: ${err.message}`;
  }
});

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

  // Primero reemplaza **texto** por <strong><em>texto</em></strong>
  escaped = escaped.replace(
    /\*\*(?!\s)(.+?)(?!\s)\*\*/g,
    "<strong><em>$1</em></strong>"
  );

  // Luego *texto* por <em>texto</em> (solo si no está envuelto en ** ya)
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
      const item = line.replace(/^\* /, "");
      html += `<li>${item}</li>`;
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
