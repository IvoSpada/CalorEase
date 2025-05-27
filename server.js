// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env') });

// Instanciar express
const app = express();
// Habilitar CORS
app.use(cors());

// Middleware para JSON
app.use(express.json());
require("dotenv").config();

app.use(express.static(__dirname));

console.log("🔑 GEMINI_API_KEY loaded?", !!process.env.GEMINI_API_KEY);

const MODEL = "gemini-2.0-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/gemini", async (req, res) => {
  console.log("▶️  /api/gemini llamado");
  console.log("   Payload recibido:", req.body);

  const textoUsuario = req.body.prompt || "<sin prompt>";
  const instruccion =
    `Devuelve exclusivamente un objeto JSON con las claves "calorías", ` +
    `"carbohidratos", "grasas" y "proteínas" (valores numéricos en gramos o kcal) ` +
    `de la siguiente comida y su porción: ${textoUsuario}`;

  const bodyToSend = {
    contents: [{ parts: [{ text: instruccion }] }],
  };
  console.log("   Body para Gemini:", JSON.stringify(bodyToSend));

  try {
    // import dinámico de node-fetch (v3+)
    const fetch = (await import("node-fetch")).default;
    const apiRes = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyToSend),
    });

    const rawText = await apiRes.text();
    console.log(`   Gemini respondió status=${apiRes.status}`);
    console.log("   Cuerpo crudo:", rawText.slice(0, 200) + "…");

    if (!apiRes.ok) {
      return res
        .status(apiRes.status)
        .json({ error: `Gemini API error ${apiRes.status}`, details: rawText });
    }

    // Parsear la respuesta del LLM
    const jsonLLM = JSON.parse(rawText);
    const candidate = jsonLLM.candidates?.[0];
    let respuestaRaw = candidate.content.parts.map((p) => p.text).join("");

    console.log("✅ Raw LLM JSON con backticks:", respuestaRaw);

    // ————— Limpiar triple backticks y etiquetas —————
    // 1. Elimina ```json y ```
    // 2. Elimina cualquier espacio extra al inicio o final
    const cleaned = respuestaRaw
      .replace(/```json/g, "") // quita ```json
      .replace(/```/g, "") // quita ```
      .trim();

    console.log("🔄 JSON limpio a parsear:", cleaned);

    // Ahora parseamos
    let nutricion;
    try {
      nutricion = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("❌ Error parseando JSON limpio:", parseErr);
      return res.status(500).json({
        error: "Respuesta no es JSON válido tras limpieza",
        raw: respuestaRaw,
        cleaned,
      });
    }

    // Devolvemos el objeto final
    res.json(nutricion);
  } catch (err) {
    console.error("🔥 Excepción en /api/gemini:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
