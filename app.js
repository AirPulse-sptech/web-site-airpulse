// var ambienteProcesso = 'producao'
var ambienteProcesso = 'desenvolvimento'

var caminhoEnv = ambienteProcesso === 'producao' ? '.env' : '.env.dev'

require("dotenv").config({ path: caminhoEnv })

var express = require("express")
var cors = require("cors")
var path = require("path")
var portaApp = process.env.APP_PORT
var hostApp = process.env.APP_HOST

var app = express()

var indexRouter = require("./src/routes/index")
var usuarioRouter = require("./src/routes/usuario")
var empresasRouter = require("./src/routes/empresas")
var aeronaveRouter = require("./src/routes/aeronave")
var computadorRouter = require("./src/routes/computador")
var relatorioRouter = require("./src/routes/relatorio")


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "public")))

app.use(cors())

app.use("/", indexRouter)
app.use("/usuario", usuarioRouter)
app.use("/empresas", empresasRouter)
app.use("/aeronave", aeronaveRouter)
app.use("/computador", computadorRouter)
app.use("/relatorio", relatorioRouter)


app.listen(portaApp, function () {
    console.log(`
    █████╗ ██╗██████╗ ██████╗ ██╗   ██╗██╗     ███████╗███████╗███████╗
   ██╔══██╗██║██╔══██╗██╔══██╗██║   ██║██║     ██╔════╝██╔════╝██╔════╝
   ███████║██║██████╔╝██████╔╝██║   ██║██║     ███████╗█████╗  █████╗
   ██╔══██║██║██╔══██╗██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝  ██╔══╝
   ██║  ██║██║██║  ██║██║     ╚██████╔╝███████╗███████║███████╗███████╗
   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝╚══════╝

                                   __|__
                            |--O----(_)----O--|
    \n\n\n                                                                                                 
    Servidor do seu site já está rodando! Acesse o caminho a seguir para visualizar .: http://${hostApp}:${portaApp} :. \n\n
    Você está rodando sua aplicação em ambiente de .:${process.env.AMBIENTE_PROCESSO}:. \n\n
    \tSe .:desenvolvimento:. você está se conectando ao banco local. \n
    \tSe .:producao:. você está se conectando ao banco remoto. \n\n
    \t\tPara alterar o ambiente, comente ou descomente as linhas 1 ou 2 no arquivo 'app.js'\n\n`)
})
