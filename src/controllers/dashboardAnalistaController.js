var alertaModel = require("../models/alertaModel")
var metricaModel = require("../models/metricaModel")
var alertaRelatorioModel = require("../models/alertaRelatorioModel")
var dashboardAnalistaModel = require("../models/dashboardAnalistaModel")
var alertaRelatorioController = require("./alertaRelatorioController")
var detalheGoldModel = require("../models/detalheGoldModel")
var jiraAlertaModel = require("../models/jiraAlertaModel")

var campoPorTipo = { CPU: "cpu", RAM: "ram", DISCO: "flash", FLASH: "flash" }
var statusPorNivel = { NORMAL: "normal", ATENCAO: "atencao", CRITICO: "critico" }
var nomePorTipo = { CPU: "CPU", RAM: "RAM", DISCO: "Armazenamento", FLASH: "Armazenamento" }
var pesoStatus = { semDados: -1, normal: 0, atencao: 1, critico: 2 }

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

function normalizar(valor) {
    return String(valor ?? "").trim().toLowerCase()
}

function indexarMonitoramento(linhas) {
    var porPlaca = new Map()
    var porHost = new Map()
    linhas.forEach(function (linha) {
        var ts = Number.isFinite(Date.parse(linha.ultima_amostra_utc)) ? new Date(linha.ultima_amostra_utc).toISOString() : null
        if (!ts || linha.placa_serie === null || linha.placa_serie === undefined) return
        var monitoramento = Object.assign({}, linha, { ts: ts })
        var chave = `${normalizar(linha.hostname)}|${normalizar(linha.placa_serie)}`
        var anterior = porPlaca.get(chave)
        if (!anterior || ts > anterior.ts) porPlaca.set(chave, monitoramento)
        var host = normalizar(linha.hostname)
        porHost.set(host, (porHost.get(host) || []).concat(monitoramento))
    })
    return {
        buscar: function (hostname, numeroSerie) {
            var exato = porPlaca.get(`${normalizar(hostname)}|${normalizar(numeroSerie)}`)
            if (exato) return exato
            var doHost = porHost.get(normalizar(hostname)) || []
            return doHost.length == 1 ? doHost[0] : null
        },
        datas: function () {
            return Array.from(porPlaca.values()).map(function (linha) { return linha.ts })
        }
    }
}

function statusComponente(monitoramento, campo, valor, limiteAtencao, limiteCritico) {
    if (valor === null) return "semDados"
    return statusPorNivel[monitoramento[`${campo}_nivel`]] || classificar(valor, limiteAtencao, limiteCritico)
}

function janelaUltimaColeta(leitura) {
    var fim = Date.parse(leitura.ts)
    var inicios = (Array.isArray(leitura.sessoes) ? leitura.sessoes : [])
        .map(function (sessao) { return Date.parse(sessao.inicio) })
        .filter(Number.isFinite)
    return { inicio: inicios.length ? Math.min.apply(null, inicios) : fim, fim: fim }
}

function contarAlertasAtivos(alertas, monitoramento) {
    var porPlaca = new Map()
    var abertosPorAeronave = new Map()
    var toleranciaMs = 60 * 1000
    alertas.forEach(function (alerta) {
        if (!alerta.em_aberto_apos_evento) return
        var leitura = monitoramento.buscar(alerta.hostname, alerta.placa_serie)
        if (!leitura) return
        var janela = janelaUltimaColeta(leitura)
        var evento = Date.parse(alerta.ts_evento || alerta.ts_abertura)
        if (!(evento >= janela.inicio - toleranciaMs && evento <= janela.fim + toleranciaMs)) return
        var chave = `${normalizar(leitura.hostname)}|${normalizar(leitura.placa_serie)}`
        var contagem = porPlaca.get(chave) || { ocorrencias: 0, criticas: 0 }
        contagem.ocorrencias++
        if (alerta.nivel == "CRITICO") contagem.criticas++
        porPlaca.set(chave, contagem)
        var desde = abertosPorAeronave.get(alerta.aeronave_id)
        if (!desde || alerta.ts_abertura < desde) abertosPorAeronave.set(alerta.aeronave_id, alerta.ts_abertura)
    })
    return { porPlaca: porPlaca, abertosPorAeronave: abertosPorAeronave }
}

