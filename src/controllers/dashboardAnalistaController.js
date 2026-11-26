var alertaModel = require("../models/alertaModel")
var metricaModel = require("../models/metricaModel")
var alertaRelatorioModel = require("../models/alertaRelatorioModel")
var dashboardAnalistaModel = require("../models/dashboardAnalistaModel")
var alertaRelatorioController = require("./alertaRelatorioController")
var detalheGoldModel = require("../models/detalheGoldModel")

var colunaPorTipo = { CPU: "cpu_media", RAM: "ram_media", DISCO: "flash_media", FLASH: "flash_media" }
var nomePorTipo = { CPU: "CPU", RAM: "RAM", DISCO: "Armazenamento", FLASH: "Armazenamento" }
var pesoStatus = { semDados: -1, normal: 0, atencao: 1, critico: 2 }
var umDiaMs = 24 * 60 * 60 * 1000

function idValido(id) {
    return Number.isSafeInteger(id) && id > 0
}

function numeroOuNulo(valor) {
    var numero = valor === null || valor === undefined || valor === "" ? NaN : Number(valor)
    return Number.isFinite(numero) ? numero : null
}

function classificar(valor, limiteAtencao, limiteCritico) {
    if (valor === null) return "semDados"
    if (limiteCritico !== null && valor >= limiteCritico) return "critico"
    if (limiteAtencao !== null && valor >= limiteAtencao) return "atencao"
    return "normal"
}

function piorStatus(lista) {
    if (lista.length == 0) return "semDados"
    return lista.reduce(function (pior, status) {
        return pesoStatus[status] > pesoStatus[pior] ? status : pior
    }, "semDados")
}

function maisRecente(datas) {
    return datas.filter(Boolean).reduce(function (maior, data) {
        return !maior || Date.parse(data) > Date.parse(maior) ? data : maior
    }, null)
}

function indexarUltimaLeitura(leituras) {
    var porPlaca = new Map()
    leituras.forEach(function (linha) {
        var ts = typeof linha.ts == "string" && Number.isFinite(Date.parse(linha.ts)) ? new Date(linha.ts).toISOString() : null
        if (!ts || linha.placa_serie === null || linha.placa_serie === undefined) return
        var chave = `${linha.hostname}|${linha.placa_serie}`
        var anterior = porPlaca.get(chave)
        if (!anterior || ts > anterior.ts) porPlaca.set(chave, Object.assign({}, linha, { ts: ts }))
    })
    return porPlaca
}

function contarAlertas(alertas, inicio, fim) {
    var porPlaca = new Map()
    var abertosPorAeronave = new Map()
    alertas.forEach(function (alerta) {
        if (alerta.em_aberto_apos_evento) {
            var desde = abertosPorAeronave.get(alerta.aeronave_id)
            if (!desde || alerta.ts_abertura < desde) abertosPorAeronave.set(alerta.aeronave_id, alerta.ts_abertura)
        }
        var abertura = Date.parse(alerta.ts_abertura)
        if (abertura < inicio || abertura > fim) return
        var chave = `${alerta.hostname}|${alerta.placa_serie}`
        var contagem = porPlaca.get(chave) || { ocorrencias: 0, criticas: 0 }
        contagem.ocorrencias++
        if (alerta.nivel == "CRITICO") contagem.criticas++
        porPlaca.set(chave, contagem)
    })
    return { porPlaca: porPlaca, abertosPorAeronave: abertosPorAeronave }
}

