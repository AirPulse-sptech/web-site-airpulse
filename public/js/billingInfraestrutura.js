const coresServicos = ["#0755ff", "#7b5cff", "#12b5cb", "#18be70", "#ffa000"]

const limiteGeradoresCusto = 8

const corTexto = "#7785bd"
const corGrade = "#edf1fb"

function arredondar(valor) {
    return Math.round(valor * 100) / 100
}

function formatarMoedaBilling(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "USD"
    })
}

function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function criarCustosVazios() {
    const hoje = new Date()
    const totalDias = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()

    return { diaAtual: 0, totalDias: totalDias, dias: [], servicos: [], tiposUso: [] }
}

function prepararServicos(servicos) {
    let total = 0

    for (let i = 0; i < servicos.length; i++) {
        total += servicos[i].atual
    }

    for (let i = 0; i < servicos.length; i++) {
        servicos[i].cor = servicos[i].nome == "Outros" ? coresServicos[4] : coresServicos[i]
        servicos[i].percentual = total > 0 ? servicos[i].atual / total : 0
    }
}

function regressaoLinear(xs, ys) {
    const quantidade = xs.length

    if (quantidade == 0) {
        return { inclinacao: 0, intercepto: 0 }
    }

    if (quantidade == 1) {
        return { inclinacao: ys[0] / xs[0], intercepto: 0 }
    }

    let somaX = 0
    let somaY = 0

    for (let i = 0; i < quantidade; i++) {
        somaX += xs[i]
        somaY += ys[i]
    }

    const mediaX = somaX / quantidade
    const mediaY = somaY / quantidade

    let numerador = 0
    let denominador = 0

    for (let i = 0; i < quantidade; i++) {
        numerador += (xs[i] - mediaX) * (ys[i] - mediaY)
        denominador += Math.pow(xs[i] - mediaX, 2)
    }

    const inclinacao = numerador / denominador

    return { inclinacao: inclinacao, intercepto: mediaY - inclinacao * mediaX }
}

function criarDadosBilling(orcamento, custos) {
    const hoje = new Date()
    const diaAtual = custos.diaAtual
    const totalDias = custos.totalDias

    const diasObservados = []
    const acumuladoObservado = []

    let acumulado = 0

    for (let dia = 1; dia <= diaAtual; dia++) {
        acumulado = arredondar(acumulado + custos.dias[dia - 1])

        diasObservados.push(dia)
        acumuladoObservado.push(acumulado)
    }

    const regressao = regressaoLinear(diasObservados, acumuladoObservado)
    const inclinacao = Math.max(regressao.inclinacao, 0)

    const dias = []
    const acumuladoReal = []
    const acumuladoProjetado = []

    for (let dia = 1; dia <= totalDias; dia++) {
        dias.push(String(dia).padStart(2, "0"))

        if (dia <= diaAtual) {
            acumuladoReal.push(acumuladoObservado[dia - 1])
        } else {
            acumuladoReal.push(null)
        }

        if (dia >= diaAtual) {
            acumuladoProjetado.push(arredondar(regressao.intercepto + inclinacao * dia))
        } else {
            acumuladoProjetado.push(null)
        }
    }

    return {
        dias: dias,
        acumuladoReal: acumuladoReal,
        acumuladoProjetado: acumuladoProjetado,
        custoAcumulado: acumulado,
        previsaoFechamento: arredondar(acumulado + inclinacao * (totalDias - diaAtual)),
        orcamento: orcamento,
        tendenciaDiaria: inclinacao,
        diaAtual: diaAtual,
        totalDias: totalDias,
        mes: String(hoje.getMonth() + 1).padStart(2, "0")
    }
}

