const idComputador = new URLSearchParams(window.location.search).get("idComputador")

const estadoTelaAnalista = { componente: "cpu", periodo: 24 }

function obterJanelaLeituras(componente) {
    const originais = obterLeiturasMinuto(componente)
    const inicio = Math.max(0, originais.length - estadoTelaAnalista.periodo * 60)
    return { inicio, leituras: originais.slice(inicio) }
}

function agruparPicosGrafico(componente) {
    const { inicio, leituras } = obterJanelaLeituras(componente)
    const intervalo = { 1: 1, 6: 5, 24: 15 }[estadoTelaAnalista.periodo]
    const pontos = []
    for (let indice = 0; indice < leituras.length; indice += intervalo) {
        const bloco = leituras.slice(indice, indice + intervalo)
        const valor = Math.max(...bloco)
        pontos.push({ valor, minuto: inicio + indice + bloco.indexOf(valor), inicio: inicio + indice, fim: inicio + indice + bloco.length - 1 })
    }
    return { pontos, intervalo, inicio, quantidadeLeituras: leituras.length }
}

function descreverPeriodo() {
    return estadoTelaAnalista.periodo === 1 ? "Última hora" : `Últimas ${estadoTelaAnalista.periodo} horas`
}

function calcularEstatisticas(leituras) {
    const media = leituras.reduce((total, valor) => total + valor, 0) / leituras.length
    const variancia = leituras.reduce((total, valor) => total + (valor - media) ** 2, 0) / leituras.length
    return { media, pico: Math.max(...leituras), desvioPadrao: Math.sqrt(variancia) }
}

function montarComparacao(variacao, periodo) {
    if (Math.abs(variacao) < 0.05) {
        return `<div class="indicadorComparacao"><i class="bi bi-arrow-right" aria-hidden="true"></i><strong>0,0 p.p.</strong><span>Em relação ${periodo}</span></div>`
    }
    const aumentou = variacao > 0
    return `<div class="indicadorComparacao">
        <i class="bi bi-graph-${aumentou ? "up-arrow" : "down-arrow"}" aria-hidden="true"></i>
        <strong>${aumentou ? "+" : "−"}${formatarNumero(Math.abs(variacao))} p.p.</strong>
        <span>Em relação ${periodo}</span>
    </div>`
}

function montarIndicadores() {
    const indicadoresComponentes = Object.values(dadosPlaca.componentes).map(componente => {
        const leituras = obterLeiturasMinuto(componente)
        const atual = leituras[leituras.length - 1]
        const status = obterStatus(atual, componente)
        const armazenamento = componente.usoDiaAnterior !== undefined
        const anterior = armazenamento ? componente.usoDiaAnterior : leituras[leituras.length - 61]
        const variacao = atual - anterior
        let previsao = ""

        if (armazenamento && atual < componente.limiteAtencao && variacao > 0) {
            const dias = Math.ceil((componente.limiteAtencao - atual) / variacao)
            previsao = `<div class="indicadorPrevisao" title="Estimativa considerando que o crescimento diário permaneça constante.">
                Previsão: cerca de ${dias} dias até ${componente.limiteAtencao}%
            </div>`
        }

        const icones = { cpu: "bi-cpu", ram: "bi-memory", disco: "bi-hdd" }
        return `<div class="cartao">
            <div class="indicadorTopo"><span>${componente.titulo}</span><span class="indicadorIcone ${status.classe}" aria-hidden="true"><i class="bi ${icones[componente.nome === "Armazenamento" ? "disco" : componente.nome.toLowerCase()]}"></i></span></div>
            <div class="indicadorValor ${status.classe}">${formatarNumero(atual)}%</div>
            <div class="indicadorTexto"><span class="statusIndicador ${status.classe}">${status.nome}</span> · Leitura às <time datetime="${formatarHora((leituras.length - 1) / 60)}">${formatarHora((leituras.length - 1) / 60)}</time></div>
            <div class="indicadorTexto limitesIndicador">Atenção: ${componente.limiteAtencao}% · Crítico: ${componente.limiteCritico}%</div>
            ${previsao}
            <div class="indicadorRodape">
            ${montarComparacao(variacao, armazenamento ? "ao dia anterior" : "à última hora")}
            </div>
        </div>`
    }).join("")

    const saude = dadosPlaca.saude
    const statusSaude = saude.atual < saude.limiteCritico
        ? { classe: "critico", nome: "Crítico" }
        : saude.atual < saude.limiteAtencao
            ? { classe: "moderado", nome: "Atenção" }
            : { classe: "normal", nome: "Normal" }
    const variacaoSaude = saude.atual - saude.anterior
    const comparacaoSaude = `${variacaoSaude < 0 ? "Diminuiu" : "Aumentou"} ${formatarNumero(Math.abs(variacaoSaude), 0)} pts em relação à última hora`
    const horarioSaude = formatarHora(horarioUltimaLeitura())
    const cartaoSaude = `<div class="cartao cartaoSaude">
        <div class="indicadorTopo"><span>Saúde da Placa</span><span class="indicadorIcone ${statusSaude.classe}" aria-hidden="true"><i class="bi bi-heart-pulse"></i></span></div>
        <div class="indicadorValor ${statusSaude.classe}">${formatarNumero(saude.atual, 0)}<small>/100</small></div>
        <div class="indicadorTexto"><span class="statusIndicador ${statusSaude.classe}">${statusSaude.nome}</span> · Leitura às <time datetime="${horarioSaude}">${horarioSaude}</time></div>
        <div class="indicadorTexto limitesIndicador">Atenção: abaixo de ${saude.limiteAtencao} · Crítico: abaixo de ${saude.limiteCritico}</div>
        <div class="indicadorRodape">
            <div class="indicadorComparacao"><i class="bi bi-arrow-${variacaoSaude < 0 ? "down" : "up"}" aria-hidden="true"></i><strong>${comparacaoSaude}</strong></div>
            <div class="barra"><div class="${statusSaude.classe}Fundo" style="width:${saude.atual}%"></div></div>
        </div>
    </div>`
    document.getElementById("indicadoresPlaca").innerHTML = indicadoresComponentes + cartaoSaude
}

