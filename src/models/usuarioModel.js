var database = require("../database/config")

function autenticar(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha)
    var instrucaoSql = `
        SELECT id_funcionario AS id, nome, email_corporativo AS email, cargo, fk_empresa_fabricante AS empresaId 
        FROM funcionario 
        WHERE email_corporativo = '${email}' AND senha = '${senha}';
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// Coloque os mesmos parâmetros aqui. Vá para a var instrucaoSql
function cadastrar(nome, email, dtNascimento, cpf, cargo, senha, telefone, idFuncionarioAdm) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, dtNascimento, cpf, cargo, senha, telefone, idFuncionarioAdm);
    
    var instrucaoSql = `
        INSERT INTO funcionario (nome, data_nascimento, email_corporativo, telefone, cpf, cargo, senha, fk_empresa_fabricante)
            SELECT '${nome}', '${dtNascimento}', '${email}', '${telefone}', '${cpf}', '${cargo}', 0, '${senha}', fk_empresa_fabricante
            FROM funcionario
            WHERE id_funcionario = ${idFuncionarioAdm};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar
};