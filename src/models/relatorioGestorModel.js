var database = require("../database/config")

function listarPublicados(idFuncionario) {
    var instrucaoSql = `
        SELECT r.idRelatorio, r.titulo, r.criticidade,
            a.nome AS aeronave, a.modelo,
            autor.nome AS autor,
            DATE_FORMAT(r.periodoInicio, '%d/%m/%Y') AS periodoInicio,
            DATE_FORMAT(r.periodoFim, '%d/%m/%Y') AS periodoFim,
            DATE_FORMAT(r.dataCriacao, '%d/%m/%Y') AS dataCriacao
        FROM relatorio r
            JOIN aeronave a ON a.idAeronave = r.fkAeronave
            JOIN funcionario gestor ON gestor.fkEmpresaFabricante = a.fkEmpresaFabricante
            LEFT JOIN funcionarioRelatorio fr ON fr.fkRelatorio = r.idRelatorio AND fr.papel = 'AUTOR'
            LEFT JOIN funcionario autor ON autor.idFuncionario = fr.fkFuncionario
        WHERE gestor.idFuncionario = ${idFuncionario}
            AND gestor.cargo = 'GESTOR'
            AND r.statusRelatorio = 'PUBLICADO'
        ORDER BY r.dataCriacao DESC, r.idRelatorio DESC;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function buscarDetalhe(idRelatorio, idFuncionario) {
    var instrucaoSql = `
        SELECT r.idRelatorio, r.titulo, r.texto, r.criticidade, r.fkAeronave,
            a.nome AS aeronave, a.modelo, a.companhiaAerea,
            DATE_FORMAT(r.periodoInicio, '%d/%m/%Y') AS periodoInicio,
            DATE_FORMAT(r.periodoFim, '%d/%m/%Y') AS periodoFim,
            DATE_FORMAT(r.dataCriacao, '%d/%m/%Y') AS dataCriacao
        FROM relatorio r
            JOIN aeronave a ON a.idAeronave = r.fkAeronave
            JOIN funcionario gestor ON gestor.fkEmpresaFabricante = a.fkEmpresaFabricante
        WHERE r.idRelatorio = ${idRelatorio}
            AND gestor.idFuncionario = ${idFuncionario}
            AND gestor.cargo = 'GESTOR'
            AND r.statusRelatorio = 'PUBLICADO';
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

module.exports = {
    listarPublicados,
    buscarDetalhe
}