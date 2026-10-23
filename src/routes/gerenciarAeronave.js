var express = require("express")
var router = express.Router()

var gerenciarAeronaveController = require("../controllers/gerenciarAeronaveController")

router.get("/listar/:idFuncionario", function (req, res) {
    gerenciarAeronaveController.listar(req, res)
})

router.put("/editar/:idAeronave", function (req, res) {
    gerenciarAeronaveController.editar(req, res)
})

router.put("/status-aeronave/:idAeronave", function (req, res) {
    gerenciarAeronaveController.alterarStatusAeronave(req, res)
})

router.put("/status-fmc/:idComputador", function (req, res) {
    gerenciarAeronaveController.alterarStatusComputador(req, res)
})

module.exports = router