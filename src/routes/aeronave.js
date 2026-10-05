var express = require("express")
var router = express.Router()

var aeronaveController = require("../controllers/aeronaveController")

router.post("/cadastrar", function (req, res) {
    aeronaveController.cadastrar(req, res)
})

module.exports = router
