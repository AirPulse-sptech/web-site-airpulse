var database = require("../database/config")

function autenticar(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha)
    var instrucaoSql = `
        SELECT idFuncionario AS id, nome, emailCorporativo AS email, cargo, fkEmpresaFabricante AS empresaId
        FROM funcionario
        WHERE emailCorporativo = '${email}' AND senha = '${senha}' AND statusSistema = '1';
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function cadastrar(nome, email, dtNascimento, cpf, cargo, senha, telefone, idFuncionarioAdm) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, dtNascimento, cpf, cargo, senha, telefone, idFuncionarioAdm)

    var instrucaoSql = `
        INSERT INTO funcionario (nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha, statusSistema, entradaSistema, fkEmpresaFabricante)
            SELECT '${nome}', '${dtNascimento}', '${email}', '${telefone}', '${cpf}', '${cargo}', '${senha}', 1, NOW(), fkEmpresaFabricante
            FROM funcionario
            WHERE idFuncionario = ${idFuncionarioAdm};
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function listarAnalistas(idFuncionario) {
    var instrucaoSql = `
        SELECT outro.idFuncionario AS id, outro.nome
        FROM funcionario outro
            JOIN funcionario f ON f.fkEmpresaFabricante = outro.fkEmpresaFabricante
        WHERE f.idFuncionario = ${idFuncionario}
            AND outro.cargo = 'ANALISTA'
            AND outro.idFuncionario <> ${idFuncionario}
        ORDER BY outro.nome;
    `
    console.log("Executando a instrução SQL: \n" + instrucaoSql)
    return database.executar(instrucaoSql)
}

function listarFuncionarios(idGestor) {
    var instrucaoSql = `
            SELECT f.idFuncionario, f.nome, f.emailCorporativo AS email, f.statusSistema, f.cargo,
                COUNT(a.idAeronave) AS totalAeronaves
            FROM funcionario f
                JOIN funcionario gestor ON gestor.fkEmpresaFabricante = f.fkEmpresaFabricante
                LEFT JOIN funcionarioAeronave fa ON fa.fkFuncionario = f.idFuncionario
                LEFT JOIN aeronave a ON a.idAeronave = fa.fkAeronave
                    AND a.fkEmpresaFabricante = f.fkEmpresaFabricante
            WHERE gestor.idFuncionario = ${idGestor} AND gestor.cargo = 'GESTOR'
                AND gestor.statusSistema = '1' AND f.cargo IN ('ANALISTA', 'GESTOR')
            GROUP BY f.idFuncionario, f.nome, f.emailCorporativo, f.statusSistema, f.cargo
            ORDER BY CASE WHEN f.statusSistema = '1' THEN 0 ELSE 1 END,
                f.nome, f.idFuncionario;
    `
    return database.executar(instrucaoSql)
}

function inativarFuncionario(idGestor, idFuncionario) {
    var instrucaoSql = `
        UPDATE funcionario AS funcionario
        JOIN funcionario AS gestor
            ON gestor.fkEmpresaFabricante = funcionario.fkEmpresaFabricante
        SET funcionario.statusSistema = '0'
        WHERE gestor.idFuncionario = ${idGestor}
            AND gestor.cargo = 'GESTOR'
            AND gestor.statusSistema = '1'
            AND funcionario.idFuncionario = ${idFuncionario}
            AND funcionario.cargo IN ('ANALISTA', 'GESTOR')
            AND funcionario.idFuncionario <> gestor.idFuncionario;
    `
    return database.executar(instrucaoSql)
}

function ativarFuncionario(idGestor, idFuncionario) {
    var instrucaoSql = `
        UPDATE funcionario AS funcionario
        JOIN funcionario AS gestor
            ON gestor.fkEmpresaFabricante = funcionario.fkEmpresaFabricante
        SET funcionario.statusSistema = '1'
        WHERE gestor.idFuncionario = ${idGestor}
            AND gestor.cargo = 'GESTOR'
            AND gestor.statusSistema = '1'
            AND funcionario.idFuncionario = ${idFuncionario}
            AND funcionario.cargo IN ('ANALISTA', 'GESTOR')
            AND funcionario.idFuncionario <> gestor.idFuncionario;
    `
    return database.executar(instrucaoSql)
}

function buscarEdicaoFuncionario(idGestor, idFuncionario) {
    var instrucaoSql = `
            SELECT a.idAeronave, a.nome, a.modelo, a.numeroSerie, a.companhiaAerea,
                f.idFuncionario, f.nome AS nomeFuncionario,
                f.emailCorporativo AS emailFuncionario, f.statusSistema,
                (fa.fkFuncionario IS NOT NULL) AS associada
            FROM aeronave a
                JOIN funcionario gestor ON gestor.fkEmpresaFabricante = a.fkEmpresaFabricante
                JOIN funcionario f ON f.idFuncionario = ${idFuncionario}
                    AND f.fkEmpresaFabricante = a.fkEmpresaFabricante AND f.cargo = 'ANALISTA'
                LEFT JOIN funcionarioAeronave fa ON fa.fkAeronave = a.idAeronave
                    AND fa.fkFuncionario = f.idFuncionario
            WHERE gestor.idFuncionario = ${idGestor} AND gestor.cargo = 'GESTOR'
                AND gestor.statusSistema = '1'
            ORDER BY a.nome, a.idAeronave;
    `
    return database.executar(instrucaoSql)
}

function salvarAeronavesFuncionario(idGestor, idFuncionario, idsAeronaves) {
    const instrucaoDelete = `
        DELETE FROM funcionarioAeronave
        WHERE fkFuncionario = ${idFuncionario};
    `
    return database.executar(instrucaoDelete).then(() => {
        if (idsAeronaves.length === 0) {
            return { mensagem: "Associações salvas com sucesso!", aeronaves: idsAeronaves }
        }

        const ids = idsAeronaves.join(", ")
        const instrucaoInsert = `
        INSERT INTO funcionarioAeronave (fkFuncionario, fkAeronave)
        SELECT ${idFuncionario}, a.idAeronave
        FROM aeronave a
            JOIN funcionario f ON f.idFuncionario = ${idFuncionario}
                AND f.fkEmpresaFabricante = a.fkEmpresaFabricante
            JOIN funcionario gestor ON gestor.fkEmpresaFabricante = f.fkEmpresaFabricante
        WHERE f.idFuncionario = ${idFuncionario} AND f.cargo = 'ANALISTA'
            AND gestor.idFuncionario = ${idGestor} AND gestor.cargo = 'GESTOR'
            AND gestor.statusSistema = '1' AND a.idAeronave IN (${ids});
        `
        return database.executar(instrucaoInsert).then(() => ({
            mensagem: "Associações salvas com sucesso!",
            aeronaves: idsAeronaves
        }))
    })
}

module.exports = {
    listarFuncionarios,
    inativarFuncionario,
    ativarFuncionario,
    buscarEdicaoFuncionario,
    salvarAeronavesFuncionario,
    listarAnalistas,
    autenticar,
    cadastrar
}
