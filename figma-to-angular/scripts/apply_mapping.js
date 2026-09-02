#!/usr/bin/env node
/**
 * Etapa 1b — Aplica o registro de mapeamento (de/para) sobre os nós
 * normalizados e gera HTML/Angular bruto. Puramente determinístico:
 * mesma entrada sempre produz a mesma saída, sem chamadas a IA.
 *
 * Uso:
 *   node apply_mapping.js <nodes.json> <component-registry.json> [output_path]
 */

const fs = require('fs');
const path = require('path');

const [, , nodesPathArg, registryPathArg, outputPathArg] = process.argv;

if (!nodesPathArg || !registryPathArg) {
  console.error('Uso: node apply_mapping.js <nodes.json> <component-registry.json> [output_path]');
  process.exit(1);
}

const nodes = JSON.parse(fs.readFileSync(nodesPathArg, 'utf-8'));
const registry = JSON.parse(fs.readFileSync(registryPathArg, 'utf-8'));
const outputPath = outputPathArg || path.join(__dirname, '..', 'output', 'raw.html');

const unmapped = []; // componentes encontrados sem entrada no registro — reportar ao final

/**
 * Resolve o valor de um "field" do registro contra um nó:
 * - { source: "property", key: "Label" } lê de componentProperties
 * - { source: "text", contains: "label" } procura um filho de texto
 *   cujo nome contenha o seletor (case-insensitive)
 * - { source: "static", value: "..." } valor fixo
 */
function resolveField(field, node) {
  if (field.source === 'property') {
    const prop = node.componentProperties?.[field.key];
    return prop ? prop.value : field.default ?? '';
  }

  if (field.source === 'text') {
    const match = findTextChild(node, field.contains.toLowerCase());
    return match ? match.text : field.default ?? '';
  }

  if (field.source === 'static') {
    return field.value;
  }

  return field.default ?? '';
}

function findTextChild(node, selectorLower) {
  if (!node.children) return null;
  for (const child of node.children) {
    if (child.type === 'TEXT' && child.name.toLowerCase().includes(selectorLower)) {
      return child;
    }
    const nested = findTextChild(child, selectorLower);
    if (nested) return nested;
  }
  return null;
}

/**
 * Aplica um template de string com placeholders {{campo}}.
 */
function applyTemplate(template, values) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => values[key] ?? '');
}

function renderNode(node) {
  if (node.type === 'INSTANCE' && node.componentId) {
    const mapping = registry.components[node.componentId];

    if (mapping) {
      const values = {};
      for (const [fieldName, fieldDef] of Object.entries(mapping.fields || {})) {
        values[fieldName] = resolveField(fieldDef, node);
      }
      return applyTemplate(mapping.template, values);
    }

    unmapped.push({ id: node.id, name: node.name, componentId: node.componentId });
    // fallback: cai para renderização genérica abaixo
  }

  // Fallback determinístico: HTML semântico simples baseado no tipo do nó.
  const childrenHtml = (node.children || []).map(renderNode).join('\n');

  if (node.type === 'TEXT') {
    return `<span>${escapeHtml(node.text || '')}</span>`;
  }

  const tag = node.layoutMode ? 'div' : 'div'; // ponto de extensão: usar <section>/<article> por heurística de nome, se útil
  const className = slugify(node.name);
  return `<${tag} class="${className}">\n${childrenHtml}\n</${tag}>`;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'node';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function main() {
  const html = renderNode(nodes);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf-8');

  console.log(`HTML/Angular bruto gerado em: ${outputPath}`);

  if (unmapped.length > 0) {
    console.log('\nComponentes sem mapeamento no registro (usaram fallback):');
    unmapped.forEach((u) => console.log(`  - ${u.name} (componentId: ${u.componentId})`));
    console.log('\nAdicione essas entradas em component-registry.json para melhorar a próxima extração.');
  }
}

main();
