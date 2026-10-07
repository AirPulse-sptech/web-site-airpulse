function voltar() {
    window.location = "cadastroFuncionario.html"
}

function cadastrar() {
    var nomeVar = nome.value
    var emailVar = email.value
    var dtNascimentoVar = dataNascimento.value
    var cpfVar = limparCpf(cpf.value)
    var telefoneVar = limparTelefone(telefone.value)
    var cargoVar = cargo.value
    var senhaVar = senha.value
    var idFuncionarioAdmVar = sessionStorage.idUsuario

    if (
        nomeVar == "" ||
        emailVar == "" ||
        dtNascimentoVar == "" ||
        cpfVar == "" ||
        senhaVar == "" ||
        telefoneVar == "" ||
        cargoVar == "" ||
        idFuncionarioAdmVar == ""
    ) {
        cardErro.style.display = "block"
        mensagemErro.innerHTML = "Mensagem de erro para todos os campos em branco"
        return false
    }

    fetch("/usuario/cadastrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            nomeServer: nomeVar,
            emailServer: emailVar,
            dtNascimentoServer: dtNascimentoVar,
            cpfServer: cpfVar,
            senhaServer: senhaVar,
            telefoneServer: telefoneVar,
            cargoServer: cargoVar,
            idFuncionarioAdmServer: idFuncionarioAdmVar
        }),
    })
        .then(function (resposta) {
            console.log("resposta: ", resposta)

            if (resposta.ok) {
                const nomeCadastrado = nomeVar
                document.getElementById("formCadastro").reset()

                cardErro.style.display = "block"
                mensagemErro.innerHTML = `Funcionário "${nomeCadastrado}" cadastrado com sucesso!`
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

function aplicarMascara(id, mascara) {
    const campo = document.querySelector(`#${id}`)

    campo.addEventListener("input", () => {
        campo.value = mascara(campo.value)
    })
}

aplicarMascara("cpf", valor => {
    return valor
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2")
})


aplicarMascara("telefone", valor => {
    return valor
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
})

function limparCpf(cpf) {
    return cpf.replace(/\D/g, "")
}

function validarCpf(cpf) {
    const cpfLimpo = limparCpf(cpf)
    return cpfLimpo.length === 11
}

function limparTelefone(telefone) {
    return telefone.replace(/\D/g, "")
}

function validarTelefone(telefone) {
    const telefoneLimpo = limparTelefone(telefone)
    return telefoneLimpo.length === 11
}
