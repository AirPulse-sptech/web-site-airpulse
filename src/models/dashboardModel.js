var database = require("../database/config")

function buscarGestorAtivo(idFuncionario) {
    var instrucaoSql = `
        SELECT idFuncionario AS id, nome, cargo, fkEmpresaFabricante AS empresaId
        FROM funcionario
        WHERE idFuncionario = ${idFuncionario} AND cargo = 'GESTOR' AND statusSistema = 1;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

module.exports = {
    buscarGestorAtivo
}