# LÓGICA — Documentação completa dos cálculos do módulo Gestão

Este documento descreve **todos os cálculos e regras** da aplicação, de forma que
qualquer pessoa consiga reproduzir os números na mão, a partir da planilha.
Nenhum número é inventado: tudo deriva das abas da planilha oficial.

---

## 1. Fontes de dados (abas e colunas da planilha)

A planilha pode chegar por dois caminhos, com o mesmo resultado:

- **Link "Publicar na web"** (`.../pub?output=xlsx`): entrega as abas `Lista` e `DB`
  (e, se o documento inteiro for publicado, também `Upsell Downsell`, `MRR Calculado`
  e `Cadastro e Configuracoes`).
- **Upload do arquivo .xlsx completo**: a aba `Base` substitui a `Lista`
  (mesmas colunas da `DB`).

### 1.1 Aba principal (`Lista`, ou `Base` quando não há `Lista`)

Cada linha é um cliente. Colunas lidas (nomes normalizados — sem acento, minúsculas):

| Coluna na planilha | Campo interno | Uso |
|---|---|---|
| Cliente / Empresa | `cliente` | Identificação; chave de cruzamento por nome |
| Data de Início / Início Real | `data_inicio` | Início do contrato (fallback) |
| Início Planejado | `data_inicio_planejado` | Corte do CLT por coorte |
| Status | `status` | Apenas exibição/filtro legado — **não** define atividade |
| Plano | `plano` | Distribuições |
| nMRR | `nmrr` | MRR contratado no 1º mês |
| Líder RevOps | `lider_revops` | Filtro de squad / agrupamento "Por Equipe" |
| Responsável RevOps | `responsavel_revops` | Agrupamentos e gráficos de evolução |
| Especialidade | `especialidade` | Distribuições (grafia "oftamologia" → "Oftalmologia") |
| Principal Fonte de Tráfego | `fonte_trafego` | Distribuições e filtros |
| CRM / Tipo CRM | `crm` / `tipo_crm` | Distribuições e filtros ("-" e vazio = "Sem CRM") |
| Dados / Performance / Design / Copy / Edição | `an_*` | Colaboradores por função |
| Data de Início - Ref Mês | `data_inicio_ref` | **Mês de início oficial** (prevalece sobre `data_inicio`) |
| Data de Fim - Ref Mês | `data_fim_ref` | **Mês de encerramento oficial** (vazio = contrato em aberto) |
| Data Aviso Prévio - Ref Mês | `data_aviso_previo_ref` | Mês do aviso prévio |
| MRR Atual | `mrr_atual` | Valor corrente do contrato |
| CLT Previsto / CLT Atual | `clt_previsto` / `clt_atual` | Tempo de casa previsto / real (meses) |
| LTV Previsto / LTV Real | `ltv_previsto` / `ltv_real` | Receita de vida prevista / realizada |

### 1.2 Aba bruta (`DB` ou `Base`) — campos extras, casados por cliente

| Coluna | Campo | Uso |
|---|---|---|
| ID (Clickup) / Clickup | `id_clickup` | Chave preferida de cruzamento (o "#" é removido) |
| Motivo de Cancelamento | `motivo_cancelamento` | Ranking de motivos de churn |
| Início Aviso Prévio / Data Aviso Previo | `data_aviso_previo` | Fallback do aviso |
| Fim Planejado (coluna E) | `fim_planejado` | Existência define se CLT/LTV **previstos** existem |
| Data de Início - Tratada | `inicio_tratada` | Escopo **vigente** (início considerando renovações) |
| Data de Fim - Tratada | `fim_tratada` | Escopo **vigente** (fim considerando última renovação) |
| Primeiro Upsell/Downsell (- Ref) | `primeiro_upsell_ref` | Mês do primeiro upsell/downsell |
| Dias Prop Pag Aviso Previo | `aviso_dias_prop` | Dias proporcionais faturados no aviso |
| Mes Pgto Aviso Previo | `aviso_mes_pgto` | Mês em que o aviso proporcional é faturado |

### 1.3 Aba `Upsell Downsell` (quando publicada/presente)

Colunas: `ID (Clickup)` (chave), `Empresa` (chave alternativa), `REF INÍCIO`,
`REF FIM`, `Novo MRR`. Cada linha é um valor de MRR vigente entre dois meses.
O cruzamento replica o `SUMIFS('Upsell Downsell'!H; REF INÍCIO <= mês; REF FIM >= mês; ID = ID Clickup)`
da planilha.

