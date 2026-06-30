import { useState, useCallback, useRef, useEffect } from 'react'

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => 'R$ ' + Math.round(n).toLocaleString('pt-BR')


// ─── NumInput ────────────────────────────────────────────────────────────────
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

// ─── TabBar ──────────────────────────────────────────────────────────────────
function TabBar({ tipo, onChange }) {
  return (
    <div className="tab-bar">
      <button className={`tab-btn${tipo === 'pf' ? ' active' : ''}`} onClick={() => onChange('pf')}>
        <i className="fa-solid fa-user" /> Pessoa Física
      </button>
      <button className={`tab-btn${tipo === 'pj' ? ' active' : ''}`} onClick={() => onChange('pj')}>
        <i className="fa-solid fa-building" /> Pessoa Jurídica
      </button>
    </div>
  )
}


// ─── DecimalInput ─────────────────────────────────────────────────────────────
function DecimalInput({ label, hint, value, onChange, fallback, prefix }) {
  const [raw, setRaw] = useState(String(value))
  const [focused, setFocused] = useState(false)

  // keep raw in sync when parent changes (e.g. on restart) but not while user is typing
  useEffect(() => {
    if (!focused) setRaw(String(value))
  }, [value, focused])

  const handleChange = (e) => {
    const s = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '')
    setRaw(s)
    const n = parseFloat(s)
    if (!isNaN(n) && n >= 0) onChange(n)
  }

  const handleBlur = () => {
    setFocused(false)
    const n = parseFloat(raw)
    if (isNaN(n) || n < 0) {
      setRaw(String(fallback))
      onChange(fallback)
    } else {
      setRaw(String(n))
    }
  }

  return (
    <div className="input-group">
      <div className="input-label">{label}{hint && <span className="input-hint">{hint}</span>}</div>
      <div className="input-wrap">
        {prefix && <span className="prefix">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={raw}
          style={!prefix ? { paddingLeft: 12 } : undefined}
          onFocus={() => setFocused(true)}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </div>
    </div>
  )
}

// ─── PtsCambioRow ────────────────────────────────────────────────────────────
function PtsCambioRow({ ptsPorUSD, cambio, valorPorPonto, onPtsChange, onCambioChange, onValorChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
      <DecimalInput label="Pontuação do cartão" hint=" pts/US$" value={ptsPorUSD} fallback={2} onChange={onPtsChange} />
      <DecimalInput label="Câmbio atual" hint=" R$/US$" value={cambio} fallback={5.2} onChange={onCambioChange} prefix="R$" />
      <DecimalInput label="Valor do ponto" hint=" R$/pt" value={valorPorPonto} fallback={0} onChange={onValorChange} prefix="R$" />
    </div>
  )
}