function montarFrota(linhas, leituras, alertas) {
    var ultimasLeituras = indexarUltimaLeitura(leituras)
    var ultimaColeta = maisRecente(Array.from(ultimasLeituras.values()).map(function (linha) { return linha.ts }))
    var fim = ultimaColeta ? Date.parse(ultimaColeta) : Date.now()
    var inicio = fim - umDiaMs
    var contagem = contarAlertas(alertas, inicio, fim)

    var aeronaves = new Map()
    linhas.forEach(function (linha) {
        if (!aeronaves.has(linha.idAeronave)) {
            aeronaves.set(linha.idAeronave, {
                idAeronave: linha.idAeronave, nome: linha.aeronave, modelo: linha.modelo,
                companhiaAerea: linha.companhiaAerea, fmcs: new Map()
            })
        }
        var aeronave = aeronaves.get(linha.idAeronave)
        if (linha.idComputador === null) return
        if (!aeronave.fmcs.has(linha.idComputador)) {
            aeronave.fmcs.set(linha.idComputador, {
                idComputador: linha.idComputador, nome: linha.computador || `FMC ${linha.tipoFmc}`,
                tipoFmc: linha.tipoFmc, hostname: linha.hostname, statusComputador: linha.statusComputador,
                placas: new Map()
            })
        }
        var fmc = aeronave.fmcs.get(linha.idComputador)
        if (linha.idPlaca === null) return
        if (!fmc.placas.has(linha.idPlaca)) {
            var chavePlaca = `${linha.hostname}|${linha.numeroSerie}`
            var alertasPlaca = contagem.porPlaca.get(chavePlaca) || { ocorrencias: 0, criticas: 0 }
            fmc.placas.set(linha.idPlaca, {
                idPlaca: linha.idPlaca, nome: linha.placa, numeroSerie: linha.numeroSerie,
                leitura: ultimasLeituras.get(chavePlaca) || null,
                ocorrencias: alertasPlaca.ocorrencias, criticas: alertasPlaca.criticas, componentes: []
            })
        }
        var placa = fmc.placas.get(linha.idPlaca)
        if (linha.idComponente === null) return
        var tipo = String(linha.tipo || "").toUpperCase()
        var coluna = colunaPorTipo[tipo]
        var valor = placa.leitura && coluna ? numeroOuNulo(placa.leitura[coluna]) : null
        var limiteAtencao = numeroOuNulo(linha.limiteAtencao)
        var limiteCritico = numeroOuNulo(linha.limiteCritico)
        placa.componentes.push({
            idComponente: linha.idComponente, tipo: tipo, nome: nomePorTipo[tipo] || tipo,
            valor: valor === null ? null : Math.round(valor * 10) / 10,
            limiteAtencao: limiteAtencao, limiteCritico: limiteCritico,
            status: classificar(valor, limiteAtencao, limiteCritico)
        })
    })

    var frota = Array.from(aeronaves.values()).map(function (aeronave) {
        var fmcs = Array.from(aeronave.fmcs.values()).map(function (fmc) {
            var placas = Array.from(fmc.placas.values()).map(function (placa) {
                return {
                    idPlaca: placa.idPlaca, nome: placa.nome, numeroSerie: placa.numeroSerie,
                    ultimaColeta: placa.leitura ? placa.leitura.ts : null,
                    status: piorStatus(placa.componentes.map(function (componente) { return componente.status })),
                    ocorrencias: placa.ocorrencias, criticas: placa.criticas, componentes: placa.componentes
                }
            })
            return {
                idComputador: fmc.idComputador, nome: fmc.nome, tipoFmc: fmc.tipoFmc,
                hostname: fmc.hostname, statusComputador: fmc.statusComputador,
                ultimaColeta: maisRecente(placas.map(function (placa) { return placa.ultimaColeta })),
                status: piorStatus(placas.map(function (placa) { return placa.status })),
                ocorrencias: placas.reduce(function (total, placa) { return total + placa.ocorrencias }, 0),
                criticas: placas.reduce(function (total, placa) { return total + placa.criticas }, 0),
                placas: placas
            }
        })
        return {
            idAeronave: aeronave.idAeronave, nome: aeronave.nome, modelo: aeronave.modelo,
            companhiaAerea: aeronave.companhiaAerea,
            ultimaColeta: maisRecente(fmcs.map(function (fmc) { return fmc.ultimaColeta })),
            alertaAbertoDesde: contagem.abertosPorAeronave.get(aeronave.idAeronave) || null,
            status: piorStatus(fmcs.map(function (fmc) { return fmc.status })),
            fmcs: fmcs
        }
    })

    return {
        ultimaColeta: ultimaColeta,
        janelaAlertas: { inicio: new Date(inicio).toISOString(), fim: new Date(fim).toISOString() },
        aeronaves: frota
    }
}

function explicarErroAws(erro) {
    var nome = erro.name || erro.code || ""
    if (["ExpiredToken", "ExpiredTokenException", "InvalidToken", "InvalidAccessKeyId", "SignatureDoesNotMatch", "CredentialsProviderError", "UnrecognizedClientException"].includes(nome)) {
        return "As credenciais AWS do .env expiraram ou são inválidas. Atualize aws_access_key_id, aws_secret_access_key e aws_session_token e reinicie o servidor."
    }
    if (nome == "AccessDenied") return "As credenciais AWS do .env não têm permissão de leitura no bucket configurado."
    if (nome == "NoSuchBucket") return "O bucket informado em aws_s3_bucket não existe."
    if (["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ETIMEDOUT", "TimeoutError", "AbortError"].includes(nome)) {
        return "O servidor não conseguiu acessar a AWS. Confira a conexão com a internet."
    }
    if (/aws_region|aws_s3_bucket/.test(erro.message || "")) return erro.message
    return "Não foi possível ler os dados do bucket gold. Veja o erro no terminal do servidor."
}

function responderErro(res, erro) {
    console.log("Erro ao montar a visão geral do analista:", typeof erro == "string" ? erro : (erro.code || erro.name), erro.message || "")
    if (erro.status) return res.status(erro.status).json({ mensagem: erro.message })
    var mensagem = "Não foi possível carregar a visão geral. Veja o erro completo no terminal do servidor."
    if (typeof erro == "string") mensagem = `Erro de configuração do servidor: ${erro}`
    else if (["ECONNREFUSED", "ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR", "ENOTFOUND"].includes(erro.code)) mensagem = "O servidor não conseguiu conectar ao banco de dados. Confira as variáveis DB_ do .env."
    else if (erro.code == "ER_NO_SUCH_TABLE" || erro.code == "ER_BAD_FIELD_ERROR") mensagem = "O banco está desatualizado. Rode novamente o scriptBd.sql."
    return res.status(erro.code && erro.code.startsWith("ER_") ? 500 : 503).json({ mensagem: mensagem })
}

