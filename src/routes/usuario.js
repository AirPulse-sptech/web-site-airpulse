var express = require("express")
var router = express.Router()

var usuarioController = require("../controllers/usuarioController")

router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res)
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res)
})

router.get("/analistas/:idFuncionario", function (req, res) {
    usuarioController.listarAnalistas(req, res)
})

router.get("/funcionarios/:idGestor", function (req, res) {
    usuarioController.listarFuncionarios(req, res)
})

router.get("/funcionarios/:idGestor/:idFuncionario", function (req, res) {
    usuarioController.buscarEdicaoFuncionario(req, res)
})

router.delete("/funcionarios/:idGestor/:idFuncionario", function (req, res) {
    usuarioController.inativarFuncionario(req, res)
})

router.put("/funcionarios/:idGestor/:idFuncionario/ativar", function (req, res) {
    usuarioController.ativarFuncionario(req, res)
})

router.put("/funcionarios/:idGestor/:idFuncionario/aeronaves", function (req, res) {
    usuarioController.salvarAeronavesFuncionario(req, res)
})

module.exports = router
