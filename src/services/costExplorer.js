const { CostExplorerClient, GetCostAndUsageCommand } = require("@aws-sdk/client-cost-explorer")

const cliente = new CostExplorerClient({ region: "us-east-1" })

const duracaoCache = 60 * 60 * 1000

let cache = null
let cacheEm = 0

function arredondar(valor) {
    return Math.round(valor * 100) / 100
}

function formatarData(data) {
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")

    return `${data.getFullYear()}-${mes}-${dia}`
}

function nomeCurtoDoServico(nome) {
    if (nome == "Amazon Elastic Compute Cloud - Compute" || nome == "EC2 - Other") {
        return "EC2"
    }

    if (nome == "Amazon Relational Database Service") {
        return "RDS"
    }

    if (nome == "Amazon Simple Storage Service") {
        return "S3"
    }

    if (nome == "Amazon CloudFront") {
        return "CloudFront"
    }

    if (nome == "AmazonCloudWatch") {
        return "CloudWatch"
    }

    return nome.replace("Amazon ", "").replace("AWS ", "")
}

function converterValor(grupo) {
    const metrica = grupo.Metrics.UnblendedCost
    return Number(metrica.Amount)
}
async function consultar(inicio, fim, granularidade, agrupamento) {
    const periodos = []
    let token = undefined

    do {
        const resposta = await cliente.send(new GetCostAndUsageCommand({
            TimePeriod: { Start: inicio, End: fim },
            Granularity: granularidade,
            Metrics: ["UnblendedCost"],
            GroupBy: agrupamento,
            Filter: {
                Dimensions: { Key: "RECORD_TYPE", Values: ["Usage"] }
            },
            NextPageToken: token
        }))

        for (let i = 0; i < resposta.ResultsByTime.length; i++) {
            periodos.push(resposta.ResultsByTime[i])
        }

        token = resposta.NextPageToken
    } while (token)

    return periodos
}

async function buscarCustosAws() {
    if (cache && Date.now() - cacheEm < duracaoCache) {
        return cache
    }

    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth()
    const ontem = new Date(ano, mes, hoje.getDate() - 1)
    const totalDias = new Date(ano, mes + 1, 0).getDate()
    const diaAtual = ontem.getMonth() == mes ? ontem.getDate() : 0

    if (diaAtual == 0) {
        return { diaAtual: 0, totalDias: totalDias, dias: [], servicos: [], tiposUso: [] }
    }

    const periodosAtuais = await consultar(
        formatarData(new Date(ano, mes, 1)),
        formatarData(hoje),
        "DAILY",
        [
            { Type: "DIMENSION", Key: "USAGE_TYPE" },
            { Type: "DIMENSION", Key: "SERVICE" }
        ]
    )

    const diasMesAnterior = new Date(ano, mes, 0).getDate()
    const fimAnterior = new Date(ano, mes - 1, Math.min(diaAtual, diasMesAnterior) + 1)

    const periodosAnteriores = await consultar(
        formatarData(new Date(ano, mes - 1, 1)),
        formatarData(fimAnterior),
        "MONTHLY",
        [{ Type: "DIMENSION", Key: "SERVICE" }]
    )

    const dias = []

    for (let i = 0; i < diaAtual; i++) {
        dias.push(0)
    }

    const atualPorServico = {}
    const porTipoUso = {}

    for (let i = 0; i < periodosAtuais.length; i++) {
        const periodo = periodosAtuais[i]
        const dia = Number(periodo.TimePeriod.Start.slice(8, 10))

        for (let j = 0; j < periodo.Groups.length; j++) {
            const grupo = periodo.Groups[j]
            const valor = converterValor(grupo)

            if (valor <= 0 || dia > diaAtual) {
                continue
            }

            const tipoUso = grupo.Keys[0]
            const servico = nomeCurtoDoServico(grupo.Keys[1])
            const chave = `${tipoUso}|${servico}`

            dias[dia - 1] += valor
            atualPorServico[servico] = (atualPorServico[servico] || 0) + valor

            if (!porTipoUso[chave]) {
                porTipoUso[chave] = { tipoUso: tipoUso, servico: servico, valor: 0 }
            }

            porTipoUso[chave].valor += valor
        }
    }

    const anteriorPorServico = {}

    for (let i = 0; i < periodosAnteriores.length; i++) {
        const grupos = periodosAnteriores[i].Groups

        for (let j = 0; j < grupos.length; j++) {
            const valor = converterValor(grupos[j])

            if (valor <= 0) {
                continue
            }

            const servico = nomeCurtoDoServico(grupos[j].Keys[0])

            anteriorPorServico[servico] = (anteriorPorServico[servico] || 0) + valor
        }
    }

    const nomes = []

    for (const nome in atualPorServico) {
        nomes.push(nome)
    }

    for (const nome in anteriorPorServico) {
        if (!(nome in atualPorServico)) {
            nomes.push(nome)
        }
    }

    nomes.sort(function (a, b) {
        const somaA = (atualPorServico[a] || 0) + (anteriorPorServico[a] || 0)
        const somaB = (atualPorServico[b] || 0) + (anteriorPorServico[b] || 0)

        return somaB - somaA
    })

    const servicos = []
    let outrosAtual = 0
    let outrosAnterior = 0

    for (let i = 0; i < nomes.length; i++) {
        const atual = atualPorServico[nomes[i]] || 0
        const anterior = anteriorPorServico[nomes[i]] || 0

        if (i < 4) {
            servicos.push({
                nome: nomes[i],
                atual: arredondar(atual),
                anterior: arredondar(anterior)
            })
        } else {
            outrosAtual += atual
            outrosAnterior += anterior
        }
    }

    if (nomes.length > 4) {
        servicos.push({
            nome: "Outros",
            atual: arredondar(outrosAtual),
            anterior: arredondar(outrosAnterior)
        })
    }

    const tiposUso = Object.values(porTipoUso)

    tiposUso.sort(function (a, b) {
        return b.valor - a.valor
    })

    const tiposUsoLimitados = tiposUso.slice(0, 20)

    for (let i = 0; i < tiposUsoLimitados.length; i++) {
        tiposUsoLimitados[i].valor = arredondar(tiposUsoLimitados[i].valor)
    }

    for (let i = 0; i < dias.length; i++) {
        dias[i] = arredondar(dias[i])
    }

    cache = {
        diaAtual: diaAtual,
        totalDias: totalDias,
        dias: dias,
        servicos: servicos,
        tiposUso: tiposUsoLimitados
    }

    cacheEm = Date.now()

    return cache
}

module.exports = { buscarCustosAws }