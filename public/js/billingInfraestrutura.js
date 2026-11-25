const servicosBilling = [
    { nome: "EC2", percentual: 0.36, cor: "#0755ff" },
    { nome: "RDS", percentual: 0.24, cor: "#7b5cff" },
    { nome: "S3", percentual: 0.17, cor: "#12b5cb" },
    { nome: "CloudFront", percentual: 0.13, cor: "#18be70" },
    { nome: "Outros", percentual: 0.10, cor: "#ffa000" }
]

const otimizacoesBilling = [
    {
        titulo: "CPU",
        utilizacao: 18,
        capacidadeAtual: "8 vCPUs",
        capacidadeRecomendada: "4 vCPUs",
        recomendacao: "Downscale",
        prioridade: 82,
        descricao: "A capacidade de processamento está acima da utilização observada."
    },
    {
        titulo: "RAM",
        utilizacao: 91,
        capacidadeAtual: "16 GB",
        capacidadeRecomendada: "32 GB",
        recomendacao: "Upscale",
        prioridade: 91,
        descricao: "A memória apresenta utilização elevada e pode comprometer o desempenho."
    },
    {
        titulo: "DISCO",
        utilizacao: 94,
        capacidadeAtual: "100 GB",
        capacidadeRecomendada: "150 GB",
        recomendacao: "Upscale",
        prioridade: 94,
        descricao: "O armazenamento está próximo da capacidade máxima disponível."
    }
]

const corTexto = "#7785bd"
const corGrade = "#edf1fb"

function formatarMoedaBilling(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor)
}

function regressaoLinear(xs, ys) {
    const quantidade = xs.length

    if (quantidade == 0) {
        return { inclinacao: 0, intercepto: 0 }
    }

    if (quantidade == 1) {
        return {
            inclinacao: ys[0] / xs[0],
            intercepto: 0
        }
    }

    const mediaX = xs.reduce((total, valor) => total + valor, 0) / quantidade
    const mediaY = ys.reduce((total, valor) => total + valor, 0) / quantidade

    let numerador = 0
    let denominador = 0

    for (let i = 0; i < quantidade; i++) {
        numerador += (xs[i] - mediaX) * (ys[i] - mediaY)
        denominador += Math.pow(xs[i] - mediaX, 2)
    }

    const inclinacao = denominador == 0 ? 0 : numerador / denominador

    return {
        inclinacao,
        intercepto: mediaY - inclinacao * mediaX
    }
}

function criarDadosBilling(orcamento) {
    const hoje = new Date()
    const totalDias = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
    const diaAtual = hoje.getDate()

    const diasObservados = []
    const acumuladoObservado = []

    let acumulado = 0

    for (let dia = 1; dia <= diaAtual; dia++) {
        const valor = Math.round(
            (
                1.35
                + Math.sin(dia / 2.2) * 0.18
                + (dia % 7 == 0 ? 0.25 : 0)
                + (dia % 5 == 0 ? 0.12 : 0)
            ) * 100
        ) / 100

        acumulado = Math.round((acumulado + valor) * 100) / 100

        diasObservados.push(dia)
        acumuladoObservado.push(acumulado)
    }

    const custoAcumulado = acumulado
    const regressao = regressaoLinear(diasObservados, acumuladoObservado)
    const inclinacao = Math.max(regressao.inclinacao, 0)

    const dias = []
    const acumuladoReal = []
    const acumuladoProjetado = []

    for (let dia = 1; dia <= totalDias; dia++) {
        dias.push(String(dia).padStart(2, "0"))

        acumuladoReal.push(
            dia <= diaAtual ? acumuladoObservado[dia - 1] : null
        )

        acumuladoProjetado.push(
            dia >= diaAtual
                ? Math.round((regressao.intercepto + inclinacao * dia) * 100) / 100
                : null
        )
    }

    return {
        dias,
        acumuladoReal,
        acumuladoProjetado,
        custoAcumulado,
        previsaoFechamento: Math.round(
            (custoAcumulado + inclinacao * (totalDias - diaAtual)) * 100
        ) / 100,
        orcamento,
        tendenciaDiaria: inclinacao,
        diaAtual,
        totalDias,
        mes: String(hoje.getMonth() + 1).padStart(2, "0")
    }
}

function criarComparativoBilling(custoAcumulado) {
    const atual = servicosBilling.map(function (servico) {
        return Math.round(custoAcumulado * servico.percentual * 100) / 100
    })

    const anterior = atual.map(function (valor, indice) {
        return Math.round(valor * (1.09 - indice * 0.02) * 100) / 100
    })

    return { atual, anterior }
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

    document.getElementById("custoAcumuladoPeriodo").textContent =
        `Até o dia ${dados.diaAtual}/${dados.mes}`

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

    if (dados.orcamento > 0) {
        document.getElementById("orcamentoConsumidoDescricao").textContent =
            disponivel >= 0
                ? `${formatarMoedaBilling(disponivel)} disponíveis`
                : `${formatarMoedaBilling(-disponivel)} acima do orçamento`
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
                    pointRadius: contexto =>
                        contexto.dataIndex == dados.diaAtual - 1 ? 4 : 0,
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
                    filter: item =>
                        item.datasetIndex == 0 || item.dataIndex >= dados.diaAtual,
                    callbacks: {
                        title: itens => `Dia ${itens[0].label}`,
                        label: contexto =>
                            `${contexto.dataset.label}: ${formatarMoedaBilling(contexto.parsed.y)}`
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
                        callback: valor => formatarMoedaBilling(valor)
                    }
                }
            }
        }
    })
}