### 1.4 Aba `MRR Calculado` (quando publicada/presente)

- **Linha 1** = meses; **linha 2** = soma (MRR oficial do mês); **linha 3** = média
  (ticket médio oficial do mês). É a **série oficial preferencial**.
- A partir da linha com cabeçalho `ID (Clickup)`: uma linha por cliente
  (coluna A = ID, coluna B = Empresa) com o MRR mensal **já calculado pela planilha**.
  Quando presente, esse valor por cliente/mês tem prioridade sobre qualquer cálculo local.

### 1.5 Aba `Cadastro e Configuracoes` (quando presente)

- **Bloco 1 (CADASTRO RESPONSAVEIS)**: cada coluna de função (Head de Growth, Head
  Comercial, Líder RevOps, Responsável RevOps, Dados, Performance, Design, Copy,
  Edição) é uma lista que termina na primeira célula vazia.
- **Bloco 2 (PESSOAS)**: colunas `Pessoa` / `Status`; só entram pessoas com
  Status = "Ativo" (usado no recorte "Por Colaborador").

### 1.6 Cruzamento entre abas

- Chave preferida: **ID do Clickup** (sem "#").
- Chave alternativa: **nome da empresa normalizado** (sem acento, minúsculo).
- **Proteção contra homônimos**: se o mesmo nome aparece com IDs diferentes, o
  cruzamento por nome é **descartado** para aquele nome (nunca mistura dois clientes).

---

## 2. Regras transversais (valem para toda a aplicação)

### 2.1 Cliente ativo — regra temporal, nunca a coluna Status

Um cliente está **ativo no mês M** (formato `yyyy-MM`) se e somente se:

```
início ≤ M  E  (fim vazio  OU  fim ≥ M)
```

onde `início` = "Data de Início - Ref Mês" (fallback: "Data de Início") e
`fim` = "Data de Fim - Ref Mês". Consequências:

- O **mês do cancelamento ainda conta como ativo** (fim ≥ M).
- A coluna `Status` da planilha **não** participa da regra; atividade é 100% temporal.
- Sem data de início, o cliente nunca é ativo.

### 2.2 Data de fim vazia = contrato em aberto

`Data de Fim - Ref Mês` vazia significa que o contrato segue vigendo: o cliente
conta como ativo em todos os meses a partir do início e seu MRR segue contando.

### 2.3 Proteção contra valores inválidos (CLT/LTV)

Um valor de CLT ou LTV é **inválido** quando é negativo, vazio, nulo ou não
numérico. Tempo de casa ou LTV negativo é sempre erro de dado (ex.: cruzamento
sem ID que devolve data de 1899). O cliente inválido **sai apenas da média
afetada** e é sinalizado na tela (⚠ com a quantidade de excluídos); ele continua
contando em clientes, MRR etc. Se nenhum valor válido sobra, a célula exibe "—",
nunca 0.

**Caso especial — sem "Fim Planejado" (coluna E do DB):** as fórmulas da planilha
usam a data vazia (30/12/1899) e produzem valores absurdos (−1.541 meses, LTV de
milhões negativos). Nesses clientes, `CLT Previsto`, `LTV Previsto` **e**
`LTV Real` são tratados como **inexistentes** (nulos) já na importação — não é zero,
é "não calculável".

### 2.4 MRR Válido × MRR Ativo

- **MRR Ativo**: soma do MRR de todos os clientes no mês, **incluindo** o primeiro
  mês de cada contrato.
- **MRR Válido**: mesmo MRR, mas o **primeiro mês do contrato é excluído**
  (se `início ≥ M`, contribui 0). Mede a receita recorrente já consolidada,
  sem o efeito de novas vendas do mês.

### 2.5 Por que o CLT é por coorte e não é somável

O CLT da tabela mensal depende de **quem já saiu** (a média dos inativos define o
corte dos ativos que entram na conta — ver §5.8). Mudar o grupo muda o corte e o
resultado. Portanto:

- o CLT de um conjunto de clientes deve ser **recalculado sobre o conjunto inteiro
  de uma vez**, nunca composto a partir de subgrupos (não é somável nem ponderável);
- o corte usa a **base histórica completa** (todos os inativos), mesmo quando a
  tela está filtrada por período — por isso os cálculos de CLT recebem uma base
  sem recorte de datas.

### 2.6 Razão de acumulados × média de taxas mensais

Nos acumulados do período, os indicadores de taxa **não** são a média das taxas
mensais — são recalculados sobre os totais:

