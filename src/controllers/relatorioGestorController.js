var relatorioGestorModel = require("../models/relatorioGestorModel")
var relatorioModel = require("../models/relatorioModel")
var analiseRelatorioModel = require("../models/analiseRelatorioModel")
var analiseRelatorioController = require("./analiseRelatorioController")
var alertaRelatorioModel = require("../models/alertaRelatorioModel")

function listarPublicados(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else {
        return relatorioGestorModel.listarPublicados(idFuncionario)
            .then(function (resultado) {
                return analiseRelatorioModel.listarDaEmpresa(idFuncionario).then(function (analises) {
                    var porRelatorio = new Map()
                    for (var analise of analises) {
                        if (!porRelatorio.has(analise.fkRelatorio)) porRelatorio.set(analise.fkRelatorio, [])
                        porRelatorio.get(analise.fkRelatorio).push(analise)
                    }
                    resultado.forEach(function (relatorio) {
                        relatorio.analises = porRelatorio.get(relatorio.idRelatorio) || []
                    })
                    res.status(200).json(resultado)
                })
            })
            .catch(function (erro) {
                console.log(erro)
                console.log("\nHouve um erro ao listar os relatórios da empresa! Erro: ", erro.sqlMessage)
                res.status(500).json(erro.sqlMessage)
            })
    }
}

function analisar(req, res) {
    var idRelatorio = Number(req.params.idRelatorio)
    var idFuncionario = Number(req.params.idFuncionario)

    if (!Number.isSafeInteger(idRelatorio) || idRelatorio <= 0 || !Number.isSafeInteger(idFuncionario) || idFuncionario <= 0) {
        return res.status(400).json({ mensagem: "Informe um relatório e um gestor válidos." })
    } else {
        return relatorioGestorModel.buscarDetalhe(idRelatorio, idFuncionario)
            .then(function (relatorios) {
                
                if (relatorios.length == 0) {
                    res.status(404).json({ mensagem: "Relatório não encontrado ou sem permissão para análise." })
                    return
                }

                return analiseRelatorioController.processar(idRelatorio)
                    .then(function (processado) {
                        res.status(200).json({ mensagem: processado ? "Análise concluída." : "Relatório já analisado ou com análise em andamento." })
                    })
            })
            .catch(function (erro) {
                res.status(503).json({ mensagem: erro.code ? "Não foi possível salvar a análise. Confira o banco de dados." : erro.message })
            })
    }
}

function buscarDetalhe(req, res) {
    var idRelatorio = Number(req.params.idRelatorio)
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idRelatorio || !idFuncionario) {
        res.status(400).send("O id do relatório ou do funcionário está undefined!")
    } else {
        relatorioGestorModel.buscarDetalhe(idRelatorio, idFuncionario)
            .then(function (resultado) {
                if (resultado.length == 0) {
                    res.status(404).json({ mensagem: "Relatório não encontrado ou ainda não publicado." })
                    return
                }

                var relatorio = resultado[0]

                return Promise.all([relatorioModel.listarVinculados(idRelatorio), alertaRelatorioModel.listarVinculos(idRelatorio)]).then(function (resultados) {
                    var vinculados = resultados[0]
                    relatorio.autor = vinculados.find(function (pessoa) { return pessoa.papel == "AUTOR" }) || null
                    relatorio.coautores = vinculados.filter(function (pessoa) { return pessoa.papel == "COAUTOR" })
                    relatorio.alertas = resultados[1]
                    res.status(200).json(relatorio)
                })
            })
            .catch(function (erro) {
                console.log(erro)
                console.log("\nHouve um erro ao buscar o relatório! Erro: ", erro.sqlMessage)
                res.status(500).json(erro.sqlMessage)
            })
    }
}

module.exports = {
    listarPublicados,
    buscarDetalhe,
    analisar
}