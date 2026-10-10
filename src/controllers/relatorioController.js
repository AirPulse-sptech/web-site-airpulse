var aeronaveModel = require("../models/aeronaveModel")
var usuarioModel = require("../models/usuarioModel")
var relatorioModel = require("../models/relatorioModel")

const statusPermitidos = ["RASCUNHO", "EM_REVISAO", "PUBLICADO"]
const criticidadesPermitidas = ["NORMAL", "ATENCAO", "CRITICO"]
const limiteTexto = 50000

function limparTexto(valor) {
    return String(valor == undefined ? "" : valor).trim().replace(/\\/g, "\\\\").replace(/'/g, "''")
}

function dataValida(valor) {
    return /^\d{4}-\d{2}-\d{2}$/.test(valor || "")
}

function erroBanco(res, mensagem) {
    return function (erro) {
        console.log(erro)
        console.log(`\n${mensagem} Erro: `, erro.sqlMessage)
        res.status(500).json(erro.sqlMessage)
    }
}

function listarAnteriores(req, res) {
    var idAeronave = Number(req.params.idAeronave)
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idAeronave || !idFuncionario) {
        res.status(400).send("O id da aeronave ou do funcionário está undefined!")
    } else {
        relatorioModel.listarAnteriores(idAeronave, idFuncionario)
            .then(function (resultado) {
                res.status(200).json(resultado)
            })
            .catch(erroBanco(res, "Houve um erro ao listar os relatórios anteriores!"))
    }
}

function listarMeus(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else {
        relatorioModel.listarMeus(idFuncionario)
            .then(function (resultado) {
                res.status(200).json(resultado)
            })
            .catch(erroBanco(res, "Houve um erro ao listar os relatórios do analista!"))
    }
}

function buscarDetalhe(req, res) {
    var idRelatorio = Number(req.params.idRelatorio)
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idRelatorio || !idFuncionario) {
        res.status(400).send("O id do relatório ou do funcionário está undefined!")
    } else {
        relatorioModel.buscarDetalhe(idRelatorio, idFuncionario)
            .then(function (resultado) {
                if (resultado.length == 0) {
                    res.status(404).json({ mensagem: "Relatório não encontrado ou você não está vinculado a ele." })
                    return
                }

                var relatorio = resultado[0]

                return relatorioModel.listarVinculados(idRelatorio).then(function (vinculados) {
                    relatorio.autor = vinculados.find(function (pessoa) { return pessoa.papel == "AUTOR" }) || null
                    relatorio.coautores = vinculados.filter(function (pessoa) { return pessoa.papel == "COAUTOR" })
                    res.status(200).json(relatorio)
                })
            })
            .catch(erroBanco(res, "Houve um erro ao buscar o relatório!"))
    }
}

function validarRelatorio(dados) {
    if (!statusPermitidos.includes(dados.statusRelatorio)) return "Status inválido. Use RASCUNHO, EM_REVISAO ou PUBLICADO."
    if (!dados.fkAeronave) return "Escolha a aeronave do relatório."
    if (!dados.titulo) return "O título do relatório está undefined!"
    if (dados.titulo.length > 150) return "O título pode ter no máximo 150 caracteres."
    if (!dataValida(dados.periodoInicio) || !dataValida(dados.periodoFim)) return "Informe o período analisado."
    if (dados.periodoFim < dados.periodoInicio) return "O fim do período não pode ser antes do início."
    if (dados.texto.length > limiteTexto) return `A análise pode ter no máximo ${limiteTexto} caracteres.`
    if (dados.criticidade && !criticidadesPermitidas.includes(dados.criticidade)) return "Conclusão inválida. Use NORMAL, ATENCAO ou CRITICO."

    if (dados.statusRelatorio == "PUBLICADO") {
        if (!dados.texto) return "Escreva a análise antes de publicar."
        if (!dados.criticidade) return "Escolha a conclusão da análise antes de publicar."
    }

    return null
}

function lerDados(req) {
    return {
        idFuncionario: Number(req.body.idFuncionarioServer),
        fkAeronave: Number(req.body.fkAeronaveServer),
        titulo: String(req.body.tituloServer || "").trim(),
        periodoInicio: req.body.periodoInicioServer,
        periodoFim: req.body.periodoFimServer,
        texto: String(req.body.textoServer || "").trim(),
        statusRelatorio: req.body.statusServer,
        criticidade: req.body.criticidadeServer || null,
        coautores: Array.isArray(req.body.coautoresServer)
            ? req.body.coautoresServer.map(Number).filter(Boolean)
            : []
    }
}

function filtrarCoautores(idFuncionario, coautores) {
    return usuarioModel.listarAnalistas(idFuncionario).then(function (analistas) {
        var permitidos = analistas.map(function (analista) { return analista.id })
        return [...new Set(coautores)].filter(function (id) { return permitidos.includes(id) })
    })
}

function textoCriticidade(criticidade) {
    return criticidade ? `'${criticidade}'` : "NULL"
}

