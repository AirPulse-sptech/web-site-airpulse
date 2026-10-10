var database = require("../database/config")

function listarAnteriores(idAeronave, idFuncionario) {
    var instrucaoSql = `
        SELECT r.idRelatorio, r.titulo, r.statusRelatorio, r.criticidade,
            DATE_FORMAT(r.dataCriacao, '%d/%m/%Y') AS dataCriacao,
            autor.nome AS autor
        FROM relatorio r
            JOIN aeronave a ON a.idAeronave = r.fkAeronave
            JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
            LEFT JOIN funcionarioRelatorio fr ON fr.fkRelatorio = r.idRelatorio AND fr.papel = 'AUTOR'
            LEFT JOIN funcionario autor ON autor.idFuncionario = fr.fkFuncionario
        WHERE r.fkAeronave = ${idAeronave}
            AND f.idFuncionario = ${idFuncionario}
            AND (
                r.statusRelatorio = 'PUBLICADO'
                OR EXISTS (
                    SELECT 1 FROM funcionarioRelatorio vinculo
                    WHERE vinculo.fkRelatorio = r.idRelatorio AND vinculo.fkFuncionario = ${idFuncionario}
                )
            )
        ORDER BY r.dataCriacao DESC
        LIMIT 5;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarVinculo(idRelatorio, idFuncionario) {
    var instrucaoSql = `
        SELECT r.statusRelatorio, fr.papel
        FROM relatorio r
            JOIN funcionarioRelatorio fr ON fr.fkRelatorio = r.idRelatorio
        WHERE r.idRelatorio = ${idRelatorio}
            AND fr.fkFuncionario = ${idFuncionario};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function listarMeus(idFuncionario) {
    var instrucaoSql = `
        SELECT r.idRelatorio, r.titulo, r.statusRelatorio, r.criticidade, fr.papel,
            a.nome AS aeronave,
            DATE_FORMAT(r.periodoInicio, '%d/%m/%Y') AS periodoInicio,
            DATE_FORMAT(r.periodoFim, '%d/%m/%Y') AS periodoFim,
            DATE_FORMAT(r.dataCriacao, '%d/%m/%Y') AS dataCriacao
        FROM relatorio r
            JOIN funcionarioRelatorio fr ON fr.fkRelatorio = r.idRelatorio
            JOIN aeronave a ON a.idAeronave = r.fkAeronave
        WHERE fr.fkFuncionario = ${idFuncionario}
        ORDER BY r.dataCriacao DESC, r.idRelatorio DESC;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarDetalhe(idRelatorio, idFuncionario) {
    var instrucaoSql = `
        SELECT r.idRelatorio, r.titulo, r.texto, r.statusRelatorio, r.criticidade, r.fkAeronave, fr.papel,
            DATE_FORMAT(r.periodoInicio, '%Y-%m-%d') AS periodoInicio,
            DATE_FORMAT(r.periodoFim, '%Y-%m-%d') AS periodoFim
        FROM relatorio r
            JOIN funcionarioRelatorio fr ON fr.fkRelatorio = r.idRelatorio
        WHERE r.idRelatorio = ${idRelatorio}
            AND fr.fkFuncionario = ${idFuncionario};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function listarVinculados(idRelatorio) {
    var instrucaoSql = `
        SELECT f.idFuncionario AS id, f.nome, fr.papel
        FROM funcionarioRelatorio fr
            JOIN funcionario f ON f.idFuncionario = fr.fkFuncionario
        WHERE fr.fkRelatorio = ${idRelatorio}
        ORDER BY fr.papel = 'AUTOR' DESC, f.nome;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function cadastrar(titulo, periodoInicio, periodoFim, texto, statusRelatorio, criticidade, fkAeronave) {
    var instrucaoSql = `
        INSERT INTO relatorio (titulo, periodoInicio, periodoFim, texto, statusRelatorio, criticidade, fkAeronave)
        VALUES ('${titulo}', '${periodoInicio}', '${periodoFim}', '${texto}', '${statusRelatorio}', ${criticidade}, ${fkAeronave});
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function atualizar(idRelatorio, titulo, periodoInicio, periodoFim, texto, statusRelatorio, criticidade, fkAeronave) {
    var instrucaoSql = `
        UPDATE relatorio SET
            titulo = '${titulo}',
            periodoInicio = '${periodoInicio}',
            periodoFim = '${periodoFim}',
            texto = '${texto}',
            statusRelatorio = '${statusRelatorio}',
            criticidade = ${criticidade},
            fkAeronave = ${fkAeronave}
        WHERE idRelatorio = ${idRelatorio};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function vincularFuncionarios(idRelatorio, vinculos) {
    var valores = vinculos.map(function (vinculo) {
        return `(CURDATE(), '${vinculo.papel}', ${vinculo.idFuncionario}, ${idRelatorio})`
    })

    var instrucaoSql = `
        INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
        VALUES ${valores.join(", ")};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function removerCoautores(idRelatorio) {
    var instrucaoSql = `
        DELETE FROM funcionarioRelatorio WHERE fkRelatorio = ${idRelatorio} AND papel = 'COAUTOR';
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function excluir(idRelatorio) {
    return database.executar(`DELETE FROM funcionarioRelatorio WHERE fkRelatorio = ${idRelatorio};`)
        .then(function () {
            return database.executar(`DELETE FROM relatorio WHERE idRelatorio = ${idRelatorio};`)
        })
}

module.exports = {
    listarAnteriores,
    buscarVinculo,
    listarMeus,       
    buscarDetalhe,    
    listarVinculados, 
    cadastrar,
    atualizar,
    vincularFuncionarios,
    removerCoautores,
    excluir
}
