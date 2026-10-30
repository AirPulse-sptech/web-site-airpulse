const historicoPlaca = obterHistoricoPlaca()
const periodosAlertas = {
    "6": { dias: 1, horas: 6, descricao: "Últimas 6 horas" },
    "24": { dias: 1, horas: 24, descricao: "Últimas 24 horas" },
    "7d": { dias: 7, horas: 24, descricao: "Última semana · 7 dias" },
    "30d": { dias: 30, horas: 24, descricao: "Último mês · 30 dias" }
}

function formatarDataAlerta(data, ano = false) {
    const [anoRegistro, mes, dia] = data.split("-")
    return ano ? `${dia}/${mes}/${anoRegistro}` : `${dia}/${mes}`
}

function atualizarAlertas() {
    const periodo = periodosAlertas[document.getElementById("filtroPeriodo").value]
    const chaveSelecionada = document.getElementById("filtroComponente").value
    const primeiraHora = 24 - periodo.horas
    const dias = historicoPlaca.slice(-periodo.dias)
    const componentes = Object.entries(dadosPlaca.componentes)
        .filter(([chave]) => chaveSelecionada === "todos" || chave === chaveSelecionada)
    const alertas = dias.flatMap(dia => listarAlertasPlaca(dia.placa)
        .filter(alerta => alerta.hora >= primeiraHora && (chaveSelecionada === "todos" || alerta.chave === chaveSelecionada))
        .map(alerta => ({ ...alerta, data: dia.data, ativo: dia.data === dadosPlaca.dataReferencia && alerta.ativo })))
        .sort((a, b) => b.data.localeCompare(a.data) || b.hora - a.hora)
    const criticos = alertas.filter(alerta => alerta.status.classe === "critico").length
    const atencao = alertas.length - criticos
    const percentual = total => `${formatarNumero(alertas.length ? total / alertas.length * 100 : 0, 0)}% do total`
    const diario = periodo.dias > 1

    document.getElementById("totalAlertas").textContent = alertas.length
    document.getElementById("totalCriticos").textContent = criticos
    document.getElementById("totalAtencao").textContent = atencao
    document.getElementById("percentualCriticos").textContent = percentual(criticos)
    document.getElementById("percentualAtencao").textContent = percentual(atencao)
    document.getElementById("periodoResumo").textContent = periodo.descricao
    document.getElementById("periodoMapa").textContent = `${periodo.descricao} · ${formatarDataAlerta(dias[0].data)}–${formatarDataAlerta(dias[dias.length - 1].data)} · Uma célula por ${diario ? "dia" : "hora"}`
    document.getElementById("descricaoMapaAlertas").textContent = diario
        ? "Cada célula mostra o maior nível atingido pelo componente no dia. O histórico lista as ocorrências com data e horário."
        : "Cada célula mostra o maior nível da hora, calculado pelas leituras originais de cada minuto."

    montarMapaAlertas(componentes, dias, primeiraHora, diario)
    document.getElementById("historicoAlertas").innerHTML = alertas.map(alerta => {
        const critico = alerta.status.classe === "critico"
        const limite = critico ? alerta.componente.limiteCritico : alerta.componente.limiteAtencao
        return `<tr>
            <td><time datetime="${alerta.data}T${formatarHora(alerta.hora)}">${formatarDataAlerta(alerta.data, true)} · ${formatarHora(alerta.hora)}</time></td>
            <td>${alerta.componente.nome}</td>
            <td><span class="severidadeAlerta ${critico ? "textoCritico" : "textoModerado"}">${alerta.status.nome}</span></td>
            <td>${formatarNumero(alerta.valor)}%</td>
            <td>${limite}%</td>
            <td>${alerta.ativo ? "Ativo" : "Encerrado"}</td>
        </tr>`
    }).join("")
    document.getElementById("semAlertas").hidden = alertas.length > 0
}

function montarMapaAlertas(componentes, dias, primeiraHora, diario) {
    const colunas = diario ? dias : Array.from({ length: 24 - primeiraHora }, (_, indice) => primeiraHora + indice)
    const passo = diario ? (dias.length > 7 ? 5 : 1) : 2
    const icones = { cpu: "bi-cpu", ram: "bi-memory", disco: "bi-hdd" }
    const niveis = { normal: 1, moderado: 2, critico: 4 }
    const mapa = document.getElementById("mapaAlertas")
    mapa.setAttribute("aria-label", diario ? "Maior nível dos componentes por dia" : "Estado dos componentes por hora")

    mapa.innerHTML = `
        <div class="mapaLinha">
            <span class="mapaSubtitulo">${diario ? "Data" : "Horário"}</span>
            <div class="mapaDatas" style="--totalCelulas:${colunas.length}">
                ${colunas.map((coluna, indice) => indice % passo === 0
                    ? `<span style="grid-column:${indice + 1} / span ${Math.min(passo, colunas.length - indice)}">${diario ? formatarDataAlerta(coluna.data) : formatarHora(coluna)}</span>` : "").join("")}
            </div>
        </div>
        ${componentes.map(([chave, componente]) => `
            <div class="mapaLinha">
                <div class="mapaRotulo"><i class="bi ${icones[chave]}" aria-hidden="true"></i><span>${componente.nome}</span></div>
                <div class="mapaCelulas" style="--totalCelulas:${colunas.length}">
                    ${colunas.map(coluna => {
                        const componenteDia = diario ? coluna.placa.componentes[chave] : componente
                        const leituras = obterLeiturasMinuto(componenteDia)
                        const valor = Math.max(...(diario ? leituras : leituras.slice(coluna * 60, (coluna + 1) * 60)))
                        const status = obterStatus(valor, componenteDia)
                        const momento = diario ? formatarDataAlerta(coluna.data, true) : `${formatarDataAlerta(dias[0].data)} · ${formatarHora(coluna)}`
                        const descricao = `${componente.nome} · ${momento} · Pico: ${formatarNumero(valor)}% · ${status.nome}`
                        return `<div class="celula nivel${niveis[status.classe]}" role="img" tabindex="0" title="${descricao}" aria-label="${descricao}"></div>`
                    }).join("")}
                </div>
            </div>`).join("")}`
}

function inicializarAlertas() {
    if (!verificarSessao() || !podeAcessarPagina("alertas.html")) return
    document.getElementById("referenciaHistorico").textContent = `Dados demonstrativos · ${formatarDataAlerta(dadosPlaca.dataReferencia, true)} · Última coleta às ${formatarHora(horarioUltimaLeitura())} · Atenção: 70% · Crítico: 90%`
    document.getElementById("filtroPeriodo").addEventListener("change", atualizarAlertas)
    document.getElementById("filtroComponente").addEventListener("change", atualizarAlertas)
    atualizarAlertas()
}

inicializarAlertas()