function cadastrar(req, res) {
    var dados = lerDados(req)
    var erroValidacao = validarRelatorio(dados)

    if (!dados.idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else if (erroValidacao) {
        res.status(400).send(erroValidacao)
    } else {
        aeronaveModel.buscarAnalistaDaAeronave(dados.idFuncionario, dados.fkAeronave)
            .then(function (resultadoAnalista) {
                if (resultadoAnalista.length == 0) {
                    res.status(403).json({ mensagem: "Apenas analistas da empresa dona da aeronave podem criar relatórios." })
                    return
                }

                var idRelatorio = null

                return relatorioModel.cadastrar(
                    limparTexto(dados.titulo),
                    dados.periodoInicio,
                    dados.periodoFim,
                    limparTexto(dados.texto),
                    dados.statusRelatorio,
                    textoCriticidade(dados.criticidade),
                    dados.fkAeronave
                )
                    .then(function (resultadoRelatorio) {
                        idRelatorio = resultadoRelatorio.insertId
                        return filtrarCoautores(dados.idFuncionario, dados.coautores)
                    })
                    .then(function (coautores) {
                        var vinculos = [{ idFuncionario: dados.idFuncionario, papel: "AUTOR" }].concat(
                            coautores.map(function (id) { return { idFuncionario: id, papel: "COAUTOR" } })
                        )
                        return relatorioModel.vincularFuncionarios(idRelatorio, vinculos)
                    })
                    .then(function () {
                        res.status(201).json({
                            mensagem: dados.statusRelatorio == "PUBLICADO" ? "Relatório publicado!" : "Rascunho salvo!",
                            idRelatorio: idRelatorio,
                            statusRelatorio: dados.statusRelatorio
                        })
                    })
                    .catch(function (erro) {
                        console.log(erro)
                        console.log("\nHouve um erro ao cadastrar o relatório! Erro: ", erro.sqlMessage)

                        // Não deixa um relatório sem autor no banco
                        var desfazer = idRelatorio ? relatorioModel.excluir(idRelatorio) : Promise.resolve()
                        desfazer
                            .catch(function (erroExclusao) { console.log("Não foi possível desfazer:", erroExclusao.sqlMessage) })
                            .then(function () { res.status(500).json(erro.sqlMessage) })
                    })
            })
            .catch(erroBanco(res, "Houve um erro ao conferir o analista!"))
    }
}

function atualizar(req, res) {
    var idRelatorio = Number(req.params.idRelatorio)
    var dados = lerDados(req)
    var erroValidacao = validarRelatorio(dados)

    if (!idRelatorio) {
        res.status(400).send("O id do relatório está undefined!")
    } else if (!dados.idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else if (erroValidacao) {
        res.status(400).send(erroValidacao)
    } else {
        relatorioModel.buscarVinculo(idRelatorio, dados.idFuncionario)
            .then(function (resultadoVinculo) {
                if (resultadoVinculo.length == 0) {
                    res.status(403).json({ mensagem: "Você não é autor nem coautor deste relatório." })
                    return
                }

                if (resultadoVinculo[0].statusRelatorio == "PUBLICADO") {
                    res.status(409).json({ mensagem: "Este relatório já foi publicado e não pode mais ser alterado." })
                    return
                }

                var papel = resultadoVinculo[0].papel

                return aeronaveModel.buscarAnalistaDaAeronave(dados.idFuncionario, dados.fkAeronave)
                    .then(function (resultadoAnalista) {
                        if (resultadoAnalista.length == 0) {
                            res.status(403).json({ mensagem: "A aeronave escolhida não é da sua empresa." })
                            return
                        }

                        return relatorioModel.atualizar(
                            idRelatorio,
                            limparTexto(dados.titulo),
                            dados.periodoInicio,
                            dados.periodoFim,
                            limparTexto(dados.texto),
                            dados.statusRelatorio,
                            textoCriticidade(dados.criticidade),
                            dados.fkAeronave
                        )
                            .then(function () {
                                if (papel != "AUTOR") return

                                return relatorioModel.removerCoautores(idRelatorio)
                                    .then(function () {
                                        return filtrarCoautores(dados.idFuncionario, dados.coautores)
                                    })
                                    .then(function (coautores) {
                                        if (coautores.length == 0) return
                                        return relatorioModel.vincularFuncionarios(idRelatorio, coautores.map(function (id) {
                                            return { idFuncionario: id, papel: "COAUTOR" }
                                        }))
                                    })
                            })
                            .then(function () {
                                res.status(200).json({
                                    mensagem: dados.statusRelatorio == "PUBLICADO" ? "Relatório publicado!" : "Rascunho salvo!",
                                    idRelatorio: idRelatorio,
                                    statusRelatorio: dados.statusRelatorio
                                })
                            })
                    })
            })
            .catch(erroBanco(res, "Houve um erro ao atualizar o relatório!"))
    }
}

module.exports = {
    listarAnteriores,
    listarMeus,    
    buscarDetalhe,  
    cadastrar,
    atualizar
}
