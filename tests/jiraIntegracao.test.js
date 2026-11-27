const test = require("node:test")
const assert = require("node:assert/strict")
const Module = require("node:module")
const path = require("node:path")
const fs = require("node:fs")

const jiraAlertaModel = require("../src/models/jiraAlertaModel")
const alertaRelatorioController = require("../src/controllers/alertaRelatorioController")

test("sanitizarLabelAlerta segue regra canônica compartilhada com Java", () => {
    assert.equal(
        jiraAlertaModel.sanitizarLabelAlerta("fmc-01:PLACA_A:cpu_pct:2026-11-26T10:00:00.123Z"),
        "alerta-fmc-01-PLACA_A-cpu_pct-2026-11-26T10-00-00.123Z"
    )
    assert.equal(
        jiraAlertaModel.sanitizarLabelAlerta("a:b_c.d-e"),
        "alerta-a-b_c.d-e"
    )
})

test("jiraAlertaModel usa POST /rest/api/3/search/jql com paginacao nextPageToken sem startAt", async () => {
    const chamadas = []
    const fetchMock = async (url, init) => {
        chamadas.push({ url, method: init.method, body: JSON.parse(init.body) })
        if (chamadas.length === 1) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    issues: [
                        {
                            key: "AIR-10",
                            fields: {
                                labels: ["alerta-1"],
                                status: { name: "Done" },
                                created: "2026-11-26T10:00:00.000Z"
                            }
                        }
                    ],
                    isLast: false,
                    nextPageToken: "page-2-token"
                })
            }
        }
        return {
            ok: true,
            status: 200,
            json: async () => ({
                issues: [
                    {
                        key: "AIR-11",
                        fields: {
                            labels: ["alerta-1", "alerta-2"],
                            status: { name: "To Do" },
                            created: "2026-11-26T11:00:00.000Z"
                        }
                    }
                ],
                isLast: true
            })
        }
    }

    const res = await jiraAlertaModel.buscarMapaIssues({
        baseUrl: "https://airpulse.atlassian.net/",
        email: "svc@airpulse.test",
        apiToken: "tok",
        projectKey: "AIR",
        fetchImpl: fetchMock
    })

    assert.equal(res.disponivel, true)
    assert.equal(chamadas.length, 2)
    assert.equal(chamadas[0].url, "https://airpulse.atlassian.net/rest/api/3/search/jql")
    assert.equal(chamadas[0].method, "POST")
    assert.equal(chamadas[0].body.nextPageToken, undefined)
    assert.equal(chamadas[0].body.startAt, undefined)
    assert.equal(chamadas[1].body.nextPageToken, "page-2-token")
    assert.equal(chamadas[1].body.startAt, undefined)

    // Duplicidade escolhe a issue mais antiga (AIR-10)
    assert.deepEqual(res.mapa.get("alerta-1"), {
        key: "AIR-10",
        status: "Done",
        created: "2026-11-26T10:00:00.000Z"
    })
    assert.deepEqual(res.mapa.get("alerta-2"), {
        key: "AIR-11",
        status: "To Do",
        created: "2026-11-26T11:00:00.000Z"
    })
})

test("jiraAlertaModel retorna indisponivel em falha HTTP ou excecao", async () => {
    const resHttp = await jiraAlertaModel.buscarMapaIssues({
        baseUrl: "https://airpulse.atlassian.net",
        email: "svc@airpulse.test",
        apiToken: "tok",
        projectKey: "AIR",
        fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({}) })
    })
    assert.equal(resHttp.disponivel, false)
    assert.equal(resHttp.mapa.size, 0)

    const resErro = await jiraAlertaModel.buscarMapaIssues({
        baseUrl: "https://airpulse.atlassian.net",
        email: "svc@airpulse.test",
        apiToken: "tok",
        projectKey: "AIR",
        fetchImpl: async () => { throw new Error("ECONNREFUSED") }
    })
    assert.equal(resErro.disponivel, false)
    assert.equal(resErro.mapa.size, 0)
})

