var express = require("express")
var router = express.Router()

var relatorioGestorController = require("../controllers/relatorioGestorController")
var alertaRelatorioController = require("../controllers/alertaRelatorioController")

router.get("/gestor/cobertura/:idFuncionario", function (req, res) {
    alertaRelatorioController.cobertura(req, res)
})

router.post("/gestor/analise/:idRelatorio/:idFuncionario", function (req, res) {
    relatorioGestorController.analisar(req, res)
})

router.get("/gestor/:idFuncionario", function (req, res) {
    relatorioGestorController.listarPublicados(req, res)
})

router.get("/gestor/detalhe/:idRelatorio/:idFuncionario", function (req, res) {
    relatorioGestorController.buscarDetalhe(req, res)
})

module.exports = router
