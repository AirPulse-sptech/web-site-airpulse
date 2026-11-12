var alertaModel = require("../models/alertaModel")
var alertaRelatorioModel = require("../models/alertaRelatorioModel")
var relatorioModel = require("../models/relatorioModel")

var calendario = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" })

function idValido(id) {
    return Number.isSafeInteger(id) && id > 0
}

function dataValida(valor) {
    return typeof valor == "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
        && Number.isFinite(Date.parse(valor)) && new Date(valor).toISOString().slice(0, 10) == valor
}

function diaLocal(timestamp) {
    var data = new Date(timestamp)
    if (!Number.isFinite(data.getTime())) throw new Error("Data inválida no JSON de alertas.")
    return calendario.format(data)
}

function noPeriodo(alerta, inicio, fim) {
    var dia = diaLocal(alerta.ts_abertura)
    return (!inicio || dia >= inicio) && (!fim || dia <= fim)
}

function consolidar(eventos, computadores) {
    var porId = new Map()
    for (var item of eventos) {
        if (!item || typeof item.alerta_id != "string" || !item.alerta_id.trim() || item.alerta_id != item.alerta_id.trim() || item.alerta_id.length > 512
            || !["ATENCAO", "CRITICO"].includes(item.nivel) || typeof item.metrica != "string"
            || typeof item.ts_abertura != "string" || !Number.isFinite(Date.parse(item.ts_abertura))
            || typeof item.ts_evento != "string" || !Number.isFinite(Date.parse(item.ts_evento))) {
            throw new Error("Formato inválido no JSON de alertas.")
        }
        var computador = computadores.find(function (computador) {
            return computador.hostname == item.hostname && computador.idComputador == Number(item.computador_id)
                && computador.idAeronave == Number(item.aeronave_id) && computador.empresaId == Number(item.empresa_id)
        })
        if (!computador) continue
        var anterior = porId.get(item.alerta_id)
        if (anterior && (anterior.aeronave_id != Number(item.aeronave_id)
            || anterior.computador_id != Number(item.computador_id)
            || anterior.ts_abertura != new Date(item.ts_abertura).toISOString())) {
            throw new Error("Identidade inconsistente no JSON de alertas.")
        }
        if (!anterior || Date.parse(item.ts_evento) >= Date.parse(anterior.ts_evento)) {
            porId.set(item.alerta_id, {
                alerta_id: item.alerta_id, hostname: item.hostname,
                computador_id: computador.idComputador, aeronave_id: computador.idAeronave,
                empresa_id: computador.empresaId, aeronave_nome: computador.aeronave,
                tipo_fmc: computador.tipoFmc, placa_serie: String(item.placa_serie || ""),
                metrica: item.metrica, nivel: item.nivel, valor: item.valor,
                ts_abertura: new Date(item.ts_abertura).toISOString(), ts_evento: item.ts_evento,
                ts_encerramento: item.ts_encerramento || null,
                em_aberto_apos_evento: item.em_aberto_apos_evento === true
            })
        }
    }
    return Array.from(porId.values()).sort(function (a, b) { return b.ts_abertura.localeCompare(a.ts_abertura) })
}   

function buscarAlertas(computadores) {
    return alertaModel.listar(computadores).then(function (eventos) {
        return consolidar(eventos, computadores)
    })
}

function calcularCobertura(alertas, idsCobertos, inicio, fim) {
    var unicos = new Map()
    alertas.forEach(function (alerta) {
        if (noPeriodo(alerta, inicio, fim)) unicos.set(alerta.alerta_id, alerta)
    })
    var total = unicos.size
    var cobertos = Array.from(unicos.keys()).filter(function (id) { return idsCobertos.has(id) }).length
    return { total: total, cobertos: cobertos, pendentes: total - cobertos, percentual: total ? cobertos / total * 100 : null }
}

function responderErro(res, erro) {
    console.log("Erro ao consultar alertas:", erro.code || erro.name)
    var mensagem = "Não foi possível carregar os alertas. Confira a conexão com o banco e a configuração AWS."
    if (erro.code == "ER_NO_SUCH_TABLE") mensagem = "Falta uma tabela no banco. Confira o bloco CREATE TABLE relatorioAlerta no scriptBd.sql."
    return res.status(erro.status || (erro.code == "ER_NO_SUCH_TABLE" ? 500 : 503)).json({ mensagem: erro.status ? erro.message : mensagem })
}

