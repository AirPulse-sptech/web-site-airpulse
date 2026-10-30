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
        return `<div class="indicadorTexto">Sem variação em relação ${periodo}</div>`
    }
    const aumentou = variacao > 0
    return `<div class="indicadorTexto ${aumentou ? "moderado" : "normal"}">
        <i class="bi bi-arrow-${aumentou ? "up" : "down"}" aria-hidden="true"></i>
        ${aumentou ? "Aumentou" : "Diminuiu"} ${formatarNumero(Math.abs(variacao))} p.p. em relação ${periodo}
    </div>`
}

function montarIndicadores() {
    document.getElementById("indicadoresPlaca").innerHTML = Object.values(dadosPlaca.componentes).map(componente => {
        const leituras = obterLeiturasMinuto(componente)
        const atual = leituras[leituras.length - 1]
        const status = obterStatus(atual, componente)
        const armazenamento = componente.usoDiaAnterior !== undefined
        const anterior = armazenamento ? componente.usoDiaAnterior : leituras[leituras.length - 61]
        const variacao = atual - anterior
        let previsao = ""

        if (armazenamento && atual < componente.limiteAtencao && variacao > 0) {
            const dias = Math.ceil((componente.limiteAtencao - atual) / variacao)
            previsao = `<div class="indicadorTexto moderado" title="Estimativa considerando que o crescimento diário permaneça constante.">
                Nesse ritmo, cerca de ${dias} dias até o limite de atenção de ${componente.limiteAtencao}%
            </div>`
        }

        return `<div class="cartao">
            <div class="indicadorTopo"><span>${componente.titulo}</span><span class="selo ${status.classe}">${status.nome}</span></div>
            <div class="indicadorValor ${status.classe}">${formatarNumero(atual)}%</div>
            <div class="indicadorTexto">Última leitura às <time datetime="${formatarHora((leituras.length - 1) / 60)}">${formatarHora((leituras.length - 1) / 60)}</time></div>
            <div class="indicadorTexto">Atenção: ${componente.limiteAtencao}% · Crítico: ${componente.limiteCritico}%</div>
            ${montarComparacao(variacao, armazenamento ? "ao dia anterior" : "à última hora")}
            ${previsao}
            <div class="barra"><div class="${status.classe}Fundo" style="width:${atual}%"></div></div>
        </div>`
    }).join("")
}

function montarDetalhes() {
    const pouso = [...dadosPlaca.ciclosVoo].reverse().find(ciclo => ciclo.fase === "Pouso")
    const decolagem = [...dadosPlaca.ciclosVoo].reverse().find(ciclo => ciclo.fase === "Decolagem" && ciclo.inicio <= pouso.inicio)
    document.getElementById("detalhesPlaca").setAttribute("aria-label", `Estatísticas do último voo, das ${formatarHora(decolagem.inicio)} às ${formatarHora(pouso.fim + 59 / 60)}`)
    document.getElementById("detalhesPlaca").innerHTML = Object.values(dadosPlaca.componentes).map(componente => {
        const estatisticas = calcularEstatisticas(obterLeiturasMinuto(componente).slice(decolagem.inicio * 60, (pouso.fim + 1) * 60))
        return `<details class="cartao detalhe">
            <summary><span>${componente.detalhe}</span><span>⌄</span></summary>
            <div class="detalheLista">
                <div><span>Pico do último voo</span><b>${formatarNumero(estatisticas.pico, 2)}%</b></div>
                <div><span>Desvio padrão do último voo</span><b>${formatarNumero(estatisticas.desvioPadrao, 2)} p.p.</b></div>
                <div><span>Média do último voo</span><b>${formatarNumero(estatisticas.media, 2)}%</b></div>
            </div>
        </details>`
    }).join("")
}

