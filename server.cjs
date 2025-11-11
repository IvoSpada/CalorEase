const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const os = require("os");
const PQueue = require("p-queue").default;

// --- INICIO: Bloque para auto-actualizar el .env ---

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

app.use(express.static(__dirname));

console.log("🔑 GEMINI_API_KEY loaded?", !!process.env.GEMINI_API_KEY);

const MODEL = "gemini-2.0-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const API_KEY = process.env.GEMINI_API_KEY;

// ===== CONFIGURACIÓN DE P-QUEUE =====
/**
 * Cola para controlar las peticiones a Gemini
 * - concurrency: 1 = procesa 1 petición a la vez (más estable)
 * - concurrency: 2-3 = permite algunas peticiones simultáneas (más rápido pero arriesgado)
 * - interval: 1000 = ventana de tiempo de 1 segundo
 * - intervalCap: 1 = máximo 1 petición por segundo
 */
const geminiQueue = new PQueue({
  concurrency: 3,        // Solo 1 petición a la vez (cambia a 2-3 si quieres más velocidad)
  interval: 1000,        // Ventana de 1 segundo
  intervalCap: 1,        // Máximo 1 peticion por segundo
  timeout: 240000,        // Timeout de 60 segundos por petición
  throwOnTimeout: true
});

// Monitoreo de la cola
geminiQueue.on('active', () => {
  console.log(`🔄 Cola Gemini: ${geminiQueue.size} en espera, ${geminiQueue.pending} procesando`);
});

geminiQueue.on('idle', () => {
  console.log('✅ Cola Gemini: vacía');
});

geminiQueue.on('error', (error) => {
  console.error('🔥 Error en cola Gemini:', error);
});

// ===== FIN CONFIGURACIÓN P-QUEUE =====

// Helper para llamar a Gemini (ahora con cola)
async function callGemini(prompt, requestId = 'unknown') {
  return geminiQueue.add(async () => {
    const fetch = (await import("node-fetch")).default;
    const bodyToSend = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    console.log(`▶️ [${requestId}] Payload a Gemini (Cola: ${geminiQueue.size} esperando):`, bodyToSend);

    const apiRes = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyToSend),
    });

    const rawText = await apiRes.text();

    console.log(`⬅️ [${requestId}] Respuesta cruda Gemini (status ${apiRes.status}):`, rawText.substring(0, 200) + '...');

    if (!apiRes.ok) {
      throw new Error(`Gemini API error ${apiRes.status}: ${rawText}`);
    }

    const jsonLLM = JSON.parse(rawText);
    const candidate = jsonLLM.candidates?.[0];
    let respuestaRaw = candidate.content.parts.map((p) => p.text).join("");

    // limpiar ```json
    const cleaned = respuestaRaw.replace(/```(?:json)?/g, "").trim();
    console.log(`✅ [${requestId}] Respuesta limpia (${cleaned.length} chars)`);

    return cleaned;
  });
}

// Ruta genérica
app.post("/api/gemini", async (req, res) => {
  const requestId = `gemini-${Date.now()}`;
  try {
    const { prompt } = req.body;
    console.log(`▶️ [${requestId}] /api/gemini llamado`);
    const cleaned = await callGemini(prompt || "<sin prompt>", requestId);
    res.send(cleaned);
  } catch (err) {
    console.error(`🔥 [${requestId}] Error en /api/gemini:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Nueva ruta: analizar comida
app.post("/analyze-food", async (req, res) => {
  const requestId = `food-${Date.now()}`;
  const { food } = req.body;
  console.log(`▶️ [${requestId}] /analyze-food llamado con food:`, food);

  if (!food || typeof food !== "string") {
    return res.status(400).json({ error: "Falta el campo 'food'" });
  }

  try {
    const prompt = `Analiza esta comida y devuelve sus macros (calorías, proteínas, grasas, carbohidratos) en formato JSON: "${food}"`;
    
    const cleanedJsonString = await callGemini(prompt, requestId);

    try {
      const jsonRespuesta = JSON.parse(cleanedJsonString);
      console.log(`✅ [${requestId}] /analyze-food respuesta JSON:`, jsonRespuesta);
      res.json({ ok: true, data: jsonRespuesta });

    } catch (parseError) {
      console.error(`🔥 [${requestId}] Error al parsear JSON de /analyze-food:`, parseError);
      res.json({ ok: false, data: cleanedJsonString, error: "La IA no devolvió un JSON válido" });
    }

  } catch (err) {
    console.error(`🔥 [${requestId}] Error en /analyze-food:`, err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Nueva ruta: generar dieta
app.post("/generate-diet", async (req, res) => {
  const requestId = `diet-${Date.now()}`;
  try {
    const { profile, options } = req.body;
    
    const prompt = options?.prompt; 
    console.log(`▶️ [${requestId}] /generate-diet llamado`);

    if (!prompt) {
      return res.status(400).json({ error: "Falta el 'prompt' en el objeto 'options'" });
    }

    const cleanedJsonString = await callGemini(prompt, requestId);

    try {
      const jsonRespuesta = JSON.parse(cleanedJsonString);
      console.log(`✅ [${requestId}] /generate-diet respuesta JSON`);
      res.json(jsonRespuesta);
    } catch (parseError) {
       console.error(`🔥 [${requestId}] Error al parsear JSON de Gemini:`, parseError);
       res.json({ ok: false, data: cleanedJsonString, error: "La IA no devolvió un JSON válido" });
    }

  } catch (err) {
    console.error(`🔥 [${requestId}] Error en /generate-diet:`, err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Endpoint para re-ajustar el plan de dieta completo basado en una desviación.
 */
app.post("/adjust-diet", async (req, res) => {
  const requestId = `adjust-${Date.now()}`;
  const { comidaReal, comidasRestantes, profile } = req.body;
  console.log(`▶️ [${requestId}] /adjust-diet llamado`);

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

  console.log(`[${requestId}] Enviando prompt a Gemini para ajuste de dieta...`);

  try {
    const cleanedJsonString = await callGemini(prompt, requestId);

    try {
      const adjustedMeals = JSON.parse(cleanedJsonString);

      if (!Array.isArray(adjustedMeals) || adjustedMeals.length !== comidasRestantes.length) {
        console.error(`[${requestId}] La IA devolvió un formato inesperado:`, adjustedMeals);
        throw new Error('La IA devolvió un formato de datos incorrecto.');
      }

      console.log(`✅ [${requestId}] /adjust-diet: Ajuste completado`);
      res.json(adjustedMeals);

    } catch (parseError) {
      console.error(`🔥 [${requestId}] Error al parsear JSON de Gemini en /adjust-diet:`, parseError);
      res.status(500).json({ ok: false, error: "La IA no devolvió un JSON válido", data: cleanedJsonString });
    }

  } catch (geminiError) {
    console.error(`🔥 [${requestId}] Error en callGemini para /adjust-diet:`, geminiError);
    res.status(500).json({ ok: false, error: geminiError.message });
  }
});

// Endpoint para obtener estadísticas de la cola (útil para debugging)
app.get("/queue-stats", (req, res) => {
  res.json({
    size: geminiQueue.size,           // Peticiones en espera
    pending: geminiQueue.pending,     // Peticiones procesando
    isPaused: geminiQueue.isPaused
  });
});

// Escuchar
const LAN_IP = process.env.VITE_LAN_IP || "localhost"; 
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
  console.log(`🌐 LAN disponible en http://${LAN_IP}:${PORT}`);
  console.log(`📊 Cola Gemini configurada: concurrency=${geminiQueue.concurrency}, intervalCap=${geminiQueue.intervalCap}`);
});