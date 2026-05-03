const express = require("express");
const router = express.Router();
const sql = require("../db");
const auth = require("../middleware/auth");

// 🔵 LISTAR transações
router.get("/", auth, async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM transacoes
      WHERE usuario_id = ${req.usuario.id}
      ORDER BY data DESC
    `;
    res.json(result);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar transações." });
  }
});

// 🟢 CRIAR transação
router.post("/", auth, async (req, res) => {
  const { tipo, valor, categoria, descricao, data } = req.body;
  try {
    const result = await sql`
      INSERT INTO transacoes (usuario_id, tipo, valor, categoria, descricao, data)
      VALUES (${req.usuario.id}, ${tipo}, ${valor}, ${categoria}, ${descricao}, ${data})
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao criar transação." });
  }
});

// 🔴 DELETAR transação
router.delete("/:id", auth, async (req, res) => {
  try {
    await sql`
      DELETE FROM transacoes
      WHERE id = ${req.params.id} AND usuario_id = ${req.usuario.id}
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao deletar transação." });
  }
});

// 🔵 RESUMO do mês
router.get("/resumo", auth, async (req, res) => {
  const { mes, ano } = req.query;
  try {
    const result = await sql`
      SELECT 
        tipo,
        SUM(valor) as total
      FROM transacoes
      WHERE usuario_id = ${req.usuario.id}
        AND EXTRACT(MONTH FROM data) = ${mes}
        AND EXTRACT(YEAR FROM data) = ${ano}
      GROUP BY tipo
    `;
    res.json(result);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar resumo." });
  }
});

module.exports = router;