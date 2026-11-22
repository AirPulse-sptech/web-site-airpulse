const servicosBilling = [
    { nome: "EC2", percentual: 0.36, cor: "#0755ff" },
    { nome: "RDS", percentual: 0.24, cor: "#7b5cff" },
    { nome: "S3", percentual: 0.17, cor: "#12b5cb" },
    { nome: "CloudFront", percentual: 0.13, cor: "#18be70" },
    { nome: "Outros", percentual: 0.10, cor: "#ffa000" }
]

const otimizacoesBilling = [
    {
        icone: "bi-hdd-rack",
        titulo: "Redimensionar instâncias EC2 ociosas",
        descricao: "Quatro instâncias abaixo de 20% de uso",
        economia: 4200
    },
    {
        icone: "bi-database",
        titulo: "Otimizar volumes RDS subutilizados",
        descricao: "Reduzir a capacidade provisionada em 25%",
        economia: 2800
    },
    {
        icone: "bi-trash3",
        titulo: "Remover volumes não anexados",
        descricao: "Doze volumes EBS sem uso nos últimos 30 dias",
        economia: 1650
    },
    {
        icone: "bi-clock",
        titulo: "Ajustar retenção de logs no S3",
        descricao: "Reduzir a retenção de 180 para 90 dias",
        economia: 890
    }
]

const corTexto = "#7785bd"
const corGrade = "#edf1fb"

function formatarMoedaBilling(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0
    }).format(valor)
}

function formatarPercentualBilling(valor) {
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(Math.abs(valor)) + "%"
}

function criarDadosBilling() {
    const hoje = new Date()
    const totalDias = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
    const diasMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate()
    const diaAtual = hoje.getDate()
    const orcamento = 250000
    const dias = []
    const acumuladoReal = []
    const acumuladoProjetado = []
    let acumulado = 0
    let custoAcumulado = 0
    let periodo = hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

    for (let dia = 1; dia <= totalDias; dia++) {
        const valor = Math.round(
            6800
            + Math.sin(dia / 2.2) * 1200
            + (dia % 7 === 0 ? 1800 : 0)
            + (dia % 5 === 0 ? 900 : 0)
        )

        acumulado += valor
        dias.push(String(dia).padStart(2, "0"))

        if (dia <= diaAtual) {
            acumuladoReal.push(acumulado)
            acumuladoProjetado.push(dia === diaAtual ? acumulado : null)
            custoAcumulado = acumulado
        } else {
            acumuladoReal.push(null)
            acumuladoProjetado.push(acumulado)
        }
    }

    return {
        dias,
        acumuladoReal,
        acumuladoProjetado,
        custoAcumulado,
        previsaoFechamento: acumulado,
        orcamento,
        mediaDiaria: custoAcumulado / diaAtual,
        mediaMesPassado: Math.round(acumulado * 1.12) / diasMesPassado,
        diaAtual,
        totalDias,
        mes: String(hoje.getMonth() + 1).padStart(2, "0"),
        periodo: periodo.charAt(0).toUpperCase() + periodo.slice(1)
    }
}

function criarComparativoBilling(custoAcumulado) {
    const atual = servicosBilling.map(function (servico) {
        return Math.round(custoAcumulado * servico.percentual)
    })

    const anterior = servicosBilling.map(function (servico, indice) {
        return Math.round(atual[indice] * (1.09 - indice * 0.02))
    })

    return {
        atual,
        anterior,
        totalAtual: atual.reduce(function (soma, valor) { return soma + valor }, 0),
        totalAnterior: anterior.reduce(function (soma, valor) { return soma + valor }, 0)
    }
}

function definirVariacao(elemento, atual, anterior) {
    if (!anterior) {
        elemento.textContent = "--"
        return
    }

    const variacao = (atual - anterior) / anterior * 100
    const subiu = variacao > 0
    const icone = subiu ? "bi-arrow-up-short" : "bi-arrow-down-short"
    const sentido = subiu ? "Aumento de " : "Redução de "

    elemento.className = "variacao " + (subiu ? "negativa" : "positiva")
    elemento.innerHTML = `
        <i class="bi ${icone}" aria-hidden="true"></i>
        <span class="textoAcessivel">${sentido}</span>${formatarPercentualBilling(variacao)}
    `
}

