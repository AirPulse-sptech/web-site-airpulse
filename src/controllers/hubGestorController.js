var alertaRelatorioModel = require("../models/alertaRelatorioModel")
var hubGestorModel = require("../models/hubGestorModel")
var dashboardAnalistaController = require("./dashboardAnalistaController")

function resumirStatus(visaoGeral) {
    var contagem = { normal: 0, atencao: 0, critico: 0, semDados: 0 }
    visaoGeral.aeronaves.forEach(function (aeronave) {
        contagem[aeronave.status]++
    })
    return {
        total: visaoGeral.aeronaves.length,
        contagem: contagem,
        ultimaColeta: visaoGeral.ultimaColeta,
        avisos: visaoGeral.avisos
    }
}

function buscarResumo(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)
    if (!Number.isSafeInteger(idFuncionario) || idFuncionario <= 0) {
        return res.status(400).json({ mensagem: "O id do funcionário está inválido!" })
    }
    return alertaRelatorioModel.contexto(idFuncionario, "GESTOR", null)
        .then(function (contexto) {
            return Promise.all([
                dashboardAnalistaController.montarVisaoGeral(contexto),
                hubGestorModel.listarUltimasAeronaves(contexto.empresaId),
                hubGestorModel.contarFmcs(contexto.empresaId),
                hubGestorModel.listarUltimosRelatorios(contexto.empresaId),
                hubGestorModel.contarRelatorios(contexto.empresaId)
            ])
        })
        .then(function (resultados) {
            var fmcs = resultados[2][0] || {}
            var relatorios = resultados[4][0] || {}
            res.status(200).json({
                visaoGeral: resumirStatus(resultados[0]),
                frota: {
                    ultimasAeronaves: resultados[1].map(function (aeronave) {
                        return Object.assign({}, aeronave, { quantidadeFmcs: Number(aeronave.quantidadeFmcs) })
                    }),
                    fmcsAtivos: Number(fmcs.ativos || 0),
                    fmcsInativos: Number(fmcs.inativos || 0)
                },
                relatorios: {
                    ultimos: resultados[3],
                    criticos: Number(relatorios.criticos || 0),
                    atencao: Number(relatorios.atencao || 0)
                }
            })
        })
        .catch(function (erro) { dashboardAnalistaController.responderErro(res, erro) })
}

module.exports = {
    buscarResumo
}