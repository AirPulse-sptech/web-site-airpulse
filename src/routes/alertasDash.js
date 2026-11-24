var express = require("express")
var router = express.Router()

var alertasDashController = require("../controllers/alertasDashController")

router.get("/historico/:idComputador/:idFuncionario", function (req, res) {
    alertasDashController.listarHistorico(req, res)
})

module.exports = router