var gerenciarAeronaveModel = require("../models/gerenciarAeronaveModel")

const statusAeronavePermitidos = ["ATIVA", "MANUTENCAO", "INATIVA"]
const statusComputadorPermitidos = ["ATIVO", "INATIVO", "MANUTENCAO"]
const statusMonitoramentoPermitidos = ["ATIVO", "INATIVO"]

function limparTexto(valor) {
    return String(valor == undefined ? "" : valor).trim().replace(/\\/g, "\\\\").replace(/'/g, "''")
}

function dataValida(valor) {
    return /^\d{4}-\d{2}-\d{2}$/.test(valor || "")
}

function textoPreenchido(valor) {
    return valor != undefined && String(valor).trim() != ""
}

function erroBanco(res, mensagem) {
    return function (erro) {
        console.log(erro)
        console.log(`\n${mensagem} Erro: `, erro.sqlMessage)
        res.status(500).json(erro.sqlMessage)
    }
}

function listar(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else {
        Promise.all([
            gerenciarAeronaveModel.listar(idFuncionario),
            gerenciarAeronaveModel.listarPlacas(idFuncionario),
            gerenciarAeronaveModel.listarMetricas(idFuncionario)
        ])
            .then(function (resultados) {
                var linhas = resultados[0]
                var placas = resultados[1]
                var metricas = resultados[2]
                var aeronaves = []

                linhas.forEach(function (linha) {
                    var aeronave = aeronaves.find(function (item) { return item.idAeronave == linha.idAeronave })

                    if (!aeronave) {
                        aeronave = {
                            idAeronave: linha.idAeronave,
                            nome: linha.nome,
                            modelo: linha.modelo,
                            numeroSerie: linha.numeroSerie,
                            companhiaAerea: linha.companhiaAerea,
                            statusAeronave: linha.statusAeronave,
                            computadores: []
                        }
                        aeronaves.push(aeronave)
                    }

                    if (linha.idComputador) {
                        aeronave.computadores.push({
                            idComputador: linha.idComputador,
                            nome: linha.nomeFmc,
                            tipoFmc: linha.tipoFmc,
                            modelo: linha.modeloFmc,
                            numeroSerie: linha.numeroSerieFmc,
                            statusComputador: linha.statusComputador,
                            dataInstalacao: linha.dataInstalacao,
                            placas: placas
                                .filter(function (placa) { return placa.fkComputador == linha.idComputador })
                                .map(function (placa) {
                                    return {
                                        idPlaca: placa.idPlaca,
                                        nome: placa.nome,
                                        modelo: placa.modelo,
                                        numeroSerie: placa.numeroSerie,
                                        componente: {
                                            idComponente: placa.idComponente,
                                            tipo: placa.tipo,
                                            modelo: placa.modeloComponente,
                                            statusMonitoramento: placa.statusMonitoramento,
                                            limiteAtencao: placa.limiteAtencao,
                                            limiteCritico: placa.limiteCritico,
                                            metricas: metricas
                                                .filter(function (metrica) { return metrica.fkComponente == placa.idComponente })
                                                .map(function (metrica) { return metrica.nome })
                                        }
                                    }
                                })
                        })
                    }
                })

                res.status(200).json(aeronaves)
            })
            .catch(erroBanco(res, "Houve um erro ao listar as aeronaves para gerenciamento!"))
    }
}

function validarEdicao(dados) {
    if (!textoPreenchido(dados.nome) || !textoPreenchido(dados.modelo) || !textoPreenchido(dados.numeroSerie) || !textoPreenchido(dados.companhiaAerea)) {
        return "Preencha todos os campos da aeronave."
    }
    if (!statusAeronavePermitidos.includes(dados.statusAeronave)) return "Status da aeronave inválido. Use ATIVA, MANUTENCAO ou INATIVA."

    for (var computador of dados.computadores) {
        if (!Number(computador.idComputador)) return "O id do FMC está undefined!"
        if (!textoPreenchido(computador.nome) || !textoPreenchido(computador.modelo) || !textoPreenchido(computador.numeroSerie)) {
            return "Preencha todos os campos dos FMCs."
        }
        if (!statusComputadorPermitidos.includes(computador.statusComputador)) return "Status do FMC inválido. Use ATIVO, INATIVO ou MANUTENCAO."
        if (!dataValida(computador.dataInstalacao)) return "A data de instalação do FMC está inválida!"

        var placas = Array.isArray(computador.placas) ? computador.placas : []

        for (var placa of placas) {
            var componente = placa.componente || {}

            if (!Number(placa.idPlaca)) return "O id da placa está undefined!"
            if (!textoPreenchido(placa.nome) || !textoPreenchido(placa.modelo) || !textoPreenchido(placa.numeroSerie)) {
                return "Preencha todos os campos das placas."
            }

            if (Number(componente.idComponente)) {
                if (!textoPreenchido(componente.modelo)) return "Preencha o modelo de todos os componentes."
                if (!statusMonitoramentoPermitidos.includes(componente.statusMonitoramento)) return "Monitoramento inválido. Use ATIVO ou INATIVO."

                var atencao = Number(componente.limiteAtencao)
                var critico = Number(componente.limiteCritico)
                if (!(atencao > 0 && critico > atencao && critico <= 100)) {
                    return "Limites inválidos: o crítico deve ser maior que o de atenção e no máximo 100%."
                }
            }
        }
    }

    return null
}

function editarPlacasDoComputador(computador, idComputador) {
    var placas = Array.isArray(computador.placas) ? computador.placas : []

    return placas.reduce(function (anterior, placa) {
        return anterior.then(function () {
            return gerenciarAeronaveModel.editarPlaca(
                Number(placa.idPlaca),
                idComputador,
                limparTexto(placa.nome),
                limparTexto(placa.modelo),
                limparTexto(placa.numeroSerie)
            )
        }).then(function () {
            var componente = placa.componente || {}

            if (!Number(componente.idComponente)) return

            return gerenciarAeronaveModel.editarComponente(
                Number(componente.idComponente),
                Number(placa.idPlaca),
                idComputador,
                limparTexto(componente.modelo),
                componente.statusMonitoramento,
                Number(componente.limiteAtencao),
                Number(componente.limiteCritico)
            )
        })
    }, Promise.resolve())
}

function editar(req, res) {
    var idAeronave = Number(req.params.idAeronave)
    var idFuncionario = Number(req.body.idFuncionarioServer)
    var dados = {
        nome: req.body.nomeServer,
        modelo: req.body.modeloServer,
        numeroSerie: req.body.numeroSerieServer,
        companhiaAerea: req.body.companhiaAereaServer,
        statusAeronave: req.body.statusServer,
        computadores: Array.isArray(req.body.computadoresServer) ? req.body.computadoresServer : []
    }

    var erroValidacao = validarEdicao(dados)

    if (!idAeronave || !idFuncionario) {
        res.status(400).send("O id da aeronave ou do funcionário está undefined!")
    } else if (erroValidacao) {
        res.status(400).send(erroValidacao)
    } else {
        gerenciarAeronaveModel.buscarAeronaveDoGestor(idAeronave, idFuncionario)
            .then(function (resultadoGestor) {
                if (resultadoGestor.length == 0) {
                    res.status(403).send("Apenas o gestor da empresa pode editar aeronaves.")
                    return
                }

                return gerenciarAeronaveModel.buscarComputadoresDaAeronave(idAeronave).then(function (existentes) {
                    var idsExistentes = existentes.map(function (existente) { return existente.idComputador })
                    var estranho = dados.computadores.find(function (computador) {
                        return !idsExistentes.includes(Number(computador.idComputador))
                    })

                    if (estranho) {
                        res.status(403).send("O FMC informado não pertence a esta aeronave.")
                        return
                    }

                    return gerenciarAeronaveModel.editarAeronave(
                        idAeronave,
                        limparTexto(dados.nome),
                        limparTexto(dados.modelo),
                        limparTexto(dados.numeroSerie),
                        limparTexto(dados.companhiaAerea),
                        dados.statusAeronave
                    )
                        .then(function () {
                            return dados.computadores.reduce(function (anterior, computador) {
                                return anterior.then(function () {
                                    var idComputador = Number(computador.idComputador)

                                    return gerenciarAeronaveModel.editarComputador(
                                        idComputador,
                                        idAeronave,
                                        limparTexto(computador.nome),
                                        limparTexto(computador.modelo),
                                        limparTexto(computador.numeroSerie),
                                        computador.statusComputador,
                                        computador.dataInstalacao
                                    ).then(function () {
                                        return editarPlacasDoComputador(computador, idComputador)
                                    })
                                })
                            }, Promise.resolve())
                        })
                        .then(function () {
                            res.status(200).json({ idAeronave: idAeronave })
                        })
                })
            })
            .catch(erroBanco(res, "Houve um erro ao editar a aeronave!"))
    }
}

function alterarStatusAeronave(req, res) {
    var idAeronave = Number(req.params.idAeronave)
    var idFuncionario = Number(req.body.idFuncionarioServer)
    var statusAeronave = req.body.statusServer

    if (!idAeronave || !idFuncionario) {
        res.status(400).send("O id da aeronave ou do funcionário está undefined!")
    } else if (!statusAeronavePermitidos.includes(statusAeronave)) {
        res.status(400).send("Status inválido. Use ATIVA, MANUTENCAO ou INATIVA.")
    } else {
        gerenciarAeronaveModel.buscarAeronaveDoGestor(idAeronave, idFuncionario)
            .then(function (resultadoGestor) {
                if (resultadoGestor.length == 0) {
                    res.status(403).send("Apenas o gestor da empresa pode alterar o status da aeronave.")
                    return
                }

                return gerenciarAeronaveModel.alterarStatusAeronave(idAeronave, statusAeronave)
                    .then(function () {
                        res.status(200).json({ idAeronave: idAeronave, statusAeronave: statusAeronave })
                    })
            })
            .catch(erroBanco(res, "Houve um erro ao alterar o status da aeronave!"))
    }
}

function alterarStatusComputador(req, res) {
    var idComputador = Number(req.params.idComputador)
    var idFuncionario = Number(req.body.idFuncionarioServer)
    var statusComputador = req.body.statusServer

    if (!idComputador || !idFuncionario) {
        res.status(400).send("O id do FMC ou do funcionário está undefined!")
    } else if (!statusComputadorPermitidos.includes(statusComputador)) {
        res.status(400).send("Status inválido. Use ATIVO, INATIVO ou MANUTENCAO.")
    } else {
        gerenciarAeronaveModel.buscarComputadorDoGestor(idComputador, idFuncionario)
            .then(function (resultadoGestor) {
                if (resultadoGestor.length == 0) {
                    res.status(403).send("Apenas o gestor da empresa pode alterar o status do FMC.")
                    return
                }

                return gerenciarAeronaveModel.alterarStatusComputador(idComputador, statusComputador)
                    .then(function () {
                        res.status(200).json({ idComputador: idComputador, statusComputador: statusComputador })
                    })
            })
            .catch(erroBanco(res, "Houve um erro ao alterar o status do FMC!"))
    }
}

module.exports = {
    listar,
    editar,
    alterarStatusAeronave,
    alterarStatusComputador
}