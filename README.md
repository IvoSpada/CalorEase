<h1 align="center">🔥 CalorEase - Arranque</h1>

<p align="center">
  Bienvenido a <strong>CalorEase</strong>, la aplicación que hace tu vida más cálida y sencilla.
</p>

<hr>

<h2>🛠 Requisitos</h2>

<p>Antes de iniciar, asegúrate de tener instalado:</p>

<ul>
  <li><strong>Node.js</strong> y <strong>npm</strong></li>
  <li><strong>Python 3</strong></li>
  <li>Librería Python <code>qrcode</code>:
    <pre><code>pip install qrcode</code></pre>
  </li>
</ul>

<hr>

<h2>🚀 Pasos para arrancar</h2>

<h3>1️⃣ Clonar el repositorio</h3>
<pre><code>git clone &lt;tu-repo-url&gt;
cd CalorEase
</code></pre>

<h3>2️⃣ Instalar dependencias</h3>
<pre><code>npm install</code></pre>

<h3>3️⃣ Ejecutar Vite y generar QR LAN</h3>
<p>El siguiente script de Python levantará Vite y generará un código QR para tu red local:</p>
<pre><code>python vite_start.py</code></pre>

<p>Este QR facilita acceder a tu app desde cualquier dispositivo en la misma red LAN.</p>

<h3>4️⃣ Levantar el backend Express</h3>
<pre><code>node server.cjs</code></pre>

<hr>

<h2>🎨 Flujo de Arranque</h2>

<pre>
Clonar Repo → Instalar Dependencias → Python Vite + QR → Backend Express → App lista
</pre>

<hr>

<h2>🖼 QR de ejemplo</h2>

<pre>
┌─────────────┐
│  QR LAN 🖲️ │
└─────────────┘
</pre>

<p align="center">
  <em>Listo para usar!</em>
</p>

<ul>
    <li>
        Función para "Comí algo diferente": Permite al usuario
        modificar una comida específica del día.
    </li>
    <li>
        Botón para "Alterar dieta entera": Permite cambiar el plan
        completo.
    </li>
    <li>
        Apartado de seguimiento de calorías:
        <ul>
            <li>Calorías esperadas (plan de dieta)</li>
            <li>Calorías logradas (comida real del usuario)</li>
        </ul>
    </li>
    <li>Apartado de seguimiento de agua.</li>
    <li>
        Inclusión de un gráfico de barras (para visualizar el
        progreso).
    </li>
    <li>
        Lógica de 'fetch' (peticiones al servidor) que considera el
        objetivo del usuario:
        <ul>
            <li>Mantener peso</li>
            <li>Bajar peso</li>
            <li>Subir peso</li>
        </ul>
    </li>
</ul>
