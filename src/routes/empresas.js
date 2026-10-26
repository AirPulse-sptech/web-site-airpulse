var express = require("express")
var router = express.Router()

var empresaController = require("../controllers/empresaController")


router.post("/cadastrar", function (req, res) {
    empresaController.cadastrar(req, res)
})

router.get("/buscar", function (req, res) {
    empresaController.buscarPorCnpj(req, res)
})

router.get("/buscar/:id", function (req, res) {
  empresaController.buscarPorId(req, res)
})

router.get("/listar", function (req, res) {
  empresaController.listar(req, res)
})

router.get("/empresasCadastradas", function (req, res) {
    empresaController.carregarEmpresas(req, res);
});

router.put("/atualizar/:id", function (req, res) {
    empresaController.atualizar(req, res)
})

router.put("/status/:id", function (req, res) {
    empresaController.alterarStatus(req, res)
})

module.exports = router