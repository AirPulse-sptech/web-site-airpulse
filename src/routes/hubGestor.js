var express = require("express")
var router = express.Router()

var hubGestorController = require("../controllers/hubGestorController")

router.get("/resumo/:idFuncionario", function (req, res) {
    hubGestorController.buscarResumo(req, res)
})

module.exports = router
