var relatorioGestorModel = require("../models/relatorioGestorModel")
var relatorioModel = require("../models/relatorioModel")

function listarPublicados(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else {
        relatorioGestorModel.listarPublicados(idFuncionario)
            .then(function (resultado) {
                res.status(200).json(resultado)
            })
            .catch(function (erro) {
                console.log(erro)
                console.log("\nHouve um erro ao listar os relatórios da empresa! Erro: ", erro.sqlMessage)
                res.status(500).json(erro.sqlMessage)
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

                return relatorioModel.listarVinculados(idRelatorio).then(function (vinculados) {
                    relatorio.autor = vinculados.find(function (pessoa) { return pessoa.papel == "AUTOR" }) || null
                    relatorio.coautores = vinculados.filter(function (pessoa) { return pessoa.papel == "COAUTOR" })
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
    buscarDetalhe
}