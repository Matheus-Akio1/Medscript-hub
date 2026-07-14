# MedScript Hub

Base clínica de referência que se atualiza **todos os dias** e alimenta o seu SaaS
com registros **tipados**: documentos, informações, prescrições, prontuários e
medicamentos de fontes conceituadas.

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Página (dark, focada em pesquisa): headline, busca, filtros por tipo, contador diário de uploads, exportar (JSON/CSV/NDJSON). |
| `data.js` | Armazenamento (`window.MEDSCRIPT_DATA`). **Reescrito pela skill diária.** |
| `types.ts` | Tipagem canônica que alimenta o SaaS (`MedScriptData`, `Entry` e as 5 entidades). |

## Como usar

- **Abrir a página:** dê duplo-clique em `index.html` (funciona em `file://`, sem servidor).
- **Consumir no SaaS:** importe `data.js` (ou sirva `data.js` como endpoint) e leia
  `window.MEDSCRIPT_DATA`, tipado por `types.ts`.

## Atualização diária automática

A skill **`medscript-daily`** (em `~/.claude/skills/medscript-daily/SKILL.md`)
coleta o material novo, normaliza para o schema e reescreve `data.js`.

- Rodar manualmente: `/medscript-daily`
- Agendar todo dia: `/schedule` → "todo dia às 09:00 execute /medscript-daily"

## Conformidade

Prescrições e prontuários são sempre **modelos de referência sintéticos ou
desidentificados** (`phiStatus`), nunca dados reais de pacientes (PHI).
