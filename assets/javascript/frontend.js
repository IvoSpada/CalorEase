// frontend.js
const sendButton = document.getElementById('sendButton');
const inputText = document.getElementById('inputText');
const responseDiv = document.getElementById('response');

sendButton.addEventListener('click', async () => {
  const prompt = inputText.value.trim();
  if (!prompt) return;
  responseDiv.textContent = 'Cargando...';

  try {
    const res = await fetch('http://localhost:3000/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    const data = await res.json();
    // Pintamos el JSON formateado
    responseDiv.innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    responseDiv.textContent = `Error: ${err.message}`;
  }
});