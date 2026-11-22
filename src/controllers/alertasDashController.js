var alertasModel = require("../models/alertasDashModel")
var alertasBucket = require("../models/alertaModel")
var calendario = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" })

function validarAcesso(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else {
        dashboardModel.buscarGestorAtivo(idFuncionario)
            .then(
                function (resultado) {
                    if (resultado.length == 0) {
                        res.status(403).send("Apenas o gestor ativo da empresa pode acessar a dashboard geral.")
                    } else {
                        res.json(resultado[0])
                    }
                }
            ).catch(
                function (erro) {
                    console.log(erro)
                    console.log("\nHouve um erro ao validar o acesso à dashboard geral! Erro: ", erro.sqlMessage)
                    res.status(500).json(erro.sqlMessage)
                }
            )
    }
}


function dataValida(valor) {
    return typeof valor == "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
        && Number.isFinite(Date.parse(valor)) && new Date(valor).toISOString().slice(0, 10) == valor
}

function noPeriodo(alerta, inicio, fim) {
    var dia = diaLocal(alerta.ts_abertura)
    return (!inicio || dia >= inicio) && (!fim || dia <= fim)
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







module.exports = {
    validarAcesso,
    dataValida,
    noPeriodo,
    buscarAlertas,
    calcularCobertura,
    responderErro,
    listar,
    cobertura
}