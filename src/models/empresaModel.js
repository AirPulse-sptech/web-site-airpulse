var database = require("../database/config")

function buscarPorId(id) {
  var instrucaoSql = `
    SELECT e.*, en.cep, en.logradouro, en.bairro, en.numero, en.complemento, en.estado, en.cidade
    FROM empresaFabricante e
    LEFT JOIN endereco en ON en.idEndereco = e.fkEndereco
    WHERE e.idEmpresaFabricante = ${id};
  `
  return database.executar(instrucaoSql)
}

function listar() {
  var instrucaoSql = `SELECT idEmpresaFabricante AS id, razaoSocial, cnpj FROM empresaFabricante`
  return database.executar(instrucaoSql)
}

function buscarPorCnpj(cnpj) {
  var instrucaoSql = `SELECT * FROM empresaFabricante WHERE cnpj = '${cnpj}'`
  return database.executar(instrucaoSql)
}

function cadastrarEndereco(cep, logradouro, bairro, numero, complemento, estado, cidade) {
  var instrucaoSql = `
    INSERT INTO endereco (cep, logradouro, bairro, numero, complemento, estado, cidade)
    VALUES ('${cep}', '${logradouro}', '${bairro}', '${numero}', '${complemento || ""}', '${estado}', '${cidade}');
  `
  return database.executar(instrucaoSql)
}

function cadastrarEmpresa(razaoSocial, nomeFantasia, cnpj, segmento, telefone, fkEndereco) {
  var instrucaoSql = `
    INSERT INTO empresaFabricante (razaoSocial, nomeFantasia, cnpj, segmentoAtuacao, telefone, statusSistema, entradaSistema, fkEndereco)
    VALUES ('${razaoSocial}', '${nomeFantasia || ""}', '${cnpj}', '${segmento}', '${telefone}', 'ATIVO', NOW(), ${fkEndereco});
  `
  return database.executar(instrucaoSql)
}

function cadastrarRepresentante(nome, email, telefone, cpf, cargo, senha, fkEmpresa) {
  var instrucaoSql = `
    INSERT INTO funcionario (nome, emailCorporativo, telefone, cpf, cargo, senha, statusSistema, entradaSistema, fkEmpresaFabricante)
    VALUES ('${nome}', '${email}', '${telefone}', '${cpf}', '${cargo}', '${senha}', 1, NOW(), ${fkEmpresa});
  `
  return database.executar(instrucaoSql)
}

function carregarEmpresas(status) {
    var filtroStatus = ""

    if (status != "TODAS") {
        filtroStatus = `AND statusSistema = '${status}'`
    }

    var instrucaoSql = `
        SELECT idEmpresaFabricante AS id, razaoSocial, nomeFantasia, cnpj, segmentoAtuacao, statusSistema
        FROM empresaFabricante
        WHERE cnpj <> '00000000000100' ${filtroStatus}
        ORDER BY CASE WHEN statusSistema = 'ATIVO' THEN 0 ELSE 1 END, razaoSocial;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarEndereco(idEndereco, cep, logradouro, bairro, numero, complemento, estado, cidade) {
  var instrucaoSql = `
    UPDATE endereco SET
      cep = '${cep}',
      logradouro = '${logradouro}',
      bairro = '${bairro}',
      numero = '${numero}',
      complemento = '${complemento || ""}',
      estado = '${estado}',
      cidade = '${cidade}'
    WHERE idEndereco = ${idEndereco};
  `
  return database.executar(instrucaoSql)
}

function atualizarEmpresa(id, razaoSocial, nomeFantasia, cnpj, segmento, telefone) {
  var instrucaoSql = `
    UPDATE empresaFabricante SET
      razaoSocial = '${razaoSocial}',
      nomeFantasia = '${nomeFantasia || ""}',
      cnpj = '${cnpj}',
      segmentoAtuacao = '${segmento}',
      telefone = '${telefone}'
    WHERE idEmpresaFabricante = ${id};
  `
  return database.executar(instrucaoSql)
}

function atualizarStatus(id, status) {
  var instrucaoSql = `UPDATE empresaFabricante SET statusSistema = '${status}' WHERE idEmpresaFabricante = ${id};`
  return database.executar(instrucaoSql)
}

module.exports = {
  buscarPorCnpj,
  buscarPorId,
  listar,
  cadastrarEndereco,
  cadastrarEmpresa,
  cadastrarRepresentante,
  cadastrarEmpresa,
  carregarEmpresas,
  atualizarEndereco,
  atualizarEmpresa,
  atualizarStatus
}