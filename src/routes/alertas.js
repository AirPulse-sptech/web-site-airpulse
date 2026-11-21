var express = require("express")
var router = express.Router()

var alertasController = require("../controllers/alertasController")

router.post("/cadastrar", function (req, res) {
    alertasController.cadastrar(req, res)
})

router.get("/listar/:idFuncionario", function (req, res) {
    alertasController.listarAeronaves(req, res)
})

module.exports = router
