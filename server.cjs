const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // <-- Importado aquí
const fs = require("fs");   // <-- Importado aquí
const os = require("os");   // <-- Importado aquí

// --- INICIO: Bloque para auto-actualizar el .env ---

/**
 * Busca la IP de LAN principal (IPv4, no interna).
 */
/**
 * Busca la IP de LAN principal, dando prioridad a los rangos de red privada.
 */
function getLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  // 1. Recopilar todos los candidatos de IPv4
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name] || [];
    for (const iface of ifaceList) {
      // Omitir direcciones internas (como 127.0.0.1) y no-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push(iface.address);
      }
    }
  }

  // 2. Analizar los candidatos y priorizar
  //    Tenemos: ['26.48.114.240', '192.168.0.20'] (en algún orden)

  // Prioridad #1: Buscar IPs de LAN '192.168.x.x' (la más común en hogares)
  const homeLanIp = candidates.find(ip => ip.startsWith('192.168.'));
  if (homeLanIp) {
    console.log(`[Env Auto-Update] IP de LAN (192.168) encontrada: ${homeLanIp}`);
    return homeLanIp;
  }

  // Prioridad #2: Buscar IPs '10.x.x.x' (común en empresas)
  const corporateLanIp = candidates.find(ip => ip.startsWith('10.'));
  if (corporateLanIp) {
    console.log(`[Env Auto-Update] IP de LAN (10.) encontrada: ${corporateLanIp}`);
    return corporateLanIp;
  }

  // Prioridad #3: Buscar IPs '172.16.x.x' a '172.31.x.x' (menos común)
  const otherLanIp = candidates.find(ip => /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip));
  if (otherLanIp) {
    console.log(`[Env Auto-Update] IP de LAN (172.) encontrada: ${otherLanIp}`);
    return otherLanIp;
  }

  // Fallback: Si no se encuentra ninguna IP de LAN, usar el primer candidato
  // (Este sería el caso de tu VPN, '26.48.114.240')
  if (candidates.length > 0) {
    console.warn(`[Env Auto-Update] No se encontró IP de LAN privada. Usando la primera IP disponible: ${candidates[0]}`);
    return candidates[0];
  }
  
  // Fallback final: Si no se encontró nada
  return "127.0.0.1";
}

/**
 * Actualiza o añade una variable en el contenido de un archivo .env.
 * @param {string} content - El contenido actual del archivo .env
 * @param {string} key - La clave a actualizar (ej. "VITE_LAN_IP")
 * @param {string} value - El nuevo valor (ej. "192.168.0.20")
 * @returns {string} - El nuevo contenido del .env
 */
function updateEnvVar(content, key, value) {
  const regex = new RegExp(`^(${key}=)(.*)$`, 'm'); // 'm' para multilínea
  if (regex.test(content)) {
    // La variable existe, la actualizamos
    console.log(`[Env Auto-Update] Actualizando ${key} a ${value}`);
    return content.replace(regex, `$1${value}`);
  } else {
    // La variable no existe, la añadimos al final
    console.log(`[Env Auto-Update] Añadiendo ${key}=${value}`);
    // Asegurarse de que haya un salto de línea si el archivo no termina con uno
    const newContent = content.trimEnd();
    return newContent + `\n${key}=${value}\n`;
  }
}

/**
 * Función principal que se auto-ejecuta para leer y actualizar el .env.
 */
function updateEnvFile() {
  try {
    const newIp = getLanIp();
    if (newIp === '127.0.0.1') {
      console.warn("[Env Auto-Update] No se pudo encontrar IP de LAN. Usando 127.0.0.1 como fallback.");
    }

    const envPath = path.join(__dirname, ".env");

    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else {
      console.warn(`[Env Auto-Update] No se encontró el archivo .env en ${envPath}. Se creará uno.`);
    }

    // Actualizar ambas variables con la misma IP
    envContent = updateEnvVar(envContent, 'VITE_LAN_IP', newIp);
    envContent = updateEnvVar(envContent, 'VITE_IA_HOST', newIp);
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`[Env Auto-Update] Archivo .env actualizado con IP: ${newIp}`);

  } catch (err) {
    console.error("🔥 Error al auto-actualizar el archivo .env:", err.message);
    // Continuamos de todos modos, el servidor intentará arrancar.
  }
}

// ¡Ejecutamos la lógica ANTES de cargar dotenv!
updateEnvFile();

// --- FIN: Bloque para auto-actualizar el .env ---


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