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

function listarAeronaves(idFuncionario) {
    var instrucaoSql = `
        SELECT a.idAeronave AS id, a.nome, a.modelo, a.companhiaAerea,
            COALESCE(SUM(c.tipoFmc = 'MESTRE'), 0) > 0 AS possuiMestre,
            COALESCE(SUM(c.tipoFmc = 'SPARE'), 0) > 0 AS possuiSpare
        FROM aeronave a
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
            LEFT JOIN computador c ON c.fkAeronave = a.idAeronave
        WHERE f.idFuncionario = ${idFuncionario}
        GROUP BY a.idAeronave, a.nome, a.modelo, a.companhiaAerea
        ORDER BY a.nome;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarAeronaveDoGestor(fkAeronave, idFuncionario) {
    var instrucaoSql = `
        SELECT a.idAeronave
        FROM aeronave a
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE a.idAeronave = ${fkAeronave}
            AND f.idFuncionario = ${idFuncionario}
            AND f.cargo = 'GESTOR';
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarAnalistaDaAeronave(idFuncionario, idAeronave) {
    var instrucaoSql = `
        SELECT f.idFuncionario
        FROM funcionario f
            JOIN aeronave a ON a.fkEmpresaFabricante = f.fkEmpresaFabricante
        WHERE f.idFuncionario = ${idFuncionario}
            AND f.cargo = 'ANALISTA'
            AND a.idAeronave = ${idAeronave};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

module.exports = {
    listarAeronaves,
    buscarAeronaveDoGestor,
    buscarAnalistaDaAeronave,
    cadastrar
}
