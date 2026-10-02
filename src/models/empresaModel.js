var database = require("../database/config");

function buscarPorId(id) {
  var instrucaoSql = `SELECT * FROM empresaFabricante WHERE idEmpresaFabricante = ${id}`;
  return database.executar(instrucaoSql);
}

function listar() {
  var instrucaoSql = `SELECT idEmpresaFabricante AS id, razaoSocial, cnpj FROM empresaFabricante`;
  return database.executar(instrucaoSql);
}

function buscarPorCnpj(cnpj) {
  var instrucaoSql = `SELECT * FROM empresaFabricante WHERE cnpj = '${cnpj}'`;
  return database.executar(instrucaoSql);
}

function cadastrarEndereco(cep, logradouro, bairro, numero, complemento, estado, cidade) {
  var instrucaoSql = `
    INSERT INTO endereco (cep, logradouro, bairro, numero, complemento, estado, cidade)
    VALUES ('${cep}', '${logradouro}', '${bairro}', '${numero}', '${complemento || ""}', '${estado}', '${cidade}');
  `;
  return database.executar(instrucaoSql);
}

function cadastrarEmpresa(razaoSocial, nomeFantasia, cnpj, segmento, email, telefone, fkEndereco) {
  var instrucaoSql = `
    INSERT INTO empresaFabricante (razaoSocial, nomeFantasia, cnpj, segmentoAtuacao, email, telefone, statusSistema, entradaSistema, fkEndereco)
    VALUES ('${razaoSocial}', '${nomeFantasia || ""}', '${cnpj}', '${segmento}', '${email}', '${telefone}', 1, NOW(), ${fkEndereco});
  `;
  return database.executar(instrucaoSql);
}

function cadastrarRepresentante(nome, email, telefone, cpf, cargo, senha, fkEmpresa) {
  var instrucaoSql = `
    INSERT INTO funcionario (nome, emailCorporativo, telefone, cpf, cargo, senha, statusSistema, entradaSistema, fkEmpresaFabricante)
    VALUES ('${nome}', '${email}', '${telefone}', '${cpf}', '${cargo}', '${senha}', 1, NOW(), ${fkEmpresa});
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
