var express = require("express")
var router = express.Router()

var relatorioController = require("../controllers/relatorioController")

router.get("/anteriores/:idAeronave/:idFuncionario", function (req, res) {
    relatorioController.listarAnteriores(req, res)
})

router.get("/meus/:idFuncionario", function (req, res) {
    relatorioController.listarMeus(req, res)
})

router.get("/detalhe/:idRelatorio/:idFuncionario", function (req, res) {
    relatorioController.buscarDetalhe(req, res)
})

router.post("/cadastrar", function (req, res) {
    relatorioController.cadastrar(req, res)
})

router.put("/atualizar/:idRelatorio", function (req, res) {
    relatorioController.atualizar(req, res)
})

module.exports = router