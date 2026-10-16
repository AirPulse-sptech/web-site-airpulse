var express = require("express")
var router = express.Router()

var dashboardRelatorioController = require("../controllers/dashboardRelatorioController")

router.get("/buscar/:idFuncionario", function (req, res) {
    dashboardRelatorioController.buscarDashboardRelatorio(req, res)
})

module.exports = router
