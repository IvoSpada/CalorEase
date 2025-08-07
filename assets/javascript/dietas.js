const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");

const app = express();
const port = 3000;

// peticiones json
app.use(express.json());
app.use(cors());

// instanciaa
const genAI = new GoogleGenerativeAI("AIzaSyDgdLETOQ7NbyJJcA0jzUgNy2k05UBjUNU");

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
});

const generationConfig = {
  temperature: 0,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

//generar prompt de dietaa
var preferencia;
var parametros;
var extra;

preferencia = "bajar de peso";
parametros = 2400;
extra = "soy celiaco, no me gustan las frutas";
// Ruta
app.post("/generate", async (req, res) => {
  const inputText = req.body.text;

  const parts = [
    {
      text:
        "input: sos un asistente de nutricion y te vamos a pedir una dieta EN FORMATO JSON y sin estos simbolos ** porfavor, organizada por dia,comida y horario para: " +
        preferencia +
        " con limite de " +
        parametros +
        " calorias diarias. ademas tener en cuenta las siguientes ordenes: " +
        extra +
        ".",
    },
    { text: "output: " },
    { text: `input: ${inputText}` },
    { text: "output: " },
  ];

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
    });
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando la respuesta" });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
