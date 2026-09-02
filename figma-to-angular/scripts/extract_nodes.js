#!/usr/bin/env node
/**
 * Etapa 1a — Extração determinística de nós do Figma.
 *
 * Uso:
 *   FIGMA_TOKEN=xxxx node extract_nodes.js <file_key> <node_id> [output_path]
 *
 * Busca a árvore de nós de um frame específico via API REST do Figma
 * e salva um JSON normalizado (sem interpretação/raciocínio) para a
 * etapa de mapeamento consumir.
 */

const fs = require('fs');
const path = require('path');

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const [, , fileKey, nodeId, outputPathArg] = process.argv;

if (!FIGMA_TOKEN) {
  console.error('Erro: variável de ambiente FIGMA_TOKEN não definida.');
  process.exit(1);
}
if (!fileKey || !nodeId) {
  console.error('Uso: node extract_nodes.js <file_key> <node_id> [output_path]');
  process.exit(1);
}

const outputPath = outputPathArg || path.join(__dirname, '..', 'output', 'nodes.json');

/**
 * Normaliza um nó bruto do Figma para o formato mínimo que a etapa de
 * mapeamento precisa. Mantém apenas o essencial — nada de heurística
 * de layout/semântica aqui, isso é responsabilidade da Etapa 4 (IA).
 */
function normalizeNode(node) {
  const normalized = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // Nós de instância carregam a referência ao componente principal —
  // é essa chave que casamos contra o registro de mapeamento.
  if (node.type === 'INSTANCE') {
    normalized.componentId = node.componentId;
    normalized.componentProperties = node.componentProperties || {};
  }

  if (node.type === 'TEXT' && typeof node.characters === 'string') {
    normalized.text = node.characters;
  }

  if (node.layoutMode) {
    normalized.layoutMode = node.layoutMode; // HORIZONTAL / VERTICAL / NONE
  }

  if (Array.isArray(node.children) && node.children.length > 0) {
    normalized.children = node.children.map(normalizeNode);
  }

  return normalized;
}

async function main() {
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN },
  });

  if (!res.ok) {
    console.error(`Erro na API do Figma: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  const nodeEntry = data.nodes[nodeId];

  if (!nodeEntry || !nodeEntry.document) {
    console.error(`Nó ${nodeId} não encontrado no arquivo ${fileKey}.`);
    process.exit(1);
  }

  const normalized = normalizeNode(nodeEntry.document);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2), 'utf-8');

  console.log(`Nós extraídos e normalizados em: ${outputPath}`);
}

main().catch((err) => {
  console.error('Falha na extração:', err);
  process.exit(1);
});
