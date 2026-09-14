var database = require("../database/config");

function buscarPorId(id) {
  var instrucaoSql = `SELECT * FROM empresa_fabricante WHERE id_empresa_fabricante = ${id}`;
  return database.executar(instrucaoSql);
}

function listar() {
  var instrucaoSql = `SELECT id_empresa_fabricante AS id, razao_social, cnpj FROM empresa_fabricante`;
  return database.executar(instrucaoSql);
}

function buscarPorCnpj(cnpj) {
  var instrucaoSql = `SELECT * FROM empresa_fabricante WHERE cnpj = '${cnpj}'`;
  return database.executar(instrucaoSql);
}

function cadastrarEndereco(cep, logradouro, bairro, numero, complemento, estado, cidade) {
  var instrucaoSql = `
    INSERT INTO endereco (cep, logradouro, bairro, numero, complemento, estado, cidade) 
    VALUES ('${cep}', '${logradouro}', '${bairro}', '${numero}', '${complemento || ""}', '${estado}', '${cidade}');
  `;
  return database.executar(instrucaoSql);
}

function cadastrarEmpresa(razaoSocial, nomeFantasia, cnpj, segmento, website, email, telefone, fkEndereco) {
  var instrucaoSql = `
    INSERT INTO empresa_fabricante (razao_social, nome_fantasia, cnpj, segmento_atuacao, email, telefone, status_sistema, entrada_sistema, website, fk_endereco) 
    VALUES ('${razaoSocial}', '${nomeFantasia || ""}', '${cnpj}', '${segmento}', '${email}', '${telefone}', 1, NOW(), '${website || ""}', ${fkEndereco});
  `;
  return database.executar(instrucaoSql);
}

function cadastrarRepresentante(nome, email, telefone, cpf, cargo, senha, fkEmpresa) {
  var instrucaoSql = `
    INSERT INTO funcionario (nome, email_corporativo, telefone, cpf, cargo, adm, senha, status_sistema, entrada_sistema, fk_empresa_fabricante) 
    VALUES ('${nome}', '${email}', '${telefone}', '${cpf}', '${cargo}', 1, '${senha}', 1, NOW(), ${fkEmpresa});
  `;
  return database.executar(instrucaoSql);
}

module.exports = {
  buscarPorCnpj,
  buscarPorId,
  listar,
  cadastrarEndereco,
  cadastrarEmpresa,
  cadastrarRepresentante
};
