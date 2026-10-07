var dashboardModel = require("../models/dashboardModel")

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

module.exports = {
    validarAcesso
}