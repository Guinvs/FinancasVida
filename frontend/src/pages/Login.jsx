import { useState } from "react";
import api from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cadastro, setCadastro] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    try {
      if (cadastro) {
        await api.post("/usuarios/cadastro", { nome, email, senha });
        setCadastro(false);
        setErro("Cadastro realizado! Faça login.");
      } else {
        const res = await api.post("/usuarios/login", { email, senha });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("usuario", JSON.stringify(res.data.usuario));
        onLogin(res.data.usuario);
      }
    } catch (err) {
      setErro("Email ou senha inválidos.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f0fdf4"
    }}>
      <div style={{
        width: 400, padding: 32, background: "#fff",
        borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ textAlign: "center", color: "#16a34a", marginBottom: 24 }}>
          💰 FinançasVida
        </h2>
        <h3 style={{ textAlign: "center", marginBottom: 24 }}>
          {cadastro ? "Criar conta" : "Entrar"}
        </h3>

        {erro && (
          <p style={{ color: cadastro ? "green" : "red", textAlign: "center" }}>
            {erro}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {cadastro && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Nome</label>
              <input value={nome} onChange={e => setNome(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box" }} />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box" }} />
          </div>
          <button type="submit" style={{
            width: "100%", padding: 12, background: "#16a34a",
            color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 16
          }}>
            {cadastro ? "Cadastrar" : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 16, cursor: "pointer", color: "#16a34a" }}
          onClick={() => { setCadastro(!cadastro); setErro(""); }}>
          {cadastro ? "Já tenho conta" : "Criar conta"}
        </p>
      </div>
    </div>
  );
}