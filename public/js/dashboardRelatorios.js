const nomesCategoria = {
    DESEMPENHO: "Desempenho",
    FALHA_HARDWARE: "Falha de hardware",
    ARMAZENAMENTO: "Armazenamento",
    MEMORIA_RAM: "Memória RAM",
    PROCESSADOR: "Processador",
    PERDA_CONEXAO: "Perda de conexão"
}

const coresCategoria = {
    DESEMPENHO: "#0755ff",
    FALHA_HARDWARE: "#ff354f",
    ARMAZENAMENTO: "#ffa000",
    MEMORIA_RAM: "#7b5cff",
    PROCESSADOR: "#18be70",
    PERDA_CONEXAO: "#12b5cb"
}

function plural(quantidade, singular, pluralDaPalavra) {
    return quantidade + " " + (quantidade == 1 ? singular : pluralDaPalavra)
}

function porcentagem(parte, total) {
    return Math.round((parte / total) * 100) + "%"
}


function mostrarIndicadores(dados) {
    var total = dados.resumo.totalRelatorios
    totalRelatorios.innerHTML = total
    analistasAtivos.innerHTML = dados.resumo.analistasAtivos

    if (dados.distribuicaoCategoria.length > 0) {
        var categoria = dados.distribuicaoCategoria[0]
        categoriaMaisFrequente.innerHTML = nomesCategoria[categoria.categoria]
        detalheCategoriaMaisFrequente.innerHTML =
            plural(categoria.total, "relatório", "relatórios") + " · " + porcentagem(categoria.total, total)
    }

    if (dados.servidoresOcorrencias.length > 0) {
        var servidor = dados.servidoresOcorrencias[0]
        servidorMaisOcorrencias.innerHTML = servidor.nome
        detalheServidorMaisOcorrencias.innerHTML =
            servidor.modelo + " · " + plural(servidor.total, "ocorrência", "ocorrências")
    }
}

function opcoesGrafico() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: "#7785bd", maxTicksLimit: 10, maxRotation: 0, font: { size: 11 } } },
            y: { beginAtZero: true, grid: { color: "#edf1fb" }, ticks: { color: "#7785bd", precision: 0 } }
        }
    }
}

function desenharProducaoAnalista(producao) {
    new Chart(graficoProducaoAnalista, {
        type: "bar",
        data: {
            labels: producao.map(function (analista) { return analista.nome }),
            datasets: [{
                label: "Relatórios",
                data: producao.map(function (analista) { return analista.total }),
                backgroundColor: "#0755ff",
                borderRadius: 6,
                maxBarThickness: 44
            }]
        },
        options: opcoesGrafico()
    })
}

function desenharCategorias(distribuicao, total) {
    var faixas = []
    var legenda = ""
    var inicio = 0

    for (var i = 0; i < distribuicao.length; i++) {
        var item = distribuicao[i]
        var cor = coresCategoria[item.categoria]
        var fim = inicio + (item.total / total) * 360

        faixas.push(`${cor} ${inicio}deg ${fim}deg`)
        inicio = fim

        legenda += `
            <li>
                <span class="ponto" style="color: ${cor}"></span>
                <span>${nomesCategoria[item.categoria]}</span>
                <strong>${item.total}</strong>
                <span>${porcentagem(item.total, total)}</span>
            </li>
        `
    }

    graficoRoscaCategoria.style.background = `conic-gradient(${faixas.join(", ")})`
    totalCentroGrafico.innerHTML = total
    legendaCategorias.innerHTML = legenda
}

function desenharHistorico(historico) {
    var dias = []
    var totais = []

    for (var i = 29; i >= 0; i--) {
        var dia = new Date()
        dia.setDate(dia.getDate() - i)

        var chave = dia.toLocaleDateString("sv-SE")
        var registro = historico.find(function (item) { return item.dia == chave })

        dias.push(dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }))
        totais.push(registro ? registro.total : 0)
    }

    new Chart(graficoHistoricoAtividade, {
        type: "line",
        data: {
            labels: dias,
            datasets: [{
                label: "Relatórios",
                data: totais,
                borderColor: "#0755ff",
                backgroundColor: "rgb(7 85 255 / 10%)",
                fill: true,
                tension: 0.2
            }]
        },
        options: opcoesGrafico()
    })
}

function mostrarServidores(servidores) {
    var lista = ""

    for (var i = 0; i < servidores.length; i++) {
        var servidor = servidores[i]
        var largura = (servidor.total / servidores[0].total) * 100

        lista += `
            <li class="cartaoServidor">
                <span class="posicaoServidor">${i + 1}</span>
                <div class="identificacaoServidor">
                    <h3>${servidor.nome}</h3>
                    <p>${servidor.modelo}</p>
                </div>
                <div class="barraServidor"><span style="width: ${largura}%"></span></div>
                <strong class="totalServidor">${plural(servidor.total, "ocorrência", "ocorrências")}</strong>
            </li>
        `
    }

    listaServidores.innerHTML = lista
}

function mostrarTabelaAnalistas(analistas) {
    var linhas = ""

    for (var i = 0; i < analistas.length; i++) {
        var analista = analistas[i]
        var cor = coresCategoria[analista.categoriaMaisFrequente]

        linhas += `
            <tr>
                <td>${analista.nome}</td>
                <td>${analista.total}</td>
                <td>
                    <span class="etiquetaCategoria">
                        <span class="ponto" style="color: ${cor}"></span>
                        ${nomesCategoria[analista.categoriaMaisFrequente]}
                    </span>
                </td>
            </tr>
        `
    }

    corpoTabelaAnalistas.innerHTML = linhas
}

function carregarDashboard() {
    if (!verificarSessao() || !podeAcessarPagina("dashboardRelatorios.html")) return

    fetch(`/dashboardRelatorio/buscar/${sessionStorage.idUsuario}`)
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("Erro " + resposta.status + " ao buscar os relatórios")
            }
            return resposta.json()
        })
        .then(function (dados) {
            mostrarIndicadores(dados)
            desenharProducaoAnalista(dados.producaoAnalista)
            desenharCategorias(dados.distribuicaoCategoria, dados.resumo.totalRelatorios)
            desenharHistorico(dados.historicoAtividade)
            mostrarServidores(dados.servidoresOcorrencias)
            mostrarTabelaAnalistas(dados.tabelaAnalistas)
        })
        .catch(function (erro) {
            console.log(`#ERRO: ${erro}`)
        })
}

carregarDashboard()
