var alertasDashModel = require("../models/alertasDashModel")
var alertaModel = require("../models/alertaModel")
var alertaRelatorioController = require("./alertaRelatorioController")

function idValido(id) {
    return Number.isSafeInteger(id) && id > 0
}

function listarHistorico(req, res) {
    var idComputador = Number(req.params.idComputador)
    var idFuncionario = Number(req.params.idFuncionario)
    var inicio = req.query.inicio
    var fim = req.query.fim

    if (!idValido(idComputador) || !idValido(idFuncionario)
        || !alertaRelatorioController.dataValida(inicio) || !alertaRelatorioController.dataValida(fim) || fim < inicio) {
        return res.status(400).json({ mensagem: "Informe computador, funcionário e período válidos." })
    }

    return alertasDashModel.buscarComputadorParaAlertas(idComputador, idFuncionario)
        .then(function (resultado) {
            if (resultado.length == 0) {
                return res.status(403).json({ mensagem: "Computador não encontrado ou sem permissão de acesso." })
            }

            var computador = resultado[0]

            return alertaModel.listar([computador]).then(function (eventos) {
                var alertas = alertaRelatorioController.consolidar(eventos, [computador])
                    .filter(function (alerta) { return alertaRelatorioController.noPeriodo(alerta, inicio, fim) })
                res.status(200).json(alertas)
            })
        })
        .catch(function (erro) {
            console.log("Erro ao buscar histórico de alertas:", erro.code || erro.name)
            res.status(erro.status || 503).json({
                mensagem: erro.status ? erro.message : "Não foi possível carregar os alertas. Confira a configuração AWS."
            })
        })
}

module.exports = { listarHistorico }