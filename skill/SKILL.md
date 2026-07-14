---
name: medscript-daily
description: Coleta diária de material clínico de referência (documentos, informações, prescrições, prontuários, medicamentos) de fontes conceituadas, normaliza para o schema tipado do MedScript Hub e reescreve data.js para alimentar o SaaS. Trigger `/medscript-daily`.
---

# MedScript Daily — coleta clínica diária

Atualiza a base do **MedScript Hub** (`c:\Users\Akio\Desktop\Claude\medscript-hub`)
com novos registros clínicos de referência, tipados conforme `types.ts`.

## Regras de conformidade (LEIA PRIMEIRO — não negociável)

- **NUNCA** ingerir dados reais de pacientes (PHI): nomes, CPF, datas de
  nascimento, números de prontuário reais, contatos.
- `prescription` e `record` só admitem material de **referência**: modelos,
  exemplos **sintéticos** ou dados **desidentificados** de fontes públicas.
  Todo registro desses tipos DEVE ter `phiStatus: "synthetic" | "deidentified"`
  e uma nota final deixando claro que não é paciente real.
- Preferir fontes de alta confiança (`tier: "gold"`): Anvisa, FDA, PubMed,
  diretrizes de sociedades médicas (SBC, SBPT, AHA, ESC, SCCM), bulários oficiais.
- Respeitar direitos autorais: guardar **resumos** e metadados + link para a
  fonte, não o texto integral protegido. Usar `source.license` corretamente.
- Se não houver material novo confiável no dia, **não inventar**: apenas
  atualizar `lastUpdated` e registrar 0 no `dailyCounts` do dia.

## Passos

1. **Ler o estado atual.** Abra `medscript-hub/data.js` e `medscript-hub/types.ts`.
   Colete os `id`s existentes para deduplicação.

2. **Definir a data de hoje** no formato ISO `YYYY-MM-DD` (fuso America/Sao_Paulo).

3. **Buscar novidades** (use as tools `WebSearch`/`WebFetch`). Rode consultas por
   categoria, priorizando o que é novo/relevante:
   - Medicamentos: aprovações e bulas recentes (Anvisa, FDA).
   - Documentos/diretrizes: novas guidelines de sociedades médicas (PubMed, sites oficiais).
   - Informações: revisões e consensos clínicos recentes.
   - Prescrições/prontuários: **modelos** de referência derivados de diretrizes
     (gerar exemplo sintético coerente, nunca extrair de paciente real).
   Alvo: **3 a 8 registros/dia**. Qualidade > quantidade.

4. **Normalizar** cada item para o tipo correto (`document` | `information` |
   `prescription` | `record` | `medication`) seguindo `types.ts`:
   - `id`: slug estável `"<tipo>-<slug>-<data>"`, ex.: `med-empagliflozina-2026-07-15`.
   - Preencher `author` (médico/instituição + credenciais), `source` (nome, url, tier, license).
   - `dateAdded` = hoje; `datePublished` = data da fonte, se houver.
   - `tags`: 3–5 termos de busca (especialidade, condição, classe).
   - `verified`: `false` por padrão (você não checou clinicamente); `true` só
     para fontes `gold` regulatórias diretas.
   - Descartar itens cujo `id` já exista (dedupe).

   **Campos detalhados OBRIGATÓRIOS por tipo** (alimentam o modal de detalhe do site):
   - `prescription`: `presentation` (o que o paciente apresentava — quadro clínico),
     `items[]` (drug/dose/route/frequency/duration), `rationale`, `notes`.
   - `record`: `identification` (dados sintéticos), `anamnese` (queixa/HDA/antecedentes/
     exame físico), `diagnostico`, `evolucao`.
   - `medication`: `administration` (dosagem e administração), `contraindications`,
     `adverseEffects`, `interactions`, `pregnancyCategory` (segurança clínica),
     `physicalId` (identificação física), e `dosing` para a CALCULADORA:
     `{ mgPerKg, maxDoseMg, concentrationMgPerMl, timesPerDay, note }`. Use
     `mgPerKg: 0` quando a dose for fixa (não por peso) — a calculadora se ajusta.
   - `document`/`information`: `summary`/`body` + metadados de arquivo.

5. **Reescrever `data.js`** preservando os registros antigos e **adicionando os
   novos no topo** de `entries`. Atualize:
   - `lastUpdated` = datetime ISO atual com fuso `-03:00`.
   - `dailyCounts["<hoje>"]` = nº de registros adicionados hoje.
   - Mantenha `schemaVersion: 1`.
   Formato exato: `window.MEDSCRIPT_DATA = { ... };` — JS válido, sem `export`.

6. **Validar** antes de salvar:
   - Todo `prescription`/`record` tem `phiStatus` e nota de "não é paciente real".
   - Nenhum campo obrigatório de `BaseEntry` faltando.
   - `data.js` é sintaticamente válido (chaves/colchetes balanceados).

7. **Relatar**: quantos registros por tipo foram adicionados e as fontes usadas.

## Como automatizar (diário)

Esta skill roda quando você digita `/medscript-daily`. Para rodar **sozinha todo
dia**, agende um cloud agent (routine) com o skill `/schedule`, algo como:
"todo dia às 06:00 execute /medscript-daily". Alternativamente, `/loop 24h
/medscript-daily` mantém a execução recorrente enquanto a sessão estiver ativa.

## Contrato de saída

`medscript-hub/data.js` atualizado e válido, consumível por `index.html` e pelo
SaaS via `window.MEDSCRIPT_DATA` (schema em `types.ts`).
