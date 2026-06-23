# Calculadora ROI ATVO × ESFERA — Brief técnico para o Claude Code

## O projeto
Calculadora interativa de ROI para empresas PJ, usada na apresentação do método ATVO ao Santander/Esfera.
Stack: React + Vite. Projeto já existe em `/Users/rayssa.amaral/Documents/Claude/Projects/ESFERA/calculadora-roi`.
**Objetivo imediato: fazer deploy no Vercel com `npx vercel --prod` e retornar a URL pública.**

---

## Fluxo: 4 etapas

### Etapa 1 — Custos pagáveis no cartão
Usuário informa gastos mensais que podem migrar para o cartão corporativo (sem criar custo novo):
- Fornecedores e insumos
- Serviços de TI e Software
- Marketing e publicidade
- Aluguel/condomínio
- Seguros
- Outros recorrentes

**Seletor de setor** pré-preenche valores típicos (Serviços, Comércio, Indústria, Agronegócio, Saúde, Outro).

**Output da etapa:**
- Total mensal elegível = soma dos 6 campos
- Pontos estimados = total × 1,5 pts/R$ (estimativa conservadora cartão PJ)

---

### Etapa 2 — Viagens e trade de turismo
Gastos anuais com viagens corporativas:
- Passagens nacionais
- Passagens internacionais
- Hotéis
- Locação / Uber / transporte
- Combustível (se no cartão)

**Seletor de classe** define o % de economia via fidelização:
| Classe | Desconto aplicado |
|---|---|
| Econômica | 55% |
| Executiva doméstica | 75% |
| Executiva internacional | 85% |
| Primeira classe / top rota | 90% |

**Cálculo:**
```
econPassagens = (nacionais + internacionais) × %_classe
econHoteis    = hoteis × 40%
econTransp    = transporte × 20%
econViagens   = econPassagens + econHoteis + econTransp
```

> Esta é a maior fonte de economia — passagens executivas via pontos chegam a 90% de desconto.

---

### Etapa 3 — Compras ocasionais e investimento em pontos

**Resgates planejados (anuais):**
- Eletrônicos e equipamentos
- Premiações para equipe
- Outros resgates

**Cálculo resgates:**
```
econResgates = (eletro + premios + outros) × 60%
```

**Compra de pontos via Clube Esfera:**
- Slider: 0 a 500 mil pontos/mês
- Plano **sem clube**: R$ 70/milheiro
- Plano **Master** (R$ 106,90/mês): R$ 35/milheiro (40% de desconto)
- Limite do Master: 500 mil pontos/mês

**Cálculo investimento mensal:**
```
custoPontos = pontosK × custoPorMilheiro   (pontosK em milhares)
custoTotal  = custoPontos + mensalidadeClube
```

**Valor gerado pelos pontos comprados (anual):**
```
valorPontosComprados = pontosK × 1000 × 12 × 0,08
```
(~R$ 80 de valor de resgate por mil pontos, com economia média de 60%)

---

### Etapa 4 — Resultado

**Consolidação:**
```
pontosCartao     = totalMensalCartao × 1,5 pts/R$ × 12
valorPontosCartão = pontosCartao / 1000 × 35          (usando custo clube)

econTotal        = econViagens + econResgates + valorPontosCartão + valorPontosComprados

investimento     = custoPontosAnual + custoClube × 12
roiLiquido       = econTotal - investimento
payback          = investimento / (econTotal / 12)     (em meses)
custoDaInação    = totalMensalCartão × 12 × 18%        (dado histórico ATVO: 18% perdido/ano)
```

**Cards exibidos:**
1. Economia anual total (destaque hero)
2. Custo do programa / ano
3. ROI líquido / ano
4. Payback em meses
5. Custo da inação

**Breakdown das economias:**
- Viagens: valor atual vs economia + % de desconto
- Resgates de produtos: valor atual vs economia (até 60%)
- Pontos acumulados no cartão: pts/ano gerados gratuitamente + valor em R$

**Barra de progressão trimestral (3, 6, 9, 12 meses):**
- Verde quando saldo acumulado > investimento acumulado
- Dourado quando ainda no período de payback

---

## Constantes e premissas do negócio
| Constante | Valor | Fonte |
|---|---|---|
| Custo milheiro sem clube | R$ 70 | Esfera |
| Custo milheiro com Clube Master | R$ 35 | Esfera (40% desc.) |
| Mensalidade Clube Master | R$ 106,90/mês | Esfera |
| Limite compra Clube Master | 500 mil pts/mês | Esfera |
| Taxa de acúmulo cartão PJ | ~1,5 pts/R$ | Estimativa conservadora |
| Economia viagens (executiva internacional) | até 90% | Dado ATVO/Sandro |
| Economia resgates em produtos | até 60% | Dado ATVO |
| Custo da inação | 18% do custo operacional/ano | Histórico ATVO |
| Churn de clientes treinados | ~0% (5% conservador nos cálculos) | Dado Sandro |

---

## Casos reais para referência (prova social)
| Empresa | Segmento | Pontos/ano comprados | Investimento/ano |
|---|---|---|---|
| E-Cosmetics | E-commerce | 4 milhões | R$ 140.000 |
| Rede Farmes | Farmácias | 2 milhões | R$ 70.000 |
| Ranking Frotas | Gestão de frotas | 1 milhão | R$ 35.000 |

Todos partiram de zero antes do ATVO. Nenhum cancelou.

---

## Contexto do negócio (para o LLM entender as decisões)
- **ATVO** = método do Sandro Keisel (25 anos no mercado) para transformar gastos PJ em patrimônio via fidelização
- **Esfera** = programa de fidelidade do Santander, aceita CNPJ
- Pontos PJ não vão direto para milhas aéreas: passam por conta Esfera PJ → sócio CPF → programa aéreo
- Tributação ocorre no **resgate** (não no acúmulo); no Lucro Real pode ser neutro
- A calculadora serve como argumento de venda para gerentes Santander abordarem empresas PJ

---

## Tarefa imediata para o Claude Code
1. Fazer deploy no Vercel: `npx vercel --prod` a partir da raiz do projeto
2. Retornar a URL pública
3. Se necessário, ajustar `vercel.json` (já existe com `framework: vite`)
