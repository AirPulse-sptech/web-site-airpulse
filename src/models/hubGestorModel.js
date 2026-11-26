var database = require("../database/config")
var mysql = require("mysql2")

function listarUltimasAeronaves(empresaId) {
    var instrucaoSql = mysql.format(`
        SELECT a.idAeronave, a.nome, a.modelo, a.statusAeronave, COUNT(c.idComputador) AS quantidadeFmcs
        FROM aeronave a
            LEFT JOIN computador c ON c.fkAeronave = a.idAeronave
        WHERE a.fkEmpresaFabricante = ?
        GROUP BY a.idAeronave, a.nome, a.modelo, a.statusAeronave
        ORDER BY a.idAeronave DESC
        LIMIT 3;
    `, [empresaId])
    return database.executar(instrucaoSql)
}

function contarFmcs(empresaId) {
    var instrucaoSql = mysql.format(`
        SELECT
            COALESCE(SUM(c.statusComputador = 'ATIVO'), 0) AS ativos,
            COALESCE(SUM(c.statusComputador <> 'ATIVO'), 0) AS inativos
        FROM computador c
            JOIN aeronave a ON a.idAeronave = c.fkAeronave
        WHERE a.fkEmpresaFabricante = ?;
    `, [empresaId])
    return database.executar(instrucaoSql)
}

function listarUltimosRelatorios(empresaId) {
    var instrucaoSql = mysql.format(`
        SELECT r.idRelatorio, r.titulo, r.criticidade, a.nome AS aeronave,
            DATE_FORMAT(r.dataCriacao, '%d/%m') AS dataCriacao
        FROM relatorio r
            JOIN aeronave a ON a.idAeronave = r.fkAeronave
        WHERE a.fkEmpresaFabricante = ? AND r.statusRelatorio = 'PUBLICADO'
        ORDER BY r.dataCriacao DESC, r.idRelatorio DESC
        LIMIT 3;
    `, [empresaId])
    return database.executar(instrucaoSql)
}

function contarRelatorios(empresaId) {
    var instrucaoSql = mysql.format(`
        SELECT
            COALESCE(SUM(r.criticidade = 'CRITICO'), 0) AS criticos,
            COALESCE(SUM(r.criticidade = 'ATENCAO'), 0) AS atencao
        FROM relatorio r
            JOIN aeronave a ON a.idAeronave = r.fkAeronave
        WHERE a.fkEmpresaFabricante = ? AND r.statusRelatorio = 'PUBLICADO';
    `, [empresaId])
    return database.executar(instrucaoSql)
}

module.exports = {
    listarUltimasAeronaves,
    contarFmcs,
    listarUltimosRelatorios,
    contarRelatorios
}
