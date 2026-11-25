const express = require("express")
const { buscarCustosAws } = require("../services/costExplorer")

const router = express.Router()

router.get("/aws", async function (req, res) {
    try {
        const custos = await buscarCustosAws()

        res.json(custos)
    } catch (erro) {
        console.log(erro)

        const credenciaisInvalidas =
            erro.name == "ExpiredTokenException"
            || erro.name == "ExpiredToken"
            || erro.name == "UnrecognizedClientException"
            || erro.name == "InvalidClientTokenId"
            || erro.name == "CredentialsProviderError"

        if (credenciaisInvalidas) {
            res.status(503).json({
                mensagem: "As credenciais temporárias do Learner Lab expiraram ou não foram encontradas. Inicie o lab, atualize as credenciais e reinicie o back-end."
            })
            return
        }

        res.status(500).json({ mensagem: erro.message })
    }
})

module.exports = router