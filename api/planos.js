import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    // Listar planos (público e admin)
    if (req.method === 'GET') {
      const planos = await sql`
        SELECT * FROM planos ORDER BY ordem_exibicao ASC, id ASC
      `;
      return res.status(200).json(planos);
    }

    // Criar novo plano (admin)
    if (req.method === 'POST') {
      const { nome, preco, descricao, itens_inclusos } = req.body;

      if (!nome || preco === undefined) {
        return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
      }

      const resultado = await sql`
        INSERT INTO planos (nome, preco, descricao, itens_inclusos)
        VALUES (${nome}, ${preco}, ${descricao || null}, ${itens_inclusos || []})
        RETURNING id
      `;
      return res.status(201).json({ id: resultado[0].id });
    }

    // Editar plano existente (admin)
    if (req.method === 'PUT') {
      const { id, nome, preco, descricao, itens_inclusos } = req.body;

      if (!id) {
        return res.status(400).json({ erro: 'id é obrigatório' });
      }

      await sql`
        UPDATE planos
        SET nome = ${nome}, preco = ${preco}, descricao = ${descricao || null}, itens_inclusos = ${itens_inclusos || []}
        WHERE id = ${id}
      `;
      return res.status(200).json({ sucesso: true });
    }

    // Excluir plano (admin)
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ erro: 'id é obrigatório' });
      }

      await sql`DELETE FROM planos WHERE id = ${id}`;
      return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: 'Método não permitido' });
  } catch (err) {
    console.error('Erro em /api/planos:', err);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}
