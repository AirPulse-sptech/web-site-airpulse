var database = require("../database/config")

function buscarResumo(idFuncionario) {
    console.log("ACESSEI O RELATORIO MODEL \n function buscarResumo():", idFuncionario)

    var instrucaoSql = `
        SELECT
            COUNT(r.idRelatorio) AS totalRelatorios,
            (SELECT COUNT(*) FROM funcionario an
                WHERE an.cargo = 'ANALISTA' AND an.statusSistema = '1'
                AND an.fkEmpresaFabricante = g.fkEmpresaFabricante) AS analistasAtivos
        FROM funcionario g
        LEFT JOIN aeronave a ON a.fkEmpresaFabricante = g.fkEmpresaFabricante
        LEFT JOIN relatorio r ON r.fkAeronave = a.idAeronave
        WHERE g.idFuncionario = ${idFuncionario}
        GROUP BY g.fkEmpresaFabricante;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarDistribuicaoCategoria(idFuncionario) {
    console.log("ACESSEI O RELATORIO MODEL \n function buscarDistribuicaoCategoria():", idFuncionario)

    var instrucaoSql = `
        SELECT r.categoria, COUNT(*) AS total
        FROM relatorio r
        JOIN aeronave a ON a.idAeronave = r.fkAeronave
        JOIN funcionario g ON g.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE g.idFuncionario = ${idFuncionario}
        GROUP BY r.categoria
        ORDER BY total DESC, r.categoria ASC;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarProducaoAnalista(idFuncionario) {
    console.log("ACESSEI O RELATORIO MODEL \n function buscarProducaoAnalista():", idFuncionario)

    var instrucaoSql = `
        SELECT f.idFuncionario, f.nome, COUNT(r.idRelatorio) AS total
        FROM funcionarioRelatorio fr
        JOIN funcionario f ON f.idFuncionario = fr.fkFuncionario
        JOIN relatorio r ON r.idRelatorio = fr.fkRelatorio
        JOIN aeronave a ON a.idAeronave = r.fkAeronave
        JOIN funcionario g ON g.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE g.idFuncionario = ${idFuncionario}
        AND f.cargo = 'ANALISTA' AND fr.papel = 'AUTOR'
        GROUP BY f.idFuncionario, f.nome
        ORDER BY total DESC, f.nome ASC;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarHistoricoAtividade(idFuncionario) {
    console.log("ACESSEI O RELATORIO MODEL \n function buscarHistoricoAtividade():", idFuncionario)

    var instrucaoSql = `
        SELECT DATE_FORMAT(r.dataCriacao, '%Y-%m-%d') AS dia, COUNT(*) AS total
        FROM relatorio r
        JOIN aeronave a ON a.idAeronave = r.fkAeronave
        JOIN funcionario g ON g.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE g.idFuncionario = ${idFuncionario}
        AND r.dataCriacao >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY dia
        ORDER BY dia ASC;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarServidoresOcorrencias(idFuncionario) {
    console.log("ACESSEI O RELATORIO MODEL \n function buscarServidoresOcorrencias():", idFuncionario)

    var instrucaoSql = `
        SELECT a.idAeronave, a.nome, a.modelo, COUNT(r.idRelatorio) AS total
        FROM relatorio r
        JOIN aeronave a ON a.idAeronave = r.fkAeronave
        JOIN funcionario g ON g.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE g.idFuncionario = ${idFuncionario}
        GROUP BY a.idAeronave, a.nome, a.modelo
        ORDER BY total DESC, a.nome ASC
        LIMIT 5;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarTabelaAnalistas(idFuncionario) {
    console.log("ACESSEI O RELATORIO MODEL \n function buscarTabelaAnalistas():", idFuncionario)

        var instrucaoSql = `
        SELECT f.idFuncionario, f.nome, COUNT(*) AS total,
            (SELECT r2.categoria
                FROM funcionarioRelatorio fr2
                JOIN relatorio r2 ON r2.idRelatorio = fr2.fkRelatorio
                WHERE fr2.fkFuncionario = f.idFuncionario AND fr2.papel = 'AUTOR'
                GROUP BY r2.categoria
                ORDER BY COUNT(*) DESC, r2.categoria ASC
                LIMIT 1) AS categoriaMaisFrequente
        FROM funcionarioRelatorio fr
        JOIN funcionario f ON f.idFuncionario = fr.fkFuncionario
        JOIN relatorio r ON r.idRelatorio = fr.fkRelatorio
        JOIN aeronave a ON a.idAeronave = r.fkAeronave
        WHERE a.fkEmpresaFabricante = (SELECT fkEmpresaFabricante FROM funcionario WHERE idFuncionario = ${idFuncionario})
        AND f.cargo = 'ANALISTA' AND fr.papel = 'AUTOR'
        GROUP BY f.idFuncionario, f.nome
        ORDER BY total DESC, f.nome ASC;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

module.exports = {
    buscarResumo,
    buscarDistribuicaoCategoria,
    buscarProducaoAnalista,
    buscarHistoricoAtividade,
    buscarServidoresOcorrencias,
    buscarTabelaAnalistas
}
