var express = require("express")
var router = express.Router()

var dashboardAnalistaController = require("../controllers/dashboardAnalistaController")

router.get("/visaoGeral/:idFuncionario", function (req, res) {
    dashboardAnalistaController.buscarVisaoGeral(req, res)
})

module.exports = router
