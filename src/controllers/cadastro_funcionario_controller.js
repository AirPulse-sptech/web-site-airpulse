var cadastro_funcionario_model = require("../models/cadastro_funcionario_model");


function cadastrar(req, res) {
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var dtNascimento = req.body.dtNascimentoServer;
    var cpf = req.body.cpfServer;
    var senha = req.body.senhaServer;
    var telefone = req.body.telefoneServer;
    var cargo = req.body.cargoServer
    var idFuncionarioAdm = req.body.idFuncionarioAdmServer;

    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (dtNascimento == undefined) {
        res.status(400).send("Sua data de nascimento está undefined!");
    } else if (cpf == undefined) {
        res.status(400).send("Seu CPF está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    } else if (telefone == undefined) {
        res.status(400).send("Seu telefone está undefined!");
    } else if (cargo == undefined) {
        res.status(400).send("Seu telefone está undefined!");
    } else if (idFuncionarioAdm == undefined) {
        res.status(400).send("Sua empresa a vincular está undefined!");
    } 
    else {

        // Passe os valores como parâmetro e vá para o arquivo usuarioModel.js
        cadastro_funcionario_model.cadastrar(nome, email, dtNascimento, cpf, cargo, senha, telefone, idFuncionarioAdm)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

module.exports = {
    cadastrar
}