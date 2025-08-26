# CalorEase 🍽️🔥

**CalorEase** es una plataforma web para el seguimiento nutricional personalizado, que permite al usuario registrar sus comidas, obtener sus valores nutricionales estimados mediante IA, y visualizar un resumen diario de su alimentación.

## 🧠 Características principales

- Registro de comidas por texto libre (analizado por Gemini AI).
- Opción manual para ingresar valores nutricionales personalizados.
- Visualización diaria de comidas y valores totales.
- Backend en PHP + MySQL.
- Frontend en JavaScript, HTML, CSS.
- Integración con la API de Gemini mediante Node.js.

## 🏗️ Estructura del Proyecto

CalorEase/
│
├── index.html
├── dashboard.html
├── dashboard.js
├── estilos/
│ └── estilo.css
├── assets/
│ └── php/
│ ├── conexion.php
│ └── logged-resources/
│ ├── obtenerComidaUsuario.php
│ └── agregarComida.php (⚠️ PENDIENTE)
├── server.js
├── .env
└── README.md

## ⚙️ Tecnologías utilizadas

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend PHP**: Conexión a MySQL mediante `mysqli`
- **Base de datos**: MySQL
- **IA**: API de Gemini (Google AI)
- **Servidor IA**: Node.js con Express
- **Entorno local**: WAMP (Windows), entorno LAMP compatible

## 📤 Flujo de la app

1. El usuario ingresa una comida.
2. Puede optar por ingresar manualmente o dejar que la IA la analice.
3. El frontend hace una petición `POST` a `/api/gemini` en el backend Node.js.
4. La IA responde con los valores nutricionales en JSON.
5. (Próximamente) Se envía ese JSON a un script PHP que guarda los datos en MySQL.
6. Los datos se muestran en el dashboard del usuario, agrupados por fecha.

## 🚧 Pendientes

- [ ] Poner `restricciones` para la seleccion de comidas, de todas a las del usuario asignadas, tanto en la ingesta diaria como parte de la dieta.
- [ ] Validaciones en la subida manual de datos.
- [ ] Mejoras visuales y adaptación móvil.
- [ ] Autenticación de usuarios.
- [ ] Mostrar gráficos nutricionales diarios.

## 📦 Ejecución local

1. Clonar el repositorio.
2. Configurar `.env` con tu API key de Gemini:
    ```
    GEMINI_API_KEY=TU_API_KEY_AQUI
    ```
3. Levantar el servidor Node.js:
    ```
    node server.js
    ```
4. Acceder vía navegador a `http://localhost` o `http://localhost:3000`.

## 👤 Autor

**CalorEase** – Proyecto final en desarrollo para plataforma de nutrición inteligente.