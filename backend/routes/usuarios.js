const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sql = require("../db");

// 🟢 CADASTRO
router.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const result = await sql`
      INSERT INTO usuarios (nome, email, senha)
      VALUES (${nome}, ${email}, ${senhaHash})
      RETURNING id, nome, email
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(400).json({ erro: "Email já cadastrado ou dados inválidos." });
  }
});

// 🔵 LOGIN
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await sql`
      SELECT * FROM usuarios WHERE email = ${email}
    `;
    if (result.length === 0) {
      return res.status(401).json({ erro: "Email ou senha inválidos." });
    }
    const usuario = result[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: "Email ou senha inválidos." });
    }
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
  } catch (err) {
    console.log("ERRO LOGIN:", err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;