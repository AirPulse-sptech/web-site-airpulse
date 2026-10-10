var express = require("express")
var router = express.Router()

var computadorController = require("../controllers/computadorController")

router.post("/cadastrar", function (req, res) {
    computadorController.cadastrar(req, res)
})

router.get("/monitoramento/:idAeronave/:idFuncionario", function (req, res) {
    computadorController.buscarMonitoramento(req, res)
})

module.exports = router