function preencherIndicadoresBilling(dados) {
    const consumido = dados.orcamento > 0
        ? dados.custoAcumulado / dados.orcamento * 100
        : 0

    const disponivel = dados.orcamento - dados.custoAcumulado
    const percentualBarra = Math.max(0, Math.min(consumido, 100))
    const barra = document.getElementById("barraOrcamento")

    document.getElementById("custoAcumulado").textContent =
        formatarMoedaBilling(dados.custoAcumulado)

    if (dados.diaAtual > 0) {
        document.getElementById("custoAcumuladoPeriodo").textContent =
            `Até o dia ${dados.diaAtual}/${dados.mes}`
    } else {
        document.getElementById("custoAcumuladoPeriodo").textContent = "Sem dados ainda"
    }

    document.getElementById("previsaoFechamento").textContent =
        formatarMoedaBilling(dados.previsaoFechamento)

    document.getElementById("previsaoFechamentoData").textContent =
        `Projeção até ${dados.totalDias}/${dados.mes}`

    document.getElementById("orcamentoConsumido").textContent =
        `${Math.round(consumido)}%`

    document.getElementById("valorOrcamentoConsumido").textContent =
        formatarMoedaBilling(dados.custoAcumulado)

    document.getElementById("valorOrcamentoTotal").textContent =
        formatarMoedaBilling(dados.orcamento)

    if (dados.orcamento > 0 && disponivel >= 0) {
        document.getElementById("orcamentoConsumidoDescricao").textContent =
            `${formatarMoedaBilling(disponivel)} disponíveis`
    } else if (dados.orcamento > 0) {
        document.getElementById("orcamentoConsumidoDescricao").textContent =
            `${formatarMoedaBilling(-disponivel)} acima do orçamento`
    } else {
        document.getElementById("orcamentoConsumidoDescricao").textContent =
            "Defina um orçamento para acompanhar o consumo"
    }

    document.getElementById("preenchimentoOrcamento").style.width =
        `${percentualBarra}%`

    barra.setAttribute("aria-valuenow", Math.min(Math.round(consumido), 100))
    barra.classList.toggle("atencao", consumido >= 75 && consumido < 90)
    barra.classList.toggle("critico", consumido >= 90)

    document.getElementById("tendenciaDiaria").textContent =
        formatarMoedaBilling(dados.tendenciaDiaria)

    document.getElementById("tendenciaDiariaData").textContent =
        `Iniciado em 01/${dados.mes}`
}

function desenharEvolucaoCustos(dados) {
    new Chart(document.getElementById("graficoEvolucaoCustos"), {
        type: "line",
        data: {
            labels: dados.dias,
            datasets: [
                {
                    label: "Realizado",
                    data: dados.acumuladoReal,
                    borderColor: "#0755ff",
                    backgroundColor: "rgba(7, 85, 255, 0.12)",
                    pointBackgroundColor: "#0755ff",
                    pointRadius: function (contexto) {
                        return contexto.dataIndex == dados.diaAtual - 1 ? 4 : 0
                    },
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: "Projeção",
                    data: dados.acumuladoProjetado,
                    borderColor: "#7b5cff",
                    backgroundColor: "rgba(123, 92, 255, 0.08)",
                    pointBackgroundColor: "#7b5cff",
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    borderDash: [6, 4],
                    tension: 0,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    filter: function (item) {
                        return item.datasetIndex == 0 || item.dataIndex >= dados.diaAtual
                    },
                    callbacks: {
                        title: function (itens) {
                            return `Dia ${itens[0].label}`
                        },
                        label: function (contexto) {
                            return `${contexto.dataset.label}: ${formatarMoedaBilling(contexto.parsed.y)}`
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: corTexto,
                        maxTicksLimit: 10,
                        maxRotation: 0,
                        font: { size: 11 }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: corGrade
                    },
                    ticks: {
                        color: corTexto,
                        maxTicksLimit: 6,
                        font: { size: 11 },
                        callback: function (valor) {
                            return formatarMoedaBilling(valor)
                        }
                    }
                }
            }
        }
    })
}

function desenharComposicaoServico(servicos) {
    const nomes = []
    const valores = []
    const cores = []
    let legenda = ""

    for (let i = 0; i < servicos.length; i++) {
        const servico = servicos[i]

        nomes.push(servico.nome)
        valores.push(servico.atual)
        cores.push(servico.cor)

        legenda += `
            <li class="itemLegenda">
                <span class="pontoLegenda" style="background: ${servico.cor}"></span>
                <span class="nomeLegenda">${escaparHtml(servico.nome)}</span>
                <strong>${Math.round(servico.percentual * 100)}%</strong>
                <span class="valorLegenda">${formatarMoedaBilling(servico.atual)}</span>
            </li>
        `
    }

    if (servicos.length == 0) {
        legenda = `
            <li class="itemLegenda">
                <span class="nomeLegenda">Sem dados no período</span>
            </li>
        `
    }

    new Chart(document.getElementById("graficoComposicaoServico"), {
        type: "pie",
        data: {
            labels: nomes,
            datasets: [{
                data: valores,
                backgroundColor: cores,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 4
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (contexto) {
                            const servico = servicos[contexto.dataIndex]

                            return `${servico.nome}: ${formatarMoedaBilling(contexto.parsed)} (${Math.round(servico.percentual * 100)}%)`
                        }
                    }
                }
            }
        }
    })

    document.getElementById("legendaComposicao").innerHTML = legenda
}

