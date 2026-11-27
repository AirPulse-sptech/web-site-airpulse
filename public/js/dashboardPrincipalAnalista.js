const NOMES_STATUS = { critico: "Crítico", atencao: "Atenção", normal: "Normal", semDados: "Sem dados" }
const PESO_STATUS = { semDados: -1, normal: 0, atencao: 1, critico: 2 }

function escaparHtml(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[caractere])
}

function plural(quantidade, singular, pluralTexto) {
    return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`
}

function formatarNumero(valor, casas = 1) {
    return Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

function formatarHorario(dataIso) {
    if (!dataIso) return "--:--"
    const data = new Date(dataIso)
    const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
    const dia = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })
    const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })
    return dia === hoje ? hora : `${dia} ${hora}`
}

function contarPorStatus(lista) {
    const contagem = { critico: 0, atencao: 0, normal: 0, semDados: 0 }
    for (const item of lista) contagem[item.status]++
    return contagem
}

function estaEmAlerta(item) {
    return item.status === "critico" || item.status === "atencao"
}

function preencherKpis(frota) {
    const fmcs = frota.flatMap(aeronave => aeronave.fmcs)
    const placas = fmcs.flatMap(fmc => fmc.placas)

    const ocorrenciasFmcs = fmcs.reduce((total, fmc) => total + fmc.ocorrencias, 0)
    const criticasFmcs = fmcs.reduce((total, fmc) => total + fmc.criticas, 0)
    const fmcsComOcorrencia = fmcs.filter(fmc => fmc.ocorrencias > 0).length

    document.getElementById("vgFmcsOcorrencias").textContent = ocorrenciasFmcs
    document.getElementById("vgFmcsTotal").textContent = `Em ${fmcsComOcorrencia} de ${fmcs.length} FMCs monitorados`
    document.getElementById("vgFmcsCriticos").textContent = plural(criticasFmcs, "crítica", "críticas")
    document.getElementById("vgFmcsAtencao").textContent = `· ${ocorrenciasFmcs - criticasFmcs} em atenção`

    const porComponente = {}
    let ocorrenciasPlacas = 0
    let placasComOcorrencia = 0
    for (const placa of placas) {
        let temOcorrencia = false
        for (const componente of placa.componentes) {
            porComponente[componente.nome] ??= 0
            if (estaEmAlerta(componente)) {
                porComponente[componente.nome]++
                ocorrenciasPlacas++
                temOcorrencia = true
            }
        }
        if (temOcorrencia) placasComOcorrencia++
    }

    document.getElementById("vgPlacasOcorrencias").textContent = ocorrenciasPlacas
    document.getElementById("vgPlacasTotal").textContent = `Em ${placasComOcorrencia} de ${placas.length} placas monitoradas`
    const resumo = Object.entries(porComponente).map(([nome, quantidade]) => `${nome} ${quantidade}`).join(" · ")
    document.getElementById("vgPlacasPorComponente").textContent = resumo || "Nenhum componente cadastrado"
}

function desenharGraficoEstado(frota, unidade) {
    const fmcs = frota.flatMap(aeronave => aeronave.fmcs)
    const bases = {
        aeronaves: { lista: frota, nome: "aeronaves" },
        fmcs: { lista: fmcs, nome: "FMCs" },
        placas: { lista: fmcs.flatMap(fmc => fmc.placas), nome: "placas" }
    }
    const base = bases[unidade]
    const contagem = contarPorStatus(base.lista)
    const status = ["critico", "atencao", "normal"]
    const total = status.reduce((soma, chave) => soma + contagem[chave], 0)

    const maior = Math.max(...status.map(chave => contagem[chave]), 1)
    const passo = maior <= 4 ? 1 : maior <= 10 ? 2 : 5
    const topo = Math.ceil(maior / passo) * passo
    const marcas = []
    for (let valor = 0; valor <= topo; valor += passo) marcas.push(valor)

    document.getElementById("vgEixoY").innerHTML = marcas
        .map(valor => `<span style="bottom: ${valor / topo * 100}%">${valor}</span>`).join("")

    document.getElementById("vgPlot").innerHTML =
        marcas.slice(1).map(valor => `<div class="vgLinhaGrade" style="bottom: ${valor / topo * 100}%"></div>`).join("") +
        `<div class="vgBarras">${status.map(chave => `
            <div class="vgColunaBarra ${chave}">
                <strong>${contagem[chave]}</strong>
                <div class="vgBarra ${chave}" style="height: ${contagem[chave] / topo * 100}%"></div>
            </div>`).join("")}
        </div>`

    document.getElementById("vgEixoX").innerHTML = status
        .map(chave => `<span><span class="vgPonto ${chave}"></span>${NOMES_STATUS[chave]}</span>`).join("")

    document.getElementById("vgTotalMonitorado").textContent = total
    document.getElementById("vgUnidadeMonitorada").textContent = base.nome
    document.getElementById("vgLegendaEstado").innerHTML = status.map(chave => `
        <li>
            <span class="vgPonto ${chave}"></span>
            <span>${NOMES_STATUS[chave]}</span>
            <strong>${contagem[chave]}</strong>
            <span>${formatarNumero(total ? contagem[chave] / total * 100 : 0, 0)}%</span>
        </li>`).join("")

    document.getElementById("vgGrafico").setAttribute("aria-label",
        `Estado na última coleta, ${total} ${base.nome}: ` +
        status.map(chave => `${contagem[chave]} ${NOMES_STATUS[chave].toLowerCase()}`).join(", "))
}

function montarResumoFmc(fmc) {
    if (fmc.status === "semDados") return "Sem coleta registrada"
    const foraDoLimite = fmc.placas.flatMap(placa => placa.componentes)
        .filter(estaEmAlerta)
        .sort((a, b) => PESO_STATUS[b.status] - PESO_STATUS[a.status] || b.valor - a.valor)
    return foraDoLimite.length
        ? foraDoLimite.slice(0, 2).map(componente => `${componente.nome} ${formatarNumero(componente.valor, 0)}%`).join(" · ")
        : "Dentro dos limites"
}

function montarBotaoFmc(aeronave, fmc, aberto) {
    return `<button type="button" class="vgBotaoFmc ${fmc.status}" data-fmc="${fmc.idComputador}"
            aria-expanded="${aberto}"
            aria-label="${aberto ? "Recolher" : "Ver placas do"} ${escaparHtml(fmc.nome)} da aeronave ${escaparHtml(aeronave.nome)}, estado ${NOMES_STATUS[fmc.status]}">
        <span class="vgPonto ${fmc.status}"></span>
        <span class="vgTextoFmc"><span>${escaparHtml(fmc.nome)}</span><small>${escaparHtml(montarResumoFmc(fmc))}</small></span>
        <i class="bi bi-chevron-down" aria-hidden="true"></i>
    </button>`
}

function montarRecursosPlaca(placa) {
    const recursos = placa.componentes.map(componente =>
        `<span>${escaparHtml(componente.nome)}: ${componente.valor === null ? "sem dados" : `${formatarNumero(componente.valor, 0)}%`}</span>`)
    return recursos.length ? `<p class="vgRecursosPlaca">${recursos.join("")}</p>` : ""
}

function montarOcorrenciasPlaca(placa) {
    const texto = placa.ocorrencias
        ? `${plural(placa.ocorrencias, "alerta ativo", "alertas ativos")} na última coleta · ${plural(placa.criticas, "crítico", "críticos")}`
        : "Sem alertas ativos na última coleta"
    return `<p class="vgRecursosPlaca"><span>${texto}</span></p>`
}

function montarSeloFmc(fmc) {
    if (fmc.status === "semDados") return `<span class="vgSeloFmc semDados"><span class="vgPontoStatus" aria-hidden="true"></span>Sem dados</span>`
    const emAlerta = estaEmAlerta(fmc)
    return `<span class="vgSeloFmc ${emAlerta ? "comAlertas" : "semAlertas"}"><span class="vgPontoStatus" aria-hidden="true"></span>${emAlerta ? "Em alerta agora" : "Normal agora"}</span>`
}

function montarCardFmc(aeronave, fmc) {
    const coleta = fmc.ultimaColeta
        ? `<span class="vgColetaAtualizada"><span class="vgPontoStatus" aria-hidden="true"></span>Atualizada</span><time datetime="${escaparHtml(fmc.ultimaColeta)}">${formatarHorario(fmc.ultimaColeta)}</time>`
        : `<span class="vgColetaAtualizada semDados"><span class="vgPontoStatus" aria-hidden="true"></span>Sem coleta</span>`
    return `<article class="vgCartaoFmc" aria-labelledby="vgTituloFmc${fmc.idComputador}">
        <header class="vgCabecalhoFmc">
            <div class="vgIconeFmc"><i class="bi bi-box" aria-hidden="true"></i></div>
            <div><h4 id="vgTituloFmc${fmc.idComputador}">${escaparHtml(fmc.nome)}</h4><p>Identificação ${escaparHtml(fmc.hostname)} · ${escaparHtml(fmc.tipoFmc)}</p></div>
            ${montarSeloFmc(fmc)}
        </header>
        <div class="vgMetricasFmc">
            <div class="vgMetricaFmc">
                <div class="vgIconeMetrica"><i class="bi bi-bell" aria-hidden="true"></i></div>
                <dl><dt>Alertas ativos na última coleta</dt><dd>${fmc.ocorrencias}</dd></dl>
            </div>
            <div class="vgMetricaFmc">
                <div class="vgIconeMetrica"><i class="bi bi-database" aria-hidden="true"></i></div>
                <dl><dt>Última coleta</dt><dd>${coleta}</dd></dl>
            </div>
        </div>
        <h5 class="vgTituloPlacas">Placas monitoradas neste FMC</h5>
        <ul class="vgListaPlacas">
            ${fmc.placas.length ? fmc.placas.map(placa => `
                <li>
                    <a class="vgPlacaMonitorada ${placa.status}" href="telaAnalista.html?placa=${encodeURIComponent(placa.idPlaca)}"
                        aria-label="Ver detalhes da placa ${escaparHtml(placa.nome)} do ${escaparHtml(fmc.nome)} da aeronave ${escaparHtml(aeronave.nome)}, estado atual ${NOMES_STATUS[placa.status]}">
                        <span class="vgPontoStatus" aria-hidden="true"></span>
                        <div class="vgDadosPlaca">
                            <div class="vgCabecalhoPlaca"><h5>${escaparHtml(placa.nome)}</h5><span class="vgSeloPlaca">${NOMES_STATUS[placa.status]}</span></div>
                            ${montarRecursosPlaca(placa)}
                            ${montarOcorrenciasPlaca(placa)}
                        </div>
                        <i class="bi bi-chevron-right" aria-hidden="true"></i>
                    </a>
                </li>`).join("") : `<li class="vgRecursosPlaca">Nenhuma placa cadastrada neste FMC.</li>`}
        </ul>
    </article>`
}

function montarSituacaoAeronave(aeronave) {
    if (aeronave.alertaAbertoDesde && estaEmAlerta(aeronave)) return `Em alerta desde ${formatarHorario(aeronave.alertaAbertoDesde)}`
    if (aeronave.ultimaColeta) return `Última coleta ${formatarHorario(aeronave.ultimaColeta)}`
    return "Sem coleta registrada"
}

function montarCardAeronave(aeronave, fmcsAbertos) {
    const abertos = aeronave.fmcs.filter(fmc => fmcsAbertos.has(String(fmc.idComputador)))
    const detalhes = [aeronave.modelo, aeronave.companhiaAerea].filter(Boolean).map(escaparHtml).join(" · ")
    return `<li class="vgCardAeronave">
        <div class="vgLinhaAeronave">
            <div class="vgIdentificacao">
                <div class="vgIconeAeronave"><i class="bi bi-airplane-fill" aria-hidden="true"></i></div>
                <div>
                    <h3>Aeronave ${escaparHtml(aeronave.nome)}</h3>
                    <p>${detalhes}</p>
                </div>
            </div>
            <div class="vgFmcs">
                ${aeronave.fmcs.length
                    ? aeronave.fmcs.map(fmc => montarBotaoFmc(aeronave, fmc, fmcsAbertos.has(String(fmc.idComputador)))).join("")
                    : `<span class="vgSemFmc">Nenhum FMC cadastrado</span>`}
            </div>
            <div class="vgSituacaoAeronave">
                <span class="vgEtiqueta ${aeronave.status}"><span class="vgPonto ${aeronave.status}"></span>${NOMES_STATUS[aeronave.status]}</span>
                <span>${montarSituacaoAeronave(aeronave)}</span>
            </div>
        </div>
        ${abertos.length ? `<div class="vgPainelFmcs">${abertos.map(fmc => montarCardFmc(aeronave, fmc)).join("")}</div>` : ""}
    </li>`
}

function normalizarTexto(texto) {
    return String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

function iniciarTela(dados) {
    const frota = dados.aeronaves
    const estado = { unidade: "aeronaves", filtro: "todos", busca: "", fmcsAbertos: new Set() }

    const lista = document.getElementById("vgListaAeronaves")
    const mensagemVazia = document.getElementById("vgMensagemVazia")
    const filtros = document.querySelectorAll(".vgFiltro")
    const botoesUnidade = document.querySelectorAll(".vgSeletorUnidade button")
    const busca = document.getElementById("vgBuscaAeronave")

    const aviso = document.getElementById("vgAviso")
    aviso.textContent = (dados.avisos || []).join(" ")
    aviso.hidden = !aviso.textContent

    const horaColeta = formatarHorario(dados.ultimaColeta)
    document.getElementById("vgHoraColeta").textContent = horaColeta
    document.getElementById("vgHoraGrafico").textContent = horaColeta

    function renderizarLista() {
        const termo = normalizarTexto(estado.busca.trim())
        const visiveis = frota
            .filter(aeronave => estado.filtro === "todos" || aeronave.status === estado.filtro)
            .filter(aeronave => !termo || normalizarTexto(`${aeronave.nome} ${aeronave.modelo} ${aeronave.companhiaAerea}`).includes(termo))
            .sort((a, b) => PESO_STATUS[b.status] - PESO_STATUS[a.status])
        lista.innerHTML = visiveis.map(aeronave => montarCardAeronave(aeronave, estado.fmcsAbertos)).join("")
        mensagemVazia.textContent = frota.length
            ? "Nenhuma aeronave encontrada para os filtros selecionados."
            : "Nenhuma aeronave cadastrada para a sua empresa."
        mensagemVazia.hidden = visiveis.length > 0
    }

    function marcarSelecionado(botoes, selecionado) {
        for (const botao of botoes) {
            const ativo = botao === selecionado
            botao.classList.toggle("selecionado", ativo)
            botao.setAttribute("aria-pressed", String(ativo))
        }
    }

    const contagemAeronaves = contarPorStatus(frota)
    for (const filtro of filtros) {
        const status = filtro.dataset.status
        const quantidade = status === "todos" ? frota.length : contagemAeronaves[status]
        filtro.innerHTML = status === "todos"
            ? `Todas (${quantidade})`
            : `<span class="vgPonto ${status}"></span>${NOMES_STATUS[status]} (${quantidade})`
        filtro.addEventListener("click", () => {
            estado.filtro = status
            marcarSelecionado(filtros, filtro)
            renderizarLista()
        })
    }

    for (const botao of botoesUnidade) {
        botao.addEventListener("click", () => {
            estado.unidade = botao.dataset.unidade
            marcarSelecionado(botoesUnidade, botao)
            desenharGraficoEstado(frota, estado.unidade)
        })
    }

    busca.addEventListener("input", () => {
        estado.busca = busca.value
        renderizarLista()
    })

    lista.addEventListener("click", evento => {
        const botao = evento.target.closest(".vgBotaoFmc")
        if (!botao) return
        const chave = botao.dataset.fmc
        if (estado.fmcsAbertos.has(chave)) estado.fmcsAbertos.delete(chave)
        else estado.fmcsAbertos.add(chave)
        renderizarLista()
        lista.querySelector(`.vgBotaoFmc[data-fmc="${CSS.escape(chave)}"]`)?.focus()
    })

    preencherKpis(frota)
    desenharGraficoEstado(frota, estado.unidade)
    renderizarLista()
}

function mostrarErro(mensagem) {
    const mensagemVazia = document.getElementById("vgMensagemVazia")
    mensagemVazia.textContent = mensagem
    mensagemVazia.hidden = false
}

function carregarDashboardPrincipalAnalista() {
    if (!verificarSessao() || !podeAcessarPagina("dashboardPrincipalAnalista.html")) return

    const mensagemVazia = document.getElementById("vgMensagemVazia")
    mensagemVazia.textContent = "Carregando a última coleta..."
    mensagemVazia.hidden = false

    fetch(`/dashboardAnalista/visaoGeral/${sessionStorage.idUsuario}`)
        .then(function (resposta) {
            return resposta.json().catch(() => ({})).then(function (dados) {
                if (!resposta.ok) throw new Error(dados.mensagem || `Erro ${resposta.status} ao buscar a visão geral`)
                return dados
            })
        })
        .then(function (dados) {
            iniciarTela(dados)
        })
        .catch(function (erro) {
            console.log(`#ERRO: ${erro}`)
            mostrarErro(erro.message)
        })
}

carregarDashboardPrincipalAnalista()