// ─── STEP PF ─────────────────────────────────────────────────────────────────
function StepPF({ data, onChange, ptsPorUSD, cambio, valorPorPonto, onPtsChange, onCambioChange, onValorChange, onNext }) {
  const totalElegivel = data.gastoAtual + data.gastoMigravel
  const taxaEfetiva = cambio > 0 ? ptsPorUSD / cambio : 0
  const pontosMes = Math.round(totalElegivel * taxaEfetiva)
  const retornoMes = pontosMes * valorPorPonto

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
          <NumInput label="Gasto mensal atual com cartão de crédito" hint="média mensal"
            value={data.gastoAtual} onChange={v => onChange({ ...data, gastoAtual: v })} />
        </div>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-money-bill-wave" /></span>
            Gasto fora do cartão
          </div>
          <NumInput label="Demais gastos mensais (débito, dinheiro, pix)" hint="total sem cartão"
            value={data.gastoForaCartao} onChange={v => onChange({ ...data, gastoForaCartao: v })} />
          <NumInput label="Quanto pode ser feito na internet" hint="valor mensal"
            value={data.gastoMigravel} onChange={v => onChange({ ...data, gastoMigravel: v })} />
        </div>
      </div>

      <PtsCambioRow ptsPorUSD={ptsPorUSD} cambio={cambio} valorPorPonto={valorPorPonto} onPtsChange={onPtsChange} onCambioChange={onCambioChange} onValorChange={onValorChange} />

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-label">
          <span className="icon"><i className="fa-solid fa-chart-line" /></span>
          Potencial mensal
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div className="input-label">Total elegível no cartão</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{fmt(totalElegivel)}</div>
            <div className="input-hint" style={{ marginTop: 4 }}>{fmt(data.gastoAtual)} atual + {fmt(data.gastoMigravel)} migrado</div>
          </div>
          <div>
            <div className="input-label">Pontos gerados/mês</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{pontosMes.toLocaleString('pt-BR')} pts</div>
            <div className="input-hint" style={{ marginTop: 4 }}>{fmt(totalElegivel)} ÷ R${cambio} × {ptsPorUSD}</div>
          </div>
          <div>
            <div className="input-label">Retorno estimado/mês</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{fmt(retornoMes)}</div>
            <div className="input-hint" style={{ marginTop: 4 }}>{pontosMes.toLocaleString('pt-BR')} pts × R${valorPorPonto}/pt</div>
          </div>
        </div>
      </div>

      <div className="nav">
        <div />
        <button className="btn btn-primary" onClick={onNext}>Ver Resultado →</button>
      </div>
    </>
  )
}

