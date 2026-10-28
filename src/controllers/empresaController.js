var empresaModel = require("../models/empresaModel")
const cargos = ["ADMIN", "GESTOR", "ANALISTA"]
const statusListagem = ["ATIVO", "INATIVO", "TODAS"]
const statusEmpresa = ["ATIVO", "INATIVO"]
const cnpjAirPulse = "00000000000100"

function buscarPorCnpj(req, res) {
  var cnpj = req.query.cnpj

  empresaModel.buscarPorCnpj(cnpj).then((resultado) => {
    res.status(200).json(resultado)
  }).catch((erro) => {
    console.log(erro)
    res.status(500).json(erro.sqlMessage)
  })
}

function listar(req, res) {
  empresaModel.listar().then((resultado) => {
    res.status(200).json(resultado)
  }).catch((erro) => {
    console.log(erro)
    res.status(500).json(erro.sqlMessage)
  })
}

function buscarPorId(req, res) {
  var id = req.params.id

  empresaModel.buscarPorId(id).then((resultado) => {
    res.status(200).json(resultado)
  }).catch((erro) => {
    console.log(erro)
    res.status(500).json(erro.sqlMessage)
  })
}

function cadastrar(req, res) {
  var razaoSocial = req.body.razaoSocialServer
  var nomeFantasia = req.body.nomeFantasiaServer
  var cnpj = req.body.cnpjServer
  var segmento = req.body.segmentoServer
  var emailEmpresa = req.body.emailEmpresaServer || ""
  var telefoneEmpresa = req.body.telefoneEmpresaServer

  var cep = req.body.cepServer
  var logradouro = req.body.logradouroServer
  var bairro = req.body.bairroServer
  var numero = req.body.numeroServer
  var complemento = req.body.complementoServer
  var estado = req.body.estadoServer
  var cidade = req.body.cidadeServer

  var nomeResponsavel = req.body.nomeResponsavelServer
  var emailResponsavel = req.body.emailResponsavelServer
  var telefoneResponsavel = req.body.telefoneResponsavelServer
  var cargoResponsavel = req.body.cargoResponsavelServer
  var cpfResponsavel = req.body.cpfResponsavelServer
  var senhaResponsavel = req.body.senhaResponsavelServer

  if (razaoSocial == undefined) {
    res.status(400).send("A razão social está undefined!")
  } else if (cnpj == undefined) {
    res.status(400).send("O CNPJ está undefined!")
  } else if (telefoneEmpresa == undefined) {
    res.status(400).send("O telefone da empresa está undefined!")
  } else if (cep == undefined) {
    res.status(400).send("O CEP está undefined!")
  } else if (logradouro == undefined) {
    res.status(400).send("O logradouro está undefined!")
  } else if (bairro == undefined) {
    res.status(400).send("O bairro está undefined!")
  } else if (numero == undefined) {
    res.status(400).send("O número do endereço está undefined!")
  } else if (estado == undefined) {
    res.status(400).send("O estado está undefined!")
  } else if (cidade == undefined) {
    res.status(400).send("A cidade está undefined!")
  } else if (nomeResponsavel == undefined) {
    res.status(400).send("O nome do responsável está undefined!")
  } else if (emailResponsavel == undefined) {
    res.status(400).send("O e-mail do responsável está undefined!")
  } else if (telefoneResponsavel == undefined) {
    res.status(400).send("O telefone do responsável está undefined!")
  } else if (cpfResponsavel == undefined) {
    res.status(400).send("O CPF do responsável está undefined!")
  } else if (!cargos.includes(cargoResponsavel)) {
    res.status(400).send("Cargo inválido. Use ADMIN, GESTOR ou ANALISTA.")
  } else if (senhaResponsavel == undefined) {
    res.status(400).send("A senha do responsável está undefined!")
  } else {
    empresaModel.buscarPorCnpj(cnpj)
      .then((resultadoCnpj) => {
        if (resultadoCnpj.length > 0) {
          res.status(401).json({ mensagem: `A empresa com o CNPJ ${cnpj} já existe` })
        } else {
          empresaModel.cadastrarEndereco(cep, logradouro, bairro, numero, complemento, estado, cidade)
            .then((resultadoEndereco) => {
              var fkEndereco = resultadoEndereco.insertId

              empresaModel.cadastrarEmpresa(razaoSocial, nomeFantasia, cnpj, segmento, emailEmpresa, telefoneEmpresa, fkEndereco)
                .then((resultadoEmpresa) => {
                  var fkEmpresa = resultadoEmpresa.insertId

                  empresaModel.cadastrarRepresentante(nomeResponsavel, emailResponsavel, telefoneResponsavel, cpfResponsavel, cargoResponsavel, senhaResponsavel, fkEmpresa)
                    .then((resultadoRepresentante) => {
                      res.status(201).json({
                        mensagem: "Empresa, endereço e responsável cadastrados com sucesso!",
                        empresaId: fkEmpresa
                      })
                    })
                    .catch((erro) => {
                      console.log(erro)
                      console.log("\nHouve um erro ao cadastrar o responsável! Erro: ", erro.sqlMessage)
                      res.status(500).json(erro.sqlMessage)
                    })
                })
                .catch((erro) => {
                  console.log(erro)
                  console.log("\nHouve um erro ao cadastrar a empresa! Erro: ", erro.sqlMessage)
                  res.status(500).json(erro.sqlMessage)
                })
            })
            .catch((erro) => {
              console.log(erro)
              console.log("\nHouve um erro ao cadastrar o endereço! Erro: ", erro.sqlMessage)
              res.status(500).json(erro.sqlMessage)
            })
        }
      })
      .catch((erro) => {
        console.log(erro)
        console.log("\nHouve um erro ao buscar o CNPJ! Erro: ", erro.sqlMessage)
        res.status(500).json(erro.sqlMessage)
      })
  }
}

