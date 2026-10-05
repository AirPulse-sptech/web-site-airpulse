var database = require("../database/config")

function cadastrar(nome, modelo, numeroSerie, companhiaAerea, statusAeronave, idFuncionarioGestor) {
    console.log("ACESSEI O AERONAVE MODEL \n function cadastrar():", nome, modelo, numeroSerie, companhiaAerea, statusAeronave, idFuncionarioGestor)

    var instrucaoSql = `
        INSERT INTO aeronave (nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante)
            SELECT '${nome}', '${modelo}', '${numeroSerie}', '${statusAeronave}', NOW(), '${companhiaAerea}', fkEmpresaFabricante
            FROM funcionario
            WHERE idFuncionario = ${idFuncionarioGestor} AND cargo = 'GESTOR';
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

module.exports = {
    cadastrar
}
