var database = require("../database/config")
var mysql = require("mysql2")

function buscarComputadorParaAlertas(idComputador, idFuncionario) {
    var instrucaoSql = mysql.format(`
        SELECT c.idComputador, c.hostname, c.tipoFmc, c.statusComputador,
            a.idAeronave, a.nome AS aeronave, a.fkEmpresaFabricante AS empresaId
        FROM computador c
            JOIN aeronave a ON a.idAeronave = c.fkAeronave
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE c.idComputador = ?
            AND f.idFuncionario = ?
            AND f.cargo = 'ANALISTA'
            AND f.statusSistema = '1';
    `, [idComputador, idFuncionario])
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

module.exports = { buscarComputadorParaAlertas }