function montarVisaoGeral(contexto) {
    var avisos = new Set()
    function semGold(origem) {
        return function (erro) {
            console.log(`Erro ao ler ${origem} no S3:`, erro.name || erro.code, erro.message)
            avisos.add(explicarErroAws(erro))
            return []
        }
    }
    return Promise.all([
        dashboardAnalistaModel.buscarEstrutura(contexto.empresaId),
        metricaModel.listarUltimaColeta(contexto.computadores).catch(semGold("métricas")),
        alertaModel.listar(contexto.computadores).then(function (eventos) {
            return alertaRelatorioController.consolidar(eventos, contexto.computadores)
        }).catch(semGold("alertas"))
    ]).then(function (resultados) {
        if (avisos.size == 0 && contexto.computadores.length > 0 && resultados[1].length == 0) {
            avisos.add("Nenhuma métrica foi encontrada no bucket gold para os hostnames cadastrados ("
                + contexto.computadores.map(function (computador) { return computador.hostname }).join(", ")
                + "). Confira se o hostname de cada FMC no banco é igual ao das pastas hostname= do S3.")
        }
        var visaoGeral = montarFrota(resultados[0], resultados[1], resultados[2])
        visaoGeral.avisos = Array.from(avisos)
        return visaoGeral
    })
}

function buscarVisaoGeral(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)
    if (!idValido(idFuncionario)) {
        return res.status(400).json({ mensagem: "O id do funcionário está inválido!" })
    }
    return alertaRelatorioModel.contexto(idFuncionario, "ANALISTA", null)
        .then(montarVisaoGeral)
        .then(function (visaoGeral) {
            res.status(200).json(visaoGeral)
        })
        .catch(function (erro) { responderErro(res, erro) })
}

function buscarDetalhePlaca(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)
    var idPlaca = Number(req.params.idPlaca)
    if (!idValido(idFuncionario) || !idValido(idPlaca)) {
        return res.status(400).json({ mensagem: "Informe uma placa e um funcionário válidos." })
    }
    return alertaRelatorioModel.contexto(idFuncionario, "ANALISTA", null)
        .then(function (contexto) {
            return dashboardAnalistaModel.buscarDetalhePlaca(idPlaca, contexto.empresaId).then(function (linhas) {
                if (!linhas.length) throw Object.assign(new Error("Placa não encontrada ou sem acesso."), { status: 404 })
                var placa = linhas[0]
                var computador = contexto.computadores.find(function (item) { return item.idComputador == placa.idComputador })
                if (!computador) throw Object.assign(new Error("Placa não encontrada ou sem acesso."), { status: 404 })
                return Promise.all([
                    detalheGoldModel.buscar(placa.hostname, String(placa.numeroSerie)),
                    alertaModel.listar([computador]).then(function (eventos) {
                        return alertaRelatorioController.consolidar(eventos, [computador])
                    })
                ]).then(function (resultados) {
                    var componentes = {}
                    linhas.forEach(function (linha) {
                        var tipo = String(linha.tipo || "").toUpperCase()
                        var chave = tipo == "DISCO" || tipo == "FLASH" ? "flash" : tipo.toLowerCase()
                        if (linha.idComponente) componentes[chave] = {
                            id: linha.idComponente, nome: chave == "flash" ? "Armazenamento" : tipo,
                            limiteAtencao: linha.limiteAtencao == null ? null : Number(linha.limiteAtencao),
                            limiteCritico: linha.limiteCritico == null ? null : Number(linha.limiteCritico)
                        }
                    })
                    var serieGold = String(resultados[0].serieGold || placa.numeroSerie).trim()
                    var alertas = resultados[1].filter(function (alerta) {
                        return String(alerta.placa_serie).trim().toLowerCase() === serieGold.toLowerCase()
                    })
                    res.status(200).json({
                        placa: { id: placa.idPlaca, nome: placa.placa, serie: String(placa.numeroSerie), hostname: placa.hostname,
                            computador: placa.computador, aeronave: placa.aeronave, modeloAeronave: placa.modelo },
                        componentes: componentes, monitoramento: resultados[0].monitoramento,
                        serie: resultados[0].serie, alertas: alertas,
                        diagnosticoGold: resultados[0].diagnostico
                    })
                })
            })
        })
        .catch(function (erro) { responderErro(res, erro) })
}

module.exports = {
    buscarVisaoGeral,
    montarVisaoGeral,
    responderErro,
    buscarDetalhePlaca,
    montarFrota,
    classificar,
    explicarErroAws
}