function preencherIndicadoresBilling(dados, comparativo) {
    const consumido = dados.custoAcumulado / dados.orcamento * 100
    const disponivel = dados.orcamento - dados.custoAcumulado
    const barra = document.getElementById("barraOrcamento")

    document.getElementById("periodoFaturamento").textContent = dados.periodo

    document.getElementById("custoAcumulado").textContent = formatarMoedaBilling(dados.custoAcumulado)
    definirVariacao(document.getElementById("custoAcumuladoVariacao"), comparativo.totalAtual, comparativo.totalAnterior)

    document.getElementById("previsaoFechamento").textContent = formatarMoedaBilling(dados.previsaoFechamento)
    document.getElementById("previsaoFechamentoData").textContent = `Projeção até ${dados.totalDias}/${dados.mes}`

    document.getElementById("orcamentoConsumido").textContent = `${Math.round(consumido)}%`
    document.getElementById("orcamentoConsumidoDescricao").textContent = disponivel >= 0
        ? `${formatarMoedaBilling(disponivel)} disponíveis`
        : `${formatarMoedaBilling(-disponivel)} acima do orçamento`
    document.getElementById("preenchimentoOrcamento").style.width = `${Math.min(consumido, 100)}%`
    barra.setAttribute("aria-valuenow", Math.min(Math.round(consumido), 100))
    barra.classList.toggle("atencao", consumido >= 75 && consumido < 90)
    barra.classList.toggle("critico", consumido >= 90)

    document.getElementById("mediaDiaria").textContent = formatarMoedaBilling(dados.mediaDiaria)
    definirVariacao(document.getElementById("mediaDiariaVariacao"), dados.mediaDiaria, dados.mediaMesPassado)
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
                    pointRadius: function (contexto) { return contexto.dataIndex === dados.diaAtual - 1 ? 4 : 0 },
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
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    filter: function (item) {
                        return item.datasetIndex === 0 || item.dataIndex >= dados.diaAtual
                    },
                    callbacks: {
                        title: function (itens) { return `Dia ${itens[0].label}` },
                        label: function (contexto) {
                            return `${contexto.dataset.label}: ${formatarMoedaBilling(contexto.parsed.y)}`
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: corTexto, maxTicksLimit: 10, maxRotation: 0, font: { size: 11 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: corGrade },
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

function desenharComposicaoServico(custoAcumulado) {
    const valores = servicosBilling.map(function (servico) { return Math.round(custoAcumulado * servico.percentual) })

    document.getElementById("totalComposicao").textContent = formatarMoedaBilling(custoAcumulado)

    new Chart(document.getElementById("graficoComposicaoServico"), {
        type: "doughnut",
        data: {
            labels: servicosBilling.map(function (servico) { return servico.nome }),
            datasets: [{
                data: valores,
                backgroundColor: servicosBilling.map(function (servico) { return servico.cor }),
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            layout: { padding: 4 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (contexto) {
                            const servico = servicosBilling[contexto.dataIndex]
                            return `${servico.nome}: ${formatarMoedaBilling(contexto.parsed)} (${Math.round(servico.percentual * 100)}%)`
                        }
                    }
                }
            }
        }
    })

    document.getElementById("legendaComposicao").innerHTML = servicosBilling.map(function (servico, indice) {
        return `
            <li class="itemLegenda">
                <span class="pontoLegenda" style="background: ${servico.cor}"></span>
                <span class="nomeLegenda">${servico.nome}</span>
                <strong>${Math.round(servico.percentual * 100)}%</strong>
                <span class="valorLegenda">${formatarMoedaBilling(valores[indice])}</span>
            </li>
        `
    }).join("")
}

function preencherOtimizacoesBilling() {
    const economiaTotal = otimizacoesBilling.reduce(function (soma, otimizacao) { return soma + otimizacao.economia }, 0)

    document.getElementById("economiaTotal").textContent = formatarMoedaBilling(economiaTotal)
    document.getElementById("listaOtimizacao").innerHTML = otimizacoesBilling.map(function (otimizacao) {
        return `
            <div class="itemOtimizacao">
                <div class="iconeOtimizacao"><i class="bi ${otimizacao.icone}" aria-hidden="true"></i></div>
                <div class="textoOtimizacao">
                    <div class="tituloOtimizacao">${otimizacao.titulo}</div>
                    <div class="descricaoOtimizacao">${otimizacao.descricao}</div>
                    <div class="economiaOtimizacao">
                        <strong>${formatarMoedaBilling(otimizacao.economia)}</strong>
                        <span>economia mensal</span>
                    </div>
                </div>
            </div>
        `
    }).join("")
}

function desenharComparativoCustos(comparativo) {
    new Chart(document.getElementById("graficoComparativoCustos"), {
        type: "bar",
        data: {
            labels: servicosBilling.map(function (servico) { return servico.nome }),
            datasets: [
                {
                    label: "Mês passado",
                    data: comparativo.anterior,
                    backgroundColor: "#c7bef5",
                    borderRadius: 5,
                    maxBarThickness: 26
                },
                {
                    label: "Este mês",
                    data: comparativo.atual,
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
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (contexto) {
                            return `${contexto.dataset.label}: ${formatarMoedaBilling(contexto.parsed.y)}`
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: corTexto, maxRotation: 0, font: { size: 11 } } },
                y: {
                    beginAtZero: true,
                    grid: { color: corGrade },
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

function carregarBillingInfraestrutura() {
    if (!verificarSessao() || !podeAcessarPagina("billingInfraestrutura.html")) return

    Chart.defaults.font.family = "Inter, sans-serif"

    const dados = criarDadosBilling()
    const comparativo = criarComparativoBilling(dados.custoAcumulado)

    preencherIndicadoresBilling(dados, comparativo)
    desenharEvolucaoCustos(dados)
    desenharComposicaoServico(dados.custoAcumulado)
    preencherOtimizacoesBilling()
    desenharComparativoCustos(comparativo)
}

carregarBillingInfraestrutura()