function carregarEmpresas(req, res) {
    var status = req.query.status || "TODAS"

    if (!statusListagem.includes(status)) {
        res.status(400).send("Status inválido. Use ATIVO, INATIVO ou TODAS.")
    } else {
        empresaModel.carregarEmpresas(status)
            .then(function (resultado) {
                res.status(200).json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function atualizar(req, res) {
  var id = req.params.id

  var razaoSocial = req.body.razaoSocialServer
  var nomeFantasia = req.body.nomeFantasiaServer
  var cnpj = req.body.cnpjServer
  var segmento = req.body.segmentoServer
  var emailEmpresa = req.body.emailEmpresaServer
  var telefoneEmpresa = req.body.telefoneEmpresaServer

  var cep = req.body.cepServer
  var logradouro = req.body.logradouroServer
  var bairro = req.body.bairroServer
  var numero = req.body.numeroServer
  var complemento = req.body.complementoServer
  var estado = req.body.estadoServer
  var cidade = req.body.cidadeServer

  if (razaoSocial == undefined) {
    res.status(400).send("A razão social está undefined!")
  } else if (cnpj == undefined) {
    res.status(400).send("O CNPJ está undefined!")
  } else if (segmento == undefined) {
    res.status(400).send("O segmento está undefined!")
  } else if (emailEmpresa == undefined) {
    res.status(400).send("O e-mail da empresa está undefined!")
  } else if (telefoneEmpresa == undefined) {
    res.status(400).send("O telefone da empresa está undefined!")
  } else if (cep == undefined) {
    res.status(400).send("O CEP está undefined!")
  } else if (logradouro == undefined) {
    res.status(400).send("O logradouro está undefined!")
  } else if (bairro == undefined) {
    res.status(400).send("O bairro está undefined!")
  } else if (numero == undefined) {
    res.status(400).send("O número do endereço está undefined!")
  } else if (estado == undefined) {
    res.status(400).send("O estado está undefined!")
  } else if (cidade == undefined) {
    res.status(400).send("A cidade está undefined!")
  } else {
    empresaModel.buscarPorId(id)
      .then((resultadoEmpresa) => {
        if (resultadoEmpresa.length == 0) {
          res.status(404).json({ mensagem: "Empresa não encontrada." })
        } else if (resultadoEmpresa[0].cnpj == cnpjAirPulse) {
          res.status(403).json({ mensagem: "A empresa interna da AirPulse não pode ser alterada." })
        } else {
          var fkEndereco = resultadoEmpresa[0].fkEndereco

          empresaModel.buscarPorCnpj(cnpj)
            .then((resultadoCnpj) => {
              if (resultadoCnpj.length > 0 && resultadoCnpj[0].idEmpresaFabricante != id) {
                res.status(401).json({ mensagem: `Já existe outra empresa com o CNPJ ${cnpj}` })
              } else {
                empresaModel.atualizarEndereco(fkEndereco, cep, logradouro, bairro, numero, complemento, estado, cidade)
                  .then(() => {
                    empresaModel.atualizarEmpresa(id, razaoSocial, nomeFantasia, cnpj, segmento, emailEmpresa, telefoneEmpresa)
                      .then(() => {
                        res.status(200).json({ mensagem: "Empresa atualizada com sucesso!" })
                      })
                      .catch((erro) => {
                        console.log(erro)
                        console.log("\nHouve um erro ao atualizar a empresa! Erro: ", erro.sqlMessage)
                        res.status(500).json(erro.sqlMessage)
                      })
                  })
                  .catch((erro) => {
                    console.log(erro)
                    console.log("\nHouve um erro ao atualizar o endereço! Erro: ", erro.sqlMessage)
                    res.status(500).json(erro.sqlMessage)
                  })
              }
            })
            .catch((erro) => {
              console.log(erro)
              console.log("\nHouve um erro ao buscar o CNPJ! Erro: ", erro.sqlMessage)
              res.status(500).json(erro.sqlMessage)
            })
        }
      })
      .catch((erro) => {
        console.log(erro)
        console.log("\nHouve um erro ao buscar a empresa! Erro: ", erro.sqlMessage)
        res.status(500).json(erro.sqlMessage)
      })
  }
}

function alterarStatus(req, res) {
  var id = req.params.id
  var status = req.body.statusServer

  if (!statusEmpresa.includes(status)) {
    res.status(400).send("Status inválido. Use ATIVO ou INATIVO.")
  } else {
    empresaModel.buscarPorId(id)
      .then((resultado) => {
        if (resultado.length == 0) {
          res.status(404).json({ mensagem: "Empresa não encontrada." })
        } else if (resultado[0].cnpj == cnpjAirPulse) {
          res.status(403).json({ mensagem: "A empresa interna da AirPulse não pode ser alterada." })
        } else {
          empresaModel.atualizarStatus(id, status)
            .then(() => {
              res.status(200).json({ mensagem: "Status da empresa atualizado!" })
            })
            .catch((erro) => {
              console.log(erro)
              console.log("\nHouve um erro ao alterar o status! Erro: ", erro.sqlMessage)
              res.status(500).json(erro.sqlMessage)
            })
        }
      })
      .catch((erro) => {
        console.log(erro)
        console.log("\nHouve um erro ao buscar a empresa! Erro: ", erro.sqlMessage)
        res.status(500).json(erro.sqlMessage)
      })
  }
}

module.exports = {
  buscarPorCnpj,
  buscarPorId,
  cadastrar,
  listar,
  carregarEmpresas,
  atualizar,
  alterarStatus
}