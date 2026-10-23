var express = require("express")
var router = express.Router()

var relatorioGestorController = require("../controllers/relatorioGestorController")

router.get("/gestor/:idFuncionario", function (req, res) {
    relatorioGestorController.listarPublicados(req, res)
})

router.get("/gestor/detalhe/:idRelatorio/:idFuncionario", function (req, res) {
    relatorioGestorController.buscarDetalhe(req, res)
})

module.exports = router