- **Churn Quantitativo acumulado** = (média de cancelados por mês) / (média de ativos por mês).
- **Churn Financeiro acumulado** = (total de MRR perdido) / (total de MRR do período).
- **nMRR Ticket acumulado** = (total de nMRR) / (total de novos).
- **MRR Ticket acumulado** = (média do MRR mensal) / (média de ativos).

### 2.7 Mês de referência

Nos cards e no ranking, o "mês de referência" é o **último mês do período
selecionado**. Quando o período é "todos", o intervalo efetivo vai do primeiro ao
último mês presente nos dados (nunca terminando antes de 2026-08).

### 2.8 Filtro de squad (Líder RevOps)

Aplicado a **todas** as linhas e cards, inclusive MRR e tickets. A série oficial da
aba `MRR Calculado` é global: só é usada quando **nenhum** recorte de squad está
ativo; com squad selecionado, o MRR é recalculado cliente a cliente.

---

## 3. MRR de um cliente em um mês — a cascata oficial

Replica fielmente a fórmula da aba `MRR Calculado`. Para o cliente `c` e o mês `M`,
na **ordem exata** (a primeira regra que se aplica vence):

0. **Série oficial**: se a aba `MRR Calculado` veio no arquivo, usa o valor que a
   própria planilha calculou para aquele cliente/mês. Fim.
1. **nMRR vazio** → 0.
2. **Mês de pagamento do aviso prévio** (`Mes Pgto Aviso Previo` = M) →
   `MRR Atual × Dias Prop / 30`.
3. **M antes do início** (ou sem início) → 0.
4. **M = mês de início** → nMRR.
5. **M ≥ fim** (quando há fim) → 0. (Fim vazio = segue contando.)
6. **Sem "Primeiro Upsell/Downsell"**, ou primeiro upsell **depois** de M → nMRR.
7. **Após o primeiro upsell** → soma dos `Novo MRR` da aba `Upsell Downsell`
   vigentes em M (`REF INÍCIO ≤ M ≤ REF FIM`), casados pelo ID Clickup
   (fallback: nome normalizado, se não ambíguo).
8. **Demais casos** → 0.

**Aproximação**: quando a aba `Upsell Downsell` não veio no arquivo, o passo 7 usa
o `MRR Atual` do cliente (fallback: nMRR). O cabeçalho da página indica a origem
do MRR: **oficial** (série da planilha), **upsell** (cascata com a aba) ou
**aproximado**.

---

## 4. Cards de KPI (aba Dashboard)

Todos usam o **mês de referência** = último mês do período, e a mesma regra
temporal de atividade da tabela mensal.

### 4.1 Seção BASE

- **CLIENTES ATIVOS**: quantidade de clientes ativos no mês de referência
  (regra §2.1). Subtítulo: total de clientes que estiveram ativos em **algum** mês
  do período ("na base") e quantos deles estão inativos no mês de referência.
- **MRR ATIVO**: soma do MRR de todos os clientes no mês de referência
  (série oficial quando disponível; senão, cascata do §3).
- **MRR TICKET MÉDIO**: MRR do mês de referência ÷ quantidade de clientes com
  MRR **diferente de zero** no mês (usa o ticket oficial quando disponível).
- **LTV REAL** (card por escopos — ver §6): número principal = média do
  `LTV Real` dos ativos do mês de referência.

### 4.2 Seção GANHO

- **NOVOS CLIENTES**: clientes com mês de início dentro do período. Subtítulo:
  média por mês (novos ÷ meses do período).
- **nMRR**: soma do `nMRR` dos novos clientes do período.
- **nMRR TICKET MÉDIO**: nMRR total ÷ novos do período.
- **CLT REAL** (card por escopos): número principal = **CLT por coorte** do mês de
  referência (§5.8), calculado sobre a base histórica completa.

### 4.3 Seção PERDA

- **AVISO PRÉVIO SOLICITADO**: clientes com "Data Aviso Prévio - Ref Mês" dentro
  do período. Subtítulo: média por mês.
- **CLIENTES CANCELADOS**: clientes com "Data de Fim - Ref Mês" dentro do período.
  Subtítulo: média por mês.
- **MRR PERDIDO**: soma do `MRR Atual` dos clientes cancelados no período
  (= `SUMIFS(MRR Atual; Data de Fim - Ref Mês = mês)` da planilha, somada nos meses).
