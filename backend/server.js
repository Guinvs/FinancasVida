require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas
const usuariosRoutes = require("./routes/usuarios");
const transacoesRoutes = require("./routes/transacoes");

app.use("/usuarios", usuariosRoutes);
app.use("/transacoes", transacoesRoutes);

app.get("/", (req, res) => {
  res.json({ message: "FinançasVida API rodando 🚀" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});