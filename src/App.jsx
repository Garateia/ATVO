import { useState, useCallback, useRef } from 'react'

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => 'R$ ' + Math.round(n).toLocaleString('pt-BR')

const SECTOR_DEFAULTS = {
  servicos:  { fornecedores: 15000, ti: 5000,  marketing: 8000,  aluguel: 6000,  seguros: 4000,  outros: 7000  },
  comercio:  { fornecedores: 80000, ti: 3000,  marketing: 15000, aluguel: 12000, seguros: 8000,  outros: 5000  },
  industria: { fornecedores: 200000,ti: 4000,  marketing: 10000, aluguel: 20000, seguros: 15000, outros: 8000  },
  agro:      { fornecedores: 150000,ti: 2000,  marketing: 5000,  aluguel: 8000,  seguros: 20000, outros: 10000 },
  saude:     { fornecedores: 50000, ti: 8000,  marketing: 12000, aluguel: 15000, seguros: 10000, outros: 6000  },
  outro:     { fornecedores: 15000, ti: 5000,  marketing: 8000,  aluguel: 6000,  seguros: 4000,  outros: 7000  },
}

const PLANOS_CLUBE = {
  nenhum:    { mensalidade: 0,      milheiro: 70, limite: 500,  desconto: 0,  bonus: 0,     label: 'Sem clube (R$ 70/milheiro)' },
  pro:       { mensalidade: 43.90,  milheiro: 35, limite: 400,  desconto: 20, bonus: 1000,  label: 'Pro — R$ 43,90/mês · até 400 mil pts/mês' },
  master:    { mensalidade: 106.90, milheiro: 35, limite: 500,  desconto: 40, bonus: 2500,  label: 'Master — R$ 106,90/mês · até 500 mil pts/mês' },
  vip:       { mensalidade: 211.90, milheiro: 35, limite: 750,  desconto: 40, bonus: 5000,  label: 'VIP — R$ 211,90/mês · até 750 mil pts/mês' },
  exclusive: { mensalidade: 799.90, milheiro: 35, limite: 1250, desconto: 50, bonus: 20000, label: 'Exclusive — R$ 799,90/mês · até 1,25 mi pts/mês' },
}

const SECTORS = [
  { key: 'servicos',  icon: 'fa-briefcase',  label: 'Serviços',     sub: 'Consultorias, TI, saúde' },
  { key: 'comercio',  icon: 'fa-store',      label: 'Comércio',     sub: 'Varejo, distribuidoras' },
  { key: 'industria', icon: 'fa-industry',   label: 'Indústria',    sub: 'Manufatura, insumos' },
  { key: 'agro',      icon: 'fa-seedling',   label: 'Agronegócio',  sub: 'Insumos, maquinário' },
  { key: 'saude',     icon: 'fa-hospital',   label: 'Saúde / Farma',sub: 'Redes, clínicas' },
  { key: 'outro',     icon: 'fa-gear',       label: 'Outro',        sub: 'Personalizado' },
]

