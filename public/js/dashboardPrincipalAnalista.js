function inicializarDashboardPrincipalAnalista() {
    if (!verificarSessao() || !podeAcessarPagina("dashboardPrincipalAnalista.html")) return

    const dataDashboard = document.getElementById("dataDashboard")
    const buscaAeronave = document.getElementById("buscaAeronave")
    const filtros = document.querySelectorAll(".botaoFiltro")
    const listaAeronaves = document.getElementById("listaAeronaves")
    const modeloCartao = document.getElementById("modeloCartaoAeronave")
    const mensagemVazia = document.getElementById("mensagemVazia")
    const nomesStatus = { critico: "Crítico", atencao: "Atenção", normal: "Normal" }
    const dadosAeronaves = [
        {
            "identificacao": "PR-GOL",
            "modelo": "Boeing 737-800",
            "status": "critico",
            "tempoEstadoMinutos": 18,
            "ultimaAtualizacao": "2025-05-26T14:28"
        },
        {
            "identificacao": "PR-TAM",
            "modelo": "Airbus A320",
            "status": "atencao",
            "tempoEstadoMinutos": 45,
            "ultimaAtualizacao": "2025-05-26T14:15"
        },
        {
            "identificacao": "PR-AZU",
            "modelo": "Embraer E195-E2",
            "status": "atencao",
            "tempoEstadoMinutos": 80,
            "ultimaAtualizacao": "2025-05-26T13:52"
        },
        {
            "identificacao": "PT-LAT",
            "modelo": "Boeing 787-9",
            "status": "normal",
            "tempoEstadoMinutos": 360,
            "ultimaAtualizacao": "2025-05-26T12:41"
        }
    ]
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

            const minutos = dadosAeronave.tempoEstadoMinutos
            const horas = Math.floor(minutos / 60)
            const minutosRestantes = minutos % 60
            const tempoEstado = cartao.querySelector(".tempoEstado time")
            tempoEstado.dateTime = `PT${minutos}M`
            tempoEstado.textContent = horas > 0
                ? `${horas} h${minutosRestantes > 0 ? ` ${minutosRestantes} min` : ""}`
                : `${minutos} min`

            const ultimaAtualizacao = cartao.querySelector(".ultimaAtualizacao time")
            ultimaAtualizacao.dateTime = dadosAeronave.ultimaAtualizacao
            ultimaAtualizacao.textContent = new Date(dadosAeronave.ultimaAtualizacao).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
            }).replace(",", "")
            fragmento.appendChild(cartao)
        }
        listaAeronaves.replaceChildren(fragmento)
        aeronaves = listaAeronaves.querySelectorAll(".cartaoAeronave")
    }

    function atualizarData() {
        const agora = new Date()
        dataDashboard.dateTime = agora.toISOString()
        dataDashboard.replaceChildren()
        for (const opcoes of [
            { weekday: "short", day: "numeric", month: "long", year: "numeric" },
            { hour: "2-digit", minute: "2-digit" }
        ]) {
            const parte = document.createElement("span")
            parte.textContent = agora.toLocaleString("pt-BR", opcoes)
            dataDashboard.appendChild(parte)
        }
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
    atualizarData()
    setInterval(atualizarData, 60000)

    construirCards(dadosAeronaves)
    filtrarAeronaves()
}

inicializarDashboardPrincipalAnalista()
