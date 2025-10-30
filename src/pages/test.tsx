import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/api";

const Test = () => {
  const [type, setType] = useState<"login" | "register">("login");
  const [form, setForm] = useState<any>({
    nombre: "",
    email: "",
    password: "",
    password_confirmation: "",
    peso: "",
    altura: "",
    edad: "",
    objetivo: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = type === "login" ? "login" : "register";
      const bodyData =
        type === "login"
          ? { email: form.email, password: form.password }
          : {
              nombre: form.nombre,
              email: form.email,
              password: form.password,
              password_confirmation: form.password_confirmation,
              peso: parseFloat(form.peso),
              altura: parseFloat(form.altura),
              edad: parseInt(form.edad),
              objetivo: form.objetivo,
            };

      console.log("Enviando a:", `${API_URL}/${endpoint}`);
      console.log("Datos:", bodyData);

      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      console.log("Respuesta:", data);

      if (!res.ok) {
        setError(data.message || "Error en la petición");
        return;
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      navigate("/profile");
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>{type === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>

      <button onClick={() => setType(type === "login" ? "register" : "login")}>
        Cambiar a {type === "login" ? "Registro" : "Login"}
      </button>

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        {type === "register" && (
          <>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={handleChange}
              required
            />
            <br />
            <input
              type="number"
              name="peso"
              placeholder="Peso"
              value={form.peso}
              onChange={handleChange}
              required
            />
            <br />
            <input
              type="number"
              name="altura"
              placeholder="Altura"
              value={form.altura}
              onChange={handleChange}
              required
            />
            <br />
            <input
              type="number"
              name="edad"
              placeholder="Edad"
              value={form.edad}
              onChange={handleChange}
              required
            />
            <br />
            <input
              type="text"
              name="objetivo"
              placeholder="Objetivo (perder_peso/mantener/ganar_peso)"
              value={form.objetivo}
              onChange={handleChange}
              required
            />
            <br />
          </>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
        />
        <br />
        {type === "register" && (
          <>
            <input
              type="password"
              name="password_confirmation"
              placeholder="Confirmar contraseña"
              value={form.password_confirmation}
              onChange={handleChange}
              required
            />
            <br />
          </>
        )}
        <button type="submit" style={{ marginTop: "1rem" }}>
          {type === "login" ? "Iniciar sesión" : "Registrarse"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Test;