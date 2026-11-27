// Regra canônica de label de alerta — se mudar aqui, mudar nos dois lados.
// Entrada: alerta_id exatamente como vem do _gold_alertas.json.
// Saída: apenas [A-Za-z0-9._-], tudo mais vira "-", prefixado com "alerta-".
function sanitizarLabelAlerta(alertaId) {
    return "alerta-" + String(alertaId).replace(/[^A-Za-z0-9._-]+/g, "-")
}

function normalizarBaseUrl(baseUrl) {
    return String(baseUrl || "").trim().replace(/\/+$/, "")
}

function montarUrlIssue(key, baseUrl) {
    var base = normalizarBaseUrl(baseUrl || process.env.JIRA_BASE_URL)
    if (!base || !key) return null
    return `${base}/browse/${encodeURIComponent(String(key))}`
}

function escolherMaisAntiga(atual, candidata) {
    var tsAtual = Date.parse(atual.created)
    var tsCand = Date.parse(candidata.created)
    if (Number.isFinite(tsCand) && (!Number.isFinite(tsAtual) || tsCand < tsAtual)) {
        return candidata
    }
    if (tsCand === tsAtual && String(candidata.key) < String(atual.key)) {
        return candidata
    }
    return atual
}

async function buscarMapaIssues(opcoes) {
    var cfg = opcoes || {}
    var baseUrl = normalizarBaseUrl(cfg.baseUrl !== undefined ? cfg.baseUrl : process.env.JIRA_BASE_URL)
    var email = String(cfg.email !== undefined ? cfg.email : (process.env.JIRA_EMAIL || "")).trim()
    var apiToken = String(cfg.apiToken !== undefined ? cfg.apiToken : (process.env.JIRA_API_TOKEN || "")).trim()
    var projectKey = String(cfg.projectKey !== undefined ? cfg.projectKey : (process.env.JIRA_ALERT_PROJECT_KEY || "")).trim()
    var fetchImpl = cfg.fetchImpl || globalThis.fetch
    var timeoutMs = Number(cfg.timeoutMs || 15000)

    if (!baseUrl || !email || !apiToken || !projectKey) {
        return { disponivel: false, mapa: new Map(), motivo: "config_incompleta" }
    }

    var authHeader = "Basic " + Buffer.from(`${email}:${apiToken}`, "utf8").toString("base64")
    var endpoint = `${baseUrl}/rest/api/3/search/jql`
    var projectEscapado = projectKey.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    var jql = `project = "${projectEscapado}" ORDER BY created ASC`

    var mapa = new Map()
    var nextPageToken = null
    var isLast = false

    try {
        do {
            var payload = {
                jql: jql,
                fields: ["labels", "status", "created"],
                maxResults: 100
            }
            if (nextPageToken) {
                payload.nextPageToken = nextPageToken
            }

            var resposta = await fetchImpl(endpoint, {
                method: "POST",
                headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(timeoutMs)
            })

            if (!resposta.ok) {
                console.error(`Erro ao consultar Jira search/jql: HTTP ${resposta.status}`)
                return { disponivel: false, mapa: new Map(), motivo: `http_${resposta.status}` }
            }

            var dados = await resposta.json()
            if (!dados || !Array.isArray(dados.issues)) {
                console.error("Resposta inválida do Jira search/jql: campo issues ausente.")
                return { disponivel: false, mapa: new Map(), motivo: "resposta_invalida" }
            }

            for (var issue of dados.issues) {
                if (!issue || !issue.key) continue
                var fields = issue.fields || {}
                var labels = Array.isArray(fields.labels) ? fields.labels : []
                var entrada = {
                    key: String(issue.key),
                    status: fields.status && fields.status.name ? String(fields.status.name) : null,
                    created: fields.created ? String(fields.created) : null
                }

                for (var label of labels) {
                    if (typeof label !== "string" || !label) continue
                    if (mapa.has(label)) {
                        var existente = mapa.get(label)
                        console.warn(`Duplicidade de label Jira detectada para '${label}': ${existente.key} e ${entrada.key}`)
                        mapa.set(label, escolherMaisAntiga(existente, entrada))
                    } else {
                        mapa.set(label, entrada)
                    }
                }
            }

            isLast = dados.isLast === true
            nextPageToken = dados.nextPageToken || null
        } while (!isLast && nextPageToken)

        return { disponivel: true, mapa: mapa }
    } catch (erro) {
        var nomeErro = erro && (erro.name || erro.code) ? (erro.name || erro.code) : "ErroDesconhecido"
        console.error(`Falha ao consultar Jira search/jql: ${nomeErro}`)
        return { disponivel: false, mapa: new Map(), motivo: nomeErro }
    }
}

module.exports = {
    sanitizarLabelAlerta,
    montarUrlIssue,
    buscarMapaIssues
}
