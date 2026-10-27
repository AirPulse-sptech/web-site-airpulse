var aeronaveModel = require("../models/aeronaveModel")
var computadorModel = require("../models/computadorModel")

const tiposFmc = ["MESTRE", "SPARE"]
const statusComputador = ["ATIVO", "INATIVO", "MANUTENCAO"]

const maximoPlacas = 10

const metricasPermitidas = {
    CPU: [
        { nome: "Percentual de uso", unidadeMedida: "%", descricao: "Uso de processamento no momento da coleta" },
        { nome: "Frequência atual", unidadeMedida: "GHz", descricao: "Frequência de operação no momento da coleta" },
        { nome: "Frequência máxima", unidadeMedida: "GHz", descricao: "Frequência máxima suportada" },
        { nome: "Núcleos físicos", unidadeMedida: "qtd", descricao: "Núcleos reais do processador" },
        { nome: "Núcleos lógicos", unidadeMedida: "qtd", descricao: "Threads disponíveis para o sistema" }
    ],
    RAM: [
        { nome: "Memória total", unidadeMedida: "GB", descricao: "Capacidade instalada" },
        { nome: "Memória usada", unidadeMedida: "GB", descricao: "Memória ocupada pelo sistema" },
        { nome: "Memória disponível", unidadeMedida: "GB", descricao: "Memória livre para uso" },
        { nome: "Percentual de uso", unidadeMedida: "%", descricao: "Memória usada em relação ao total" },
        { nome: "Cache", unidadeMedida: "GB", descricao: "Memória reservada para cache" },
        { nome: "Velocidade", unidadeMedida: "MHz", descricao: "Frequência dos módulos de memória" }
    ],
    DISCO: [
        { nome: "Capacidade total", unidadeMedida: "GB", descricao: "Espaço total de armazenamento" },
        { nome: "Em uso", unidadeMedida: "GB", descricao: "Espaço ocupado" },
        { nome: "Disponível", unidadeMedida: "GB", descricao: "Espaço livre" },
        { nome: "Percentual de uso", unidadeMedida: "%", descricao: "Espaço em uso em relação ao total" },
        { nome: "Leitura / escrita", unidadeMedida: "MB/s", descricao: "Taxa de transferência do armazenamento" }
    ]
}

