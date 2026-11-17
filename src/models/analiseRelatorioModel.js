var database = require("../database/config")
var mysql = require("mysql2")

function buscar(idRelatorio) {
    var instrucaoSql = mysql.format(`SELECT idRelatorio, texto, statusAnalise
        FROM relatorio
        WHERE idRelatorio = ? AND statusRelatorio = 'PUBLICADO';`, [idRelatorio])
    return database.executar(instrucaoSql)
}

function reservar(idRelatorio) {
    var instrucaoSql = mysql.format(`UPDATE relatorio
        SET statusAnalise = 'PROCESSANDO', dataProcessamentoAnalise = NOW(), erroAnalise = NULL
        WHERE idRelatorio = ? AND statusRelatorio = 'PUBLICADO'
        AND (statusAnalise IN ('PENDENTE', 'ERRO') OR (statusAnalise = 'PROCESSANDO' AND dataProcessamentoAnalise < DATE_SUB(NOW(), INTERVAL 2 MINUTE)));`, [idRelatorio])
    return database.executar(instrucaoSql)
}

function salvar(idRelatorio, analises) {
    var instrucaoSql = mysql.format("DELETE FROM analiseRelatorio WHERE fkRelatorio = ?;", [idRelatorio])
    return database.executar(instrucaoSql)
        .then(function () {
            if (analises.length == 0) return

            var valores = analises.map(function (analise) {
                return [idRelatorio, analise.componente, analise.sintoma, analise.situacao, analise.recomendacao, analise.trechoEvidencia]
            })
            var instrucaoSql = mysql.format(`INSERT INTO analiseRelatorio
                (fkRelatorio, componente, sintoma, situacao, recomendacao, trechoEvidencia)
                VALUES ?;`, [valores])
            return database.executar(instrucaoSql)
        })
        .then(function () {
            var instrucaoSql = mysql.format(`UPDATE relatorio
                SET statusAnalise = 'CONCLUIDO', erroAnalise = NULL, dataProcessamentoAnalise = NOW()
                WHERE idRelatorio = ?;`, [idRelatorio])
            return database.executar(instrucaoSql)
        })
}

function registrarErro(idRelatorio, mensagem) {
    var instrucaoSql = mysql.format(`UPDATE relatorio
        SET statusAnalise = 'ERRO', erroAnalise = ?, dataProcessamentoAnalise = NOW()
        WHERE idRelatorio = ?;`, [mensagem.slice(0, 255), idRelatorio])
    return database.executar(instrucaoSql)
}

function listarDaEmpresa(idFuncionario) {
    var instrucaoSql = mysql.format(`SELECT an.* FROM analiseRelatorio an
        JOIN relatorio r ON r.idRelatorio = an.fkRelatorio
        JOIN aeronave a ON a.idAeronave = r.fkAeronave
        JOIN funcionario g ON g.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE g.idFuncionario = ? AND g.cargo = 'GESTOR' AND r.statusRelatorio = 'PUBLICADO'
        AND r.statusAnalise = 'CONCLUIDO';`, [idFuncionario])
    return database.executar(instrucaoSql)
}

module.exports = {
    buscar,
    reservar,
    salvar,
    registrarErro,
    listarDaEmpresa
}
