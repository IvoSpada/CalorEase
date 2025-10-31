const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());
require("dotenv").config();

app.use(express.static(__dirname));

console.log("🔑 GEMINI_API_KEY loaded?", !!process.env.GEMINI_API_KEY);

const MODEL = "gemini-2.0-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const API_KEY = process.env.GEMINI_API_KEY;

// Helper para llamar a Gemini
async function callGemini(prompt) {
  const fetch = (await import("node-fetch")).default;
  const bodyToSend = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  console.log("▶️ Payload a Gemini:", bodyToSend);

  const apiRes = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyToSend),
  });

  const rawText = await apiRes.text();

  console.log(`⬅️ Respuesta cruda Gemini (status ${apiRes.status}):`, rawText);

  if (!apiRes.ok) {
    throw new Error(`Gemini API error ${apiRes.status}: ${rawText}`);
  }

  const jsonLLM = JSON.parse(rawText);
  const candidate = jsonLLM.candidates?.[0];
  let respuestaRaw = candidate.content.parts.map((p) => p.text).join("");

  // limpiar ```json
  const cleaned = respuestaRaw.replace(/```(?:json)?/g, "").trim();
  console.log("✅ Respuesta limpia:", cleaned);

    console.log("✅ Respuesta limpia:", cleaned);

  return cleaned;
}

// Ruta genérica
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("▶️ /api/gemini llamado con prompt:", prompt);
    const cleaned = await callGemini(prompt || "<sin prompt>");
    res.send(cleaned);
  } catch (err) {
    console.error("🔥 Error en /api/gemini:", err);
    res.status(500).json({ error: err.message });
  }
});

// Nueva ruta: analizar comida
app.post("/analyze-food", async (req, res) => {
  const { food } = req.body;
  console.log("▶️ /analyze-food llamado con food:", food);

  if (!food || typeof food !== "string") {
    return res.status(400).json({ error: "Falta el campo 'food'" });
  }

  // Aquí iría tu lógica de análisis, por ejemplo llamando a Gemini
  try {
    // NOTA: Tu endpoint /analyze-food estaba volviendo a implementar
    // la lógica de fetch. Es mejor reutilizar tu helper 'callGemini'
    // para mantener el código DRY (Don't Repeat Yourself).
    // Lo he modificado para usar 'callGemini'.

    const prompt = `Analiza esta comida y devuelve sus macros (calorías, proteínas, grasas, carbohidratos) en formato JSON: "${food}"`;
    
    // Usamos el helper que ya tienes
    const cleanedJsonString = await callGemini(prompt);

    try {
      // Intentamos parsear la respuesta
      const jsonRespuesta = JSON.parse(cleanedJsonString);
      console.log("✅ /analyze-food respuesta JSON:", jsonRespuesta);
      // Devolvemos 'ok: true' y 'data' como objeto
      res.json({ ok: true, data: jsonRespuesta });

    } catch (parseError) {
      console.error("🔥 Error al parsear JSON de /analyze-food:", parseError, "Respuesta cruda:", cleanedJsonString);
      // Si falla el parseo, devolvemos la respuesta cruda (limpia)
      res.json({ ok: false, data: cleanedJsonString, error: "La IA no devolvió un JSON válido" });
    }

  } catch (err) {
    console.error("🔥 Error en /analyze-food:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ... (justo después del app.post("/analyze-food", ...))

// Nueva ruta: generar dieta
app.post("/generate-diet", async (req, res) => {
  try {
    const { profile, options } = req.body;
    
    // El prompt viene dentro del objeto 'options'
    const prompt = options?.prompt; 
    console.log("▶️ /generate-diet llamado con prompt:", prompt);

    if (!prompt) {
      return res.status(400).json({ error: "Falta el 'prompt' en el objeto 'options'" });
    }

    // Reutilizamos tu helper de Gemini
    const cleanedJsonString = await callGemini(prompt);

    // La respuesta 'cleaned' de callGemini es un string JSON
    // Lo parseamos antes de enviarlo, para que el front reciba un objeto
    try {
      const jsonRespuesta = JSON.parse(cleanedJsonString);
      console.log("✅ /generate-diet respuesta JSON:", jsonRespuesta);
      res.json(jsonRespuesta); // Enviar el objeto JSON
    } catch (parseError) {
       console.error("🔥 Error al parsear JSON de Gemini:", parseError, "Respuesta cruda:", cleanedJsonString);
       // Si falla el parseo, enviamos el texto limpio para debug
       // El frontend (GenerateDietModal) ya sabe cómo limpiar esto
       res.json({ ok: false, data: cleanedJsonString, error: "La IA no devolvió un JSON válido" });
    }

  } catch (err) {
    console.error("🔥 Error en /generate-diet:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// --- ¡NUEVO ENDPOINT AÑADIDO AQUÍ! ---
/**
 * Endpoint para re-ajustar el plan de dieta completo basado en una desviación.
 */
app.post("/adjust-diet", async (req, res) => {
  const { comidaReal, comidasRestantes, profile } = req.body;
  console.log("▶️ /adjust-diet llamado");

  // Validación de entrada
  if (!comidaReal || !comidasRestantes || !profile) {
    return res.status(400).json({ error: 'Faltan datos: se requiere comidaReal, comidasRestantes y profile' });
  }

  if (!Array.isArray(comidasRestantes) || comidasRestantes.length === 0) {
    return res.status(400).json({ error: 'comidasRestantes debe ser un array no vacío.' });
  }

  // --- Construcción del Prompt Complejo para Gemini ---
  const prompt = `
Actúa como un nutricionista experto de clase mundial.
Un usuario con el siguiente perfil:
{
  "objetivo": "${profile.objetivo || 'no especificado'}",
  "peso_kg": ${profile.peso || 'no especificado'},
  "altura_cm": ${profile.altura || 'no especificado'},
  "edad": ${profile.edad || 'no especificado'}
}

Se ha desviado significativamente de su plan al comer:
{
  "descripcion": "${comidaReal.descripcion}",
  "calorias": ${comidaReal.calorias},
  "proteinas": ${comidaReal.proteinas},
  "grasas": ${comidaReal.grasas},
  "carbohidratos": ${comidaReal.carbohidratos}
}

Su plan de comidas original restante (para los próximos días) es el siguiente array JSON:
${JSON.stringify(comidasRestantes, null, 2)}

TAREA:
Ajusta la lista de 'comidasRestantes' para compensar el desvío (especialmente el exceso de calorías y grasas) y ayudar al usuario a volver a su objetivo de "${profile.objetivo}".

REGLAS ESTRICTAS DE RESPUESTA:
1.  Devuelve ÚNICAMENTE un array JSON válido.
2.  El array debe contener la lista COMPLETA de comidas ajustadas.
3.  Debe tener EXACTAMENTE el mismo número de elementos (${comidasRestantes.length}) que el array 'comidasRestantes' original.
4.  Cada objeto de comida en el array debe mantener la misma estructura que el original (incluyendo 'id', 'dia', 'tipo', etc.), pero con la 'descripcion' y los campos de macros ('calorias', 'proteinas', 'grasas', 'carbohidratos') modificados para el re-balanceo.
5.  No incluyas ninguna explicación, prefacio, o texto adicional. Solo el array JSON.
`;

  console.log('Enviando prompt a Gemini para ajuste de dieta...');

  try {
    // 1. Llamar a Gemini (usando TU helper)
    // 'cleanedJsonString' ya es el string de JSON limpio
    const cleanedJsonString = await callGemini(prompt);

    try {
      // 2. Parsear el JSON
      const adjustedMeals = JSON.parse(cleanedJsonString);

      // 3. Verificación final
      if (!Array.isArray(adjustedMeals) || adjustedMeals.length !== comidasRestantes.length) {
        console.error('La IA devolvió un formato inesperado:', adjustedMeals);
        throw new Error('La IA devolvió un formato de datos incorrecto.');
      }

      // 4. Enviar la respuesta al frontend
      console.log('✅ /adjust-diet: Ajuste completado. Enviando plan al frontend.');
      res.json(adjustedMeals); // Enviamos el array parseado

    } catch (parseError) {
      // Este catch es para errores de JSON.parse
      console.error("🔥 Error al parsear JSON de Gemini en /adjust-diet:", parseError, "Respuesta cruda:", cleanedJsonString);
      res.status(500).json({ ok: false, error: "La IA no devolvió un JSON válido", data: cleanedJsonString });
    }

  } catch (geminiError) {
    // Este catch es para errores de la función callGemini (ej. error de API)
    console.error("🔥 Error en callGemini para /adjust-diet:", geminiError);
    res.status(500).json({ ok: false, error: geminiError.message });
  }
});


// Escuchar
const LAN_IP = process.env.VITE_LAN_IP || "localhost"; 
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
  console.log(`🌐 LAN disponible en http://${LAN_IP}:${PORT}`);
});