function preencherResumoGeral(aeronaves, filtros) {
    const alertas = obterFrotaDemonstrativa().flatMap(aeronave => aeronave.fmcs.flatMap(fmc => fmc.placas.flatMap(placa => listarAlertasPlaca(placa)))).sort((a, b) => b.hora - a.hora)
    const criticos = alertas.filter(alerta => alerta.status.classe === "critico")
    const total = aeronaves.length
    const contagens = { normal: 0, atencao: 0, critico: 0 }
    const nomes = { normal: "Normal", atencao: "Atenção", critico: "Crítico" }
    for (const aeronave of aeronaves) contagens[aeronave.status]++

    document.getElementById("totalAlertasGeral").textContent = alertas.length
    document.getElementById("resumoAlertasGeral").textContent = alertas.length
        ? `${dadosPlaca.aeronave} · Placa ${dadosPlaca.identificacao} · ${dadosPlaca.fmc}`
        : "Nenhuma ocorrência nas últimas 24 horas"
    document.getElementById("totalCriticosGeral").textContent = criticos.length
    document.getElementById("resumoCriticosGeral").textContent = criticos.length
        ? `${criticos[0].componente.nome} · ${dadosPlaca.fmc} · ${formatarHora(criticos[0].hora)}`
        : "Nenhuma ocorrência crítica nas últimas 24 horas"

    document.getElementById("totalAeronaves").textContent = total
    document.getElementById("rotuloTotalAeronaves").textContent = total === 1 ? "Aeronave" : "Aeronaves"
    document.getElementById("legendaSituacao").innerHTML = Object.entries(contagens).map(([status, quantidade]) =>
        `<li><span class="ponto ${status}"></span><span>${nomes[status]}</span><strong>${quantidade}</strong><span>${formatarNumero(total ? quantidade / total * 100 : 0, 0)}%</span></li>`
    ).join("")

    const grafico = document.getElementById("graficoSituacao")
    const fimNormal = total ? contagens.normal / total * 360 : 0
    const fimAtencao = total ? (contagens.normal + contagens.atencao) / total * 360 : 0
    grafico.style.background = total
        ? `conic-gradient(var(--verdeSituacao) 0deg ${fimNormal}deg, var(--laranjaSituacao) ${fimNormal}deg ${fimAtencao}deg, var(--vermelhoSituacao) ${fimAtencao}deg 360deg)`
        : "var(--bordaPainel)"
    grafico.setAttribute("aria-label", `${total} aeronaves: ${contagens.normal} em estado normal, ${contagens.atencao} em atenção e ${contagens.critico} em estado crítico na última coleta.`)

    for (const filtro of filtros) {
        const status = filtro.dataset.status
        const quantidade = status === "todos" ? total : contagens[status]
        filtro.innerHTML = `${status === "todos" ? "" : `<span class="ponto ${status}"></span>`}${status === "todos" ? "Todos" : nomes[status]} (${quantidade})`
    }
}

function inicializarDashboardPrincipalAnalista() {
    if (!verificarSessao() || !podeAcessarPagina("dashboardPrincipalAnalista.html")) return

    const buscaAeronave = document.getElementById("buscaAeronave")
    const filtros = document.querySelectorAll(".botaoFiltro")
    const listaAeronaves = document.getElementById("listaAeronaves")
    const modeloCartao = document.getElementById("modeloCartaoAeronave")
    const mensagemVazia = document.getElementById("mensagemVazia")
    const nomesStatus = { critico: "Crítico", atencao: "Atenção", normal: "Normal" }
    const dadosAeronaves = obterFrotaDemonstrativa().map(aeronave => ({
        identificacao: aeronave.identificacao,
        modelo: aeronave.modelo,
        ...resumirAeronaveAtual(aeronave)
    }))
    let aeronaves = []
    let statusSelecionado = "todos"

    function construirCards(dados) {
        const fragmento = document.createDocumentFragment()
        for (const dadosAeronave of dados) {
            const cartao = modeloCartao.content.firstElementChild.cloneNode(true)
            cartao.dataset.status = dadosAeronave.status
            cartao.querySelector("h3").textContent = `Aeronave ${dadosAeronave.identificacao}`
            cartao.querySelector(".modeloAeronave").textContent = dadosAeronave.modelo
            cartao.querySelector(".matriculaAeronave").textContent = `Identificação ${dadosAeronave.identificacao}`

            const etiqueta = cartao.querySelector(".etiquetaSituacao")
            etiqueta.classList.add(dadosAeronave.status)
            cartao.querySelector(".nomeStatus").textContent = nomesStatus[dadosAeronave.status]

            const tempoEstado = cartao.querySelector(".tempoEstado time")
            tempoEstado.dateTime = formatarHora(dadosAeronave.inicioEstado)
            tempoEstado.textContent = formatarHora(dadosAeronave.inicioEstado)

            const ultimaAtualizacao = cartao.querySelector(".ultimaAtualizacao time")
            ultimaAtualizacao.dateTime = formatarHora(dadosAeronave.ultimaHora)
            ultimaAtualizacao.textContent = formatarHora(dadosAeronave.ultimaHora)

            fragmento.appendChild(cartao)
        }
        listaAeronaves.replaceChildren(fragmento)
        aeronaves = listaAeronaves.querySelectorAll(".cartaoAeronave")
    }

    function normalizarTexto(texto) {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    }

    function filtrarAeronaves() {
        const busca = normalizarTexto(buscaAeronave.value.trim())
        let totalVisivel = 0
        for (const aeronave of aeronaves) {
            const correspondeStatus = statusSelecionado === "todos" || aeronave.dataset.status === statusSelecionado
            const identificacao = aeronave.querySelector(".identificacaoAeronave").textContent
            aeronave.hidden = !correspondeStatus || !normalizarTexto(identificacao).includes(busca)
            if (!aeronave.hidden) totalVisivel++
        }
        mensagemVazia.hidden = totalVisivel > 0
    }

    for (const filtro of filtros) {
        filtro.addEventListener("click", function () {
            statusSelecionado = filtro.dataset.status
            for (const item of filtros) {
                const selecionado = item === filtro
                item.classList.toggle("selecionado", selecionado)
                item.setAttribute("aria-pressed", String(selecionado))
            }
            filtrarAeronaves()
        })
    }

    buscaAeronave.addEventListener("input", filtrarAeronaves)

    preencherResumoGeral(dadosAeronaves, filtros)
    construirCards(dadosAeronaves)
    filtrarAeronaves()
}

inicializarDashboardPrincipalAnalista()
