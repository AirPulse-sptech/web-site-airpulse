var relatorioModel = require("../models/relatorioModel")
var analiseRelatorioController = require("./analiseRelatorioController")
var alertaRelatorioController = require("./alertaRelatorioController")
var alertaRelatorioModel = require("../models/alertaRelatorioModel")
var usuarioModel = require("../models/usuarioModel")

const statusPermitidos = ["RASCUNHO", "EM_REVISAO", "PUBLICADO"]
const criticidadesPermitidas = ["NORMAL", "ATENCAO", "CRITICO"]
const categoriasPermitidas = ["DESEMPENHO", "FALHA_HARDWARE", "ARMAZENAMENTO", "MEMORIA_RAM", "PROCESSADOR", "PERDA_CONEXAO"]
const limiteTexto = 50000

function dataValida(valor) {
    return alertaRelatorioController.dataValida(valor)
}

function limparTexto(valor) {
    return String(valor == undefined ? "" : valor).trim().replace(/\\/g, "\\\\").replace(/'/g, "''")
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

                return Promise.all([relatorioModel.listarVinculados(idRelatorio), alertaRelatorioModel.listarVinculos(idRelatorio)]).then(function (resultados) {
                    var vinculados = resultados[0]
                    relatorio.autor = vinculados.find(function (pessoa) { return pessoa.papel == "AUTOR" }) || null
                    relatorio.coautores = vinculados.filter(function (pessoa) { return pessoa.papel == "COAUTOR" })
                    relatorio.alertas = resultados[1]
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
    if (!categoriasPermitidas.includes(dados.categoria)) return "Escolha uma categoria válida."
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
        categoria: req.body.categoriaServer,
        alertas: req.body.alertasServer === undefined ? [] : req.body.alertasServer,
        coautores: Array.isArray(req.body.coautoresServer)
            ? req.body.coautoresServer.map(Number).filter(Boolean)
            : []
    }
}

function prepararEdicao(dados, idRelatorio) {
    if (!idRelatorio) return Promise.resolve({ papel: "AUTOR", coautores: [], alertas: [] })
    return relatorioModel.buscarVinculo(idRelatorio, dados.idFuncionario).then(function (vinculos) {
        if (vinculos.length == 0) throw Object.assign(new Error("Você não é autor nem coautor deste relatório."), { status: 403 })
        if (vinculos[0].statusRelatorio == "PUBLICADO") {
            throw Object.assign(new Error("Este relatório já foi publicado e não pode mais ser alterado."), { status: 409 })
        }
        return Promise.all([relatorioModel.listarVinculados(idRelatorio), alertaRelatorioModel.listarVinculos(idRelatorio)])
            .then(function (resultados) {
                return {
                    papel: vinculos[0].papel,
                    coautores: resultados[0].filter(function (pessoa) { return pessoa.papel == "COAUTOR" }).map(function (pessoa) { return pessoa.id }),
                    alertas: resultados[1]
                }
            })
    })
}

function salvarParticipantes(dados, idRelatorio, papel) {
    if (papel != "AUTOR") return Promise.resolve()
    return usuarioModel.listarAnalistas(dados.idFuncionario).then(function (analistas) {
        var permitidos = analistas.map(function (analista) { return analista.id })
        var coautores = [...new Set(dados.coautores)].filter(function (id) { return permitidos.includes(id) })
        return relatorioModel.salvarCoautores(idRelatorio, coautores)
    })
}

function gravarRelatorio(dados, idRelatorio, alertas, anterior) {
    var novo = !idRelatorio
    var iniciar = Promise.resolve()
    if (novo) {
        iniciar = relatorioModel.cadastrar(limparTexto(dados.titulo), dados.periodoInicio, dados.periodoFim,
            limparTexto(dados.texto), "RASCUNHO", dados.criticidade ? `'${dados.criticidade}'` : "NULL", dados.categoria, dados.fkAeronave)
            .then(function (resultado) {
                idRelatorio = resultado.insertId
                return relatorioModel.vincularFuncionarios(idRelatorio, [{ idFuncionario: dados.idFuncionario, papel: "AUTOR" }])
            })
    }
    return iniciar
        .then(function () { return salvarParticipantes(dados, idRelatorio, anterior.papel) })
        .then(function () { return alertaRelatorioModel.salvarVinculos(idRelatorio, alertas) })
        .then(function () {
            return relatorioModel.atualizar(idRelatorio, limparTexto(dados.titulo), dados.periodoInicio, dados.periodoFim,
                limparTexto(dados.texto), dados.statusRelatorio, dados.criticidade ? `'${dados.criticidade}'` : "NULL", dados.categoria, dados.fkAeronave)
        })
        .then(function (resultado) {
            if (!resultado.affectedRows) throw Object.assign(new Error("O relatório já foi publicado. Recarregue a página."), { status: 409 })
            return idRelatorio
        })
        .catch(function (erro) {
            if (!idRelatorio) throw erro
            // Não deixa um relatório sem autor no banco
            var desfazer = novo ? relatorioModel.excluir(idRelatorio) : Promise.all([
                anterior.papel == "AUTOR" ? relatorioModel.salvarCoautores(idRelatorio, anterior.coautores) : Promise.resolve(),
                alertaRelatorioModel.salvarVinculos(idRelatorio, anterior.alertas)
            ])
            return desfazer.catch(function () {
                throw Object.assign(new Error("Não foi possível concluir a gravação nem restaurar todos os vínculos. Revise o relatório antes de publicar."), { status: 500 })
            }).then(function () { throw erro })
        })
}

function salvar(req, res, idRelatorio) {
    var dados = lerDados(req)
    var erroValidacao = validarRelatorio(dados)
    if (!Number.isSafeInteger(dados.idFuncionario) || dados.idFuncionario <= 0
        || !Number.isSafeInteger(dados.fkAeronave) || dados.fkAeronave <= 0
        || (idRelatorio !== null && (!Number.isSafeInteger(idRelatorio) || idRelatorio <= 0))) {
        return res.status(400).json({ mensagem: "Informe funcionário, aeronave e relatório válidos." })
    }
    if (erroValidacao) return res.status(400).json({ mensagem: erroValidacao })
    return alertaRelatorioModel.contexto(dados.idFuncionario, "ANALISTA", dados.fkAeronave)
        .then(function () { return prepararEdicao(dados, idRelatorio) })
        .then(function (anterior) {
            return alertaRelatorioController.validarSelecao(dados, idRelatorio).then(function (alertas) {
                return gravarRelatorio(dados, idRelatorio, alertas, anterior)
            })
        })
        .then(function (id) {
            res.status(idRelatorio ? 200 : 201).json({
                mensagem: dados.statusRelatorio == "PUBLICADO" ? "Relatório publicado!" : "Rascunho salvo!",
                idRelatorio: id, statusRelatorio: dados.statusRelatorio
            })
            if (dados.statusRelatorio == "PUBLICADO") analiseRelatorioController.aoPublicar(id)
        })
        .catch(function (erro) {
            console.log("Erro ao salvar relatório:", erro.code || erro.name)
            res.status(erro.status || 500).json({ mensagem: erro.status ? erro.message : "Não foi possível salvar o relatório. Tente novamente." })
        })
}

function cadastrar(req, res) {
    return salvar(req, res, null)
}

function atualizar(req, res) {
    return salvar(req, res, Number(req.params.idRelatorio))
}

module.exports = {
    listarAnteriores,
    listarMeus,
    buscarDetalhe,
    cadastrar,
    atualizar
}