function listar(req, res) {
    var idAeronave = Number(req.params.idAeronave)
    var idFuncionario = Number(req.params.idFuncionario)
    var inicio = req.query.inicio
    var fim = req.query.fim
    if (!idValido(idAeronave) || !idValido(idFuncionario) || !dataValida(inicio) || !dataValida(fim) || fim < inicio) {
        return res.status(400).json({ mensagem: "Informe aeronave, funcionário e período válidos." })
    }
    return alertaRelatorioModel.contexto(idFuncionario, "ANALISTA", idAeronave)
        .then(function (contexto) { return buscarAlertas(contexto.computadores) })
        .then(function (alertas) {
            res.status(200).json(alertas.filter(function (alerta) { return noPeriodo(alerta, inicio, fim) }))
        })
        .catch(function (erro) { responderErro(res, erro) })
}

function cobertura(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)
    var idAeronave = req.query.aeronave ? Number(req.query.aeronave) : null
    var dias = req.query.dias || "7"
    if (!idValido(idFuncionario) || (idAeronave !== null && !idValido(idAeronave)) || !["7", "30", "90", "TODOS"].includes(dias)) {
        return res.status(400).json({ mensagem: "Informe filtros válidos para a cobertura." })
    }
    return alertaRelatorioModel.contexto(idFuncionario, "GESTOR", idAeronave)
        .then(function (contexto) {
            return Promise.all([buscarAlertas(contexto.computadores), alertaRelatorioModel.listarCobertos(contexto.empresaId, idAeronave)])
                .then(function (resultados) {
                    var fim = diaLocal(new Date())
                    var inicio = null
                    if (dias != "TODOS") {
                        var dataInicio = new Date(`${fim}T12:00:00Z`)
                        dataInicio.setUTCDate(dataInicio.getUTCDate() - Number(dias) + 1)
                        inicio = dataInicio.toISOString().slice(0, 10)
                    }
                    var idsCobertos = new Set(resultados[1].map(function (vinculo) { return vinculo.alertaIdAws }))
                    var resumo = calcularCobertura(resultados[0], idsCobertos, inicio, dias == "TODOS" ? null : fim)
                    resumo.aeronaves = contexto.aeronaves
                    res.status(200).json(resumo)
                })
        })
        .catch(function (erro) { responderErro(res, erro) })
}

function validarSelecao(dados, idRelatorio) {
    var ids = dados.alertas
    if (!Array.isArray(ids) || ids.length > 500 || ids.some(function (id) { return typeof id != "string" || !id.trim() || id.length > 512 })
        || new Set(ids).size != ids.length) {
        return Promise.reject(Object.assign(new Error("Selecione até 500 alertas válidos, sem repetições."), { status: 400 }))
    }
    if (ids.length == 0) return Promise.resolve([])
    return alertaRelatorioModel.contexto(dados.idFuncionario, "ANALISTA", dados.fkAeronave)
        .then(function (contexto) {
            var anteriores = Promise.resolve([])
            if (idRelatorio) {
                anteriores = relatorioModel.buscarVinculo(idRelatorio, dados.idFuncionario).then(function (vinculo) {
                    if (vinculo.length == 0) throw Object.assign(new Error("Relatório sem permissão de edição."), { status: 403 })
                    return alertaRelatorioModel.listarVinculos(idRelatorio)
                })
            }
            return anteriores.then(function (salvos) {
                var porId = new Map()
                salvos.forEach(function (alerta) {
                    if (alerta.aeronave_id == dados.fkAeronave && alerta.empresa_id == contexto.empresaId) porId.set(alerta.alerta_id, alerta)
                })
                var disponiveis = Promise.resolve([])
                if (ids.some(function (id) { return !porId.has(id) })) {
                    disponiveis = buscarAlertas(contexto.computadores).catch(function () {
                        throw Object.assign(new Error("Não foi possível validar os alertas na AWS. Tente novamente."), { status: 503 })
                    })
                }
                return disponiveis.then(function (alertas) {
                    alertas.forEach(function (alerta) { porId.set(alerta.alerta_id, alerta) })
                    return ids.map(function (id) {
                        var alerta = porId.get(id)
                        if (!alerta || !noPeriodo(alerta, dados.periodoInicio, dados.periodoFim)) {
                            throw Object.assign(new Error("Há alerta fora da aeronave ou do período analisado. Revise a seleção."), { status: 400 })
                        }
                        return alerta
                    })
                })
            })
        })
}

module.exports = {
    listar,
    cobertura,
    validarSelecao,
    dataValida,
    consolidar,
    noPeriodo,
    diaLocal,
    calcularCobertura
}
