import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    const resultado = await sql`SELECT * FROM admins WHERE email = ${email}`;

    if (resultado.length === 0) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    const admin = resultado[0];
    const senhaCorreta = await bcrypt.compare(senha, admin.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    return res.status(200).json({ sucesso: true, email: admin.email });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ erro: 'Erro interno ao processar login' });
  }
}
