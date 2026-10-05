function voltar() {
    window.location = obterPaginaInicial()
}

function cadastrar() {
    var nomeVar = nome.value
    var modeloVar = modelo.value
    var numeroSerieVar = numeroSerie.value
    var companhiaAereaVar = companhiaAerea.value
    var statusAeronaveVar = statusAeronave.value
    var idFuncionarioGestorVar = sessionStorage.idUsuario

    if (
        nomeVar == "" ||
        modeloVar == "" ||
        numeroSerieVar == "" ||
        companhiaAereaVar == "" ||
        statusAeronaveVar == "" ||
        idFuncionarioGestorVar == ""
    ) {
        cardErro.style.display = "block"
        mensagemErro.innerHTML = "Preencha todos os campos para cadastrar a aeronave."
        return false
    }

    fetch("/aeronave/cadastrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            nomeServer: nomeVar,
            modeloServer: modeloVar,
            numeroSerieServer: numeroSerieVar,
            companhiaAereaServer: companhiaAereaVar,
            statusAeronaveServer: statusAeronaveVar,
            idFuncionarioGestorServer: idFuncionarioGestorVar
        }),
    })
        .then(function (resposta) {
            console.log("resposta: ", resposta)

            if (resposta.ok) {
                const nomeCadastrado = nomeVar
                document.getElementById("formCadastro").reset()

                cardErro.style.display = "block"
                mensagemErro.innerHTML = `Aeronave "${nomeCadastrado}" cadastrada com sucesso!`
            } else {
                cardErro.style.display = "block"
                mensagemErro.innerHTML = "Houve um erro ao tentar realizar o cadastro!"
            }
        })
        .catch(function (resposta) {
            console.log(`#ERRO: ${resposta}`)
        })

    return false
}