function montarAlertas() {
    const inicio = obterJanelaLeituras(dadosPlaca.componentes.cpu).inicio
    const alertas = listarAlertasPlaca().filter(alerta => alerta.minuto >= inicio)
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
    const x = indice => Number((46 + indice * (556 / Math.max(1, pontos.length - 1))).toFixed(2))
    const y = valor => Number((230 - valor * 2.2).toFixed(2))
    const coordenadas = pontos.map((ponto, indice) => `${x(indice)},${y(ponto.valor)}`).join(" ")
    const pico = Math.max(...pontos.map(ponto => ponto.valor))
    const indicePico = pontos.findIndex(ponto => ponto.valor === pico)
    const minutoPico = pontos[indicePico].minuto
    const fim = inicio + quantidadeLeituras - 1
    const alinhamentoPico = indicePico === 0 ? "start" : indicePico === pontos.length - 1 ? "end" : "middle"
    const agrupamento = intervalo === 1 ? "uma leitura por minuto" : `pico de cada ${intervalo} minutos`
    const passoRotulos = { 1: 5, 6: 6, 24: 8 }[estadoTelaAnalista.periodo]
    document.getElementById("descricaoPeriodoGrafico").textContent = `${descreverPeriodo()} · ${formatarHora(inicio / 60)}–${formatarHora(fim / 60)} · ${pontos.length} pontos · ${agrupamento}`

    grafico.innerHTML = `<title id="tituloGrafico">Uso de ${componente.nome} · ${descreverPeriodo()}</title>
        <desc id="descricaoGrafico">${quantidadeLeituras} leituras originais por minuto, exibidas em ${pontos.length} pontos: ${agrupamento}. Atenção em ${componente.limiteAtencao}% e crítico em ${componente.limiteCritico}%. Pico de ${formatarNumero(pico, 2)}% às ${formatarHora(minutoPico / 60)}.</desc>
        ${[100, 75, 50, 25, 0].map(valor => `
            <line x1="46" y1="${y(valor)}" x2="602" y2="${y(valor)}" stroke="#e5e7eb" />
            <text x="36" y="${y(valor) + 4}" text-anchor="end">${valor}%</text>`).join("")}
        <polygon fill="#4F46E5" fill-opacity=".15" points="${coordenadas} 602,230 46,230" />
        <polyline fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linejoin="round" points="${coordenadas}" />
        ${pontos.map((ponto, indice) => `<circle cx="${x(indice)}" cy="${y(ponto.valor)}" r="3" fill="#4F46E5" data-minuto="${ponto.minuto}"><title>${intervalo === 1 ? "Leitura" : "Pico"}: ${formatarNumero(ponto.valor, 2)}% às ${formatarHora(ponto.minuto / 60)}${intervalo === 1 ? "" : ` · Intervalo ${formatarHora(ponto.inicio / 60)}–${formatarHora(ponto.fim / 60)}`}</title></circle>`).join("")}
        <line x1="46" y1="${y(componente.limiteAtencao)}" x2="602" y2="${y(componente.limiteAtencao)}" stroke="#f97316" stroke-width="1.5" stroke-dasharray="6 4" />
        <text x="52" y="${y(componente.limiteAtencao) - 6}" fill="#f97316">Atenção (${componente.limiteAtencao}%)</text>
        <line x1="46" y1="${y(componente.limiteCritico)}" x2="602" y2="${y(componente.limiteCritico)}" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="6 4" />
        <text x="52" y="${y(componente.limiteCritico) - 6}" fill="#e11d48">Crítico (${componente.limiteCritico}%)</text>
        <circle cx="${x(indicePico)}" cy="${y(pico)}" r="5" fill="#4F46E5" />
        <text x="${x(indicePico)}" y="${y(pico) + (pico >= 85 ? 20 : -12)}" text-anchor="${alinhamentoPico}" fill="#1a1f5c" font-weight="700">${formatarNumero(pico, 2)}% · ${formatarHora(minutoPico / 60)}</text>
        ${pontos.map((ponto, indice) => indice % passoRotulos === 0 || indice === pontos.length - 1
            ? `<text x="${x(indice)}" y="246" text-anchor="end" transform="rotate(-55 ${x(indice)} 246)">${formatarHora((indice === pontos.length - 1 ? ponto.fim : ponto.inicio) / 60)}</text>` : "").join("")}`
}

function inicializarTelaAnalista() {
    if (!verificarSessao() || !podeAcessarPagina("telaAnalista.html")) return
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
