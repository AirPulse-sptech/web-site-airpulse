var database = require("../database/config")

function listar(idFuncionario) {
    var instrucaoSql = `
        SELECT a.idAeronave, a.nome, a.modelo, a.numeroSerie, a.companhiaAerea, a.statusAeronave,
            c.idComputador, c.nome AS nomeFmc, c.tipoFmc, c.modelo AS modeloFmc,
            c.numeroSerie AS numeroSerieFmc, c.statusComputador,
            DATE_FORMAT(c.dataInstalacao, '%Y-%m-%d') AS dataInstalacao
        FROM aeronave a
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
            LEFT JOIN computador c ON c.fkAeronave = a.idAeronave
        WHERE f.idFuncionario = ${idFuncionario}
            AND f.cargo = 'GESTOR'
        ORDER BY a.nome, c.tipoFmc;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function listarPlacas(idFuncionario) {
    var instrucaoSql = `
        SELECT p.idPlaca, p.nome, p.modelo, p.numeroSerie, p.fkComputador,
            co.idComponente, co.tipo, co.modelo AS modeloComponente, co.statusMonitoramento,
            co.limiteAtencao, co.limiteCritico
        FROM aeronave a
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
            JOIN computador c ON c.fkAeronave = a.idAeronave
            JOIN placa p ON p.fkComputador = c.idComputador
            LEFT JOIN componente co ON co.fkPlaca = p.idPlaca
        WHERE f.idFuncionario = ${idFuncionario}
            AND f.cargo = 'GESTOR'
        ORDER BY p.idPlaca;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function listarMetricas(idFuncionario) {
    var instrucaoSql = `
        SELECT m.nome, m.fkComponente
        FROM aeronave a
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
            JOIN computador c ON c.fkAeronave = a.idAeronave
            JOIN placa p ON p.fkComputador = c.idComputador
            JOIN componente co ON co.fkPlaca = p.idPlaca
            JOIN metrica m ON m.fkComponente = co.idComponente
        WHERE f.idFuncionario = ${idFuncionario}
            AND f.cargo = 'GESTOR'
        ORDER BY m.idMetrica;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarComputadoresDaAeronave(idAeronave) {
    var instrucaoSql = `
        SELECT idComputador FROM computador WHERE fkAeronave = ${idAeronave};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarAeronaveDoGestor(idAeronave, idFuncionario) {
    var instrucaoSql = `
        SELECT a.idAeronave
        FROM aeronave a
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE a.idAeronave = ${idAeronave}
            AND f.idFuncionario = ${idFuncionario}
            AND f.cargo = 'GESTOR';
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarComputadorDoGestor(idComputador, idFuncionario) {
    var instrucaoSql = `
        SELECT c.idComputador
        FROM computador c
            JOIN aeronave a ON a.idAeronave = c.fkAeronave
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE c.idComputador = ${idComputador}
            AND f.idFuncionario = ${idFuncionario}
            AND f.cargo = 'GESTOR';
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function editarAeronave(idAeronave, nome, modelo, numeroSerie, companhiaAerea, statusAeronave) {
    var instrucaoSql = `
        UPDATE aeronave SET
            nome = '${nome}',
            modelo = '${modelo}',
            numeroSerie = '${numeroSerie}',
            companhiaAerea = '${companhiaAerea}',
            statusAeronave = '${statusAeronave}'
        WHERE idAeronave = ${idAeronave};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function editarComputador(idComputador, fkAeronave, nome, modelo, numeroSerie, statusComputador, dataInstalacao) {
    var instrucaoSql = `
        UPDATE computador SET
            nome = '${nome}',
            modelo = '${modelo}',
            numeroSerie = '${numeroSerie}',
            statusComputador = '${statusComputador}',
            dataInstalacao = '${dataInstalacao}'
        WHERE idComputador = ${idComputador}
            AND fkAeronave = ${fkAeronave};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function editarPlaca(idPlaca, fkComputador, nome, modelo, numeroSerie) {
    var instrucaoSql = `
        UPDATE placa SET
            nome = '${nome}',
            modelo = '${modelo}',
            numeroSerie = '${numeroSerie}'
        WHERE idPlaca = ${idPlaca}
            AND fkComputador = ${fkComputador};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function editarComponente(idComponente, fkPlaca, fkComputador, modelo, statusMonitoramento, limiteAtencao, limiteCritico) {
    var instrucaoSql = `
        UPDATE componente co
            JOIN placa p ON p.idPlaca = co.fkPlaca
        SET co.modelo = '${modelo}',
            co.statusMonitoramento = '${statusMonitoramento}',
            co.limiteAtencao = ${limiteAtencao},
            co.limiteCritico = ${limiteCritico}
        WHERE co.idComponente = ${idComponente}
            AND p.idPlaca = ${fkPlaca}
            AND p.fkComputador = ${fkComputador};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function alterarStatusAeronave(idAeronave, statusAeronave) {
    var instrucaoSql = `
        UPDATE aeronave SET statusAeronave = '${statusAeronave}' WHERE idAeronave = ${idAeronave};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function alterarStatusComputador(idComputador, statusComputador) {
    var instrucaoSql = `
        UPDATE computador SET statusComputador = '${statusComputador}' WHERE idComputador = ${idComputador};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

module.exports = {
    listar,
    listarPlacas,
    listarMetricas,
    buscarComputadoresDaAeronave,
    buscarAeronaveDoGestor,
    buscarComputadorDoGestor,
    editarAeronave,
    editarComputador,
    editarPlaca,
    editarComponente,
    alterarStatusAeronave,
    alterarStatusComputador
}