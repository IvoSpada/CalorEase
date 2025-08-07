const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/macros', async (req, res) => {
  const { alimento } = req.body;
  if (!alimento) return res.status(400).json({ error: 'Falta el alimento.' });

  const prompt = `
Dame los valores nutricionales aproximados para ${alimento}.
Formato JSON con: calorías, proteínas, grasas, carbohidratos y fibra.
Solo el JSON, sin explicaciones ni texto adicional.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Elimina posibles ```json ... ``` de la respuesta
    const jsonText = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonText);

    res.json(data);
  } catch (err) {
    console.error('Error al obtener datos de Gemini:', err);
    res.status(500).json({ error: 'Error al consultar Gemini' });
  }
});

app.listen(3001, () => {
  console.log('Servidor corriendo en http://localhost:3001');
});
