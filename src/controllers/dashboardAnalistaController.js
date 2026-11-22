var alertaModel = require("../models/alertaModel")
var metricaModel = require("../models/metricaModel")
var alertaRelatorioModel = require("../models/alertaRelatorioModel")
var dashboardAnalistaModel = require("../models/dashboardAnalistaModel")
var alertaRelatorioController = require("./alertaRelatorioController")

var colunaPorTipo = { CPU: "cpu_media", RAM: "ram_media", DISCO: "flash_media", FLASH: "flash_media" }
var nomePorTipo = { CPU: "CPU", RAM: "RAM", DISCO: "Armazenamento", FLASH: "Armazenamento" }
var pesoStatus = { semDados: -1, normal: 0, atencao: 1, critico: 2 }
var umDiaMs = 24 * 60 * 60 * 1000

function idValido(id) {
    return Number.isSafeInteger(id) && id > 0
}

function numeroOuNulo(valor) {
    var numero = valor === null || valor === undefined || valor === "" ? NaN : Number(valor)
    return Number.isFinite(numero) ? numero : null
}

function classificar(valor, limiteAtencao, limiteCritico) {
    if (valor === null) return "semDados"
    if (limiteCritico !== null && valor >= limiteCritico) return "critico"
    if (limiteAtencao !== null && valor >= limiteAtencao) return "atencao"
    return "normal"
}

function piorStatus(lista) {
    if (lista.length == 0) return "semDados"
    return lista.reduce(function (pior, status) {
        return pesoStatus[status] > pesoStatus[pior] ? status : pior
    }, "semDados")
}

function maisRecente(datas) {
    return datas.filter(Boolean).reduce(function (maior, data) {
        return !maior || Date.parse(data) > Date.parse(maior) ? data : maior
    }, null)
}

function indexarUltimaLeitura(leituras) {
    var porPlaca = new Map()
    leituras.forEach(function (linha) {
        var ts = typeof linha.ts == "string" && Number.isFinite(Date.parse(linha.ts)) ? new Date(linha.ts).toISOString() : null
        if (!ts || linha.placa_serie === null || linha.placa_serie === undefined) return
        var chave = `${linha.hostname}|${linha.placa_serie}`
        var anterior = porPlaca.get(chave)
        if (!anterior || ts > anterior.ts) porPlaca.set(chave, Object.assign({}, linha, { ts: ts }))
    })
    return porPlaca
}

function contarAlertas(alertas, inicio, fim) {
    var porPlaca = new Map()
    var abertosPorAeronave = new Map()
    alertas.forEach(function (alerta) {
        if (alerta.em_aberto_apos_evento) {
            var desde = abertosPorAeronave.get(alerta.aeronave_id)
            if (!desde || alerta.ts_abertura < desde) abertosPorAeronave.set(alerta.aeronave_id, alerta.ts_abertura)
        }
        var abertura = Date.parse(alerta.ts_abertura)
        if (abertura < inicio || abertura > fim) return
        var chave = `${alerta.hostname}|${alerta.placa_serie}`
        var contagem = porPlaca.get(chave) || { ocorrencias: 0, criticas: 0 }
        contagem.ocorrencias++
        if (alerta.nivel == "CRITICO") contagem.criticas++
        porPlaca.set(chave, contagem)
    })
    return { porPlaca: porPlaca, abertosPorAeronave: abertosPorAeronave }
}