function corDoServico(nome, servicos) {
    for (let i = 0; i < servicos.length; i++) {
        if (servicos[i].nome == nome) {
            return servicos[i].cor
        }
    }

    return coresServicos[4]
}

function descreverTipoDeUso(tipoUso) {
    const detalhe = tipoUso.split(":")[1] || ""

    if (tipoUso.includes("BoxUsage")) {
        return {
            nome: "Servidores virtuais",
            descricao: detalhe
                ? `Horas de funcionamento das máquinas ${detalhe}`
                : "Horas de funcionamento das máquinas"
        }
    }

    if (tipoUso.includes("EBS:")) {
        return {
            nome: "Discos dos servidores",
            descricao: "Espaço de armazenamento ligado às máquinas"
        }
    }

    if (tipoUso.includes("PublicIPv4")) {
        return {
            nome: "Endereços IP públicos",
            descricao: "Cobrança pelos IPs públicos usados pelos servidores"
        }
    }

    if (tipoUso.includes("NatGateway")) {
        return {
            nome: "Saída de rede privada",
            descricao: "Acesso à internet para recursos que ficam em rede privada"
        }
    }

    if (tipoUso.includes("RDS:") && tipoUso.includes("Storage")) {
        return {
            nome: "Armazenamento do banco de dados",
            descricao: "Espaço ocupado pelos dados do banco"
        }
    }

    if (tipoUso.includes("InstanceUsage")) {
        return {
            nome: "Banco de dados",
            descricao: detalhe
                ? `Horas de funcionamento do banco ${detalhe}`
                : "Horas de funcionamento do banco de dados"
        }
    }

    if (tipoUso.includes("TimedStorage")) {
        return {
            nome: "Armazenamento de arquivos",
            descricao: "Espaço ocupado pelos arquivos guardados"
        }
    }

    if (tipoUso.includes("DataTransfer-Out")) {
        return {
            nome: "Envio de dados para a internet",
            descricao: "Dados entregues aos seus usuários e clientes"
        }
    }

    if (tipoUso.includes("DataTransfer")) {
        return {
            nome: "Transferência de dados",
            descricao: "Dados trafegados entre regiões e serviços"
        }
    }

    if (tipoUso.includes("Requests-Tier")) {
        return {
            nome: "Requisições de acesso",
            descricao: "Chamadas de leitura e gravação feitas nos serviços"
        }
    }

    if (tipoUso.includes("Lambda")) {
        return {
            nome: "Funções sob demanda",
            descricao: "Código executado sem servidor dedicado"
        }
    }

    if (tipoUso.includes("CW:") || tipoUso.includes("MetricMonitor")) {
        return {
            nome: "Monitoramento",
            descricao: "Métricas e alertas acompanhados no CloudWatch"
        }
    }

    return { nome: tipoUso, descricao: "Outros usos do serviço" }
}