function limparTexto(valor) {
    return String(valor == undefined ? "" : valor).trim().replace(/\\/g, "\\\\").replace(/'/g, "''")
}

function hostnameValido(valor) {
    var texto = String(valor || "").trim()
    return texto.length <= 255 && /^[A-Za-z0-9._-]+$/.test(texto)
}

function dataValida(valor) {
    return /^\d{4}-\d{2}-\d{2}$/.test(valor || "")
}

function textoPreenchido(valor) {
    return valor != undefined && String(valor).trim() != ""
}

function validarComputadores(computadores) {
    if (!Array.isArray(computadores) || computadores.length == 0) {
        return "Escolha pelo menos um FMC para monitorar."
    }

    var tiposRecebidos = computadores.map(function (computador) { return computador.tipoFmc })
    if (new Set(tiposRecebidos).size != tiposRecebidos.length) {
        return "Cada aeronave possui apenas um FMC Mestre e um FMC Spare."
    }

    for (var computador of computadores) {
        var fmc = computador.tipoFmc == "MESTRE" ? "FMC Mestre" : "FMC Spare"

        if (!tiposFmc.includes(computador.tipoFmc)) return "Tipo de FMC inválido. Use MESTRE ou SPARE."
        if (!textoPreenchido(computador.nome)) return `O nome do ${fmc} está undefined!`
        if (!textoPreenchido(computador.hostname)) return `O hostname do ${fmc} está undefined!`
        if (!hostnameValido(computador.hostname)) return `Hostname do ${fmc} inválido. Use letras, números, ponto, hífen ou sublinhado, sem espaços (até 255 caracteres).`
        if (!textoPreenchido(computador.modelo)) return `O modelo do ${fmc} está undefined!`
        if (!statusComputador.includes(computador.statusComputador)) return `Status do ${fmc} inválido. Use ATIVO, INATIVO ou MANUTENCAO.`
        if (!dataValida(computador.dataInstalacao)) return `A data de instalação do ${fmc} está inválida!`
        if (!dataValida(computador.entradaSistema)) return `A data de entrada no sistema do ${fmc} está inválida!`

        if (!Array.isArray(computador.placas) || computador.placas.length == 0) {
            return `Informe pelo menos uma placa no ${fmc}.`
        }

        if (computador.placas.length > maximoPlacas) {
            return `O ${fmc} pode ter no máximo ${maximoPlacas} placas.`
        }

        for (var i = 0; i < computador.placas.length; i++) {
            var placa = computador.placas[i]
            var nomePlaca = `placa ${i + 1} do ${fmc}`

            if (!textoPreenchido(placa.nome)) return `O nome da ${nomePlaca} está undefined!`
            if (!textoPreenchido(placa.modelo)) return `O modelo da ${nomePlaca} está undefined!`
            if (!textoPreenchido(placa.numeroSerie)) return `O número de série da ${nomePlaca} está undefined!`

            if (!Array.isArray(placa.componentes) || placa.componentes.length == 0) {
                return `Marque pelo menos um componente para monitorar na ${nomePlaca}.`
            }

            var tiposDaPlaca = placa.componentes.map(function (componente) { return componente.tipo })
            if (new Set(tiposDaPlaca).size != tiposDaPlaca.length) {
                return `A ${nomePlaca} tem um componente repetido. Cada placa tem no máximo uma CPU, uma RAM e um armazenamento.`
            }

            for (var componente of placa.componentes) {
                var nomeComponente = componente.tipo === "DISCO" ? "Armazenamento" : componente.tipo
                var permitidas = metricasPermitidas[componente.tipo]

                if (!permitidas) return `Tipo de componente inválido na ${nomePlaca}. Use CPU, RAM ou Armazenamento.`
                if (!textoPreenchido(componente.modelo)) return `O modelo do componente ${nomeComponente} da ${nomePlaca} está undefined!`

                var atencao = Number(componente.limiteAtencao)
                var critico = Number(componente.limiteCritico)
                if (!(atencao > 0 && critico > atencao && critico <= 100)) {
                    return `Limites inválidos no componente ${nomeComponente} da ${nomePlaca}: o crítico deve ser maior que o alerta e no máximo 100%.`
                }

                if (!Array.isArray(componente.metricas) || componente.metricas.length == 0) {
                    return `Marque pelo menos uma métrica para o componente ${nomeComponente} da ${nomePlaca}.`
                }

                for (var metrica of componente.metricas) {
                    var existe = permitidas.some(function (permitida) { return permitida.nome == metrica.nome })
                    if (!existe) return `A métrica "${metrica.nome}" não pode ser monitorada no componente ${nomeComponente}.`
                }
            }
        }
    }

    return null
}

function cadastrarComputadorCompleto(computador, fkAeronave, criados) {
    return computadorModel.cadastrarComputador(
        limparTexto(computador.nome),
        computador.tipoFmc,
        limparTexto(computador.hostname), 
        limparTexto(computador.modelo),
        computador.statusComputador,
        computador.dataInstalacao,
        computador.entradaSistema,
        fkAeronave
    ).then(function (resultadoComputador) {
        var fkComputador = resultadoComputador.insertId
        criados.push(fkComputador)

        return computador.placas.reduce(function (anterior, placa) {
            return anterior.then(function () {
                return cadastrarPlacaCompleta(placa, fkComputador)
            })
        }, Promise.resolve()).then(function () {
            return fkComputador
        })
    })
}

function cadastrarPlacaCompleta(placa, fkComputador) {
    return computadorModel.cadastrarPlaca(
        limparTexto(placa.nome),
        limparTexto(placa.modelo),
        limparTexto(placa.numeroSerie),
        fkComputador
    ).then(function (resultadoPlaca) {
        var fkPlaca = resultadoPlaca.insertId

        return placa.componentes.reduce(function (anterior, componente) {
            return anterior.then(function () {
                return cadastrarComponenteCompleto(componente, fkPlaca)
            })
        }, Promise.resolve())
    })
}

function cadastrarComponenteCompleto(componente, fkPlaca) {
    return computadorModel.cadastrarComponente(
        componente.tipo,
        limparTexto(componente.modelo),
        "ATIVO",
        Number(componente.limiteAtencao),
        Number(componente.limiteCritico),
        fkPlaca
    ).then(function (resultadoComponente) {
        var metricas = metricasPermitidas[componente.tipo]
            .filter(function (permitida) {
                return componente.metricas.some(function (metrica) { return metrica.nome == permitida.nome })
            })
            .map(function (permitida) {
                return {
                    nome: limparTexto(permitida.nome),
                    unidadeMedida: limparTexto(permitida.unidadeMedida),
                    descricao: limparTexto(permitida.descricao)
                }
            })

        return computadorModel.cadastrarMetricas(metricas, resultadoComponente.insertId)
    })
}

function cadastrar(req, res) {
    var idFuncionario = Number(req.body.idFuncionarioServer)
    var fkAeronave = Number(req.body.fkAeronaveServer)
    var computadores = req.body.computadoresServer

    var erroValidacao = validarComputadores(computadores)

    if (!idFuncionario) {
        res.status(400).send("O id do funcionário está undefined!")
    } else if (!fkAeronave) {
        res.status(400).send("A aeronave está undefined!")
    } else if (erroValidacao) {
        res.status(400).send(erroValidacao)
    } else {
        aeronaveModel.buscarAeronaveDoGestor(fkAeronave, idFuncionario)
            .then(function (resultadoAeronave) {
                if (resultadoAeronave.length == 0) {
                    res.status(403).json({ mensagem: "Aeronave não encontrada ou você não é gestor desta empresa." })
                    return
                }

                return computadorModel.buscarPorAeronave(fkAeronave).then(function (resultadoExistentes) {
                    var tiposExistentes = resultadoExistentes.map(function (existente) { return existente.tipoFmc })
                    var repetido = computadores.find(function (computador) {
                        return tiposExistentes.includes(computador.tipoFmc)
                    })

                    if (repetido) {
                        var fmc = repetido.tipoFmc == "MESTRE" ? "FMC Mestre" : "FMC Spare"
                        res.status(409).json({ mensagem: `Esta aeronave já possui um ${fmc} cadastrado.` })
                        return
                    }

                    var criados = []

                    return computadores.reduce(function (anterior, computador) {
                        return anterior.then(function () {
                            return cadastrarComputadorCompleto(computador, fkAeronave, criados)
                        })
                    }, Promise.resolve())
                        .then(function () {
                            res.status(201).json({
                                mensagem: "FMCs cadastrados com sucesso!",
                                computadores: criados
                            })
                        })
                        .catch(function (erro) {
                            console.log(erro)
                            console.log("\nHouve um erro ao cadastrar os FMCs! Desfazendo o que já foi gravado. Erro: ", erro.sqlMessage)

                            Promise.all(criados.map(computadorModel.excluirComputador))
                                .catch(function (erroExclusao) {
                                    console.log("\nNão foi possível desfazer o cadastro! Erro: ", erroExclusao.sqlMessage)
                                })
                                .then(function () {
                                    res.status(500).json(erro.sqlMessage)
                                })
                        })
                })
            })
            .catch(function (erro) {
                console.log(erro)
                console.log("\nHouve um erro ao buscar a aeronave! Erro: ", erro.sqlMessage)
                res.status(500).json(erro.sqlMessage)
            })
    }
}

function buscarMonitoramento(req, res) {
    var idAeronave = Number(req.params.idAeronave)
    var idFuncionario = Number(req.params.idFuncionario)

    if (!idAeronave || !idFuncionario) {
        res.status(400).send("O id da aeronave ou do funcionário está undefined!")
    } else {
        computadorModel.buscarMonitoramento(idAeronave, idFuncionario)
            .then(function (resultado) {
                var computadores = []

                resultado.forEach(function (linha) {
                    var computador = computadores.find(function (item) { return item.idComputador == linha.idComputador })

                    if (!computador) {
                        computador = {
                            idComputador: linha.idComputador,
                            tipoFmc: linha.tipoFmc,
                            statusComputador: linha.statusComputador,
                            componentes: []
                        }
                        computadores.push(computador)
                    }

                    computador.componentes.push({
                        placa: linha.placa, 
                        tipo: linha.tipo,
                        limiteAtencao: Number(linha.limiteAtencao),
                        limiteCritico: Number(linha.limiteCritico)
                    })
                })

                res.status(200).json(computadores)
            })
            .catch(function (erro) {
                console.log("Houve um erro ao buscar o monitoramento da aeronave!", erro)
                res.status(500).json(erro.sqlMessage)
            })
    }
}

module.exports = {
    buscarMonitoramento,
    cadastrar
}