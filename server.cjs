const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, ".env") });

// Instanciar express
const app = express();
app.use(cors());
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

  const instruccion = req.body.prompt || "<sin prompt>";

  const bodyToSend = {
    contents: [{ parts: [{ text: instruccion }] }],
  };

  try {
    const fetch = (await import("node-fetch")).default;
    const apiRes = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyToSend),
    });

    const rawText = await apiRes.text();
    console.log(`   Gemini respondió status=${apiRes.status}`);

    if (!apiRes.ok) {
      return res
        .status(apiRes.status)
        .json({ error: `Gemini API error ${apiRes.status}`, details: rawText });
    }

    const jsonLLM = JSON.parse(rawText);
    const candidate = jsonLLM.candidates?.[0];
    let respuestaRaw = candidate.content.parts.map((p) => p.text).join("");

    console.log("✅ Respuesta cruda:", respuestaRaw);

    const cleaned = respuestaRaw.replace(/```(?:json)?/g, "").trim();

    res.send(cleaned);
  } catch (err) {
    console.error("🔥 Excepción en /api/gemini:", err);
    res.status(500).json({ error: err.message });
  }
});

// ⚡ Escuchar en LAN (0.0.0.0) y en el puerto 5000
const LAN_IP = process.env.VITE_LAN_IP || "localhost"; // fallback
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
  console.log(`🌐 LAN disponible en http://${LAN_IP}:${PORT}`);
});