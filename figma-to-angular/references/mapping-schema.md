# Schema do registro de mapeamento (component-registry.json)

Cada entrada de `components` representa um componente da biblioteca interna
e como extrair seus dados a partir do nó Figma correspondente.

```json
{
  "components": {
    "<componentKey ou componentId do Figma>": {
      "description": "texto livre, só para humanos",
      "fields": {
        "<nomeDoCampo>": { "source": "...", ... }
      },
      "template": "string com {{placeholders}} que viram tags Angular"
    }
  }
}
