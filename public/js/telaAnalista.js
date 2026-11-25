const tela = { componente: "cpu", periodo: 24, dados: null }
const metricas = { cpu: "cpu", ram: "ram", flash: "flash" }

function escaparHtml(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere])
}

function numero(valor, casas = 1) {
    return valor == null || !Number.isFinite(Number(valor)) ? "—" : Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

function dataLocal(valor) {
    if (!valor) return "—"
    const data = new Date(valor)
    return Number.isFinite(data.getTime()) ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(data) : "—"
}

function horaLocal(valor) {
    if (!valor) return "—"
    const data = new Date(valor)
    return Number.isFinite(data.getTime()) ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(data) : "—"
}

function statusClasse(valor) {
    return ({ NORMAL: "normal", ATENCAO: "moderado", CRITICO: "critico", SEM_DADOS: "semDados" })[valor] || "semDados"
}

function nomeStatus(valor) {
    return ({ NORMAL: "Normal", ATENCAO: "Atenção", CRITICO: "Crítico", SEM_DADOS: "Sem dados" })[valor] || "Sem dados"
}

function montarIndicadores() {
    const { monitoramento: m, componentes: cadastro } = tela.dados
    const icones = { cpu: "bi-cpu", ram: "bi-memory", flash: "bi-hdd" }
    const cards = Object.entries(metricas).map(([chave, campo]) => {
        const componente = cadastro[chave] || {}
        const nivel = m ? m[`${campo}_nivel`] : "SEM_DADOS"
        const valor = m ? m[`${campo}_pct`] : null
        const delta = m ? m[`${campo}_delta_pp`] : null
        const limiteAtencao = m?.[`${campo}_limite_atencao`] ?? componente.limiteAtencao
        const limiteCritico = m?.[`${campo}_limite_critico`] ?? componente.limiteCritico
        const data = m?.[`${campo}_ts`]
        const previsaoDias = chave === "flash" ? m?.flash_dias_ate_atencao : null
        const previsao = previsaoDias == null ? "" : `<div class="indicadorPrevisao">Previsão: cerca de ${numero(previsaoDias, 0)} dias até ${numero(limiteAtencao, 0)}%</div>`
        const comparacao = delta == null ? "Variação indisponível" : `${delta > 0 ? "+" : "−"}${numero(Math.abs(delta))} p.p. ${chave === "flash" ? "ao dia anterior" : "na última hora"}`
        return `<div class="cartao">
            <div class="indicadorTopo"><span>Uso da ${chave === "flash" ? "Armazenamento" : chave.toUpperCase()}</span><span class="indicadorIcone ${statusClasse(nivel)}" aria-hidden="true"><i class="bi ${icones[chave]}"></i></span></div>
            <div class="indicadorValor ${statusClasse(nivel)}">${numero(valor)}${valor == null ? "" : "%"}</div>
            <div class="indicadorTexto"><span class="statusIndicador ${statusClasse(nivel)}">${nomeStatus(nivel)}</span> · Leitura às ${horaLocal(data)}</div>
            <div class="indicadorTexto limitesIndicador">Atenção: ${numero(limiteAtencao, 0)}% · Crítico: ${numero(limiteCritico, 0)}%</div>
            ${previsao}<div class="indicadorRodape"><div class="indicadorComparacao"><i class="bi bi-activity" aria-hidden="true"></i><strong>${comparacao}</strong></div></div>
        </div>`
    }).join("")

    const score = m?.health_score
    const estado = m?.estado_saude || "SEM_DADOS"
    const deltaSaude = m?.health_delta_pontos
    const cardSaude = `<div class="cartao cartaoSaude">
        <div class="indicadorTopo"><span>Saúde da Placa</span><span class="indicadorIcone ${statusClasse(estado)}" aria-hidden="true"><i class="bi bi-heart-pulse"></i></span></div>
        <div class="indicadorValor ${statusClasse(estado)}">${numero(score, 0)}${score == null ? "" : "<small>/100</small>"}</div>
        <div class="indicadorTexto"><span class="statusIndicador ${statusClasse(estado)}">${nomeStatus(estado)}</span> · Leitura às ${horaLocal(m?.ultima_amostra_utc)}</div>
        <div class="indicadorTexto limitesIndicador">Atenção: abaixo de ${numero(m?.health_limite_atencao, 0)} · Crítico: abaixo de ${numero(m?.health_limite_critico, 0)}</div>
        <div class="indicadorRodape"><div class="indicadorComparacao"><i class="bi bi-arrow-${deltaSaude != null && deltaSaude < 0 ? "down" : "up"}" aria-hidden="true"></i><strong>${deltaSaude == null ? "Variação indisponível" : `${deltaSaude > 0 ? "+" : "−"}${numero(Math.abs(deltaSaude), 0)} pts na última hora`}</strong></div>
        ${score == null ? "" : `<div class="barra"><div class="${statusClasse(estado)}Fundo" style="width:${Math.max(0, Math.min(100, score))}%"></div></div>`}</div>
    </div>`
    document.getElementById("indicadoresPlaca").innerHTML = cards + cardSaude
}

function diagnosticoSemDados() {
    const dados = tela.dados
    const d = dados.diagnosticoGold || {}
    const partes = []
    if (d.objetosNaPasta === 0) {
        partes.push(`Não há objetos Gold na pasta hostname=${dados.placa.hostname}. Confira se o hostname cadastrado no FMC corresponde ao hostname da pasta S3; os dados Gold são associados por hostname e número de série.`)
    } else if (d.arquivosMonitoramento === 0) {
        partes.push("A pasta Gold foi encontrada, mas não tem JSON de monitoramento da placa.")
    } else if (!dados.monitoramento && d.correspondenciasHostMonitoramento === 0) {
        partes.push("O hostname do cadastro não aparece nas linhas do JSON de monitoramento.")
    } else if (!dados.monitoramento && d.tipoCorrespondencia === "EXATA") {
        partes.push(`A série do cadastro (${dados.placa.serie}) não corresponde a uma placa única no monitoramento Gold.`)
    }
    if (d.arquivosSerieNoTotal > 0 && d.arquivosSerieRecentes === 0) {
        partes.push("Há arquivos de série, mas nenhum foi atualizado nas últimas 26 horas.")
    } else if (d.arquivosSerieNoTotal === 0) {
        partes.push("Não há arquivos Gold de série por minuto nessa pasta.")
    }
    if (d.tipoCorrespondencia && d.tipoCorrespondencia !== "EXATA") {
        partes.push(`A série foi associada por identidade única do hostname (${d.serieGold}).`)
    }
    return partes.join(" ")
}

function montarDetalhes() {
    const sessoes = tela.dados.monitoramento?.sessoes || []
    const sessao = [...sessoes].sort((a, b) => Date.parse(b.fim) - Date.parse(a.fim))[0]
    const el = document.getElementById("detalhesPlaca")
    if (!sessao) {
        el.innerHTML = '<div class="cartao detalhe"><summary>Dados da sessão</summary><p class="subtitulo">Nenhuma sessão disponível na coleta.</p></div>'
        return
    }
    const labels = { cpu: "CPU", ram: "RAM", flash: "Armazenamento" }
    el.setAttribute("aria-label", `Indicadores da sessão ${sessao.sessao_id}`)
    el.innerHTML = Object.entries(labels).map(([chave, nome]) => {
        const pico = sessao[`${chave}_pico`]
        return `<details class="cartao detalhe" open><summary><span>Detalhes de ${nome}</span><i class="bi bi-chevron-down" aria-hidden="true"></i></summary>
            <div class="detalheLista">
                <div class="detalhePico"><span>Pico da sessão<small>${horaLocal(sessao[`${chave}_ts_pico`])} · ${escaparHtml(sessao[`${chave}_fase_pico`] || "Fase indisponível")}</small></span><b>${numero(pico, 2)}${pico == null ? "" : "%"}</b></div>
                <div><span>Percentil 95</span><b>${numero(sessao[`${chave}_p95`], 2)}${sessao[`${chave}_p95`] == null ? "" : "%"}</b></div>
                <div><span>Tempo acima do limite crítico</span><b>${numero(sessao[`${chave}_minutos_acima_critico`])} min</b></div>
                <div><span>Variação do pico para sessão anterior</span><b>${sessao[`${chave}_delta_pico_pp`] == null ? "—" : `${numero(sessao[`${chave}_delta_pico_pp`])} p.p.`}</b></div>
            </div><small class="subtitulo">${dataLocal(sessao.inicio)} – ${dataLocal(sessao.fim)} · ${escaparHtml(sessao.sessao_id)}</small>
        </details>`
    }).join("")
}

function montarAlertas() {
    const inicio = Date.now() - tela.periodo * 60 * 60 * 1000
    const prioridade = { CRITICO: 0, ATENCAO: 1 }
    const alertas = tela.dados.alertas.filter(a => Date.parse(a.ts_abertura) >= inicio)
        .sort((a, b) => prioridade[b.maior_nivel] - prioridade[a.maior_nivel] || Date.parse(b.ts_abertura) - Date.parse(a.ts_abertura))
    document.getElementById("tituloAlertasPeriodo").textContent = `Alertas · últimas ${tela.periodo} ${tela.periodo === 1 ? "hora" : "horas"}`
    document.getElementById("alertasPlaca").innerHTML = alertas.length ? alertas.map(alerta => {
        const critico = alerta.maior_nivel === "CRITICO"
        const classe = critico ? "critico" : "moderado"
        const nome = ({ cpu_pct: "CPU", ram_pct: "RAM", flash_pct: "Armazenamento" })[alerta.metrica] || alerta.metrica
        return `<a class="alerta ${classe}" href="alertas.html"><div>${nome}: limite ${critico ? "crítico" : "de atenção"} atingido
            <small>Às ${dataLocal(alerta.ts_abertura)} · ${numero(alerta.valor_abertura_pct ?? alerta.valor)}% · ${alerta.em_aberto_apos_evento ? "Ativo na última coleta" : "Ocorrência encerrada"}</small>
            </div><span><i class="bi bi-chevron-right" aria-hidden="true"></i></span></a>`
    }).join("") : '<p class="subtitulo">Nenhum alerta no período selecionado.</p>'
}

function montarPontos(chave) {
    const campo = metricas[chave]
    const limite = Date.now() - tela.periodo * 60 * 60 * 1000
    const registros = tela.dados.serie.filter(p => Date.parse(p.ts) >= limite)
    const blocoMs = ({ 1: 60_000, 6: 5 * 60_000, 24: 15 * 60_000 })[tela.periodo]
    const blocos = new Map()
    registros.forEach(p => {
        const ts = Date.parse(p.ts)
        const chaveBloco = Math.floor(ts / blocoMs)
        const valor = p[`${campo}_pico`]
        if (valor == null || !Number.isFinite(Number(valor))) return
        const anterior = blocos.get(chaveBloco)
        if (!anterior || Number(valor) > anterior.valor) blocos.set(chaveBloco, { valor: Number(valor), ts, nivel: p[`${campo}_nivel`] })
    })
    return Array.from(blocos.values()).sort((a, b) => a.ts - b.ts)
}

function desenharGrafico(chave) {
    const svg = document.getElementById("graficoComponente")
    const pontos = montarPontos(chave)
    const componente = tela.dados.componentes[chave] || {}
    const monitoramento = tela.dados.monitoramento
    const campo = metricas[chave]
    const atencao = monitoramento?.[`${campo}_limite_atencao`] ?? componente.limiteAtencao
    const critico = monitoramento?.[`${campo}_limite_critico`] ?? componente.limiteCritico
    const inicio = Date.now() - tela.periodo * 60 * 60 * 1000
    const maxX = 602
    const x = indice => pontos.length < 2 ? 46 : 46 + indice * (maxX - 46) / (pontos.length - 1)
    const y = valor => 230 - valor * 2.2
    const valores = pontos.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ")
    const pico = pontos.length ? Math.max(...pontos.map(p => p.valor)) : null
    const indicePico = pontos.findIndex(p => p.valor === pico)
    const titulo = chave === "flash" ? "Armazenamento" : chave.toUpperCase()
    document.getElementById("descricaoPeriodoGrafico").textContent = `${tela.periodo}h · picos por intervalo · ${pontos.length} pontos com leitura`
    if (!pontos.length) {
        svg.innerHTML = `<title id="tituloGrafico">Uso de ${titulo}</title><desc id="descricaoGrafico">Sem leituras no período selecionado.</desc>
            ${[100, 75, 50, 25, 0].map(v => `<line x1="46" y1="${y(v)}" x2="602" y2="${y(v)}" stroke="#e5e7eb"/><text x="36" y="${y(v) + 4}" text-anchor="end">${v}%</text>`).join("")}
            <text x="324" y="125" text-anchor="middle">Sem leituras para este período</text>`
        return
    }
    const linhas = [100, 75, 50, 25, 0].map(v => `<line x1="46" y1="${y(v)}" x2="602" y2="${y(v)}" stroke="#e5e7eb"/><text x="36" y="${y(v) + 4}" text-anchor="end">${v}%</text>`).join("")
    const linhaLimite = (valor, nome, cor) => valor == null ? "" : `<line x1="46" y1="${y(valor)}" x2="602" y2="${y(valor)}" stroke="${cor}" stroke-width="1" stroke-dasharray="4 3"/><text x="52" y="${y(valor) - 6}" fill="${cor}">${nome} (${numero(valor, 0)}%)</text>`
    const rotulos = pontos.map((p, i) => i % Math.max(1, Math.ceil(pontos.length / 8)) === 0 || i === pontos.length - 1
        ? `<text x="${x(i)}" y="246" text-anchor="end" transform="rotate(-55 ${x(i)} 246)">${horaLocal(new Date(p.ts).toISOString())}</text>` : "").join("")
    svg.innerHTML = `<title id="tituloGrafico">Picos de uso de ${titulo} · ${tela.periodo} horas</title>
        <desc id="descricaoGrafico">${pontos.length} picos observados. Maior pico ${numero(pico, 2)}% às ${dataLocal(new Date(pontos[indicePico].ts).toISOString())}.</desc>
        ${linhas}<polyline fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${valores}"/>
        ${pontos.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.valor)}" r="1.8" fill="#4F46E5"><title>${numero(p.valor, 2)}% · ${dataLocal(new Date(p.ts).toISOString())} · ${p.nivel || "Nível indisponível"}</title></circle>`).join("")}
        ${linhaLimite(atencao, "Atenção", "#f97316")}${linhaLimite(critico, "Crítico", "#e11d48")}
        <circle cx="${x(indicePico)}" cy="${y(pico)}" r="3" fill="#4F46E5"/><text x="${x(indicePico)}" y="${y(pico) + (pico >= 85 ? 20 : -12)}" text-anchor="middle" fill="#1a1f5c" font-weight="700">${numero(pico, 2)}%</text>${rotulos}`
}

function iniciarTela(dados) {
    tela.dados = dados
    document.title = `AirPulse - ${dados.placa.nome}`
    document.querySelector("main h1").textContent = `Monitoramento de recursos · ${dados.placa.nome}`
    montarIndicadores()
    const diagnostico = diagnosticoSemDados()
    if (diagnostico) {
        const aviso = document.createElement("p")
        aviso.className = "subtitulo"
        aviso.style.gridColumn = "1 / -1"
        aviso.textContent = diagnostico
        document.getElementById("indicadoresPlaca").append(aviso)
    }
    montarDetalhes()
    montarAlertas()
    desenharGrafico(tela.componente)
    const botoes = document.querySelectorAll("#abasComponentes button")
    botoes.forEach(botao => botao.addEventListener("click", () => {
        botoes.forEach(item => { item.classList.toggle("ativa", item === botao); item.setAttribute("aria-pressed", String(item === botao)) })
        tela.componente = botao.dataset.componente
        desenharGrafico(tela.componente)
    }))
    const periodos = document.querySelectorAll(".periodosGrafico button")
    periodos.forEach(botao => botao.addEventListener("click", () => {
        tela.periodo = Number(botao.dataset.periodo)
        periodos.forEach(item => { item.classList.toggle("selecionado", item === botao); item.setAttribute("aria-pressed", String(item === botao)) })
        montarAlertas()
        desenharGrafico(tela.componente)
    }))
}

function carregarTelaAnalista() {
    if (!verificarSessao() || !podeAcessarPagina("telaAnalista.html")) return
    const idPlaca = new URLSearchParams(location.search).get("placa")
    if (!idPlaca || !/^\d+$/.test(idPlaca)) {
        document.getElementById("indicadoresPlaca").innerHTML = '<div class="cartao">Selecione uma placa na visão geral do analista.</div>'
        return
    }
    fetch(`/dashboardAnalista/placa/${encodeURIComponent(idPlaca)}/${sessionStorage.idUsuario}`)
        .then(resposta => resposta.json().catch(() => ({})).then(dados => {
            if (!resposta.ok) {
                const mensagem = dados.mensagem || `A API retornou HTTP ${resposta.status} sem uma mensagem válida. Confirme se a página está aberta pelo servidor AirPulse na porta 3333.`
                throw new Error(mensagem)
            }
            return dados
        }))
        .then(iniciarTela)
        .catch(erro => {
            const mensagem = document.createElement("div")
            mensagem.className = "cartao"
            mensagem.textContent = erro.message
            document.getElementById("indicadoresPlaca").replaceChildren(mensagem)
            console.error("Erro ao carregar detalhe da placa:", erro)
        })
}

carregarTelaAnalista()