function desenharComposicaoServico(custoAcumulado) {
    const valores = servicosBilling.map(function (servico) {
        return Math.round(custoAcumulado * servico.percentual * 100) / 100
    })

    new Chart(document.getElementById("graficoComposicaoServico"), {
        type: "pie",
        data: {
            labels: servicosBilling.map(servico => servico.nome),
            datasets: [{
                data: valores,
                backgroundColor: servicosBilling.map(servico => servico.cor),
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
                        label: contexto => {
                            const servico = servicosBilling[contexto.dataIndex]

                            return `${servico.nome}: ${formatarMoedaBilling(contexto.parsed)} (${Math.round(servico.percentual * 100)}%)`
                        }
                    }
                }
            }
        }
    })

    document.getElementById("legendaComposicao").innerHTML =
        servicosBilling.map(function (servico, indice) {
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
    const lista = document.getElementById("listaOtimizacao")
    const resumo = document.querySelector(".paginaBilling .seloEconomia")

    const totalDownscale = otimizacoesBilling.filter(
        otimizacao => otimizacao.recomendacao == "Downscale"
    ).length

    const totalUpscale = otimizacoesBilling.filter(
        otimizacao => otimizacao.recomendacao == "Upscale"
    ).length

    resumo.textContent = `${totalDownscale} Downscale · ${totalUpscale} Upscale`

    const recomendacoesOrdenadas = [...otimizacoesBilling].sort(
        (a, b) => b.prioridade - a.prioridade
    )

    lista.innerHTML = `
        <table class="tabelaOtimizacao">
            <thead>
                <tr>
                    <th>Recurso</th>
                    <th>Utilização</th>
                    <th>Capacidade atual</th>
                    <th>Capacidade recomendada</th>
                    <th>Recomendação</th>
                </tr>
            </thead>
            <tbody>
                ${recomendacoesOrdenadas.map(function (otimizacao) {
                    const classeStatus = otimizacao.recomendacao.toLowerCase()

                    return `
                        <tr>
                            <td>
                                <div class="recursoTabelaOtimizacao">
                                    <strong>${otimizacao.titulo}</strong>
                                    <small>${otimizacao.descricao}</small>
                                </div>
                            </td>
                            <td>
                                <div class="utilizacaoTabelaOtimizacao">
                                    <strong>${otimizacao.utilizacao}%</strong>
                                    <div class="barraTabelaOtimizacao">
                                        <span style="width: ${otimizacao.utilizacao}%"></span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="capacidadeTabelaOtimizacao">
                                    ${otimizacao.capacidadeAtual}
                                </span>
                            </td>
                            <td>
                                <span class="capacidadeTabelaOtimizacao">
                                    ${otimizacao.capacidadeRecomendada}
                                </span>
                            </td>
                            <td>
                                <span class="statusTabelaOtimizacao ${classeStatus}">
                                    ${otimizacao.recomendacao}
                                </span>
                            </td>
                        </tr>
                    `
                }).join("")}
            </tbody>
        </table>
    `
}

function desenharComparativoCustos(comparativo) {
    new Chart(document.getElementById("graficoComparativoCustos"), {
        type: "bar",
        data: {
            labels: servicosBilling.map(servico => servico.nome),
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
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: contexto =>
                            `${contexto.dataset.label}: ${formatarMoedaBilling(contexto.parsed.y)}`
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
                        callback: valor => formatarMoedaBilling(valor)
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

function renderizarDashboardBilling(dados) {
    preencherIndicadoresBilling(dados)
    desenharEvolucaoCustos(dados)
    desenharComposicaoServico(dados.custoAcumulado)
    preencherOtimizacoesBilling()
    desenharComparativoCustos(criarComparativoBilling(dados.custoAcumulado))
}

function carregarBillingInfraestrutura() {
    if (!verificarSessao() || !podeAcessarPagina("billingInfraestrutura.html")) {
        return
    }

    Chart.defaults.font.family = "Inter, sans-serif"

    const idFuncionario = sessionStorage.getItem("idUsuario")

    fetch(`/empresas/orcamento/funcionario/${idFuncionario}`)
        .then(async function (resposta) {
            const resultado = await resposta.json()

            if (!resposta.ok) {
                throw new Error(
                    resultado.mensagem || "Não foi possível carregar o orçamento."
                )
            }

            return resultado
        })
        .then(function (resultado) {
            const orcamento = Number(resultado.valorOrcamento)

            if (!Number.isFinite(orcamento) || orcamento < 0) {
                throw new Error("O orçamento recebido do servidor é inválido.")
            }

            const dados = criarDadosBilling(orcamento)

            renderizarDashboardBilling(dados)
            configurarModalOrcamento(idFuncionario, dados)
        })
        .catch(function (erro) {
            console.log(erro)

            const dados = criarDadosBilling(0)

            renderizarDashboardBilling(dados)

            document.getElementById("orcamentoConsumido").textContent = "--"
            document.getElementById("valorOrcamentoConsumido").textContent = "--"
            document.getElementById("valorOrcamentoTotal").textContent = "Indisponível"

            document.getElementById("orcamentoConsumidoDescricao").textContent =
                "Não foi possível carregar o orçamento."

            document.getElementById("abrirModalOrcamento").disabled = true
        })
}

carregarBillingInfraestrutura()