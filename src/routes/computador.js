var express = require("express")
var router = express.Router()

var computadorController = require("../controllers/computadorController")

router.get("/aeronaves/:idFuncionario", function (req, res) {
    computadorController.listarAeronaves(req, res)
})

router.post("/cadastrar", function (req, res) {
    computadorController.cadastrar(req, res)
})

module.exports = router