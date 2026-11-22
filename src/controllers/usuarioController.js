var usuarioModel = require("../models/usuarioModel")
const computadorModel = require("../models/computadorModel")
const cargos = ["ADMIN", "GESTOR", "ANALISTA"]

async function autenticar(req, res) {
    const { emailServer: email, senhaServer: senha, cliente, hostname } = req.body || {}
    if (typeof email !== "string" || !email) {
        return res.status(400).send("Informe seu email.")
    }
    if (typeof senha !== "string" || !senha) {
        return res.status(400).send("Informe sua senha.")
    }

    const agente = cliente === "agente"
    const host = typeof hostname === "string" ? hostname.trim().toLowerCase() : ""
    if (agente && !/^[a-z0-9_][a-z0-9._-]{0,254}$/.test(host)) {
        return res.status(400).json({ mensagem: "Informe um hostname válido." })
    }

    try {
        const resultados = await usuarioModel.autenticar(email, senha)
        if (resultados.length !== 1) {
            return res.status(403).send(resultados.length === 0
                ? "Email e/ou senha inválido(s)"
                : "Mais de um usuário com o mesmo login e senha!")
        }

        const { id, email: emailUsuario, nome, cargo, empresaId } = resultados[0]
        if (!cargos.includes(cargo)) {
            return res.status(403).send("Cargo inválido para acessar o sistema.")
        }
        if (agente) {
            const linhas = await computadorModel.buscarPlacasDoAgente(host, id)
            return res.set("Cache-Control", "no-store").json({ placas: linhas.map(linha => linha.nome) })
        }
        return res.json({ id, email: emailUsuario, nome, cargo, empresaId })
    } catch (erro) {
        console.error("Falha ao autenticar usuário:", erro.code || "indisponível")
        return res.status(500).json("Não foi possível realizar o login.")
    }
}

function cadastrar(req, res) {
    var nome = req.body.nomeServer
    var email = req.body.emailServer
    var dtNascimento = req.body.dtNascimentoServer
    var cpf = req.body.cpfServer
    var senha = req.body.senhaServer
    var telefone = req.body.telefoneServer
    var cargo = req.body.cargoServer
    var idFuncionarioAdm = req.body.idFuncionarioAdmServer

    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!")
    } else if (email == undefined) {
        res.status(400).send("Seu email está undefined!")
    } else if (dtNascimento == undefined) {
        res.status(400).send("Sua data de nascimento está undefined!")
    } else if (cpf == undefined) {
        res.status(400).send("Seu CPF está undefined!")
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!")
    } else if (telefone == undefined) {
        res.status(400).send("Seu telefone está undefined!")
    } else if (!cargos.includes(cargo)) {
        res.status(400).send("Cargo inválido. Use ADMIN, GESTOR ou ANALISTA.")
    } else if (idFuncionarioAdm == undefined) {
        res.status(400).send("Sua empresa a vincular está undefined!")
    }
    else {

        usuarioModel.cadastrar(nome, email, dtNascimento, cpf, cargo, senha, telefone, idFuncionarioAdm)
            .then(
                function (resultado) {
                    res.json(resultado)
                }
            ).catch(
                function (erro) {
                    console.log(erro)
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    )
                    res.status(500).json(erro.sqlMessage)
                }
            )
    }
}

function listarAnalistas(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else {
        usuarioModel.listarAnalistas(idFuncionario)
            .then(function (resultado) {
                res.status(200).json(resultado)
            })
            .catch(function (erro) {
                console.log("Houve um erro ao listar os analistas!", erro)
                res.status(500).json(erro.sqlMessage)
            })
    }
}

function responderErroGerenciamento(res, erro) {
    if (erro.status) {
        return res.status(erro.status).json({ mensagem: erro.message })
    }
    console.error("Erro no gerenciamento de funcionários:", erro.code || erro.message)
    return res.status(500).json({ mensagem: "Não foi possível concluir a operação. Tente novamente." })
}

function listarFuncionarios(req, res) {
    return usuarioModel.listarFuncionarios(Number(req.params.idGestor))
        .then(funcionarios => res.json(funcionarios))
        .catch(erro => responderErroGerenciamento(res, erro))
}

function inativarFuncionario(req, res) {
    if (!validarAlteracaoStatus(req, res)) return
    return usuarioModel.inativarFuncionario(
        Number(req.params.idGestor),
        Number(req.params.idFuncionario)
    ).then(resultado => {
        if (!resultado.affectedRows) {
            return res.status(403).json({ mensagem: "Conta não encontrada ou sem permissão para alterar seu status." })
        }
        return res.json({ mensagem: "Funcionário inativado com sucesso." })
    })
        .catch(erro => responderErroGerenciamento(res, erro))
}

function ativarFuncionario(req, res) {
    if (!validarAlteracaoStatus(req, res)) return
    return usuarioModel.ativarFuncionario(
        Number(req.params.idGestor),
        Number(req.params.idFuncionario)
    ).then(resultado => {
        if (!resultado.affectedRows) {
            return res.status(403).json({ mensagem: "Conta não encontrada ou sem permissão para alterar seu status." })
        }
        return res.json({ mensagem: "Funcionário ativado com sucesso." })
    })
        .catch(erro => responderErroGerenciamento(res, erro))
}

function validarAlteracaoStatus(req, res) {
    const idGestor = Number(req.params.idGestor)
    const idFuncionario = Number(req.params.idFuncionario)

    if (idGestor === idFuncionario) {
        res.status(403).json({ mensagem: "Você não pode alterar o status da própria conta." })
        return false
    }
    return true
}

function buscarEdicaoFuncionario(req, res) {
    return usuarioModel.buscarEdicaoFuncionario(Number(req.params.idGestor), Number(req.params.idFuncionario))
        .then(dados => res.json(dados))
        .catch(erro => responderErroGerenciamento(res, erro))
}

function salvarAeronavesFuncionario(req, res) {
    const idsAeronaves = req.body.aeronaves
    if (!Array.isArray(idsAeronaves)
        || idsAeronaves.some(id => !Number.isSafeInteger(id) || id <= 0)
        || new Set(idsAeronaves).size !== idsAeronaves.length) {
        return res.status(400).json({ mensagem: "Informe uma lista de IDs de aeronaves válidos, sem repetições." })
    }
    return usuarioModel.salvarAeronavesFuncionario(
            Number(req.params.idGestor), Number(req.params.idFuncionario), idsAeronaves
        )
        .then(resultado => res.json(resultado))
        .catch(erro => responderErroGerenciamento(res, erro))
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
