import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    // Criar novo pedido (vem do formulário público do site)
    if (req.method === 'POST') {
      const { nome, email, telefone, tipo_negocio, nome_negocio, plano_texto, plano_id, mensagem } = req.body;

      if (!nome || !telefone) {
        return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' });
      }

      const resultado = await sql`
        INSERT INTO pedidos (nome, email, telefone, tipo_negocio, nome_negocio, plano_texto, plano_id, mensagem)
        VALUES (${nome}, ${email || null}, ${telefone}, ${tipo_negocio || null}, ${nome_negocio || null}, ${plano_texto || null}, ${plano_id || null}, ${mensagem || null})
        RETURNING id
      `;
      return res.status(201).json({ id: resultado[0].id });
    }

    // Listar pedidos (painel admin) - já traz o nome do plano junto
    if (req.method === 'GET') {
      const pedidos = await sql`
        SELECT p.*, COALESCE(p.plano_texto, pl.nome) AS plano_nome
        FROM pedidos p
        LEFT JOIN planos pl ON pl.id = p.plano_id
        ORDER BY p.criado_em DESC
      `;
      return res.status(200).json(pedidos);
    }

    // Atualizar status de um pedido (painel admin)
    if (req.method === 'PATCH') {
      const { id, status } = req.body;
      const statusValidos = ['novo', 'em_contato', 'fechado', 'recusado'];

      if (!id || !statusValidos.includes(status)) {
        return res.status(400).json({ erro: 'id e status válidos são obrigatórios' });
      }

      await sql`UPDATE pedidos SET status = ${status} WHERE id = ${id}`;
      return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: 'Método não permitido' });
  } catch (err) {
    console.error('Erro em /api/pedidos:', err);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}
