import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    // Listar itens do portfólio (público e admin)
    if (req.method === 'GET') {
      const itens = await sql`
        SELECT * FROM portfolio ORDER BY ordem_exibicao ASC, id DESC
      `;
      return res.status(200).json(itens);
    }

    // Criar novo item (admin)
    if (req.method === 'POST') {
      const { nome_cliente, nome_site, url_site, imagem_capa, categoria, descricao, destaque } = req.body;

      if (!nome_cliente || !nome_site) {
        return res.status(400).json({ erro: 'Nome do cliente e nome do site são obrigatórios' });
      }

      const resultado = await sql`
        INSERT INTO portfolio (nome_cliente, nome_site, url_site, imagem_capa, categoria, descricao, destaque)
        VALUES (${nome_cliente}, ${nome_site}, ${url_site || null}, ${imagem_capa || null}, ${categoria || null}, ${descricao || null}, ${destaque || false})
        RETURNING id
      `;
      return res.status(201).json({ id: resultado[0].id });
    }

    // Editar item existente (admin)
    if (req.method === 'PUT') {
      const { id, nome_cliente, nome_site, url_site, imagem_capa, categoria, descricao, destaque } = req.body;

      if (!id) {
        return res.status(400).json({ erro: 'id é obrigatório' });
      }

      await sql`
        UPDATE portfolio
        SET nome_cliente = ${nome_cliente}, nome_site = ${nome_site}, url_site = ${url_site || null},
            imagem_capa = ${imagem_capa || null}, categoria = ${categoria || null},
            descricao = ${descricao || null}, destaque = ${destaque || false}
        WHERE id = ${id}
      `;
      return res.status(200).json({ sucesso: true });
    }

    // Excluir item (admin)
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ erro: 'id é obrigatório' });
      }

      await sql`DELETE FROM portfolio WHERE id = ${id}`;
      return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: 'Método não permitido' });
  } catch (err) {
    console.error('Erro em /api/portfolio:', err);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}
