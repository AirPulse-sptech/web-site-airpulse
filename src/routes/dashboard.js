var express = require("express")
var router = express.Router()

var dashboardController = require("../controllers/dashboardController")

router.get("/acesso/:idFuncionario", function (req, res) {
    dashboardController.validarAcesso(req, res)
})

module.exports = router