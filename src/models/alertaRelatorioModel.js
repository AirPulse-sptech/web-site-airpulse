var database = require("../database/config")
var mysql = require("mysql2")

function contexto(idFuncionario, cargo, idAeronave) {
    var instrucaoSql = mysql.format(`
        SELECT fkEmpresaFabricante AS empresaId FROM funcionario
        WHERE idFuncionario = ? AND cargo = ? AND statusSistema = '1';
    `, [idFuncionario, cargo])
    return database.executar(instrucaoSql).then(function (usuarios) {
        if (usuarios.length == 0) throw Object.assign(new Error("Funcionário sem permissão."), { status: 403 })
        var empresaId = usuarios[0].empresaId
        var instrucaoAeronaves = mysql.format(`
            SELECT idAeronave AS id, nome FROM aeronave WHERE fkEmpresaFabricante = ? ORDER BY nome;
        `, [empresaId])
        return database.executar(instrucaoAeronaves).then(function (aeronaves) {
            if (idAeronave && !aeronaves.some(function (aeronave) { return aeronave.id == idAeronave })) {
                throw Object.assign(new Error("Aeronave não encontrada na sua empresa."), { status: 403 })
            }
            var instrucaoComputadores = mysql.format(`
                SELECT c.idComputador, c.hostname, c.tipoFmc, a.idAeronave, a.nome AS aeronave,
                    a.fkEmpresaFabricante AS empresaId
                FROM computador c JOIN aeronave a ON a.idAeronave = c.fkAeronave
                WHERE a.fkEmpresaFabricante = ? AND (? IS NULL OR a.idAeronave = ?);
            `, [empresaId, idAeronave || null, idAeronave || null])
            return database.executar(instrucaoComputadores).then(function (computadores) {
                return { empresaId: empresaId, aeronaves: aeronaves, computadores: computadores }
            })
        })
    })
}

function listarVinculos(idRelatorio) {
    var instrucaoSql = mysql.format(`
        SELECT dadosAlerta FROM relatorioAlerta WHERE fkRelatorio = ? ORDER BY alertaIdAws;
    `, [idRelatorio])
    return database.executar(instrucaoSql).then(function (linhas) {
        return linhas.map(function (linha) {
            return typeof linha.dadosAlerta == "string" ? JSON.parse(linha.dadosAlerta) : linha.dadosAlerta
        })
    })
}

function salvarVinculos(idRelatorio, alertas) {
    var inserir = Promise.resolve()
    if (alertas.length > 0) {
        var valores = alertas.map(function (alerta) {
            return [idRelatorio, alerta.alerta_id, JSON.stringify(alerta)]
        })
        var instrucaoSql = mysql.format(`
            INSERT INTO relatorioAlerta (fkRelatorio, alertaIdAws, dadosAlerta)
            VALUES ? ON DUPLICATE KEY UPDATE alertaIdAws = VALUES(alertaIdAws);
        `, [valores])
        inserir = database.executar(instrucaoSql)
    }
    return inserir.then(function () {
        var ids = alertas.map(function (alerta) { return alerta.alerta_id })
        var instrucaoSql = ids.length > 0
            ? mysql.format("DELETE FROM relatorioAlerta WHERE fkRelatorio = ? AND alertaIdAws NOT IN (?);", [idRelatorio, ids])
            : mysql.format("DELETE FROM relatorioAlerta WHERE fkRelatorio = ?;", [idRelatorio])
        return database.executar(instrucaoSql)
    })
}

function listarCobertos(empresaId, idAeronave) {
    var instrucaoSql = mysql.format(`
        SELECT DISTINCT ra.alertaIdAws FROM relatorioAlerta ra
        JOIN relatorio r ON r.idRelatorio = ra.fkRelatorio JOIN aeronave a ON a.idAeronave = r.fkAeronave
        WHERE a.fkEmpresaFabricante = ? AND r.statusRelatorio = 'PUBLICADO'
            AND (? IS NULL OR a.idAeronave = ?);
    `, [empresaId, idAeronave || null, idAeronave || null])
    return database.executar(instrucaoSql)
}

module.exports = {
    contexto,
    listarVinculos,
    salvarVinculos,
    listarCobertos
}