function montarDetalhes() {
    const pouso = [...dadosPlaca.ciclosVoo].reverse().find(ciclo => ciclo.fase === "Pouso")
    const decolagem = [...dadosPlaca.ciclosVoo].reverse().find(ciclo => ciclo.fase === "Decolagem" && ciclo.inicio <= pouso.inicio)
    document.getElementById("detalhesPlaca").setAttribute("aria-label", `Estatísticas do último voo, das ${formatarHora(decolagem.inicio)} às ${formatarHora(pouso.fim + 59 / 60)}`)
    document.getElementById("detalhesPlaca").innerHTML = Object.values(dadosPlaca.componentes).map(componente => {
        const leiturasVoo = obterLeiturasMinuto(componente).slice(decolagem.inicio * 60, (pouso.fim + 1) * 60)
        const estatisticas = calcularEstatisticas(leiturasVoo)
        const detalhes = componente.detalhesVoo || {
            pico: estatisticas.pico,
            horarioPico: formatarHora(decolagem.inicio + leiturasVoo.indexOf(estatisticas.pico) / 60),
            fasePico: "Último voo",
            percentil95: [...leiturasVoo].sort((a, b) => a - b)[Math.ceil(leiturasVoo.length * .95) - 1],
            minutosAcimaCritico: leiturasVoo.filter(valor => valor >= componente.limiteCritico).length
        }
        return `<details class="cartao detalhe" open>
            <summary><span>${componente.detalhe}</span><i class="bi bi-chevron-down" aria-hidden="true"></i></summary>
            <div class="detalheLista">
                <div class="detalhePico"><span>Pico do último voo<small>às ${detalhes.horarioPico} · ${detalhes.fasePico}</small></span><b>${formatarNumero(detalhes.pico, 2)}%</b></div>
                <div><span>Percentil 95 do último voo</span><b>${formatarNumero(detalhes.percentil95, 2)}%</b></div>
                <div><span>Tempo acima do limite crítico</span><b>${detalhes.minutosAcimaCritico} min</b></div>
            </div>
        </details>`
    }).join("")
}

function montarAlertas() {
    const inicio = obterJanelaLeituras(dadosPlaca.componentes.cpu).inicio
    const prioridadeSeveridade = { critico: 0, moderado: 1 }
    const alertas = listarAlertasPlaca()
        .filter(alerta => alerta.minuto >= inicio)
        .sort((a, b) => prioridadeSeveridade[a.status.classe] - prioridadeSeveridade[b.status.classe] || b.minuto - a.minuto)
    document.getElementById("tituloAlertasPeriodo").textContent = `Alertas · ${descreverPeriodo()}`
    document.getElementById("alertasPlaca").innerHTML = alertas.length ? alertas.map(alerta => `
        <a class="alerta ${alerta.status.classe}" href="alertas.html">
            <div>${alerta.componente.nome}: limite ${alerta.status.classe === "critico" ? "crítico" : "de atenção"} atingido
                <small>Às ${formatarHora(alerta.hora)} · ${formatarNumero(alerta.valor)}% · ${alerta.ativo ? "Ativo na última coleta" : "Ocorrência encerrada"}</small>
            </div><span><i class="bi bi-chevron-right" aria-hidden="true"></i></span>
        </a>`).join("") : '<p class="subtitulo">Nenhum limite atingido no período selecionado.</p>'
}