function preencherGeradoresCusto(itens, servicos) {
    const lista = document.getElementById("listaOtimizacao")
    const selo = document.getElementById("seloGeradoresCusto")

    if (itens.length == 0) {
        selo.textContent = "Sem dados no período"
        lista.innerHTML = ""
        return
    }

    let total = 0
    let somaTop5 = 0

    for (let i = 0; i < itens.length; i++) {
        total += itens[i].valor

        if (i < 5) {
            somaTop5 += itens[i].valor
        }
    }

    selo.innerHTML =
        `Os 5 maiores somam <strong>${Math.round(somaTop5 / total * 100)}%</strong> do gasto`

    let linhas = ""

    for (let i = 0; i < itens.length && i < limiteGeradoresCusto; i++) {
        const item = itens[i]
        const percentual = Math.round(item.valor / total * 100)
        const cor = corDoServico(item.servico, servicos)
        const descricao = descreverTipoDeUso(item.tipoUso)

        linhas += `
            <tr>
                <td>
                    <div class="itemGerador" title="Tipo de uso na AWS: ${escaparHtml(item.tipoUso)}">
                        <span class="posicaoGerador">${i + 1}</span>
                        <div class="recursoTabelaOtimizacao">
                            <strong>${escaparHtml(descricao.nome)}</strong>
                            <small>${escaparHtml(descricao.descricao)}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="seloServicoTabela">
                        <i style="background: ${cor}"></i>
                        ${escaparHtml(item.servico)}
                    </span>
                </td>
                <td>
                    <div class="utilizacaoTabelaOtimizacao">
                        <strong>${percentual}%</strong>
                        <div class="barraTabelaOtimizacao">
                            <span style="width: ${percentual}%; background: ${cor}"></span>
                        </div>
                    </div>
                </td>
                <td class="alinharDireita">
                    <span class="custoTabelaGeradores">
                        ${formatarMoedaBilling(item.valor)}
                    </span>
                </td>
            </tr>
        `
    }

    lista.innerHTML = `
        <table class="tabelaOtimizacao tabelaGeradores">
            <thead>
                <tr>
                    <th>O que está sendo cobrado</th>
                    <th>Serviço</th>
                    <th>Quanto pesa</th>
                    <th class="alinharDireita">Valor no mês</th>
                </tr>
            </thead>
            <tbody>${linhas}</tbody>
        </table>
    `
}

function desenharComparativoCustos(servicos) {
    const nomes = []
    const atual = []
    const anterior = []

    for (let i = 0; i < servicos.length; i++) {
        nomes.push(servicos[i].nome)
        atual.push(servicos[i].atual)
        anterior.push(servicos[i].anterior)
    }

    new Chart(document.getElementById("graficoComparativoCustos"), {
        type: "bar",
        data: {
            labels: nomes,
            datasets: [
                {
                    label: "Mês passado",
                    data: anterior,
                    backgroundColor: "#c7bef5",
                    borderRadius: 5,
                    maxBarThickness: 26
                },
                {
                    label: "Este mês",
                    data: atual,
                    backgroundColor: "#0755ff",
                    borderRadius: 5,
                    maxBarThickness: 26
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (contexto) {
                            return `${contexto.dataset.label}: ${formatarMoedaBilling(contexto.parsed.y)}`
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: corTexto,
                        maxRotation: 0,
                        font: { size: 11 }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: corGrade
                    },
                    ticks: {
                        color: corTexto,
                        maxTicksLimit: 5,
                        font: { size: 11 },
                        callback: function (valor) {
                            return formatarMoedaBilling(valor)
                        }
                    }
                }
            }
        }
    })
}

