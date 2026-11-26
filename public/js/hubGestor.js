var nomesStatus = { normal: "Normal", atencao: "Atenção", critico: "Crítico" }
var coresStatus = { normal: "#16a34a", atencao: "#f97316", critico: "#e11d48" }
var classesCriticidade = { CRITICO: "critico", ATENCAO: "atencao", NORMAL: "normal" }
var statusAeronave = {
    ATIVA: { nome: "Ativa", classe: "normal" },
    MANUTENCAO: { nome: "Em manutenção", classe: "atencao" },
    INATIVA: { nome: "Inativa", classe: "inativo" }
}

function escaparHtml(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, function (caractere) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[caractere]
    })
}

function mostrarListaVazia(idLista, mensagem) {
    document.getElementById(idLista).innerHTML = `<li class="hbItemVazio">${escaparHtml(mensagem)}</li>`
}

function preencherVisaoGeral() {
    var frota = obterFrotaDemonstrativa()
    var contagem = { normal: 0, atencao: 0, critico: 0 }
    frota.forEach(function (aeronave) {
        contagem[resumirAeronaveAtual(aeronave).status]++
    })

    var total = frota.length
    var inicio = 0
    var fatias = ["normal", "atencao", "critico"].map(function (status) {
        var fim = inicio + (total ? contagem[status] / total * 360 : 0)
        var fatia = `${coresStatus[status]} ${inicio}deg ${fim}deg`
        inicio = fim
        return fatia
    })

    var rosca = document.getElementById("hbRosca")
    if (total) rosca.style.background = `conic-gradient(${fatias.join(", ")})`
    rosca.setAttribute("aria-label", `Status das aeronaves: ${contagem.normal} normais, ${contagem.atencao} em atenção e ${contagem.critico} críticas, de ${total}`)
    document.getElementById("hbTotalAeronaves").textContent = total

    document.getElementById("hbLegendaStatus").innerHTML = ["normal", "atencao", "critico"].map(function (status) {
        var percentual = total ? Math.round(contagem[status] / total * 100) : 0
        return `<li>
            <span class="hbBolinha ${status}"></span>
            <span>${nomesStatus[status]}</span>
            <strong>${contagem[status]}</strong>
            <span>${percentual}%</span>
        </li>`
    }).join("")

    var hora = formatarHora(horarioUltimaLeitura())
    document.getElementById("hbHoraStatus").textContent = hora
    document.getElementById("hbHoraColeta").textContent = hora
}

function preencherFrota(aeronaves) {
    var computadores = aeronaves.flatMap(function (aeronave) { return aeronave.computadores || [] })
    var ativos = computadores.filter(function (computador) { return computador.statusComputador == "ATIVO" }).length
    document.getElementById("hbFmcsAtivos").textContent = ativos
    document.getElementById("hbFmcsInativos").textContent = computadores.length - ativos

    var ultimas = aeronaves.slice().sort(function (a, b) { return b.idAeronave - a.idAeronave }).slice(0, 3)
    if (ultimas.length == 0) return mostrarListaVazia("hbListaAeronaves", "Nenhuma aeronave cadastrada.")

    document.getElementById("hbListaAeronaves").innerHTML = ultimas.map(function (aeronave) {
        var quantidade = (aeronave.computadores || []).length
        var status = statusAeronave[aeronave.statusAeronave] || statusAeronave.INATIVA
        return `<li>
            <span class="hbTexto"><strong>${escaparHtml(aeronave.nome)}</strong> · ${escaparHtml(aeronave.modelo)}</span>
            <span class="hbDetalhe">${quantidade} ${quantidade == 1 ? "FMC" : "FMCs"}</span>
            <span class="hbEtiqueta ${status.classe}">${status.nome}</span>
        </li>`
    }).join("")
}

function preencherRelatorios(relatorios) {
    var criticos = relatorios.filter(function (relatorio) { return relatorio.criticidade == "CRITICO" }).length
    document.getElementById("hbRelatoriosCriticos").textContent = criticos
    document.getElementById("hbRotuloCriticos").textContent = criticos == 1 ? "relatório crítico" : "relatórios críticos"
    document.getElementById("hbRelatoriosAtencao").textContent =
        relatorios.filter(function (relatorio) { return relatorio.criticidade == "ATENCAO" }).length

    var ultimos = relatorios.slice().sort(function (a, b) {
        return Number(b.dataCriacaoTimestamp) - Number(a.dataCriacaoTimestamp) || b.idRelatorio - a.idRelatorio
    }).slice(0, 3)
    if (ultimos.length == 0) return mostrarListaVazia("hbListaRelatorios", "Nenhum relatório publicado.")

    document.getElementById("hbListaRelatorios").innerHTML = ultimos.map(function (relatorio) {
        var classe = classesCriticidade[relatorio.criticidade]
        return `<li>
            <span class="hbTexto">${escaparHtml(relatorio.titulo || "Sem título")} · ${escaparHtml(relatorio.aeronave)}</span>
            <span class="hbDetalhe">${escaparHtml(String(relatorio.dataCriacao || "").slice(0, 5))}</span>
            ${classe ? `<span class="hbEtiqueta ${classe}">${nomesStatus[classe]}</span>` : ""}
        </li>`
    }).join("")
}

function buscarJson(url, mensagemErro) {
    return fetch(url, { cache: "no-store" }).then(function (resposta) {
        if (!resposta.ok) throw new Error(mensagemErro)
        return resposta.json()
    })
}

function carregarHubGestor() {
    if (!verificarSessao() || !podeAcessarPagina("hubGestor.html")) return

    var idFuncionario = sessionStorage.getItem("idUsuario")
    document.getElementById("hbNomeGestor").textContent = sessionStorage.getItem("nomeUsuario").trim().split(/\s+/)[0]

    preencherVisaoGeral()

    buscarJson(`/gerenciarAeronave/listar/${idFuncionario}`, "Erro ao buscar as aeronaves.")
        .then(preencherFrota)
        .catch(function (erro) {
            console.log(erro)
            mostrarListaVazia("hbListaAeronaves", "Não foi possível carregar as aeronaves.")
        })

    buscarJson(`/relatorio/gestor/${idFuncionario}`, "Erro ao buscar os relatórios.")
        .then(preencherRelatorios)
        .catch(function (erro) {
            console.log(erro)
            mostrarListaVazia("hbListaRelatorios", "Não foi possível carregar os relatórios.")
        })
}

carregarHubGestor()