- **CHURN FINANCEIRO**: MRR perdido do período ÷ MRR do período (soma dos MRR
  mensais), em %. Sem período definido, usa a foto do mês de referência.

---

## 5. Tabela "Indicadores mês a mês"

Uma linha por indicador, uma coluna por mês do período, mais **Acum. Total** e
**Acum. Média**. Filtro de squad aplicado a todas as linhas.

| Linha | Valor no mês M | Acum. Total | Acum. Média |
|---|---|---|---|
| **Novos** | clientes com início = M | soma dos meses | — |
| **nMRR** | soma do nMRR dos novos de M | soma dos meses | — |
| **nMRR Ticket** | nMRR de M ÷ novos de M | total nMRR ÷ total novos (razão de acumulados) | — |
| **Ativos** | clientes ativos em M (§2.1) | clientes **distintos** ativos em algum mês do período (início ≤ último mês e fim vazio ou ≥ primeiro mês) | média dos ativos mensais |
| **MRR** | soma do MRR dos clientes em M (oficial se houver) | soma dos meses | média dos meses |
| **MRR - Ticket Médio** | MRR de M ÷ clientes com MRR ≠ 0 em M (oficial se houver) | média do MRR mensal ÷ média de ativos (razão de acumulados) | — |
| **Aviso Prévio** | clientes com aviso = M | soma dos meses | — |
| **Cancelados** | clientes com fim = M | soma dos meses | — |
| **MRR Perdido** | soma do MRR Atual dos cancelados de M | soma dos meses | — |
| **Churn Quantitativo** | cancelados de M ÷ ativos de M | média de cancelados ÷ média de ativos | — |
| **Churn Financeiro** | MRR perdido de M ÷ MRR de M | total perdido ÷ total MRR | — |
| **CLT (meses)** | coorte de M (§5.8) | média simples dos CLTs mensais da janela | — |

### 5.8 CLT por coorte (porte fiel da aba `Base Cálculo CLT`)

Para o mês M, sobre a **base histórica completa** (sem recorte de datas):

1. Para cada cliente: seja `i` = índice do mês de início (Ref Mês), `f` = índice do
   mês de fim (Ref Mês), `M` = índice do mês analisado (índice = ano×12 + mês).
2. **Fora da coorte**: clientes cujo "Início Planejado" é **depois** de M.
3. **Status no mês**: ativo se `f` vazio ou `f ≥ M`; senão inativo.
4. **Duração**: 0 se `i ≥ M`; ativo → `M − i`; inativo → `f − i`.
5. **CLT** = média das durações de: todos os **inativos** + os **ativos cuja
   duração ≥ média das durações dos inativos**.

Ou seja: a média de quem já saiu define o corte; entram na conta quem saiu e quem
já ficou pelo menos esse tempo. Por isso o valor não é somável nem ponderável
entre grupos (§2.5).

### Motivos de cancelamento (painel ao lado da tabela)

Para clientes com fim dentro da janela: agrupa por "Motivo de Cancelamento"
(vazio → "Não informado"), contando quantidade e somando `MRR Atual`
(fallback: nMRR). Ordenado por quantidade.

---

## 6. LTV e CLT por escopo (cards LTV REAL e CLT REAL)

Cada card mostra uma grade 2×2: **Real** × **Previsto**, nos escopos **Inicial**
(contrato original) e **Vigente** (considerando renovações). Médias sobre os
**ativos do mês de referência**; valores inválidos ficam fora (§2.3). O escopo
vigente depende das datas "Tratadas", casadas pelo ID do Clickup — cliente sem ID
fica fora dessas médias.

### 6.1 LTV

| Célula | Fórmula |
|---|---|
| **Real · Inicial** | soma do MRR mensal do cliente (matriz oficial) do mês de início até o **menor** entre "Fim Planejado" e "Data de Fim - Ref Mês" |
| **Previsto · Inicial** | `LTV Previsto` da planilha |
| **Real · Vigente** (número principal do card) | `LTV Real` da planilha |
| **Previsto · Vigente** | `LTV Real + MRR Atual × meses restantes até "Data de Fim - Tratada"` (dias ÷ 30, mínimo 0; requer ID Clickup) |

### 6.2 CLT

| Célula | Fórmula |
|---|---|
| **Real · Inicial** | `min(CLT Atual, CLT Previsto)` |
| **Previsto · Inicial** | `CLT Previsto` da planilha |
| **Real · Vigente** | `CLT Atual` da planilha |
| **Previsto · Vigente** | `("Data de Fim - Tratada" − "Data de Início - Tratada") ÷ 30 dias` (requer ID Clickup e as duas datas) |