function configurarModalOrcamento(idFuncionario, dados) {
    const modal = document.getElementById("modalOrcamento")
    const botaoAbrir = document.getElementById("abrirModalOrcamento")
    const botaoFechar = document.getElementById("fecharModalOrcamento")
    const botaoCancelar = document.getElementById("cancelarModalOrcamento")
    const botaoSalvar = document.getElementById("salvarOrcamento")
    const input = document.getElementById("inputOrcamento")
    const mensagem = document.getElementById("statusModalOrcamento")

    const cargo = sessionStorage.getItem("cargoUsuario")

    if (cargo != "ADMIN" && cargo != "GESTOR") {
        botaoAbrir.style.display = "none"
    }

    function fecharModal() {
        modal.style.display = "none"
        modal.setAttribute("aria-hidden", "true")
    }

    botaoAbrir.addEventListener("click", function () {
        input.value = Number(dados.orcamento).toFixed(2)
        mensagem.textContent = ""

        modal.style.display = "flex"
        modal.setAttribute("aria-hidden", "false")

        input.focus()
    })

    botaoFechar.addEventListener("click", fecharModal)
    botaoCancelar.addEventListener("click", fecharModal)

    modal.addEventListener("click", function (evento) {
        if (evento.target == modal) {
            fecharModal()
        }
    })

    window.addEventListener("keydown", function (evento) {
        if (evento.key == "Escape" && modal.style.display == "flex") {
            fecharModal()
        }
    })

    botaoSalvar.addEventListener("click", async function () {
        const novoOrcamento = Number(input.value)

        if (!Number.isFinite(novoOrcamento) || novoOrcamento <= 0) {
            mensagem.textContent = "Informe um valor maior que zero."
            return
        }

        botaoSalvar.disabled = true
        mensagem.textContent = "Salvando orçamento..."

        try {
            const resposta = await fetch(
                `/empresas/orcamento/funcionario/${idFuncionario}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        valorOrcamentoServer: novoOrcamento
                    })
                }
            )

            const resultado = await resposta.json()

            if (!resposta.ok) {
                throw new Error(
                    resultado.mensagem || "Não foi possível atualizar o orçamento."
                )
            }

            dados.orcamento = novoOrcamento

            preencherIndicadoresBilling(dados)
            fecharModal()
        } catch (erro) {
            mensagem.textContent = erro.message
        } finally {
            botaoSalvar.disabled = false
        }
    })
}

async function carregarOrcamento(idFuncionario) {
    const resposta = await fetch(`/empresas/orcamento/funcionario/${idFuncionario}`)
    const resultado = await resposta.json()

    if (!resposta.ok) {
        throw new Error(
            resultado.mensagem || "Não foi possível carregar o orçamento."
        )
    }

    const orcamento = Number(resultado.valorOrcamento)

    if (!Number.isFinite(orcamento) || orcamento < 0) {
        throw new Error("O orçamento recebido do servidor é inválido.")
    }

    return orcamento
}

async function carregarCustosAws() {
    const resposta = await fetch("/custos/aws")
    const resultado = await resposta.json()

    if (!resposta.ok) {
        throw new Error(
            resultado.mensagem || "Não foi possível carregar os custos da AWS."
        )
    }

    return resultado
}

async function carregarBillingInfraestrutura() {
    if (!verificarSessao() || !podeAcessarPagina("billingInfraestrutura.html")) {
        return
    }

    Chart.defaults.font.family = "Inter, sans-serif"

    const idFuncionario = sessionStorage.getItem("idUsuario")

    let orcamento = 0
    let orcamentoDisponivel = true
    let custos = criarCustosVazios()
    let mensagemCustos = ""

    try {
        orcamento = await carregarOrcamento(idFuncionario)
    } catch (erro) {
        console.log(erro)
        orcamentoDisponivel = false
    }

    try {
        custos = await carregarCustosAws()
    } catch (erro) {
        console.log(erro)
        mensagemCustos = erro.message
    }

    prepararServicos(custos.servicos)

    const dados = criarDadosBilling(orcamento, custos)

    preencherIndicadoresBilling(dados)
    desenharEvolucaoCustos(dados)
    desenharComposicaoServico(custos.servicos)
    preencherGeradoresCusto(custos.tiposUso, custos.servicos)
    desenharComparativoCustos(custos.servicos)

    if (orcamentoDisponivel) {
        configurarModalOrcamento(idFuncionario, dados)
    } else {
        document.getElementById("orcamentoConsumido").textContent = "--"
        document.getElementById("valorOrcamentoConsumido").textContent = "--"
        document.getElementById("valorOrcamentoTotal").textContent = "Indisponível"

        document.getElementById("orcamentoConsumidoDescricao").textContent =
            "Não foi possível carregar o orçamento."

        document.getElementById("abrirModalOrcamento").disabled = true
    }

    if (mensagemCustos != "") {
        document.getElementById("custoAcumulado").textContent = "--"
        document.getElementById("previsaoFechamento").textContent = "--"
        document.getElementById("tendenciaDiaria").textContent = "--"
        document.getElementById("seloGeradoresCusto").textContent = "Indisponível"

        document.getElementById("listaOtimizacao").innerHTML =
            `<p class="statusModalOrcamento">${escaparHtml(mensagemCustos)}</p>`
    }
}

carregarBillingInfraestrutura()