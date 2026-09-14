var empresaModel = require("../models/empresaModel");

function buscarPorCnpj(req, res) {
  var cnpj = req.query.cnpj;

  empresaModel.buscarPorCnpj(cnpj).then((resultado) => {
    res.status(200).json(resultado);
  }).catch((erro) => {
    console.log(erro);
    res.status(500).json(erro.sqlMessage);
  });
}

function listar(req, res) {
  empresaModel.listar().then((resultado) => {
    res.status(200).json(resultado);
  }).catch((erro) => {
    console.log(erro);
    res.status(500).json(erro.sqlMessage);
  });
}

function buscarPorId(req, res) {
  var id = req.params.id;

  empresaModel.buscarPorId(id).then((resultado) => {
    res.status(200).json(resultado);
  }).catch((erro) => {
    console.log(erro);
    res.status(500).json(erro.sqlMessage);
  });
}

function cadastrar(req, res) {
  // Dados da Empresa
  var razaoSocial = req.body.razaoSocialServer;
  var nomeFantasia = req.body.nomeFantasiaServer;
  var cnpj = req.body.cnpjServer;
  var segmento = req.body.segmentoServer;
  var website = req.body.websiteServer;
  var emailEmpresa = req.body.emailEmpresaServer;
  var telefoneEmpresa = req.body.telefoneEmpresaServer;

  // Dados do Endereço
  var cep = req.body.cepServer;
  var logradouro = req.body.logradouroServer;
  var bairro = req.body.bairroServer;
  var numero = req.body.numeroServer;
  var complemento = req.body.complementoServer;
  var estado = req.body.estadoServer;
  var cidade = req.body.cidadeServer;

  // Dados do Responsável
  var nomeResponsavel = req.body.nomeResponsavelServer;
  var emailResponsavel = req.body.emailResponsavelServer;
  var telefoneResponsavel = req.body.telefoneResponsavelServer;
  var cargoResponsavel = req.body.cargoResponsavelServer;
  var cpfResponsavel = req.body.cpfResponsavelServer;
  var senhaResponsavel = req.body.senhaResponsavelServer;

  // Validações básicas no backend
  if (razaoSocial == undefined) {
    res.status(400).send("A razão social está undefined!");
  } else if (cnpj == undefined) {
    res.status(400).send("O CNPJ está undefined!");
  } else if (emailEmpresa == undefined) {
    res.status(400).send("O e-mail da empresa está undefined!");
  } else if (telefoneEmpresa == undefined) {
    res.status(400).send("O telefone da empresa está undefined!");
  } else if (cep == undefined) {
    res.status(400).send("O CEP está undefined!");
  } else if (logradouro == undefined) {
    res.status(400).send("O logradouro está undefined!");
  } else if (bairro == undefined) {
    res.status(400).send("O bairro está undefined!");
  } else if (numero == undefined) {
    res.status(400).send("O número do endereço está undefined!");
  } else if (estado == undefined) {
    res.status(400).send("O estado está undefined!");
  } else if (cidade == undefined) {
    res.status(400).send("A cidade está undefined!");
  } else if (nomeResponsavel == undefined) {
    res.status(400).send("O nome do responsável está undefined!");
  } else if (emailResponsavel == undefined) {
    res.status(400).send("O e-mail do responsável está undefined!");
  } else if (telefoneResponsavel == undefined) {
    res.status(400).send("O telefone do responsável está undefined!");
  } else if (cpfResponsavel == undefined) {
    res.status(400).send("O CPF do responsável está undefined!");
  } else if (senhaResponsavel == undefined) {
    res.status(400).send("A senha do responsável está undefined!");
  } else {
    // Verificar se o CNPJ já está cadastrado
    empresaModel.buscarPorCnpj(cnpj)
      .then((resultadoCnpj) => {
        if (resultadoCnpj.length > 0) {
          res.status(401).json({ mensagem: `A empresa com o CNPJ ${cnpj} já existe` });
        } else {
          // Cadastrar o Endereço primeiro
          empresaModel.cadastrarEndereco(cep, logradouro, bairro, numero, complemento, estado, cidade)
            .then((resultadoEndereco) => {
              var fkEndereco = resultadoEndereco.insertId;

              // Cadastrar a Empresa vinculada ao endereço
              empresaModel.cadastrarEmpresa(razaoSocial, nomeFantasia, cnpj, segmento, website, emailEmpresa, telefoneEmpresa, fkEndereco)
                .then((resultadoEmpresa) => {
                  var fkEmpresa = resultadoEmpresa.insertId;

                  // Cadastrar o Responsável (Funcionário) vinculado à empresa
                  empresaModel.cadastrarRepresentante(nomeResponsavel, emailResponsavel, telefoneResponsavel, cpfResponsavel, cargoResponsavel, senhaResponsavel, fkEmpresa)
                    .then((resultadoRepresentante) => {
                      res.status(201).json({
                        mensagem: "Empresa, endereço e responsável cadastrados com sucesso!",
                        empresaId: fkEmpresa
                      });
                    })
                    .catch((erro) => {
                      console.log(erro);
                      console.log("\nHouve um erro ao cadastrar o responsável! Erro: ", erro.sqlMessage);
                      res.status(500).json(erro.sqlMessage);
                    });
                })
                .catch((erro) => {
                  console.log(erro);
                  console.log("\nHouve um erro ao cadastrar a empresa! Erro: ", erro.sqlMessage);
                  res.status(500).json(erro.sqlMessage);
                });
            })
            .catch((erro) => {
              console.log(erro);
              console.log("\nHouve um erro ao cadastrar o endereço! Erro: ", erro.sqlMessage);
              res.status(500).json(erro.sqlMessage);
            });
        }
      })
      .catch((erro) => {
        console.log(erro);
        console.log("\nHouve um erro ao buscar o CNPJ! Erro: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
      });
  }
}

module.exports = {
  buscarPorCnpj,
  buscarPorId,
  cadastrar,
  listar,
};