test("consolidar preserva tipo_evento, valor_abertura_pct, maior_nivel e limiar_violado do evento mais recente", () => {
    const computadores = [
        { idComputador: 10, idAeronave: 20, empresaId: 1, hostname: "fmc-1", aeronave: "PT-AIR", tipoFmc: "PRIMARIO" }
    ]
    const eventos = [
        {
            alerta_id: "id-1", hostname: "fmc-1", computador_id: 10, aeronave_id: 20, empresa_id: 1,
            placa_serie: "PLACA-1", metrica: "cpu_pct", tipo_evento: "ABERTURA",
            nivel: "ATENCAO", maior_nivel: "ATENCAO", valor: 82, valor_abertura_pct: 82, limiar_violado: 80,
            ts_abertura: "2026-11-26T10:00:00Z", ts_evento: "2026-11-26T10:00:00Z",
            ts_encerramento: null, em_aberto_apos_evento: true
        },
        {
            alerta_id: "id-1", hostname: "fmc-1", computador_id: 10, aeronave_id: 20, empresa_id: 1,
            placa_serie: "PLACA-1", metrica: "cpu_pct", tipo_evento: "ESCALONAMENTO",
            nivel: "CRITICO", maior_nivel: "CRITICO", valor: 94, valor_abertura_pct: 82, limiar_violado: 90,
            ts_abertura: "2026-11-26T10:00:00Z", ts_evento: "2026-11-26T10:05:00Z",
            ts_encerramento: null, em_aberto_apos_evento: true
        }
    ]

    const consolidados = alertaRelatorioController.consolidar(eventos, computadores)
    assert.equal(consolidados.length, 1)
    assert.equal(consolidados[0].tipo_evento, "ESCALONAMENTO")
    assert.equal(consolidados[0].valor_abertura_pct, 82)
    assert.equal(consolidados[0].maior_nivel, "CRITICO")
    assert.equal(consolidados[0].limiar_violado, 90)
    assert.equal(consolidados[0].em_aberto_apos_evento, true)
})

function carregarControllerComMocks(jiraMockResult) {
    const controllerPath = require.resolve("../src/controllers/dashboardAnalistaController")
    delete require.cache[controllerPath]

    const origLoad = Module._load
    Module._load = function (request, parent, isMain) {
        if (request === "../models/alertaRelatorioModel") {
            return {
                contexto: async () => ({
                    empresaId: 1,
                    computadores: [{ idComputador: 10, idAeronave: 20, empresaId: 1, hostname: "fmc-1", aeronave: "PT-AIR", tipoFmc: "PRIMARIO" }]
                })
            }
        }
        if (request === "../models/dashboardAnalistaModel") {
            return {
                buscarDetalhePlaca: async () => ([
                    { idPlaca: 5, placa: "Placa CPU", numeroSerie: "SERIE-1", hostname: "fmc-1", idComputador: 10, computador: "FMC 1", aeronave: "PT-AIR", modelo: "A320", idComponente: 1, tipo: "CPU", limiteAtencao: 80, limiteCritico: 90 }
                ])
            }
        }
        if (request === "../models/detalheGoldModel") {
            return {
                buscar: async () => ({ serieGold: "SERIE-1", monitoramento: null, serie: [], diagnostico: {} })
            }
        }
        if (request === "../models/alertaModel") {
            return {
                listar: async () => ([
                    {
                        alerta_id: "fmc-1:SERIE-1:cpu_pct:1", hostname: "fmc-1", computador_id: 10, aeronave_id: 20, empresa_id: 1,
                        placa_serie: "SERIE-1", metrica: "cpu_pct", tipo_evento: "ABERTURA",
                        nivel: "CRITICO", maior_nivel: "CRITICO", valor: 95, valor_abertura_pct: 95, limiar_violado: 90,
                        ts_abertura: "2026-11-26T10:00:00Z", ts_evento: "2026-11-26T10:00:00Z", em_aberto_apos_evento: true
                    },
                    {
                        alerta_id: "fmc-1:SERIE-1:ram_pct:2", hostname: "fmc-1", computador_id: 10, aeronave_id: 20, empresa_id: 1,
                        placa_serie: "SERIE-1", metrica: "ram_pct", tipo_evento: "ABERTURA",
                        nivel: "ATENCAO", maior_nivel: "ATENCAO", valor: 82, valor_abertura_pct: 82, limiar_violado: 80,
                        ts_abertura: "2026-11-26T09:00:00Z", ts_evento: "2026-11-26T09:00:00Z", em_aberto_apos_evento: true
                    },
                    {
                        alerta_id: "fmc-1:SERIE-1:flash_pct:3", hostname: "fmc-1", computador_id: 10, aeronave_id: 20, empresa_id: 1,
                        placa_serie: "SERIE-1", metrica: "flash_pct", tipo_evento: "ABERTURA",
                        nivel: "ATENCAO", maior_nivel: "ATENCAO", valor: 81, valor_abertura_pct: 81, limiar_violado: 80,
                        ts_abertura: "2026-11-26T08:00:00Z", ts_evento: "2026-11-26T08:00:00Z", em_aberto_apos_evento: false
                    },
                    {
                        alerta_id: "fmc-1:OUTRA-SERIE:cpu_pct:4", hostname: "fmc-1", computador_id: 10, aeronave_id: 20, empresa_id: 1,
                        placa_serie: "OUTRA-SERIE", metrica: "cpu_pct", tipo_evento: "ABERTURA",
                        nivel: "CRITICO", maior_nivel: "CRITICO", valor: 99, valor_abertura_pct: 99, limiar_violado: 90,
                        ts_abertura: "2026-11-26T10:00:00Z", ts_evento: "2026-11-26T10:00:00Z", em_aberto_apos_evento: true
                    }
                ])
            }
        }
        if (request === "../models/jiraAlertaModel") {
            return {
                sanitizarLabelAlerta: jiraAlertaModel.sanitizarLabelAlerta,
                montarUrlIssue: (k) => `https://airpulse.atlassian.net/browse/${k}`,
                buscarMapaIssues: async () => jiraMockResult
            }
        }
        return origLoad.apply(this, arguments)
    }

    try {
        return require("../src/controllers/dashboardAnalistaController")
    } finally {
        Module._load = origLoad
    }
}

