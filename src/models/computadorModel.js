var database = require("../database/config")

function buscarPorAeronave(fkAeronave) {
    var instrucaoSql = `
        SELECT idComputador, tipoFmc FROM computador WHERE fkAeronave = ${fkAeronave};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function cadastrarComputador(nome, tipoFmc, numeroSerie, modelo, statusComputador, dataInstalacao, entradaSistema, fkAeronave) {
    var instrucaoSql = `
        INSERT INTO computador (nome, tipoFmc, numeroSerie, modelo, statusComputador, dataInstalacao, entradaSistema, fkAeronave)
        VALUES ('${nome}', '${tipoFmc}', '${numeroSerie}', '${modelo}', '${statusComputador}', '${dataInstalacao}', '${entradaSistema}', ${fkAeronave});
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function cadastrarPlaca(nome, modelo, numeroSerie, fkComputador) {
    var instrucaoSql = `
        INSERT INTO placa (nome, modelo, numeroSerie, fkComputador)
        VALUES ('${nome}', '${modelo}', '${numeroSerie}', ${fkComputador});
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function cadastrarComponente(tipo, modelo, statusMonitoramento, limiteAtencao, limiteCritico, fkPlaca) {
    var instrucaoSql = `
        INSERT INTO componente (tipo, modelo, statusMonitoramento, limiteAtencao, limiteCritico, fkPlaca)
        VALUES ('${tipo}', '${modelo}', '${statusMonitoramento}', ${limiteAtencao}, ${limiteCritico}, ${fkPlaca});
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function cadastrarMetricas(metricas, fkComponente) {
    var valores = metricas.map(function (metrica) {
        return `('${metrica.nome}', '${metrica.unidadeMedida}', '${metrica.descricao}', ${fkComponente})`
    })

    var instrucaoSql = `
        INSERT INTO metrica (nome, unidadeMedida, descricao, fkComponente)
        VALUES ${valores.join(", ")};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function excluirComputador(idComputador) {
    var instrucoes = [
        `DELETE m FROM metrica m
            JOIN componente co ON m.fkComponente = co.idComponente
            JOIN placa p ON co.fkPlaca = p.idPlaca
            WHERE p.fkComputador = ${idComputador};`,
        `DELETE co FROM componente co
            JOIN placa p ON co.fkPlaca = p.idPlaca
            WHERE p.fkComputador = ${idComputador};`,
        `DELETE FROM placa WHERE fkComputador = ${idComputador};`,
        `DELETE FROM computador WHERE idComputador = ${idComputador};`
    ]

    return instrucoes.reduce(function (anterior, instrucaoSql) {
        return anterior.then(function () {
            return database.executar(instrucaoSql)
        })
    }, Promise.resolve())
}

function buscarMonitoramento(idAeronave, idFuncionario) {
    var instrucaoSql = `
        SELECT c.idComputador, c.tipoFmc, c.statusComputador,
            co.tipo, co.limiteAtencao, co.limiteCritico
        FROM aeronave a
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
            JOIN computador c ON c.fkAeronave = a.idAeronave
            JOIN placa p ON p.fkComputador = c.idComputador
            JOIN componente co ON co.fkPlaca = p.idPlaca
        WHERE a.idAeronave = ${idAeronave}
            AND f.idFuncionario = ${idFuncionario}
            AND co.statusMonitoramento = 'ATIVO'
        ORDER BY c.tipoFmc, FIELD(co.tipo, 'CPU', 'RAM', 'DISCO');
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

module.exports = {
    buscarMonitoramento,
    buscarPorAeronave,
    cadastrarComputador,
    cadastrarPlaca,
    cadastrarComponente,
    cadastrarMetricas,
    excluirComputador
}
