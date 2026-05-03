import { useState, useEffect } from "react";
import api from "../services/api";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement
} from "chart.js";
import * as XLSX from "xlsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard({ usuario, onLogout }) {
  const [transacoes, setTransacoes] = useState([]);
  const [form, setForm] = useState({
    tipo: "entrada", valor: "", categoria: "", descricao: "", data: new Date().toISOString().split("T")[0]
  });
  const [mensagem, setMensagem] = useState("");
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());

  useEffect(() => { carregarTransacoes(); }, []);

  async function carregarTransacoes() {
    const res = await api.get("/transacoes");
    setTransacoes(res.data);
  }

  async function salvarTransacao(e) {
    e.preventDefault();
    try {
      await api.post("/transacoes", form);
      setMensagem("✅ Transação salva!");
      setForm({ tipo: "entrada", valor: "", categoria: "", descricao: "", data: new Date().toISOString().split("T")[0] });
      carregarTransacoes();
      setTimeout(() => setMensagem(""), 3000);
    } catch (err) {
      setMensagem("❌ Erro ao salvar.");
    }
  }

  async function deletarTransacao(id) {
    await api.delete(`/transacoes/${id}`);
    carregarTransacoes();
  }

  function importarExcel(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      for (const row of data) {
        await api.post("/transacoes", {
          tipo: row.tipo,
          valor: row.valor,
          categoria: row.categoria,
          descricao: row.descricao,
          data: row.data
        });
      }
      carregarTransacoes();
      setMensagem("✅ Planilha importada com sucesso!");
      setTimeout(() => setMensagem(""), 3000);
    };
    reader.readAsBinaryString(file);
  }

  // Filtra por mês/ano
  const transacoesFiltradas = transacoes.filter(t => {
    const d = new Date(t.data);
    return d.getMonth() + 1 === Number(filtroMes) && d.getFullYear() === Number(filtroAno);
  });

  const totalEntradas = transacoesFiltradas.filter(t => t.tipo === "entrada").reduce((acc, t) => acc + Number(t.valor), 0);
  const totalSaidas = transacoesFiltradas.filter(t => t.tipo === "saida").reduce((acc, t) => acc + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  // Dados para gráfico de linha
  const diasDoMes = [...new Set(transacoesFiltradas.map(t => t.data.split("T")[0]))].sort();
  const dadosLinha = {
    labels: diasDoMes,
    datasets: [
      {
        label: "Entradas",
        data: diasDoMes.map(dia => transacoesFiltradas.filter(t => t.data.split("T")[0] === dia && t.tipo === "entrada").reduce((acc, t) => acc + Number(t.valor), 0)),
        borderColor: "#16a34a", backgroundColor: "rgba(22,163,74,0.1)", tension: 0.4
      },
      {
        label: "Saídas",
        data: diasDoMes.map(dia => transacoesFiltradas.filter(t => t.data.split("T")[0] === dia && t.tipo === "saida").reduce((acc, t) => acc + Number(t.valor), 0)),
        borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", tension: 0.4
      }
    ]
  };

  // Dados para gráfico de rosca
  const categorias = [...new Set(transacoesFiltradas.map(t => t.categoria))];
  const dadosRosca = {
    labels: categorias,
    datasets: [{
      data: categorias.map(cat => transacoesFiltradas.filter(t => t.categoria === cat).reduce((acc, t) => acc + Number(t.valor), 0)),
      backgroundColor: ["#16a34a", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"]
    }]
  };

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    onLogout();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: "#16a34a" }}>💰 Olá, {usuario.nome}!</h1>
        <button onClick={logout} style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          Sair
        </button>
      </div>

      {/* Filtro de mês */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd" }}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
            </option>
          ))}
        </select>
        <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd" }}>
          {[2024, 2025, 2026, 2027].map(ano => (
            <option key={ano} value={ano}>{ano}</option>
          ))}
        </select>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 20 }}>
          <p style={{ color: "#16a34a", margin: 0 }}>Total Entradas</p>
          <h2 style={{ color: "#16a34a", margin: "8px 0 0" }}>R$ {totalEntradas.toFixed(2)}</h2>
        </div>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 20 }}>
          <p style={{ color: "#ef4444", margin: 0 }}>Total Saídas</p>
          <h2 style={{ color: "#ef4444", margin: "8px 0 0" }}>R$ {totalSaidas.toFixed(2)}</h2>
        </div>
        <div style={{ background: saldo >= 0 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${saldo >= 0 ? "#bbf7d0" : "#fecaca"}`, borderRadius: 8, padding: 20 }}>
          <p style={{ color: saldo >= 0 ? "#16a34a" : "#ef4444", margin: 0 }}>Saldo</p>
          <h2 style={{ color: saldo >= 0 ? "#16a34a" : "#ef4444", margin: "8px 0 0" }}>R$ {saldo.toFixed(2)}</h2>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <h3>📈 Evolução do mês</h3>
          <Line data={dadosLinha} />
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <h3>🍩 Por categoria</h3>
          {categorias.length > 0 ? <Doughnut data={dadosRosca} /> : <p>Sem dados</p>}
        </div>
      </div>

      {/* Formulário */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <h3>➕ Nova transação</h3>
        <form onSubmit={salvarTransacao}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div>
              <label>Valor (R$)</label>
              <input type="number" step="0.01" value={form.valor}
                onChange={e => setForm({ ...form, valor: e.target.value })}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box" }} />
            </div>
            <div>
              <label>Categoria</label>
              <input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                placeholder="Ex: Alimentação, Salário..."
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box" }} />
            </div>
            <div>
              <label>Data</label>
              <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Descrição</label>
            <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descrição opcional..."
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box" }} />
          </div>
          {mensagem && <p>{mensagem}</p>}
          <button type="submit" style={{ padding: "10px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Salvar
          </button>
        </form>
      </div>

      {/* Importar Excel */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <h3>📊 Importar planilha Excel</h3>
        <p style={{ color: "#666", fontSize: 14 }}>A planilha deve ter as colunas: <strong>tipo, valor, categoria, descricao, data</strong></p>
        <input type="file" accept=".xlsx,.xls" onChange={importarExcel} />
      </div>

      {/* Histórico */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 24 }}>
        <h3>📋 Histórico</h3>
        {transacoesFiltradas.length === 0 && <p>Nenhuma transação neste mês.</p>}
        {transacoesFiltradas.map(t => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <div>
              <span style={{ color: t.tipo === "entrada" ? "#16a34a" : "#ef4444", fontWeight: "bold" }}>
                {t.tipo === "entrada" ? "▲" : "▼"} R$ {Number(t.valor).toFixed(2)}
              </span>
              <span style={{ marginLeft: 12, color: "#666" }}>{t.categoria}</span>
              {t.descricao && <span style={{ marginLeft: 8, color: "#999", fontSize: 14 }}>— {t.descricao}</span>}
              <span style={{ marginLeft: 12, color: "#999", fontSize: 14 }}>
                {new Date(t.data).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <button onClick={() => deletarTransacao(t.id)}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18 }}>
              🗑️
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}