function montarFrota(linhas, leituras, alertas) {
    var ultimasLeituras = indexarUltimaLeitura(leituras)
    var ultimaColeta = maisRecente(Array.from(ultimasLeituras.values()).map(function (linha) { return linha.ts }))
    var fim = ultimaColeta ? Date.parse(ultimaColeta) : Date.now()
    var inicio = fim - umDiaMs
    var contagem = contarAlertas(alertas, inicio, fim)

    var aeronaves = new Map()
    linhas.forEach(function (linha) {
        if (!aeronaves.has(linha.idAeronave)) {
            aeronaves.set(linha.idAeronave, {
                idAeronave: linha.idAeronave, nome: linha.aeronave, modelo: linha.modelo,
                companhiaAerea: linha.companhiaAerea, fmcs: new Map()
            })
        }
        var aeronave = aeronaves.get(linha.idAeronave)
        if (linha.idComputador === null) return
        if (!aeronave.fmcs.has(linha.idComputador)) {
            aeronave.fmcs.set(linha.idComputador, {
                idComputador: linha.idComputador, nome: linha.computador || `FMC ${linha.tipoFmc}`,
                tipoFmc: linha.tipoFmc, hostname: linha.hostname, statusComputador: linha.statusComputador,
                placas: new Map()
            })
        }
        var fmc = aeronave.fmcs.get(linha.idComputador)
        if (linha.idPlaca === null) return
        if (!fmc.placas.has(linha.idPlaca)) {
            var chavePlaca = `${linha.hostname}|${linha.numeroSerie}`
            var alertasPlaca = contagem.porPlaca.get(chavePlaca) || { ocorrencias: 0, criticas: 0 }
            fmc.placas.set(linha.idPlaca, {
                idPlaca: linha.idPlaca, nome: linha.placa, numeroSerie: linha.numeroSerie,
                leitura: ultimasLeituras.get(chavePlaca) || null,
                ocorrencias: alertasPlaca.ocorrencias, criticas: alertasPlaca.criticas, componentes: []
            })
        }
        var placa = fmc.placas.get(linha.idPlaca)
        if (linha.idComponente === null) return
        var tipo = String(linha.tipo || "").toUpperCase()
        var coluna = colunaPorTipo[tipo]
        var valor = placa.leitura && coluna ? numeroOuNulo(placa.leitura[coluna]) : null
        var limiteAtencao = numeroOuNulo(linha.limiteAtencao)
        var limiteCritico = numeroOuNulo(linha.limiteCritico)
        placa.componentes.push({
            idComponente: linha.idComponente, tipo: tipo, nome: nomePorTipo[tipo] || tipo,
            valor: valor === null ? null : Math.round(valor * 10) / 10,
            limiteAtencao: limiteAtencao, limiteCritico: limiteCritico,
            status: classificar(valor, limiteAtencao, limiteCritico)
        })
    })

    var frota = Array.from(aeronaves.values()).map(function (aeronave) {
        var fmcs = Array.from(aeronave.fmcs.values()).map(function (fmc) {
            var placas = Array.from(fmc.placas.values()).map(function (placa) {
                return {
                    idPlaca: placa.idPlaca, nome: placa.nome, numeroSerie: placa.numeroSerie,
                    ultimaColeta: placa.leitura ? placa.leitura.ts : null,
                    status: piorStatus(placa.componentes.map(function (componente) { return componente.status })),
                    ocorrencias: placa.ocorrencias, criticas: placa.criticas, componentes: placa.componentes
                }
            })
            return {
                idComputador: fmc.idComputador, nome: fmc.nome, tipoFmc: fmc.tipoFmc,
                hostname: fmc.hostname, statusComputador: fmc.statusComputador,
                ultimaColeta: maisRecente(placas.map(function (placa) { return placa.ultimaColeta })),
                status: piorStatus(placas.map(function (placa) { return placa.status })),
                ocorrencias: placas.reduce(function (total, placa) { return total + placa.ocorrencias }, 0),
                criticas: placas.reduce(function (total, placa) { return total + placa.criticas }, 0),
                placas: placas
            }
        })
        return {
            idAeronave: aeronave.idAeronave, nome: aeronave.nome, modelo: aeronave.modelo,
            companhiaAerea: aeronave.companhiaAerea,
            ultimaColeta: maisRecente(fmcs.map(function (fmc) { return fmc.ultimaColeta })),
            alertaAbertoDesde: contagem.abertosPorAeronave.get(aeronave.idAeronave) || null,
            status: piorStatus(fmcs.map(function (fmc) { return fmc.status })),
            fmcs: fmcs
        }
    })

    return {
        ultimaColeta: ultimaColeta,
        janelaAlertas: { inicio: new Date(inicio).toISOString(), fim: new Date(fim).toISOString() },
        aeronaves: frota
    }
}

function responderErro(res, erro) {
    console.log("Erro ao montar a visão geral do analista:", erro.code || erro.name, erro.message)
    var mensagem = "Não foi possível carregar a visão geral. Confira a conexão com o banco e a configuração AWS."
    return res.status(erro.status || (erro.code && erro.code.startsWith("ER_") ? 500 : 503))
        .json({ mensagem: erro.status ? erro.message : mensagem })
}

function buscarVisaoGeral(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)
    if (!idValido(idFuncionario)) {
        return res.status(400).json({ mensagem: "O id do funcionário está inválido!" })
    }
    return alertaRelatorioModel.contexto(idFuncionario, "ANALISTA", null)
        .then(function (contexto) {
            return Promise.all([
                dashboardAnalistaModel.buscarEstrutura(contexto.empresaId),
                metricaModel.listarUltimaColeta(contexto.computadores),
                alertaModel.listar(contexto.computadores).then(function (eventos) {
                    return alertaRelatorioController.consolidar(eventos, contexto.computadores)
                })
            ])
        })
        .then(function (resultados) {
            res.status(200).json(montarFrota(resultados[0], resultados[1], resultados[2]))
        })
        .catch(function (erro) { responderErro(res, erro) })
}

module.exports = {
    buscarVisaoGeral,
    montarFrota,
    classificar
}
