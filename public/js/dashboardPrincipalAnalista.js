const NOMES_STATUS = { critico: "Crítico", atencao: "Atenção", normal: "Normal" }
const PESO_STATUS = { normal: 0, atencao: 1, critico: 2 }

function normalizarStatus(classe) {
    return classe === "moderado" ? "atencao" : classe
}

function piorStatus(lista) {
    return lista.reduce((pior, status) => PESO_STATUS[status] > PESO_STATUS[pior] ? status : pior, "normal")
}

function escaparHtml(texto) {
    return String(texto).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[caractere])
}

function plural(quantidade, singular, pluralTexto) {
    return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`
}


function montarFrotaVisaoGeral() {
    const ultimaHora = horarioUltimaLeitura()
    const ultimoMinuto = Math.round(ultimaHora * 60)

    return obterFrotaDemonstrativa().map(aeronave => {
        const fmcs = aeronave.fmcs.map(fmc => {
            const placas = fmc.placas.map(placa => {
                const componentes = Object.entries(placa.componentes).map(([chave, componente]) => {
                    const leituras = obterLeiturasMinuto(componente)
                    const valor = leituras[Math.min(ultimoMinuto, leituras.length - 1)]
                    return {
                        chave,
                        nome: componente.nome,
                        valor,
                        limiteAtencao: componente.limiteAtencao,
                        limiteCritico: componente.limiteCritico,
                        status: normalizarStatus(obterStatus(valor, componente).classe)
                    }
                })
                const alertas = listarAlertasPlaca(placa)
                return {
                    identificacao: placa.identificacao,
                    componentes,
                    status: piorStatus(componentes.map(componente => componente.status)),
                    ocorrencias: alertas.length,
                    criticas: alertas.filter(alerta => alerta.status.classe === "critico").length
                }
            })
            return {
                nome: fmc.nome,
                identificacao: fmc.identificacao,
                posicao: fmc.posicao,
                chave: `${aeronave.identificacao}|${fmc.identificacao}`,
                placas,
                status: piorStatus(placas.map(placa => placa.status)),
                ocorrencias: placas.reduce((total, placa) => total + placa.ocorrencias, 0)
            }
        })
        const resumo = resumirAeronaveAtual(aeronave)
        return {
            identificacao: aeronave.identificacao,
            modelo: aeronave.modelo,
            operador: aeronave.operador,
            fmcs,
            status: piorStatus(fmcs.map(fmc => fmc.status)),
            inicioEstado: resumo.inicioEstado
        }
    })
}

function contarPorStatus(lista) {
    const contagem = { critico: 0, atencao: 0, normal: 0 }
    for (const item of lista) contagem[item.status]++
    return contagem
}



function preencherKpis(frota) {
    const fmcs = frota.flatMap(aeronave => aeronave.fmcs)
    const placas = fmcs.flatMap(fmc => fmc.placas)
    const fmcsEmAlerta = fmcs.filter(fmc => fmc.status !== "normal")
    const placasEmAlerta = placas.filter(placa => placa.status !== "normal")

    document.getElementById("vgFmcsAlerta").textContent = fmcsEmAlerta.length
    document.getElementById("vgFmcsTotal").textContent = `De ${fmcs.length} FMCs monitorados`
    document.getElementById("vgFmcsCriticos").textContent =
        plural(fmcsEmAlerta.filter(fmc => fmc.status === "critico").length, "crítico", "críticos")
    document.getElementById("vgFmcsAtencao").textContent =
        `· ${fmcsEmAlerta.filter(fmc => fmc.status === "atencao").length} em atenção`

    document.getElementById("vgPlacasAlerta").textContent = placasEmAlerta.length
    document.getElementById("vgPlacasTotal").textContent = `De ${placas.length} placas monitoradas`

    const porComponente = {}
    for (const placa of placas) {
        for (const componente of placa.componentes) {
            porComponente[componente.nome] ??= 0
            if (componente.status !== "normal") porComponente[componente.nome]++
        }
    }
    document.getElementById("vgPlacasPorComponente").textContent =
        Object.entries(porComponente).map(([nome, quantidade]) => `${nome} ${quantidade}`).join(" · ")
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
    const total = base.lista.length

    const maior = Math.max(contagem.critico, contagem.atencao, contagem.normal, 1)
    const passo = maior <= 4 ? 1 : maior <= 10 ? 2 : 5
    const topo = Math.ceil(maior / passo) * passo
    const marcas = []
    for (let valor = 0; valor <= topo; valor += passo) marcas.push(valor)

    const status = ["critico", "atencao", "normal"]

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
    const foraDoLimite = fmc.placas.flatMap(placa => placa.componentes)
        .filter(componente => componente.status !== "normal")
        .sort((a, b) => PESO_STATUS[b.status] - PESO_STATUS[a.status] || b.valor - a.valor)
    return foraDoLimite.length
        ? foraDoLimite.slice(0, 2).map(componente => `${componente.nome} ${formatarNumero(componente.valor, 0)}%`).join(" · ")
        : "Dentro dos limites"
}

function montarBotaoFmc(aeronave, fmc, aberto) {
    return `<button type="button" class="vgBotaoFmc ${fmc.status}" data-fmc="${escaparHtml(fmc.chave)}"
            aria-expanded="${aberto}"
            aria-label="${aberto ? "Recolher" : "Ver placas do"} ${escaparHtml(fmc.nome)} da aeronave ${escaparHtml(aeronave.identificacao)}, estado ${NOMES_STATUS[fmc.status]}">
        <span class="vgPonto ${fmc.status}"></span>
        <span class="vgTextoFmc"><span>${escaparHtml(fmc.nome)}</span><small>${escaparHtml(montarResumoFmc(fmc))}</small></span>
        <i class="bi bi-chevron-down" aria-hidden="true"></i>
    </button>`
}

function montarComponente(componente) {
    return `<div class="vgComponente ${componente.status}">
        <div class="vgComponenteTopo">
            <span>${escaparHtml(componente.nome)}</span>
            <strong>${formatarNumero(componente.valor)}%</strong>
        </div>
        <div class="vgTrilho" aria-hidden="true">
            <div class="vgPreenchimento" style="width: ${Math.min(componente.valor, 100)}%"></div>
            <span class="vgMarcaLimite atencao" style="left: ${componente.limiteAtencao}%"></span>
            <span class="vgMarcaLimite critico" style="left: ${componente.limiteCritico}%"></span>
        </div>
    </div>`
}

function montarCardFmc(aeronave, fmc) {
    const ocorrencias = fmc.ocorrencias ? `${plural(fmc.ocorrencias, "alerta", "alertas")} em 24h` : "sem alertas em 24h"
    return `<article class="vgCardFmc">
        <header class="vgCabecalhoFmc">
            <div>
                <h4>${escaparHtml(fmc.nome)} · ${escaparHtml(aeronave.identificacao)}</h4>
                <p>${escaparHtml(fmc.identificacao)} · Posição ${fmc.posicao} · coleta ${formatarHora(horarioUltimaLeitura())} · ${ocorrencias}</p>
            </div>
            <span class="vgEtiqueta ${fmc.status}"><span class="vgPonto ${fmc.status}"></span>${NOMES_STATUS[fmc.status]}</span>
        </header>
        <ul class="vgListaPlacas">
            ${fmc.placas.map(placa => `
                <li class="vgPlaca">
                    <div class="vgTituloPlaca">
                        <strong>Placa ${escaparHtml(placa.identificacao)}</strong>
                        <span class="${placa.status}">· ${NOMES_STATUS[placa.status]}</span>
                    </div>
                    ${placa.componentes.map(montarComponente).join("")}
                    <span class="vgDetalhePlaca">${placa.ocorrencias
                        ? `${plural(placa.ocorrencias, "ocorrência", "ocorrências")} nas últimas 24h · ${plural(placa.criticas, "crítica", "críticas")}`
                        : "Sem ocorrências nas últimas 24h"}</span>
                </li>`).join("")}
        </ul>
        <a class="vgBotaoMonitoramento" href="telaAnalista.html"
            aria-label="Abrir monitoramento de recursos do ${escaparHtml(fmc.nome)} da aeronave ${escaparHtml(aeronave.identificacao)}">
            Abrir monitoramento de recursos <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </a>
    </article>`
}

function montarCardAeronave(aeronave, fmcsAbertos) {
    const abertos = aeronave.fmcs.filter(fmc => fmcsAbertos.has(fmc.chave))
    return `<li class="vgCardAeronave">
        <div class="vgLinhaAeronave">
            <div class="vgIdentificacao">
                <div class="vgIconeAeronave"><i class="bi bi-airplane-fill" aria-hidden="true"></i></div>
                <div>
                    <h3>Aeronave ${escaparHtml(aeronave.identificacao)}</h3>
                    <p>${escaparHtml(aeronave.modelo)} · ${escaparHtml(aeronave.operador)}</p>
                </div>
            </div>
            <div class="vgFmcs">
                ${aeronave.fmcs.map(fmc => montarBotaoFmc(aeronave, fmc, fmcsAbertos.has(fmc.chave))).join("")}
            </div>
            <div class="vgSituacaoAeronave">
                <span class="vgEtiqueta ${aeronave.status}"><span class="vgPonto ${aeronave.status}"></span>${NOMES_STATUS[aeronave.status]}</span>
                <span>Neste estado desde ${formatarHora(aeronave.inicioEstado)}</span>
            </div>
        </div>
        ${abertos.length ? `<div class="vgPainelFmcs">${abertos.map(fmc => montarCardFmc(aeronave, fmc)).join("")}</div>` : ""}
    </li>`
}

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}



function inicializarDashboardPrincipalAnalista() {
    if (!verificarSessao() || !podeAcessarPagina("dashboardPrincipalAnalista.html")) return

    const frota = montarFrotaVisaoGeral()
    const estado = { unidade: "aeronaves", filtro: "todos", busca: "", fmcsAbertos: new Set() }

    const lista = document.getElementById("vgListaAeronaves")
    const mensagemVazia = document.getElementById("vgMensagemVazia")
    const filtros = document.querySelectorAll(".vgFiltro")
    const botoesUnidade = document.querySelectorAll(".vgSeletorUnidade button")
    const busca = document.getElementById("vgBuscaAeronave")

    const horaColeta = formatarHora(horarioUltimaLeitura())
    document.getElementById("vgHoraColeta").textContent = horaColeta
    document.getElementById("vgHoraGrafico").textContent = horaColeta

    function renderizarLista() {
        const termo = normalizarTexto(estado.busca.trim())
        const visiveis = frota
            .filter(aeronave => estado.filtro === "todos" || aeronave.status === estado.filtro)
            .filter(aeronave => !termo || normalizarTexto(`${aeronave.identificacao} ${aeronave.modelo} ${aeronave.operador}`).includes(termo))
            .sort((a, b) => PESO_STATUS[b.status] - PESO_STATUS[a.status])
        lista.innerHTML = visiveis.map(aeronave => montarCardAeronave(aeronave, estado.fmcsAbertos)).join("")
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

inicializarDashboardPrincipalAnalista()