// ─── Step progress ───────────────────────────────────────────────────────────
function StepProgress({ current, onGo }) {
  const steps = ['Gastos no Cartão', 'Viagens e Trade', 'Compras e Pontos', 'Resultado']
  return (
    <div className="steps">
      {steps.map((label, i) => {
        const n = i + 1
        const cls = n < current ? 'step-item done' : n === current ? 'step-item active' : 'step-item'
        return (
          <div key={n} className={cls} onClick={() => onGo(n)}>
            <div className="step-num">
              {n < current ? <i className="fa-solid fa-check" style={{ fontSize: 12 }} /> : n}
            </div>
            <div className="step-label">{label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Input helpers ───────────────────────────────────────────────────────────
function NumInput({ label, hint, value, onChange }) {
  const inputRef = useRef(null)
  const displayValue = value === 0 ? '' : value.toLocaleString('pt-BR')

  const handleChange = (e) => {
    const input = e.target
    const oldVal = input.value
    const oldCursor = input.selectionStart
    const digitsBeforeCursor = oldVal.slice(0, oldCursor).replace(/\D/g, '').length

    const digits = oldVal.replace(/\D/g, '')
    const num = digits === '' ? 0 : parseInt(digits, 10)
    const newVal = num === 0 ? '' : num.toLocaleString('pt-BR')

    onChange(num)

    requestAnimationFrame(() => {
      if (!inputRef.current) return
      let pos = newVal.length, count = 0
      for (let i = 0; i < newVal.length; i++) {
        if (newVal[i] !== '.') count++
        if (count === digitsBeforeCursor) { pos = i + 1; break }
      }
      inputRef.current.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="input-group">
      <div className="input-label">
        {label}
        {hint && <span className="input-hint">{hint}</span>}
      </div>
      <div className="input-wrap">
        <span className="prefix">R$</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder="0"
          onFocus={e => e.target.select()}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}

// ─── STEP 1 ──────────────────────────────────────────────────────────────────
function Step1({ data, onChange, onNext, onBack, ptsPorUSD, cambio, onPtsChange, onCambioChange }) {
  const [sector, setSector] = useState('servicos')

  const total = Object.values(data).reduce((a, v) => a + v, 0)
  const taxaEfetiva = cambio > 0 ? ptsPorUSD / cambio : 0
  const pontos = Math.round(total * taxaEfetiva)

  const selectSector = (key) => {
    setSector(key)
  }

  const setField = (field) => (val) => onChange({ ...data, [field]: val })

  return (
    <>
      <div className="section-tag">Etapa 1 de 4</div>
      <div className="section-title">Custos Pagáveis no Cartão</div>
      <p className="section-desc">
        Mapeamos os gastos mensais que podem ser direcionados para o cartão corporativo, gerando pontos sem criar custo novo.
      </p>

      <div className="info-box">
        <strong>Por que isso importa:</strong> A empresa já tem esses custos. Migrar o pagamento para o cartão certo não cria despesa nova: transforma gasto inevitável em acúmulo de pontos.
      </div>

      <div className="input-label" style={{ marginBottom: 10 }}>Selecione o setor da empresa</div>
      <div className="sector-grid">
        {SECTORS.map(s => (
          <div
            key={s.key}
            className={`sector-card${sector === s.key ? ' selected' : ''}`}
            onClick={() => selectSector(s.key)}
          >
            <div className="s-icon"><i className={`fa-solid ${s.icon}`} /></div>
            <div>
              <div className="s-label">{s.label}</div>
              <div className="s-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-lightbulb" /></span>
            Fornecedores e Insumos
          </div>
          <NumInput label="Gasto mensal com fornecedores" hint="aceita cartão" value={data.fornecedores} onChange={setField('fornecedores')} />
          <NumInput label="Serviços de TI e Software" value={data.ti} onChange={setField('ti')} />
          <NumInput label="Marketing e Publicidade" value={data.marketing} onChange={setField('marketing')} />
        </div>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-clipboard-list" /></span>
            Despesas Operacionais
          </div>
          <NumInput label="Aluguel e condomínio (se aceitar cartão)" value={data.aluguel} onChange={setField('aluguel')} />
          <NumInput label="Seguros (empresa, frota, saúde)" value={data.seguros} onChange={setField('seguros')} />
          <NumInput label="Outros gastos recorrentes no cartão" value={data.outros} onChange={setField('outros')} />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="input-group">
          <div className="input-label">Pontuação do cartão <span className="input-hint">pts por US$</span></div>
          <div className="input-wrap">
            <input
              type="number"
              min={0.1} max={20} step={0.1}
              value={ptsPorUSD}
              onChange={e => onPtsChange(parseFloat(e.target.value) || 1)}
              style={{ paddingLeft: 12 }}
            />
          </div>
        </div>
        <div className="input-group">
          <div className="input-label">Câmbio atual <span className="input-hint">R$/US$</span></div>
          <div className="input-wrap">
            <span className="prefix">R$</span>
            <input
              type="number"
              min={1} max={20} step={0.01}
              value={cambio}
              onChange={e => onCambioChange(parseFloat(e.target.value) || 5.2)}
            />
          </div>
        </div>
      </div>

      <div className="result-mini">
        <div>
          <div className="label">Total mensal elegível ao cartão</div>
          <div className="sub-label">Pontos gerados: {pontos.toLocaleString('pt-BR')} pts/mês · {ptsPorUSD} pts/US$ ÷ R$ {cambio} = {taxaEfetiva.toFixed(3)} pts/R$</div>
        </div>
        <div className="value">{fmt(total)}</div>
      </div>

      <div className="nav">
        <button className="btn btn-secondary" onClick={onBack}>← Voltar</button>
        <button className="btn btn-primary" onClick={onNext}>Próxima etapa →</button>
      </div>
    </>
  )
}

// ─── STEP 2 ──────────────────────────────────────────────────────────────────
function Step2({ data, onChange, onNext, onBack }) {
  const setField = (field) => (val) => onChange({ ...data, [field]: val })
  const setClasse = (e) => onChange({ ...data, classe: parseFloat(e.target.value) })

  const econPassagens = (data.nacionais + data.internacionais) * data.classe
  const econHoteis    = data.hoteis * 0.40
  const econTransp    = data.transporte * 0.20
  const total         = econPassagens + econHoteis + econTransp

  return (
    <>
      <div className="section-tag">Etapa 2 de 4</div>
      <div className="section-title">Viagens e Trade de Turismo</div>
      <p className="section-desc">
        Aqui está a maior fonte de economia — passagens e serviços de turismo comprados via mercado de fidelização chegam a{' '}
        <strong>90% de desconto</strong>.
      </p>

      <div className="info-box">
        <strong>Como funciona a economia em viagens:</strong> Uma passagem executiva Rio/Lisboa que custaria R$ 12.000 no mercado pode ser emitida com pontos por R$ 1.200 — economia de até 90%. O segredo está em usar os pontos certos no programa certo.
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-plane" /></span>
            Passagens Aéreas
          </div>
          <NumInput label="Gasto anual com passagens nacionais" value={data.nacionais} onChange={setField('nacionais')} />
          <NumInput label="Gasto anual com passagens internacionais" value={data.internacionais} onChange={setField('internacionais')} />
          <div className="input-group">
            <div className="input-label">Classe média das viagens</div>
            <select value={data.classe} onChange={setClasse}>
              <option value={0.55}>Econômica (economia ~55%)</option>
              <option value={0.75}>Executiva doméstica (economia ~75%)</option>
              <option value={0.85}>Executiva internacional (economia ~85%)</option>
              <option value={0.90}>Primeira classe / Top rota (economia ~90%)</option>
            </select>
          </div>
        </div>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-car" /></span>
            Mobilidade e Hospedagem
          </div>
          <NumInput label="Gasto anual com hotéis" value={data.hoteis} onChange={setField('hoteis')} />
          <NumInput label="Locação de veículos / Uber / transporte" value={data.transporte} onChange={setField('transporte')} />
          <NumInput label="Combustível (se no cartão)" value={data.combustivel} onChange={setField('combustivel')} />
        </div>
      </div>

      <div className="result-mini">
        <div>
          <div className="label">Economia anual estimada em viagens</div>
          <div className="sub-label" style={{ color: 'var(--green)' }}>Maior alavanca de ROI da estratégia de pontos</div>
        </div>
        <div className="value green">{fmt(total)}</div>
      </div>

      <div className="nav">
        <button className="btn btn-secondary" onClick={onBack}>← Anterior</button>
        <button className="btn btn-primary" onClick={onNext}>Próxima etapa →</button>
      </div>
    </>
  )
}

// ─── STEP 3 ──────────────────────────────────────────────────────────────────
function Step3({ data, onChange, onNext, onBack }) {
  const setField = (field) => (val) => onChange({ ...data, [field]: val })
  const plano = PLANOS_CLUBE[data.clube] ?? PLANOS_CLUBE.nenhum

  const custoPontos  = data.pontosK * plano.milheiro
  const custoTotal   = custoPontos + plano.mensalidade
  const totalResgates = data.eletro + data.premios + data.outros
  const econResgates = totalResgates * 0.60
  const valorPontosAnual = (data.pontosK * 1000 * 12 * 0.08)
  const econTotal = econResgates + valorPontosAnual

  return (
    <>
      <div className="section-tag">Etapa 3 de 4</div>
      <div className="section-title">Compras Ocasionais e Investimento em Pontos</div>
      <p className="section-desc">
        Além dos gastos recorrentes, a empresa pode comprar pontos diretamente e usar para adquirir produtos e serviços com até 90% de economia.
      </p>

      <div className="info-box">
        {data.clube === 'nenhum' ? (
          <>Selecione um plano do clube para comprar pontos a <strong>R$ 35/milheiro</strong> — metade do preço avulso (R$ 70). Qualquer plano dá acesso às promoções.</>
        ) : (
          <>
            <strong>Plano {data.clube.charAt(0).toUpperCase() + data.clube.slice(1)}:</strong>{' '}
            R$ {plano.mensalidade.toFixed(2).replace('.', ',')}/mês ·{' '}
            {plano.bonus.toLocaleString('pt-BR')} pts bônus/mês ·{' '}
            até <strong>{plano.limite >= 1000 ? `${plano.limite / 1000} milhão` : `${plano.limite} mil`} pts/mês</strong> para comprar.{' '}
            Compra via promoção a <strong>R$ 35/milheiro</strong> — independente do plano.
          </>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-cart-shopping" /></span>
            Compras Ocasionais via Pontos
          </div>
          <NumInput label="Eletrônicos e equipamentos/ano" value={data.eletro} onChange={setField('eletro')} />
          <NumInput label="Premiações para equipe/ano" value={data.premios} onChange={setField('premios')} />
          <NumInput label="Outros resgates previstos/ano" value={data.outros} onChange={setField('outros')} />
        </div>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-coins" /></span>
            Investimento em Moedas de Fidelização
          </div>
          <div className="input-group">
            <div className="input-label">Pontos/mês que deseja comprar via Clube</div>
            <div className="slider-wrap">
              <input
                type="range"
                min={0} max={plano.limite} step={10}
                value={Math.min(data.pontosK, plano.limite)}
                onChange={e => onChange({ ...data, pontosK: parseInt(e.target.value) })}
              />
              <div className="slider-labels">
                <span>0 mil pts</span>
                <span className="mid">{data.pontosK} mil pts</span>
                <span>{plano.limite >= 1000 ? `${plano.limite/1000} mi pts` : `${plano.limite} mil pts`}</span>
              </div>
            </div>
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <div className="input-label">Plano do clube</div>
            <select value={data.clube} onChange={e => onChange({ ...data, clube: e.target.value, pontosK: Math.min(data.pontosK, PLANOS_CLUBE[e.target.value]?.limite ?? 500) })}>
              {Object.entries(PLANOS_CLUBE).map(([key, p]) => (
                <option key={key} value={key}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="cost-box">
            <div className="cost-label">Custo mensal do investimento</div>
            <div className="cost-value">{fmt(custoTotal)}</div>
            <div className="cost-note">{(Math.min(data.pontosK, plano.limite) * 1000).toLocaleString('pt-BR')} pontos disponíveis · R$ {plano.milheiro}/milheiro</div>
          </div>
        </div>
      </div>

      <div className="result-mini">
        <div>
          <div className="label">Valor liberado para resgates via pontos (anual)</div>
          <div className="sub-label">Economia estimada em produtos e serviços</div>
        </div>
        <div className="value">{fmt(econTotal)}</div>
      </div>

      <div className="nav">
        <button className="btn btn-secondary" onClick={onBack}>← Anterior</button>
        <button className="btn btn-primary" onClick={onNext}>Ver Resultado →</button>
      </div>
    </>
  )
}

// ─── STEP 4 ──────────────────────────────────────────────────────────────────
function Step4({ s1, s2, s3, ptsPorUSD, cambio, onBack, onRestart }) {
  const taxaEfetiva     = cambio > 0 ? ptsPorUSD / cambio : 0
  const cartaoMensal    = Object.values(s1).reduce((a, v) => a + v, 0)
  const cartaoAnual     = cartaoMensal * 12
  const pontosCartao    = cartaoMensal * taxaEfetiva * 12
  const valorPontosCartao = pontosCartao / 1000 * 35

  const econViagens   = (s2.nacionais + s2.internacionais) * s2.classe + s2.hoteis * 0.40 + s2.transporte * 0.20
  const totalViagens  = s2.nacionais + s2.internacionais + s2.hoteis + s2.transporte

  const totalResgates    = s3.eletro + s3.premios + s3.outros
  const planoS3         = PLANOS_CLUBE[s3.clube] ?? PLANOS_CLUBE.nenhum
  const custoPontosAnual = s3.pontosK * planoS3.milheiro * 12
  const custoClube       = planoS3.mensalidade * 12
  const econResgates     = totalResgates * 0.60
  const valorPontosComprados = s3.pontosK * 1000 * 12 * 0.08

  const econTotal   = econViagens + econResgates + valorPontosCartao + valorPontosComprados
  const investimento = custoPontosAnual + custoClube
  const roiLiquido  = econTotal - investimento
  const payback     = investimento > 0 ? (investimento / (econTotal / 12)).toFixed(1) : 0
  const inacao      = cartaoAnual * 0.18

  const pctViagens  = totalViagens > 0 ? Math.round(econViagens / totalViagens * 100) : 0

  const quarterBars = [3, 6, 9, 12].map(m => {
    const acum    = (econTotal / 12) * m
    const invest  = (investimento / 12) * m
    const balance = acum - invest
    const pct     = Math.min(100, Math.round(acum / econTotal * 100))
    const color   = balance >= 0 ? '#2ecc71' : '#c9a84c'
    return { m, balance, pct, color }
  })

  return (
    <>
      <div className="section-tag">Resultado</div>
      <div className="section-title">ROI para a sua empresa</div>
      <p className="section-desc">Com base nos dados informados, este é o potencial da fidelização estratégica para o seu negócio.</p>

      <div className="result-hero">
        <div className="headline">Economia anual estimada</div>
        <div className="big-number">{fmt(econTotal)}</div>
        <div className="sub">nos próximos 12 meses</div>
      </div>

      <div className="result-grid">
        <div className="result-card">
          <div className="rc-label">Custo do Programa / Ano</div>
          <div className="rc-value text-gold">{fmt(investimento)}</div>
          <div className="rc-note">Clube + compra de pontos</div>
        </div>
        <div className="result-card">
          <div className="rc-label">ROI Líquido / Ano</div>
          <div className="rc-value text-green">{fmt(roiLiquido)}</div>
          <div className="rc-note">Economia menos investimento</div>
        </div>
        <div className="result-card">
          <div className="rc-label">Payback</div>
          <div className="rc-value text-gold">{payback > 0 ? `${payback} meses` : 'menos de 1 mês'}</div>
          <div className="rc-note">Tempo para recuperar o investimento</div>
        </div>
        <div className="result-card">
          <div className="rc-label">Custo da Inação</div>
          <div className="rc-value text-red">{fmt(inacao)}</div>
          <div className="rc-note">~18% do custo operacional perdido por ano</div>
        </div>
      </div>

      <div className="breakdown">
        <div className="breakdown-title">Detalhamento das economias</div>
        <div className="breakdown-row">
          <div className="br-label"><i className="fa-solid fa-plane" /> Economia em viagens</div>
          <div className="br-values">
            <div className="br-current">{fmt(totalViagens)}/ano</div>
            <div className="br-saving">- {fmt(econViagens)}</div>
            <div className="br-pct">{pctViagens}% eco.</div>
          </div>
        </div>
        <div className="breakdown-row">
          <div className="br-label"><i className="fa-solid fa-cart-shopping" /> Economia em resgates de produtos</div>
          <div className="br-values">
            <div className="br-current">{fmt(totalResgates)}/ano</div>
            <div className="br-saving">- {fmt(econResgates)}</div>
            <div className="br-pct">até 60%</div>
          </div>
        </div>
        <div className="breakdown-row">
          <div className="br-label"><i className="fa-solid fa-coins" /> Pontos acumulados no cartão</div>
          <div className="br-values">
            <div className="br-current">{Math.round(pontosCartao).toLocaleString('pt-BR')} pts/ano</div>
            <div className="br-saving">+ {fmt(valorPontosCartao)}</div>
            <div className="br-pct">100% grátis</div>
          </div>
        </div>
      </div>

      <div className="payback-bar-wrap">
        <div className="payback-bar-title">Acúmulo de Economia ao Longo do Ano</div>
        {quarterBars.map(({ m, balance, pct, color }) => (
          <div className="bar-row" key={m}>
            <div className="bar-header">
              <span className="bar-label">{m} meses</span>
              <span style={{ color, fontWeight: 700 }}>
                {balance >= 0 ? '+' : ''}{fmt(balance)}
              </span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="cta-box">
        <div className="cta-text">
          <div className="cta-title">Cada mês sem o método é economia perdida.</div>
          <div className="cta-desc">
            A empresa que não aprende a usar o ecossistema perde em média{' '}
            <strong>18% do custo operacional</strong> por ano em oportunidades não aproveitadas.
          </div>
        </div>
        <button className="btn-cta" onClick={onRestart}>Refazer Simulação</button>
      </div>

      <div className="nav">
        <button className="btn btn-secondary" onClick={onBack}>← Revisar dados</button>
        <div />
      </div>
    </>
  )
}

// ─── TIPO SELECTOR ───────────────────────────────────────────────────────────
function TipoSelector({ onSelect }) {
  return (
    <>
      <div className="section-tag">Calculadora de Pontos</div>
      <div className="section-title">Qual é o perfil do cliente?</div>
      <p className="section-desc">
        A simulação é personalizada conforme o tipo — pessoa física ou empresa.
      </p>
      <div className="tipo-grid">
        <button className="tipo-card" onClick={() => onSelect('pf')}>
          <div className="tipo-icon"><i className="fa-solid fa-user" /></div>
          <div className="tipo-label">Pessoa Física</div>
          <div className="tipo-sub">Consumidor individual que quer maximizar pontos no cartão pessoal</div>
        </button>
        <button className="tipo-card" onClick={() => onSelect('pj')}>
          <div className="tipo-icon"><i className="fa-solid fa-building" /></div>
          <div className="tipo-label">Pessoa Jurídica</div>
          <div className="tipo-sub">Empresa ou MEI com gastos operacionais pagáveis no cartão corporativo</div>
        </button>
      </div>
    </>
  )
}

// ─── STEP PF ─────────────────────────────────────────────────────────────────
function StepPF({ data, onChange, ptsPorUSD, cambio, onPtsChange, onCambioChange, onNext, onBack }) {
  const plano = PLANOS_CLUBE[data.clube] ?? PLANOS_CLUBE.nenhum
  const totalElegivel = data.gastoAtual + data.gastoMigravel
  const taxaEfetiva = cambio > 0 ? ptsPorUSD / cambio : 0
  const pontosMes = Math.round(totalElegivel * taxaEfetiva)

  return (
    <>
      <div className="section-tag">Pessoa Física</div>
      <div className="section-title">Gastos Mensais</div>
      <p className="section-desc">
        Mapeamos o que você gasta hoje no cartão e tudo que ainda paga fora — para descobrir quanto pode ser migrado e gerar pontos.
      </p>

      <div className="info-box">
        <strong>Princípio:</strong> Você já tem esses gastos. Direcionar tudo para o cartão certo não cria despesa nova — gera pontos que podem valer passagens e produtos com até 90% de desconto.
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-credit-card" /></span>
            Gasto atual no cartão
          </div>
          <NumInput label="Gasto mensal atual com cartão de crédito" hint="média mensal" value={data.gastoAtual} onChange={v => onChange({ ...data, gastoAtual: v })} />
        </div>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-money-bill-wave" /></span>
            Gasto fora do cartão
          </div>
          <NumInput label="Demais gastos mensais (débito, dinheiro, pix)" hint="total sem cartão" value={data.gastoForaCartao} onChange={v => onChange({ ...data, gastoForaCartao: v })} />
          <NumInput label="Desses gastos, quanto pode ir pro cartão" hint="valor mensal" value={data.gastoMigravel} onChange={v => onChange({ ...data, gastoMigravel: v })} />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="input-group">
          <div className="input-label">Pontuação do cartão <span className="input-hint">pts por US$</span></div>
          <div className="input-wrap">
            <input type="number" min={0.1} max={20} step={0.1} value={ptsPorUSD} onChange={e => onPtsChange(parseFloat(e.target.value) || 1)} style={{ paddingLeft: 12 }} />
          </div>
        </div>
        <div className="input-group">
          <div className="input-label">Câmbio atual <span className="input-hint">R$/US$</span></div>
          <div className="input-wrap">
            <span className="prefix">R$</span>
            <input type="number" min={1} max={20} step={0.01} value={cambio} onChange={e => onCambioChange(parseFloat(e.target.value) || 5.2)} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-coins" /></span>
            Clube de Pontos (opcional)
          </div>
          <div className="input-group">
            <div className="input-label">Plano do clube</div>
            <select value={data.clube} onChange={e => onChange({ ...data, clube: e.target.value, pontosK: Math.min(data.pontosK, PLANOS_CLUBE[e.target.value]?.limite ?? 500) })}>
              {Object.entries(PLANOS_CLUBE).map(([key, p]) => (
                <option key={key} value={key}>{p.label}</option>
              ))}
            </select>
          </div>
          {data.clube !== 'nenhum' && (
            <div className="input-group">
              <div className="input-label">Pontos/mês que deseja comprar</div>
              <div className="slider-wrap">
                <input
                  type="range"
                  min={0} max={plano.limite} step={10}
                  value={Math.min(data.pontosK, plano.limite)}
                  onChange={e => onChange({ ...data, pontosK: parseInt(e.target.value) })}
                />
                <div className="slider-labels">
                  <span>0</span>
                  <span className="mid">{data.pontosK} mil pts</span>
                  <span>{plano.limite >= 1000 ? `${plano.limite/1000} mi` : `${plano.limite} mil`}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-chart-line" /></span>
            Potencial mensal
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="input-label">Total elegível no cartão</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{fmt(totalElegivel)}</div>
            <div className="input-hint" style={{ marginTop: 4 }}>{fmt(data.gastoAtual)} atual + {fmt(data.gastoMigravel)} migrado</div>
          </div>
          <div>
            <div className="input-label">Pontos gerados/mês</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{pontosMes.toLocaleString('pt-BR')} pts</div>
            <div className="input-hint" style={{ marginTop: 4 }}>{ptsPorUSD} pts/US$ ÷ R$ {cambio} = {taxaEfetiva.toFixed(3)} pts/R$</div>
          </div>
        </div>
      </div>

      <div className="nav">
        <button className="btn btn-secondary" onClick={onBack}>← Voltar</button>
        <button className="btn btn-primary" onClick={onNext}>Ver Resultado →</button>
      </div>
    </>
  )
}

// ─── STEP PF RESULT ──────────────────────────────────────────────────────────
function StepPFResult({ data, ptsPorUSD, cambio, onBack, onRestart }) {
  const plano = PLANOS_CLUBE[data.clube] ?? PLANOS_CLUBE.nenhum
  const taxaEfetiva = cambio > 0 ? ptsPorUSD / cambio : 0
  const totalMensal = data.gastoAtual + data.gastoMigravel
  const pontosAno = totalMensal * taxaEfetiva * 12
  const valorPontosCartao = pontosAno / 1000 * 35

  const custoPontosAnual = data.pontosK * plano.milheiro * 12
  const custoClube = plano.mensalidade * 12
  const valorPontosComprados = data.pontosK * 1000 * 12 * 0.08

  const econTotal = valorPontosCartao + valorPontosComprados
  const investimento = custoPontosAnual + custoClube
  const roiLiquido = econTotal - investimento

  const quarterBars = [3, 6, 9, 12].map(m => {
    const acum = (econTotal / 12) * m
    const invest = (investimento / 12) * m
    const balance = acum - invest
    const pct = Math.min(100, Math.round(acum / Math.max(econTotal, 1) * 100))
    const color = balance >= 0 ? '#2ecc71' : '#c9a84c'
    return { m, balance, pct, color }
  })

  return (
    <>
      <div className="section-tag">Resultado · Pessoa Física</div>
      <div className="section-title">ROI do seu cartão</div>
      <p className="section-desc">Com base nos seus gastos mensais, este é o potencial de retorno com a estratégia de pontos.</p>

      <div className="result-hero">
        <div className="headline">Valor gerado pelo cartão / Ano</div>
        <div className="big-number">{fmt(econTotal)}</div>
        <div className="sub">em pontos e resgates</div>
      </div>

      <div className="result-grid">
        <div className="result-card">
          <div className="rc-label">Pontos acumulados / Ano</div>
          <div className="rc-value text-gold">{Math.round(pontosAno).toLocaleString('pt-BR')}</div>
          <div className="rc-note">via gastos no cartão</div>
        </div>
        <div className="result-card">
          <div className="rc-label">Valor dos pontos / Ano</div>
          <div className="rc-value text-green">{fmt(valorPontosCartao)}</div>
          <div className="rc-note">a R$ 35/milheiro via resgate</div>
        </div>
        {investimento > 0 && <>
          <div className="result-card">
            <div className="rc-label">Custo do Clube / Ano</div>
            <div className="rc-value text-gold">{fmt(investimento)}</div>
            <div className="rc-note">mensalidade + pontos comprados</div>
          </div>
          <div className="result-card">
            <div className="rc-label">ROI Líquido / Ano</div>
            <div className="rc-value text-green">{fmt(roiLiquido)}</div>
            <div className="rc-note">economia menos investimento</div>
          </div>
        </>}
      </div>

      <div className="breakdown">
        <div className="breakdown-title">Detalhamento</div>
        <div className="breakdown-row">
          <div className="br-label"><i className="fa-solid fa-credit-card" /> Gasto atual no cartão / mês</div>
          <div className="br-values"><div className="br-saving">{fmt(data.gastoAtual)}</div></div>
        </div>
        <div className="breakdown-row">
          <div className="br-label"><i className="fa-solid fa-arrow-right-arrow-left" /> Migrado para o cartão / mês</div>
          <div className="br-values">
            <div className="br-saving">+ {fmt(data.gastoMigravel)}</div>
            <div className="br-pct">de {fmt(data.gastoForaCartao)} fora do cartão</div>
          </div>
        </div>
        <div className="breakdown-row">
          <div className="br-label"><i className="fa-solid fa-coins" /> Pontos do cartão / Ano</div>
          <div className="br-values">
            <div className="br-current">{Math.round(pontosAno).toLocaleString('pt-BR')} pts</div>
            <div className="br-saving">= {fmt(valorPontosCartao)}</div>
            <div className="br-pct">100% grátis</div>
          </div>
        </div>
        {data.pontosK > 0 && (
          <div className="breakdown-row">
            <div className="br-label"><i className="fa-solid fa-bag-shopping" /> Pontos comprados via Clube / Ano</div>
            <div className="br-values">
              <div className="br-current">{(data.pontosK * 1000 * 12).toLocaleString('pt-BR')} pts</div>
              <div className="br-saving">= {fmt(valorPontosComprados)}</div>
            </div>
          </div>
        )}
      </div>

      {investimento > 0 && (
        <div className="payback-bar-wrap">
          <div className="payback-bar-title">Acúmulo de Valor ao Longo do Ano</div>
          {quarterBars.map(({ m, balance, pct, color }) => (
            <div className="bar-row" key={m}>
              <div className="bar-header">
                <span className="bar-label">{m} meses</span>
                <span style={{ color, fontWeight: 700 }}>{balance >= 0 ? '+' : ''}{fmt(balance)}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cta-box">
        <div className="cta-text">
          <div className="cta-title">Cada mês sem o método é retorno perdido.</div>
          <div className="cta-desc">
            Cada real gasto fora do cartão certo é um ponto que poderia virar <strong>passagem, produto ou cashback</strong>.
          </div>
        </div>
        <button className="btn-cta" onClick={onRestart}>Refazer Simulação</button>
      </div>

      <div className="nav">
        <button className="btn btn-secondary" onClick={onBack}>← Revisar dados</button>
        <div />
      </div>
    </>
  )
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App() {
  const [tipo, setTipo] = useState(null)
  const [step, setStep] = useState(1)
  const [pfStep, setPfStep] = useState(1)

  const [s1, setS1] = useState({ fornecedores: 0, ti: 0, marketing: 0, aluguel: 0, seguros: 0, outros: 0 })
  const [s2, setS2] = useState({ nacionais: 0, internacionais: 0, classe: 0.75, hoteis: 0, transporte: 0, combustivel: 0 })
  const [s3, setS3] = useState({ eletro: 0, premios: 0, outros: 0, pontosK: 0, clube: 'nenhum' })
  const [pfData, setPfData] = useState({ gastoAtual: 0, gastoForaCartao: 0, gastoMigravel: 0, clube: 'nenhum', pontosK: 0 })
  const [ptsPorUSD, setPtsPorUSD] = useState(2)
  const [cambio, setCambio] = useState(5.20)

  const goTo = useCallback((n) => setStep(n), [])

  const restart = useCallback(() => {
    setTipo(null)
    setStep(1)
    setPfStep(1)
    setS1({ fornecedores: 0, ti: 0, marketing: 0, aluguel: 0, seguros: 0, outros: 0 })
    setS2({ nacionais: 0, internacionais: 0, classe: 0.75, hoteis: 0, transporte: 0, combustivel: 0 })
    setS3({ eletro: 0, premios: 0, outros: 0, pontosK: 0, clube: 'nenhum' })
    setPfData({ gastoAtual: 0, gastoForaCartao: 0, gastoMigravel: 0, clube: 'nenhum', pontosK: 0 })
  }, [])

  return (
    <>
      <div className="header">
        <div style={{ cursor: tipo ? 'pointer' : 'default' }} onClick={tipo ? restart : undefined}>
          <div className="logo-text">Calculadora <span>de</span> Pontos</div>
          <div className="logo-sub">ROI · Fidelização</div>
        </div>
      </div>

      <div className="container">
        {!tipo && <TipoSelector onSelect={setTipo} />}

        {tipo === 'pf' && pfStep === 1 && (
          <StepPF
            data={pfData} onChange={setPfData}
            ptsPorUSD={ptsPorUSD} cambio={cambio}
            onPtsChange={setPtsPorUSD} onCambioChange={setCambio}
            onNext={() => setPfStep(2)} onBack={() => setTipo(null)}
          />
        )}
        {tipo === 'pf' && pfStep === 2 && (
          <StepPFResult
            data={pfData} ptsPorUSD={ptsPorUSD} cambio={cambio}
            onBack={() => setPfStep(1)} onRestart={restart}
          />
        )}

        {tipo === 'pj' && (
          <>
            <StepProgress current={step} onGo={goTo} />
            {step === 1 && <Step1 data={s1} onChange={setS1} onNext={() => goTo(2)} onBack={() => setTipo(null)} ptsPorUSD={ptsPorUSD} cambio={cambio} onPtsChange={setPtsPorUSD} onCambioChange={setCambio} />}
            {step === 2 && <Step2 data={s2} onChange={setS2} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
            {step === 3 && <Step3 data={s3} onChange={setS3} onNext={() => goTo(4)} onBack={() => goTo(2)} />}
            {step === 4 && <Step4 s1={s1} s2={s2} s3={s3} ptsPorUSD={ptsPorUSD} cambio={cambio} onBack={() => goTo(3)} onRestart={restart} />}
          </>
        )}
      </div>
    </>
  )
}