function desenharGrafico(chave) {
    const componente = dadosPlaca.componentes[chave]
    const grafico = document.getElementById("graficoComponente")
    const { pontos, intervalo, inicio, quantidadeLeituras } = agruparPicosGrafico(componente)
    const horizonteHoras = 3
    const pontosPrevistos = 12
    const totalIntervalos = Math.max(1, pontos.length - 1 + pontosPrevistos)
    const x = indice => Number((46 + indice * (556 / totalIntervalos)).toFixed(2))
    const y = valor => Number((230 - valor * 2.2).toFixed(2))
    const coordenadas = pontos.map((ponto, indice) => `${x(indice)},${y(ponto.valor)}`).join(" ")
    const pico = Math.max(...pontos.map(ponto => ponto.valor))
    const indicePico = pontos.findIndex(ponto => ponto.valor === pico)
    const minutoPico = pontos[indicePico].minuto
    const fim = inicio + quantidadeLeituras - 1
    const alinhamentoPico = indicePico === 0 ? "start" : indicePico === pontos.length - 1 ? "end" : "middle"
    const agrupamento = intervalo === 1 ? "uma leitura por minuto" : `pico de cada ${intervalo} minutos`
    const passoRotulos = estadoTelaAnalista.periodo === 24 ? 60 / intervalo : { 1: 5, 6: 6 }[estadoTelaAnalista.periodo]
    const atual = pontos[pontos.length - 1].valor
    const previsoes = Array.from({ length: pontosPrevistos }, (_, indice) => {
        const horasAdiante = (indice + 1) * horizonteHoras / pontosPrevistos
        let valor
        if (componente.usoDiaAnterior !== undefined) {
            valor = atual + ((componente.leituras[23] - componente.leituras[0]) / 23) * horasAdiante
        } else {
            const horaInteira = Math.floor(horasAdiante)
            const fracao = horasAdiante - horaInteira
            const base = horaInteira === 0 ? atual : componente.leituras[(horaInteira + 23) % 24]
            const destino = componente.leituras[(horaInteira + 24) % 24]
            valor = base + (destino - base) * fracao
        }
        return { valor: Math.max(0, Math.min(100, valor)), horasAdiante }
    })
    const coordenadasPrevistas = [`${x(pontos.length - 1)},${y(atual)}`, ...previsoes.map((ponto, indice) => `${x(pontos.length + indice)},${y(ponto.valor)}`)].join(" ")
    const xPrevisao = x(pontos.length - 1)
    const xFimPrevisao = x(pontos.length - 1 + pontosPrevistos)
    const superior = previsoes.map((ponto, indice) => `${x(pontos.length + indice)},${y(Math.min(100, ponto.valor + 4.5 * ponto.horasAdiante))}`)
    const inferior = previsoes.map((ponto, indice) => `${x(pontos.length + indice)},${y(Math.max(0, ponto.valor - 4.5 * ponto.horasAdiante))}`).reverse()
    document.getElementById("descricaoPeriodoGrafico").textContent = `${descreverPeriodo()} · ${formatarHora(inicio / 60)}–${formatarHora(fim / 60)} · ${pontos.length} pontos · ${agrupamento}`

    grafico.innerHTML = `<title id="tituloGrafico">Uso de ${componente.nome} · ${descreverPeriodo()}</title>
        <desc id="descricaoGrafico">${quantidadeLeituras} leituras reais por minuto, exibidas em ${pontos.length} pontos. Previsão para as próximas ${horizonteHoras} horas com faixa de incerteza. Atenção em ${componente.limiteAtencao}% e crítico em ${componente.limiteCritico}%. Pico de ${formatarNumero(pico, 2)}% às ${formatarHora(minutoPico / 60)}.</desc>
        <rect x="${xPrevisao}" y="10" width="${xFimPrevisao - xPrevisao}" height="220" fill="#4F46E5" opacity=".055" />
        ${[100, 75, 50, 25, 0].map(valor => `
            <line x1="46" y1="${y(valor)}" x2="${xFimPrevisao}" y2="${y(valor)}" stroke="#e5e7eb" />
            <text x="36" y="${y(valor) + 4}" text-anchor="end">${valor}%</text>`).join("")}
        <polyline fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${coordenadas}" />
        ${pontos.map((ponto, indice) => `<circle cx="${x(indice)}" cy="${y(ponto.valor)}" r="1.6" fill="#4F46E5" data-minuto="${ponto.minuto}"><title>${intervalo === 1 ? "Leitura" : "Pico"}: ${formatarNumero(ponto.valor, 2)}% às ${formatarHora(ponto.minuto / 60)}${intervalo === 1 ? "" : ` · Intervalo ${formatarHora(ponto.inicio / 60)}–${formatarHora(ponto.fim / 60)}`}</title></circle>`).join("")}
        <polygon points="${superior.concat(inferior).join(" ")}" fill="#4F46E5" opacity=".14" />
        <polyline fill="none" stroke="#4F46E5" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round" points="${coordenadasPrevistas}" />
        ${previsoes.map((ponto, indice) => `<circle cx="${x(pontos.length + indice)}" cy="${y(ponto.valor)}" r="1.7" fill="#fff" stroke="#4F46E5"><title>Previsão em ${formatarNumero(ponto.horasAdiante, 2)} h: ${formatarNumero(ponto.valor, 2)}%</title></circle>`).join("")}
        <line x1="${xPrevisao}" y1="${y(100)}" x2="${xPrevisao}" y2="${y(0)}" stroke="#818cf8" stroke-dasharray="2 3" />
        <text x="${xFimPrevisao}" y="12" text-anchor="end" fill="#4F46E5" font-weight="700">Previsão · próximas ${horizonteHoras} horas</text>
        <line x1="46" y1="${y(componente.limiteAtencao)}" x2="${xFimPrevisao}" y2="${y(componente.limiteAtencao)}" stroke="#f97316" stroke-width="1" stroke-dasharray="4 3" />
        <text x="52" y="${y(componente.limiteAtencao) - 6}" fill="#f97316">Atenção (${componente.limiteAtencao}%)</text>
        <line x1="46" y1="${y(componente.limiteCritico)}" x2="${xFimPrevisao}" y2="${y(componente.limiteCritico)}" stroke="#e11d48" stroke-width="1" stroke-dasharray="4 3" />
        <text x="52" y="${y(componente.limiteCritico) - 6}" fill="#e11d48">Crítico (${componente.limiteCritico}%)</text>
        <circle cx="${x(indicePico)}" cy="${y(pico)}" r="3" fill="#4F46E5" />
        <text x="${x(indicePico)}" y="${y(pico) + (pico >= 85 ? 20 : -12)}" text-anchor="${alinhamentoPico}" fill="#1a1f5c" font-weight="700">${formatarNumero(pico, 2)}% · ${formatarHora(minutoPico / 60)}</text>
        ${pontos.map((ponto, indice) => indice % passoRotulos === 0 || (estadoTelaAnalista.periodo !== 24 && indice === pontos.length - 1)
        ? `<text x="${x(indice)}" y="246" text-anchor="end" transform="rotate(-55 ${x(indice)} 246)">${formatarHora((estadoTelaAnalista.periodo !== 24 && indice === pontos.length - 1 ? ponto.fim : ponto.inicio) / 60)}</text>` : "").join("")}
        ${[1, 2, 3].map(hora => {
            const horaPrevista = (Math.floor(fim / 60) + hora) % 24
            const indicePrevisto = pontos.length - 1 + hora * 4
            return `<text x="${x(indicePrevisto)}" y="246" text-anchor="end" transform="rotate(-55 ${x(indicePrevisto)} 246)" fill="#4F46E5">${String(horaPrevista).padStart(2, "0")}:00</text>`
        }).join("")}`
}

