var database = require("../database/config")
var mysql = require("mysql2")

function buscarEstrutura(empresaId) {
    var instrucaoSql = mysql.format(`
        SELECT a.idAeronave, a.nome AS aeronave, a.modelo, a.companhiaAerea,
            c.idComputador, c.nome AS computador, c.tipoFmc, c.hostname, c.statusComputador,
            p.idPlaca, p.nome AS placa, p.numeroSerie,
            co.idComponente, co.tipo, co.limiteAtencao, co.limiteCritico
        FROM aeronave a
            LEFT JOIN computador c ON c.fkAeronave = a.idAeronave
            LEFT JOIN placa p ON p.fkComputador = c.idComputador
            LEFT JOIN componente co ON co.fkPlaca = p.idPlaca AND co.statusMonitoramento = 'ATIVO'
        WHERE a.fkEmpresaFabricante = ?
        ORDER BY a.nome, c.tipoFmc, c.idComputador, p.nome, p.idPlaca, co.tipo;
    `, [empresaId])
    return database.executar(instrucaoSql)
}

function buscarDetalhePlaca(idPlaca, empresaId) {
    var instrucaoSql = mysql.format(`
        SELECT a.idAeronave, a.nome AS aeronave, a.modelo, c.idComputador, c.nome AS computador,
            c.tipoFmc, c.hostname, p.idPlaca, p.nome AS placa, p.numeroSerie,
            co.idComponente, co.tipo, co.limiteAtencao, co.limiteCritico
        FROM placa p
            JOIN computador c ON c.idComputador = p.fkComputador
            JOIN aeronave a ON a.idAeronave = c.fkAeronave
            LEFT JOIN componente co ON co.fkPlaca = p.idPlaca AND co.statusMonitoramento = 'ATIVO'
        WHERE p.idPlaca = ? AND a.fkEmpresaFabricante = ?
        ORDER BY FIELD(co.tipo, 'CPU', 'RAM', 'DISCO', 'FLASH');
    `, [idPlaca, empresaId])
    return database.executar(instrucaoSql)
}

module.exports = {
    buscarEstrutura,
    buscarDetalhePlaca
}
