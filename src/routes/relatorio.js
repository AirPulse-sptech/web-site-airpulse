var express = require("express")
var router = express.Router()

var relatorioController = require("../controllers/relatorioController")

router.get("/aeronaves/:idFuncionario", function (req, res) {
    relatorioController.listarAeronaves(req, res)
})

router.get("/monitoramento/:idAeronave/:idFuncionario", function (req, res) {
    relatorioController.buscarMonitoramento(req, res)
})

router.get("/anteriores/:idAeronave/:idFuncionario", function (req, res) {
    relatorioController.listarAnteriores(req, res)
})

router.get("/analistas/:idFuncionario", function (req, res) {
    relatorioController.listarAnalistas(req, res)
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