# Estrutura de nós do Figma — campos relevantes para este pipeline

Referência rápida dos campos do JSON retornado pela API/MCP do Figma que
importam para a extração determinística. Não é uma cópia completa da doc
oficial — só o que este pipeline usa.

| Campo | Onde aparece | Uso no pipeline |
|---|---|---|
| `id` | todo nó | identificador único do nó nesta consulta |
| `name` | todo nó | usado como fallback de classe CSS/seletor quando não há mapeamento |
| `type` | todo nó | `FRAME`, `INSTANCE`, `TEXT`, `GROUP`, `RECTANGLE`, etc. |
| `componentId` | nós `INSTANCE` | referência ao componente principal — chave para o de/para |
| `componentProperties` | nós `INSTANCE` | valores de variantes/props definidas no componente Figma |
| `characters` | nós `TEXT` | conteúdo textual |
| `layoutMode` | frames com auto-layout | `HORIZONTAL` / `VERTICAL` / `NONE` — indício de flex/grid, mas não a resposta final de responsividade |
| `children` | nós com filhos | árvore recursiva |

## Limitações conhecidas (não tente resolver na Etapa 1)

- **Responsividade/breakpoints**: o Figma não informa isso nativamente;
  fica para a Etapa 4 (IA) ou decisão humana.
- **Estados de interação** (hover, focus, loading): normalmente exigem
  frames/variantes separadas no Figma que precisam ser combinadas
  manualmente — não assuma que dá para inferir automaticamente.
- **Acessibilidade** (alt text, aria-labels): raramente vem no nó; sinalizar
  como pendência na entrega, não inventar.
- **Republicação de biblioteca**: `componentId` pode mudar; prefira mapear
  pela `key` publicada quando disponível (ver `mapping-schema.md`).
