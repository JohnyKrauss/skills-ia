---
name: figma-to-angular
description: Converte telas do Figma em código Angular usando um pipeline de duas etapas — (1) extração determinística dos nós via API/MCP do Figma com de/para para os componentes da biblioteca de design system interna, sem raciocínio de IA, e (2) reorganização/componentização do resultado com boas práticas Angular usando raciocínio de IA. Use esta skill sempre que o usuário pedir para transformar um link ou arquivo do Figma em código Angular, HTML de uma tela do Figma, "bater" um design com o design system, ou mencionar node do Figma, componentProperties, Code Connect, de/para de componentes, ou geração de frontend a partir de design. Não use para geração de UI do zero sem referência de um arquivo Figma real.
compatibility: Requer token de acesso à API do Figma (ou MCP do Figma configurado) e Node.js para rodar os scripts de extração/mapeamento.
---

# Figma → Angular (pipeline determinístico + IA)

## Objetivo

Acelerar o trabalho do desenvolvedor frontend que converte telas do Figma em Angular, **sem substituí-lo**. O pipeline tem duas etapas com responsabilidades bem separadas — não pule a Etapa 1 direto para geração livre por IA, mesmo que pareça mais rápido.

- **Etapa 1 — Extração determinística**: percorre os nós do Figma e gera HTML/Angular cru, usando um registro de mapeamento (de/para) para nós que são instâncias de componentes da biblioteca interna. Roda via script, não via raciocínio do modelo — resultado deve ser reprodutível.
- **Etapa 2 — Reorganização com IA**: pega a saída da Etapa 1 e componentiza, nomeia, aplica boas práticas Angular (standalone components, signals, OnPush, etc.) e ajusta acessibilidade/responsividade que o Figma não capturou.

## Quando usar

Acione esta skill quando o usuário:
- Fornecer um link de arquivo/frame do Figma e pedir código Angular
- Pedir para "bater" um componente do Figma com a biblioteca interna (de/para)
- Perguntar sobre mapeamento de `componentProperties`, `componentKey`, ou node do Figma
- Pedir para atualizar/expandir o `component-registry.json`

Não acione para pedidos de UI genéricos sem um arquivo Figma real de referência — nesse caso é geração de UI comum, não este pipeline.

## Fluxo passo a passo

### 1. Confirmar acesso
Verifique se há um token de API do Figma disponível (variável de ambiente `FIGMA_TOKEN`) ou MCP do Figma conectado. Sem isso, pare e peça ao usuário.

### 2. Buscar os nós
Rode `scripts/extract_nodes.js <file_key> <node_id>` para buscar a árvore de nós do frame/tela alvo via API REST do Figma (`GET /v1/files/:key/nodes`). Isso salva um JSON bruto em `output/nodes.json` — não interprete os nós manualmente, deixe o script normalizar.

Consulte `references/node-structure.md` se precisar entender campos específicos do JSON retornado (auto-layout, `componentProperties`, etc.) antes de decidir algo sobre o mapeamento.

### 3. Aplicar o registro de mapeamento (de/para)
Leia `assets/component-registry.json` (ou o caminho informado pelo usuário, se a biblioteca interna já tiver um registro mantido no repo do design system).

Rode `scripts/apply_mapping.js output/nodes.json assets/component-registry.json` para gerar o HTML/Angular bruto:
- Nó `INSTANCE` com `componentKey` presente no registro → emite o componente Angular mapeado, com os inputs traduzidos a partir de `componentProperties`
- Nó sem mapeamento → cai no fallback de HTML semântico simples baseado no tipo de nó e `name`

Se o usuário disser que um componente não está mapeado, ajude a adicionar a entrada em `assets/component-registry.json` seguindo `references/mapping-schema.md` — não invente o mapeamento sem confirmar com o usuário qual componente Angular corresponde.

### 4. Reorganizar com IA (aqui você raciocina)
Com o HTML/Angular bruto da Etapa 3 em mãos, você (Claude) deve:
- Identificar blocos repetidos ou complexos e extrair como componentes Angular próprios
- Nomear componentes/inputs de forma semântica (não `Frame1234`, `Group56`)
- Aplicar convenções do projeto do usuário (standalone components, `OnPush`, signals se já usado no projeto — pergunte se não souber)
- Sinalizar explicitamente o que o Figma não informa e precisa de decisão humana: breakpoints/responsividade, estados de interação (hover/focus/loading) não desenhados, textos alternativos de acessibilidade

### 5. Entregar
Mostre o código final ao usuário e destaque separadamente: (a) o que veio direto do de/para (alta confiança), (b) o que foi fallback de HTML puro (revisar), (c) decisões de arquitetura que você tomou na Etapa 4 (para o dev revisar rápido, não redescobrir).

## Arquivos desta skill

- `scripts/extract_nodes.js` — chama a API do Figma e normaliza o JSON dos nós
- `scripts/apply_mapping.js` — aplica o registro de mapeamento e gera HTML/Angular bruto
- `assets/component-registry.example.json` — exemplo de registro; copie para `component-registry.json` real do projeto do usuário
- `references/mapping-schema.md` — como escrever uma entrada de mapeamento
- `references/node-structure.md` — campos relevantes do JSON de nós do Figma