// ─── STEP PF RESULT ──────────────────────────────────────────────────────────
function StepPFResult({ data, ptsPorUSD, cambio, valorPorPonto, onBack, onRestart }) {
  const taxaEfetiva = cambio > 0 ? ptsPorUSD / cambio : 0
  const totalMensal = data.gastoAtual + data.gastoMigravel
  const pontosAno = totalMensal * taxaEfetiva * 12
  const valorPontosCartao = pontosAno * valorPorPonto
  const econTotal = valorPontosCartao

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
          <div className="rc-note">R$ {valorPorPonto}/pt × {Math.round(pontosAno).toLocaleString('pt-BR')} pts</div>
        </div>
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
      </div>

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

// ─── STEP PJ ─────────────────────────────────────────────────────────────────
function StepPJ({ data, onChange, ptsPorUSD, cambio, valorPorPonto, onPtsChange, onCambioChange, onValorChange, onNext }) {
  const totalElegivel = data.gastoAtual + data.gastoMigravel
  const taxaEfetiva = cambio > 0 ? ptsPorUSD / cambio : 0
  const pontosMes = Math.round(totalElegivel * taxaEfetiva)
  const retornoMes = pontosMes * valorPorPonto
  const econViagens = data.gastoViagens * 0.75

  return (
    <>
      <div className="section-tag">Pessoa Jurídica</div>
      <div className="section-title">Gastos da Empresa</div>
      <p className="section-desc">
        Mapeamos o que a empresa já paga no cartão e o que ainda paga fora — para descobrir quanto pode ser migrado e gerar pontos corporativos.
      </p>

      <div className="info-box">
        <strong>Princípio:</strong> A empresa já tem esses custos. Direcionar para o cartão certo não cria despesa nova — gera pontos que podem valer passagens e produtos com até 90% de desconto.
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-credit-card" /></span>
            Gasto no cartão corporativo
          </div>
          <NumInput label="Gasto mensal com cartão corporativo" hint="média mensal"
            value={data.gastoAtual} onChange={v => onChange({ ...data, gastoAtual: v })} />
        </div>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-money-bill-wave" /></span>
            Gastos fora do cartão
          </div>
          <NumInput label="Gastos mensais pagáveis fora do cartão" hint="fornecedores, serviços"
            value={data.gastoForaCartao} onChange={v => onChange({ ...data, gastoForaCartao: v })} />
          <NumInput label="Desses gastos, quanto pode ir pro cartão" hint="valor mensal"
            value={data.gastoMigravel} onChange={v => onChange({ ...data, gastoMigravel: v })} />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-plane" /></span>
            Viagens corporativas
          </div>
          <NumInput label="Gasto anual com passagens, hotéis e transporte" hint="total anual"
            value={data.gastoViagens} onChange={v => onChange({ ...data, gastoViagens: v })} />
        </div>
        <div className="card">
          <div className="card-label">
            <span className="icon"><i className="fa-solid fa-chart-line" /></span>
            Potencial estimado
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="input-label">Total elegível no cartão / mês</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{fmt(totalElegivel)}</div>
            <div className="input-hint" style={{ marginTop: 4 }}>{fmt(data.gastoAtual)} atual + {fmt(data.gastoMigravel)} migrado</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="input-label">Pontos gerados / mês</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{pontosMes.toLocaleString('pt-BR')} pts</div>
            <div className="input-hint" style={{ marginTop: 4 }}>{fmt(totalElegivel)} ÷ R${cambio} × {ptsPorUSD}</div>
          </div>
          <div style={{ marginBottom: econViagens > 0 ? 16 : 0 }}>
            <div className="input-label">Retorno estimado / mês</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{fmt(retornoMes)}</div>
            <div className="input-hint" style={{ marginTop: 4 }}>{pontosMes.toLocaleString('pt-BR')} pts × R${valorPorPonto}/pt</div>
          </div>
          {econViagens > 0 && (
            <div>
              <div className="input-label">Economia em viagens / ano</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{fmt(econViagens)}</div>
              <div className="input-hint" style={{ marginTop: 4 }}>~75% de economia média usando pontos</div>
            </div>
          )}
        </div>
      </div>

      <PtsCambioRow ptsPorUSD={ptsPorUSD} cambio={cambio} valorPorPonto={valorPorPonto} onPtsChange={onPtsChange} onCambioChange={onCambioChange} onValorChange={onValorChange} />

      <div className="nav">
        <div />
        <button className="btn btn-primary" onClick={onNext}>Ver Resultado →</button>
      </div>
    </>
  )
}

// ─── STEP PJ RESULT ──────────────────────────────────────────────────────────
function StepPJResult({ data, ptsPorUSD, cambio, valorPorPonto, onBack, onRestart }) {
  const taxaEfetiva = cambio > 0 ? ptsPorUSD / cambio : 0
  const totalMensal = data.gastoAtual + data.gastoMigravel
  const pontosAno = totalMensal * taxaEfetiva * 12
  const valorPontosCartao = pontosAno * valorPorPonto
  const econViagens = data.gastoViagens * 0.75
  const econTotal = valorPontosCartao + econViagens

  return (
    <>
      <div className="section-tag">Resultado · Pessoa Jurídica</div>
      <div className="section-title">ROI da empresa</div>
      <p className="section-desc">Com base nos gastos informados, este é o potencial de retorno com a estratégia de pontos.</p>

      <div className="result-hero">
        <div className="headline">Valor gerado / Ano</div>
        <div className="big-number">{fmt(econTotal)}</div>
        <div className="sub">em pontos e economia em viagens</div>
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
          <div className="rc-note">R$ {valorPorPonto}/pt × {Math.round(pontosAno).toLocaleString('pt-BR')} pts</div>
        </div>
        {econViagens > 0 && (
          <div className="result-card">
            <div className="rc-label">Economia em viagens / Ano</div>
            <div className="rc-value text-green">{fmt(econViagens)}</div>
            <div className="rc-note">~75% de economia média usando pontos</div>
          </div>
        )}
      </div>

      <div className="breakdown">
        <div className="breakdown-title">Detalhamento</div>
        <div className="breakdown-row">
          <div className="br-label"><i className="fa-solid fa-credit-card" /> Gasto no cartão / mês</div>
          <div className="br-values"><div className="br-saving">{fmt(data.gastoAtual)}</div></div>
        </div>
        <div className="breakdown-row">
          <div className="br-label"><i className="fa-solid fa-arrow-right-arrow-left" /> Migrado para o cartão / mês</div>
          <div className="br-values">
            <div className="br-saving">+ {fmt(data.gastoMigravel)}</div>
            <div className="br-pct">de {fmt(data.gastoForaCartao)} fora</div>
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
        {econViagens > 0 && (
          <div className="breakdown-row">
            <div className="br-label"><i className="fa-solid fa-plane" /> Viagens corporativas / Ano</div>
            <div className="br-values">
              <div className="br-current">{fmt(data.gastoViagens)}</div>
              <div className="br-saving">- {fmt(econViagens)}</div>
              <div className="br-pct">~75% eco.</div>
            </div>
          </div>
        )}
      </div>

      <div className="cta-box">
        <div className="cta-text">
          <div className="cta-title">Cada mês sem o método é economia perdida.</div>
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
  const [tipo, setTipo] = useState('pf')
  const [pfStep, setPfStep] = useState(1)
  const [pjStep, setPjStep] = useState(1)

  const [pfData, setPfData] = useState({ gastoAtual: 0, gastoForaCartao: 0, gastoMigravel: 0 })
  const [pjData, setPjData] = useState({ gastoAtual: 0, gastoForaCartao: 0, gastoMigravel: 0, gastoViagens: 0 })
  const [ptsPorUSD, setPtsPorUSD] = useState(2)
  const [cambio, setCambio] = useState(5.20)
  const [valorPorPonto, setValorPorPonto] = useState(0)

  const switchTipo = useCallback((t) => {
    setTipo(t)
    setPfStep(1)
    setPjStep(1)
  }, [])

  const restart = useCallback(() => {
    setPfStep(1)
    setPjStep(1)
    setPfData({ gastoAtual: 0, gastoForaCartao: 0, gastoMigravel: 0 })
    setPjData({ gastoAtual: 0, gastoForaCartao: 0, gastoMigravel: 0, gastoViagens: 0 })
  }, [])

  return (
    <>
      <div className="header">
        <div style={{ cursor: 'pointer' }} onClick={restart}>
          <div className="logo-text">Calculadora <span>de</span> Pontos</div>
          <div className="logo-sub">ROI · Fidelização</div>
        </div>
      </div>

      <div className="container">
        <TabBar tipo={tipo} onChange={switchTipo} />

        {tipo === 'pf' && pfStep === 1 && (
          <StepPF
            data={pfData} onChange={setPfData}
            ptsPorUSD={ptsPorUSD} cambio={cambio} valorPorPonto={valorPorPonto}
            onPtsChange={setPtsPorUSD} onCambioChange={setCambio} onValorChange={setValorPorPonto}
            onNext={() => setPfStep(2)}
          />
        )}
        {tipo === 'pf' && pfStep === 2 && (
          <StepPFResult
            data={pfData} ptsPorUSD={ptsPorUSD} cambio={cambio} valorPorPonto={valorPorPonto}
            onBack={() => setPfStep(1)} onRestart={restart}
          />
        )}

        {tipo === 'pj' && pjStep === 1 && (
          <StepPJ
            data={pjData} onChange={setPjData}
            ptsPorUSD={ptsPorUSD} cambio={cambio} valorPorPonto={valorPorPonto}
            onPtsChange={setPtsPorUSD} onCambioChange={setCambio} onValorChange={setValorPorPonto}
            onNext={() => setPjStep(2)}
          />
        )}
        {tipo === 'pj' && pjStep === 2 && (
          <StepPJResult
            data={pjData} ptsPorUSD={ptsPorUSD} cambio={cambio} valorPorPonto={valorPorPonto}
            onBack={() => setPjStep(1)} onRestart={restart}
          />
        )}
      </div>
    </>
  )
}