function montarFrota(linhas, monitoramentos, alertas) {
    var monitoramento = indexarMonitoramento(monitoramentos)
    var ultimaColeta = maisRecente(monitoramento.datas())
    var contagem = contarAlertasAtivos(alertas, monitoramento)

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
            var leitura = monitoramento.buscar(linha.hostname, linha.numeroSerie)
            var chavePlaca = `${normalizar(linha.hostname)}|${normalizar(leitura ? leitura.placa_serie : linha.numeroSerie)}`
            var alertasPlaca = contagem.porPlaca.get(chavePlaca) || { ocorrencias: 0, criticas: 0 }
            fmc.placas.set(linha.idPlaca, {
                idPlaca: linha.idPlaca, nome: linha.placa, numeroSerie: linha.numeroSerie,
                leitura: leitura,
                ocorrencias: alertasPlaca.ocorrencias, criticas: alertasPlaca.criticas, componentes: []
            })
        }
        var placa = fmc.placas.get(linha.idPlaca)
        if (linha.idComponente === null) return
        var tipo = String(linha.tipo || "").toUpperCase()
        var campo = campoPorTipo[tipo]
        var leituraPlaca = placa.leitura && campo ? placa.leitura : null
        var valor = leituraPlaca ? numeroOuNulo(leituraPlaca[`${campo}_pct`]) : null
        var limiteAtencao = leituraPlaca && numeroOuNulo(leituraPlaca[`${campo}_limite_atencao`]) !== null
            ? numeroOuNulo(leituraPlaca[`${campo}_limite_atencao`]) : numeroOuNulo(linha.limiteAtencao)
        var limiteCritico = leituraPlaca && numeroOuNulo(leituraPlaca[`${campo}_limite_critico`]) !== null
            ? numeroOuNulo(leituraPlaca[`${campo}_limite_critico`]) : numeroOuNulo(linha.limiteCritico)
        placa.componentes.push({
            idComponente: linha.idComponente, tipo: tipo, nome: nomePorTipo[tipo] || tipo,
            valor: valor === null ? null : Math.round(valor * 10) / 10,
            limiteAtencao: limiteAtencao, limiteCritico: limiteCritico,
            status: leituraPlaca ? statusComponente(leituraPlaca, campo, valor, limiteAtencao, limiteCritico) : "semDados"
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

function montarVisaoGeral(contexto, idFuncionario) {
    var avisos = new Set()
    function semGold(origem) {
        return function (erro) {
            console.log(`Erro ao ler ${origem} no S3:`, erro.name || erro.code, erro.message)
            avisos.add(explicarErroAws(erro))
            return []
        }
    }
    var buscarEstrutura = idFuncionario
        ? dashboardAnalistaModel.buscarEstruturaFuncionario(idFuncionario, contexto.empresaId)
        : dashboardAnalistaModel.buscarEstrutura(contexto.empresaId)
    return buscarEstrutura.then(function (estrutura) {
        var idsAeronaves = new Set(estrutura.map(function (linha) { return linha.idAeronave }))
        var computadores = contexto.computadores.filter(function (computador) {
            return idsAeronaves.has(computador.idAeronave)
        })
        return Promise.all([
            metricaModel.listarMonitoramento(computadores).catch(semGold("monitoramento")),
            alertaModel.listar(computadores).then(function (eventos) {
                return alertaRelatorioController.consolidar(eventos, computadores)
            }).catch(semGold("alertas"))
        ]).then(function (resultados) {
            if (avisos.size == 0 && computadores.length > 0 && resultados[0].length == 0) {
                avisos.add("Nenhum monitoramento de placa foi encontrado no bucket gold para os hostnames cadastrados ("
                    + computadores.map(function (computador) { return computador.hostname }).join(", ")
                    + "). Confira se o hostname de cada FMC no banco é igual ao das pastas hostname= do S3.")
            }
            var visaoGeral = montarFrota(estrutura, resultados[0], resultados[1])
            visaoGeral.avisos = Array.from(avisos)
            return visaoGeral
        })
    })
}

function buscarVisaoGeral(req, res) {
    var idFuncionario = Number(req.params.idFuncionario)
    if (!idValido(idFuncionario)) {
        return res.status(400).json({ mensagem: "O id do funcionário está inválido!" })
    }
    return alertaRelatorioModel.contexto(idFuncionario, "ANALISTA", null)
        .then(function (contexto) { return montarVisaoGeral(contexto, idFuncionario) })
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
            return dashboardAnalistaModel.buscarDetalhePlaca(idPlaca, contexto.empresaId, idFuncionario).then(function (linhas) {
                if (!linhas.length) throw Object.assign(new Error("Placa não encontrada ou sem acesso."), { status: 404 })
                var placa = linhas[0]
                var computador = contexto.computadores.find(function (item) { return item.idComputador == placa.idComputador })
                if (!computador) throw Object.assign(new Error("Placa não encontrada ou sem acesso."), { status: 404 })
                return Promise.all([
                    detalheGoldModel.buscar(placa.hostname, String(placa.numeroSerie)),
                    alertaModel.listar([computador]).then(function (eventos) {
                        return { eventos: eventos, ocorrencias: alertaRelatorioController.consolidar(eventos, [computador]) }
                    }),
                    jiraAlertaModel.buscarMapaIssues().catch(function () {
                        return { disponivel: false, mapa: new Map() }
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
                    var jiraResultado = resultados[2] || { disponivel: false, mapa: new Map() }
                    var alertas = resultados[1].ocorrencias.filter(function (alerta) {
                        return String(alerta.placa_serie).trim().toLowerCase() === serieGold.toLowerCase()
                    }).map(function (alerta) {
                        var jiraInfo
                        if (!jiraResultado.disponivel) {
                            jiraInfo = { indisponivel: true }
                        } else {
                            var label = jiraAlertaModel.sanitizarLabelAlerta(alerta.alerta_id)
                            var issue = jiraResultado.mapa.get(label)
                            if (issue) {
                                jiraInfo = {
                                    key: issue.key,
                                    url: jiraAlertaModel.montarUrlIssue(issue.key),
                                    status: issue.status
                                }
                            } else if (alerta.em_aberto_apos_evento === true) {
                                jiraInfo = { aguardando: true }
                            } else {
                                jiraInfo = { semIssue: true }
                            }
                        }
                        return Object.assign({}, alerta, { jira: jiraInfo })
                    })
                    var idsDaPlaca = new Set(alertas.map(function (alerta) { return alerta.alerta_id }))
                    var alertasConfirmados = resultados[1].eventos.filter(function (evento) {
                        return idsDaPlaca.has(evento.alerta_id)
                            && evento.hostname === computador.hostname && Number(evento.computador_id) === Number(computador.idComputador)
                            && Number(evento.aeronave_id) === Number(computador.idAeronave) && Number(evento.empresa_id) === Number(computador.empresaId)
                            && String(evento.placa_serie).trim().toLowerCase() === serieGold.toLowerCase()
                            && ["ABERTURA", "ESCALONAMENTO"].includes(evento.tipo_evento)
                    }).map(function (evento) {
                        return { metrica: evento.metrica, tipo_evento: evento.tipo_evento,
                            ts_evento: evento.ts_evento, nivel: evento.nivel, valor: evento.valor }
                    })
                    res.status(200).json({
                        placa: { id: placa.idPlaca, nome: placa.placa, serie: String(placa.numeroSerie), hostname: placa.hostname,
                            computador: placa.computador, aeronave: placa.aeronave, modeloAeronave: placa.modelo },
                        componentes: componentes, monitoramento: resultados[0].monitoramento,
                        serie: resultados[0].serie, alertas: alertas, alertasConfirmados: alertasConfirmados,
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
