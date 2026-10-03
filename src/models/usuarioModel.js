var database = require("../database/config")

function autenticar(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha)
    var instrucaoSql = `
        SELECT idFuncionario AS id, nome, emailCorporativo AS email, cargo, fkEmpresaFabricante AS empresaId
        FROM funcionario
        WHERE emailCorporativo = '${email}' AND senha = '${senha}';
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

module.exports = {
    autenticar,
    cadastrar
}
