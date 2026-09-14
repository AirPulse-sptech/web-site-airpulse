var express = require("express");
var router = express.Router();

var cadastro_funcionario_controller = require("../controllers/cadastro_funcionario_controller");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
router.post("/cadastrar", function (req, res) {
    cadastro_funcionario_controller.cadastrar(req, res);
})

module.exports = router;