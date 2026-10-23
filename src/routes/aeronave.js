var express = require("express")
var router = express.Router()

var aeronaveController = require("../controllers/aeronaveController")

router.post("/cadastrar", function (req, res) {
    aeronaveController.cadastrar(req, res)
})

router.get("/listar/:idFuncionario", function (req, res) {
    aeronaveController.listarAeronaves(req, res)
})

module.exports = router
