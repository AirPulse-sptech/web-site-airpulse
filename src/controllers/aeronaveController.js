var aeronaveModel = require("../models/aeronaveModel")
const statusPermitidos = ["ATIVA", "MANUTENCAO", "INATIVA"]

function cadastrar(req, res) {
    var nome = req.body.nomeServer
    var modelo = req.body.modeloServer
    var numeroSerie = req.body.numeroSerieServer
    var companhiaAerea = req.body.companhiaAereaServer
    var statusAeronave = req.body.statusAeronaveServer
    var idFuncionarioGestor = req.body.idFuncionarioGestorServer

    if (nome == undefined) {
        res.status(400).send("O nome da aeronave está undefined!")
    } else {
        aeronaveModel.cadastrar(nome, modelo, numeroSerie, companhiaAerea, statusAeronave, idFuncionarioGestor)
            .then(
                function (resultado) {
                    if (resultado.affectedRows == 0) {
                        res.status(403).send("Apenas o gestor da empresa pode cadastrar aeronaves.")
                    } else {
                        res.json(resultado)
                    }
                }
            ).catch(
                function (erro) {
                    console.log(erro)
                    console.log(
                        "\nHouve um erro ao cadastrar a aeronave! Erro: ",
                        erro.sqlMessage
                    )
                    res.status(500).json(erro.sqlMessage)
                }
            )
    }
}

function listarAeronaves(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else {
        aeronaveModel.listarAeronaves(idFuncionario)
            .then(function (resultado) {
                res.status(200).json(resultado)
            })
            .catch(function (erro) {
                console.log(erro)
                console.log("\nHouve um erro ao listar as aeronaves! Erro: ", erro.sqlMessage)
                res.status(500).json(erro.sqlMessage)
            })
    }
}

module.exports = {
    listarAeronaves,
    cadastrar
}