O número principal do card CLT REAL é o **CLT por coorte** do mês de referência
(§5.8), exibido também na coluna "Real" entre Inicial e Vigente.

---

## 7. Tabela de ranking (aba Insights: Equipes)

### 7.1 Recorte

- **Período próprio da seção** (independente da barra global).
- Um cliente **entra no recorte** se: iniciou, encerrou, avisou **ou** esteve ativo
  em algum mês dentro do período.
- Filtros adicionais: Status (Ativos/Inativos, pela regra temporal no **último mês
  do período**), CRM, Fonte de Tráfego.
- **Agrupamentos**: Por Equipe (Líder), Por Responsável Rev Ops, Por Performance,
  Por Copy, ou Por Colaborador (cada cliente conta em **todos** os seus papéis:
  Responsável RevOps, Dados, Performance, Design, Copy, Edição; com o cadastro
  carregado, só entram pessoas com Status = Ativo). Nome vazio → "Sem definição".

### 7.2 Colunas (mês de referência = último mês do período)

| Coluna | Regra |
|---|---|
| **Clientes** | quantidade de clientes do grupo no recorte |
| **MRR Válido** | soma do MRR do mês de referência, **excluindo o 1º mês** de cada contrato (§2.4) |
| **MRR Ativo** | soma do MRR do mês de referência, sem exclusão |
| **LTV Real** | média do `LTV Real` do grupo (inválidos fora, com ⚠) |
| **LTV Previsto** | média do `LTV Previsto` do grupo (idem) |
| **CLT Médio** | média do `CLT Atual` do grupo (idem) — sempre em **meses** |
| **CLT Previsto** | média do `CLT Previsto` do grupo (idem) |

### 7.3 Linha de fechamento "TOTAL / MÉDIA"

Cada coluna tem regra própria:

- **SOMA** — Clientes, MRR Válido, MRR Ativo: soma das linhas (confere com os
  chips do cabeçalho da seção).
- **MÉDIA PONDERADA POR CLIENTE** — LTV Real, LTV Previsto, CLT Previsto:
  calculada **diretamente sobre todos os clientes do recorte de uma vez**
  (equivalente a ponderar as linhas pelo nº de clientes). Marcadas com "≈".
- **RECALCULO SOBRE TODOS OS CLIENTES** — CLT Médio: recalculado sobre todos os
  clientes do recorte com o mesmo método das linhas (nunca derivado das linhas —
  §2.5). Bate com o card "CLT REAL" do dashboard quando os filtros são equivalentes.

A linha fica sempre por último (não participa da ordenação) e mantém os avisos ⚠
de valores excluídos.

### 7.4 Gráficos de evolução da seção

Quatro cards (Líder, Responsável Rev Ops, Performance, Copy): evolução mensal do
MRR por pessoa/equipe sobre a base filtrada (sem recorte de data), com no máximo
**4 consultores** por gráfico. Usam o mesmo MRR por cliente/mês do §3.

---

## 8. Insights: Clientes (distribuições e comparativos)

- **Distribuições** (Especialidade, Plano, Fonte de Tráfego, CRM, Status):
  contagem de clientes e soma de MRR por categoria, sobre a base filtrada;
  tooltips mostram MRR Ativo, **MRR Válido** (§2.4) e Clientes, nessa ordem.
  Categorias vazias de CRM aparecem como "Sem CRM".
- **Maturidade da carteira**: faixas de `CLT Atual` (0–3, 4–6, 7–12, 13+ meses),
  só com valores válidos.
- **CLT Real × Previsto**: média e mediana de `CLT Atual` e `CLT Previsto` sobre
  os clientes com **os dois** valores válidos; contagens de quem está acima/abaixo
  do previsto, nos escopos Inicial e Vigente (§6.2). Clientes sem "Fim Planejado"
  ficam fora do comparativo.
- **Sem responsável**: ativos sem Responsável RevOps **e** sem Líder RevOps, com a
  soma do `MRR Atual`.

---

## 9. Importação e persistência

- Os dados ficam no armazenamento local do navegador (sem backend conectado):
  clientes, metadados da importação, série oficial de MRR e cadastro de pessoas.
- O leitor da planilha tem **versão** (atual: 3). Dados gravados por versão
  anterior são considerados desatualizados e re-sincronizados automaticamente.
- Cada nova sincronização **substitui todo o conteúdo** anterior.