test("buscarDetalhePlaca filtra placa unica e associa estados Jira corretamente", async () => {
    const mapa = new Map([
        [jiraAlertaModel.sanitizarLabelAlerta("fmc-1:SERIE-1:cpu_pct:1"), { key: "AIR-7", status: "Done", created: "2026-11-26T10:01:00Z" }]
    ])
    const ctrl = carregarControllerComMocks({ disponivel: true, mapa })

    let statusOut = null
    let bodyOut = null
    await ctrl.buscarDetalhePlaca(
        { params: { idFuncionario: "1", idPlaca: "5" } },
        { status: (s) => ({ json: (b) => { statusOut = s; bodyOut = b } }) }
    )

    assert.equal(statusOut, 200)
    assert.equal(bodyOut.alertasAbertos, undefined)
    assert.equal(bodyOut.alertas.length, 3)

    const a1 = bodyOut.alertas.find(a => a.alerta_id === "fmc-1:SERIE-1:cpu_pct:1")
    const a2 = bodyOut.alertas.find(a => a.alerta_id === "fmc-1:SERIE-1:ram_pct:2")
    const a3 = bodyOut.alertas.find(a => a.alerta_id === "fmc-1:SERIE-1:flash_pct:3")

    assert.deepEqual(a1.jira, { key: "AIR-7", url: "https://airpulse.atlassian.net/browse/AIR-7", status: "Done" })
    assert.deepEqual(a2.jira, { aguardando: true })
    assert.deepEqual(a3.jira, { semIssue: true })
})

test("buscarDetalhePlaca preserva alertas Gold e marca jira.indisponivel quando Jira falha", async () => {
    const ctrl = carregarControllerComMocks({ disponivel: false, mapa: new Map() })

    let statusOut = null
    let bodyOut = null
    await ctrl.buscarDetalhePlaca(
        { params: { idFuncionario: "1", idPlaca: "5" } },
        { status: (s) => ({ json: (b) => { statusOut = s; bodyOut = b } }) }
    )

    assert.equal(statusOut, 200)
    assert.equal(bodyOut.alertas.length, 3)
    for (const a of bodyOut.alertas) {
        assert.deepEqual(a.jira, { indisponivel: true })
    }
})

test("telaAnalista.js trata os 4 estados Jira no historico de alertas", () => {
    const js = fs.readFileSync(path.join(__dirname, "../public/js/telaAnalista.js"), "utf8")
    assert.match(js, /Aguardando Jira\.\.\./)
    assert.match(js, /Sem issue Jira/)
    assert.match(js, /Jira indisponível/)
    assert.match(js, /target="_blank" rel="noopener noreferrer"/)
})
