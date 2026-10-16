var dashboardRelatorioModel = require("../models/dashboardRelatorioModel")

function buscarDashboardRelatorio(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)

    if (!Number.isInteger(idFuncionario) || idFuncionario <= 0) {
        res.status(400).send("O id do funcionário está inválido!")
    } else {
        Promise.all([
            dashboardRelatorioModel.buscarResumo(idFuncionario),
            dashboardRelatorioModel.buscarDistribuicaoCategoria(idFuncionario),
            dashboardRelatorioModel.buscarProducaoAnalista(idFuncionario),
            dashboardRelatorioModel.buscarHistoricoAtividade(idFuncionario),
            dashboardRelatorioModel.buscarServidoresOcorrencias(idFuncionario),
            dashboardRelatorioModel.buscarTabelaAnalistas(idFuncionario)
        ])
            .then(
                function (resultados) {
                    if (resultados[0].length == 0) {
                        res.status(404).send("Funcionário não encontrado.")
                    } else {
                        res.json({
                            resumo: resultados[0][0],
                            distribuicaoCategoria: resultados[1],
                            producaoAnalista: resultados[2],
                            historicoAtividade: resultados[3],
                            servidoresOcorrencias: resultados[4],
                            tabelaAnalistas: resultados[5]
                        })
                    }
                }
            ).catch(
                function (erro) {
                    console.log(erro)
                    console.log(
                        "\nHouve um erro ao buscar os dados dos relatórios! Erro: ",
                        erro.sqlMessage
                    )
                    res.status(500).json(erro.sqlMessage)
                }
            )
    }
}

module.exports = {
    buscarDashboardRelatorio
}
