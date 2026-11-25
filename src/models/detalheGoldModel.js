var s3 = require("@aws-sdk/client-s3")

function buscar(hostname, serie, cliente) {
    var bucket = process.env.aws_s3_bucket || process.env.AWS_S3_BUCKET
    var regiao = process.env.aws_region || process.env.AWS_REGION
    if (!bucket || !regiao) return Promise.reject(new Error("Configure aws_region e aws_s3_bucket no ambiente do servidor."))
    var credenciais = process.env.aws_access_key_id ? {
        accessKeyId: process.env.aws_access_key_id,
        secretAccessKey: process.env.aws_secret_access_key,
        sessionToken: process.env.aws_session_token
    } : undefined
    var conexao = cliente || new s3.S3Client({ region: regiao, credentials: credenciais, maxAttempts: 2 })
    var prefixo = (process.env.aws_s3_alertas_prefix || process.env.AWS_S3_ALERTAS_PREFIX || "03-gold/").replace(/\/?$/, "/")
    var pasta = `${prefixo}hostname=${hostname}/`
    var abort = AbortSignal.timeout(45000)
    var hostnameNormalizado = String(hostname).trim().toLowerCase()
    var serieNormalizada = String(serie).trim().toLowerCase()

    function listar(token, encontrados) {
        return conexao.send(new s3.ListObjectsV2Command({ Bucket: bucket, Prefix: pasta, ContinuationToken: token }), { abortSignal: abort })
            .then(function (pagina) {
                encontrados.push(...(pagina.Contents || []))
                if (!pagina.IsTruncated) return encontrados
                if (!pagina.NextContinuationToken) throw new Error("Listagem incompleta de arquivos Gold no S3.")
                return listar(pagina.NextContinuationToken, encontrados)
            })
    }

    function ler(objeto) {
        return conexao.send(new s3.GetObjectCommand({ Bucket: bucket, Key: objeto.Key }), { abortSignal: abort })
            .then(function (resposta) { return resposta.Body.transformToString() })
            .then(function (texto) {
                var dados = JSON.parse(texto)
                if (!Array.isArray(dados)) throw new Error("O JSON Gold deve conter uma lista.")
                return dados
            })
    }

    return listar(undefined, []).then(function (objetos) {
        var monitoramentos = objetos.filter(function (objeto) { return objeto.Key.endsWith("_gold_monitoramento_placa.json") })
            .sort(function (a, b) { return new Date(b.LastModified) - new Date(a.LastModified) })
        var corte = Date.now() - 26 * 60 * 60 * 1000
        var arquivosSerie = objetos.filter(function (objeto) { return objeto.Key.endsWith("_gold_serie_1min.json") })
        var series = arquivosSerie.filter(function (objeto) {
            return !objeto.LastModified || new Date(objeto.LastModified).getTime() >= corte
        })
        var diagnostico = {
            objetosNaPasta: objetos.length,
            arquivosMonitoramento: monitoramentos.length,
            arquivosSerieRecentes: series.length,
            arquivosSerieNoTotal: arquivosSerie.length,
            linhasMonitoramentoNaPasta: 0,
            linhasSerieNaPasta: 0,
            correspondenciasHostMonitoramento: 0,
            correspondenciasPlacaMonitoramento: 0,
            correspondenciasPlacaSerie: 0,
            tipoCorrespondencia: "EXATA",
            serieGold: null,
            hostSolicitadoEncontrado: objetos.length > 0
        }
        var serieGold = String(serie)
        var monitoramento = monitoramentos.length ? ler(monitoramentos[0]).then(function (dados) {
            diagnostico.linhasMonitoramentoNaPasta = dados.length
            var candidatosHost = dados.filter(function (linha) {
                return String(linha.hostname || "").trim().toLowerCase() === hostnameNormalizado
            })
            diagnostico.correspondenciasHostMonitoramento = candidatosHost.length
            var exatos = candidatosHost.filter(function (linha) {
                return String(linha.placa_serie ?? "").trim().toLowerCase() === serieNormalizada
            })
            diagnostico.correspondenciasPlacaMonitoramento = exatos.length
            var encontrado = exatos[0]
            if (!encontrado && candidatosHost.length === 1) {
                encontrado = candidatosHost[0]
                serieGold = String(encontrado.placa_serie ?? "")
                diagnostico.tipoCorrespondencia = "HOST_UNICO"
            }
            diagnostico.serieGold = encontrado ? String(encontrado.placa_serie ?? "") : null
            return encontrado || null
        }) : Promise.resolve(null)
        return Promise.all([monitoramento, Promise.all(series.map(ler))]).then(function (resultados) {
            var linhasRecentes = [].concat(...resultados[1])
            diagnostico.linhasSerieNaPasta = linhasRecentes.length
            var candidatasSerie = linhasRecentes.filter(function (linha) {
                return linha && String(linha.hostname || "").trim().toLowerCase() === hostnameNormalizado
                    && typeof linha.ts === "string" && Number.isFinite(Date.parse(linha.ts))
            })
            var seriesHost = Array.from(new Set(candidatasSerie.map(function (linha) { return String(linha.placa_serie ?? "").trim() })))
            var serieAlvo = serieGold.trim().toLowerCase()
            var pontos = candidatasSerie.filter(function (linha) {
                return String(linha.placa_serie ?? "").trim().toLowerCase() === serieAlvo
            })
            if (!pontos.length && seriesHost.length === 1) {
                serieGold = seriesHost[0]
                serieAlvo = serieGold.trim().toLowerCase()
                pontos = candidatasSerie
                if (diagnostico.tipoCorrespondencia === "EXATA") diagnostico.tipoCorrespondencia = "SERIE_UNICA_NO_HOST"
                diagnostico.serieGold = serieGold
            }
            diagnostico.correspondenciasPlacaSerie = pontos.length
            var unicos = new Map()
            pontos.forEach(function (linha) { unicos.set(new Date(linha.ts).toISOString(), linha) })
            return {
                monitoramento: resultados[0],
                serie: Array.from(unicos.values()).sort(function (a, b) { return Date.parse(a.ts) - Date.parse(b.ts) }),
                diagnostico: diagnostico,
                serieGold: serieGold
            }
        })
    }).finally(function () { if (!cliente) conexao.destroy() })
}

module.exports = { buscar }
