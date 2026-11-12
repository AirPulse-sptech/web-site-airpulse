var s3 = require("@aws-sdk/client-s3")

function listar(computadores, cliente) {
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
    var eventos = []
    var sinal = AbortSignal.timeout(45000)

    function lerArquivo(chave) {
        return conexao.send(new s3.GetObjectCommand({ Bucket: bucket, Key: chave }), { abortSignal: sinal })
            .then(function (resposta) { return resposta.Body.transformToString() })
            .then(function (texto) {
                var dados = JSON.parse(texto)
                if (!Array.isArray(dados)) throw new Error("O JSON de alertas deve conter uma lista.")
                dados.forEach(function (evento) { eventos.push(evento) })
            })
    }

    function lerPagina(pasta, token) {
        return conexao.send(new s3.ListObjectsV2Command({ Bucket: bucket, Prefix: pasta, ContinuationToken: token }), { abortSignal: sinal })
            .then(function (pagina) {
                var arquivos = (pagina.Contents || []).filter(function (objeto) {
                    return objeto.Key.startsWith(pasta) && objeto.Key.endsWith("_gold_alertas.json")
                })
                return arquivos.reduce(function (anterior, arquivo) {
                    return anterior.then(function () { return lerArquivo(arquivo.Key) })
                }, Promise.resolve()).then(function () {
                    if (!pagina.IsTruncated) return
                    if (!pagina.NextContinuationToken) throw new Error("Listagem incompleta de alertas no S3.")
                    return lerPagina(pasta, pagina.NextContinuationToken)
                })
            })
    }

    return hostnames.reduce(function (anterior, hostname) {
        return anterior.then(function () {
            if (!/^[A-Za-z0-9._-]+$/.test(hostname)) throw new Error("Hostname inválido para consultar alertas.")
            return lerPagina(`${prefixo}hostname=${hostname}/`)
        })
    }, Promise.resolve())
        .then(function () { return eventos })
        .finally(function () { if (!cliente) conexao.destroy() })
}

module.exports = { listar }
