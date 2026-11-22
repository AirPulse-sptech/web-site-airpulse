var s3 = require("@aws-sdk/client-s3")

function listarUltimaColeta(computadores, cliente) {
    if (computadores.length == 0) return Promise.resolve([])
    var bucket = process.env.aws_s3_bucket || process.env.AWS_S3_BUCKET
    var regiao = process.env.aws_region || process.env.AWS_REGION
    if (!bucket || !regiao) {
        return Promise.reject(new Error("Configure aws_region e aws_s3_bucket no ambiente do servidor."))
    }
    var credenciais = process.env.aws_access_key_id ? {
        accessKeyId: process.env.aws_access_key_id,
        secretAccessKey: process.env.aws_secret_access_key,
        sessionToken: process.env.aws_session_token
    } : undefined
    var conexao = cliente || new s3.S3Client({ region: regiao, credentials: credenciais, maxAttempts: 2 })
    var prefixo = (process.env.aws_s3_alertas_prefix || process.env.AWS_S3_ALERTAS_PREFIX || "03-gold/").replace(/\/?$/, "/")
    var hostnames = [...new Set(computadores.map(function (computador) { return computador.hostname }))]
    var leituras = []
    var sinal = AbortSignal.timeout(45000)

    function listarArquivos(pasta, token, encontrados) {
        return conexao.send(new s3.ListObjectsV2Command({ Bucket: bucket, Prefix: pasta, ContinuationToken: token }), { abortSignal: sinal })
            .then(function (pagina) {
                (pagina.Contents || []).forEach(function (objeto) {
                    if (objeto.Key.startsWith(pasta) && objeto.Key.endsWith("_gold_serie_1min.json")) encontrados.push(objeto)
                })
                if (!pagina.IsTruncated) return encontrados
                if (!pagina.NextContinuationToken) throw new Error("Listagem incompleta de métricas no S3.")
                return listarArquivos(pasta, pagina.NextContinuationToken, encontrados)
            })
    }

    function lerArquivo(chave) {
        return conexao.send(new s3.GetObjectCommand({ Bucket: bucket, Key: chave }), { abortSignal: sinal })
            .then(function (resposta) { return resposta.Body.transformToString() })
            .then(function (texto) {
                var dados = JSON.parse(texto)
                if (!Array.isArray(dados)) throw new Error("O JSON de métricas deve conter uma lista.")
                return dados
            })
    }

    return hostnames.reduce(function (anterior, hostname) {
        return anterior.then(function () {
            if (!/^[A-Za-z0-9._-]+$/.test(hostname)) throw new Error("Hostname inválido para consultar métricas.")
            return listarArquivos(`${prefixo}hostname=${hostname}/`, undefined, []).then(function (arquivos) {
                if (arquivos.length == 0) return
                var maisRecente = arquivos.reduce(function (maior, arquivo) {
                    return new Date(arquivo.LastModified) > new Date(maior.LastModified) ? arquivo : maior
                })
                return lerArquivo(maisRecente.Key).then(function (dados) {
                    dados.forEach(function (linha) {
                        if (linha && linha.hostname == hostname) leituras.push(linha)
                    })
                })
            })
        })
    }, Promise.resolve())
        .then(function () { return leituras })
        .finally(function () { if (!cliente) conexao.destroy() })
}

module.exports = { listarUltimaColeta }