function inicializarTelaAnalista() {
     if (!verificarSessao() || !podeAcessarPagina("telaAnalista.html")) return
    const linkHistorico = document.querySelector(".btnHistoricoAlertas")
    if (idComputador) linkHistorico.href = `alertas.html?idComputador=${idComputador}`
    montarIndicadores()
    montarIndicadores()
    montarDetalhes()
    montarAlertas()
    desenharGrafico("cpu")

    const botoes = document.querySelectorAll("#abasComponentes button")
    for (const botao of botoes) {
        botao.addEventListener("click", () => {
            for (const item of botoes) {
                const ativo = item === botao
                item.classList.toggle("ativa", ativo)
                item.setAttribute("aria-pressed", String(ativo))
            }
            estadoTelaAnalista.componente = botao.dataset.componente
            desenharGrafico(estadoTelaAnalista.componente)
        })
    }

    const periodos = document.querySelectorAll(".periodosGrafico button")
    for (const botao of periodos) {
        botao.addEventListener("click", () => {
            estadoTelaAnalista.periodo = Number(botao.dataset.periodo)
            for (const item of periodos) {
                const ativo = item === botao
                item.classList.toggle("selecionado", ativo)
                item.setAttribute("aria-pressed", String(ativo))
            }
            montarAlertas()
            desenharGrafico(estadoTelaAnalista.componente)
        })
    }
}

inicializarTelaAnalista()
