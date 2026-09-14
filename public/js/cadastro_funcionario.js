// Garante que o usuário está logado.
validarSessao();

// Regra de negócio: só o gestor da empresa cadastra novos funcionários.
// Um funcionário comum que tentar acessar esta página direto pela URL
// é levado de volta pra Home.
if (sessionStorage.ADM_USUARIO !== "true") {
    window.location.href = "home.html";
}

function voltar() {
    window.location = "home.html";
}

function cadastrar() {
    var nomeVar = nome.value;
    var emailVar = email.value;
    var dtNascimentoVar = data_nascimento.value;
    var cpfVar = limparCpf(cpf.value);
    var telefoneVar = limparTelefone(telefone.value);
    var cargoVar = cargo.value;
    var senhaVar = senha.value;
    var idFuncionarioAdmVar = sessionStorage.ID_USUARIO;

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
        cardErro.style.display = "block";
        mensagem_erro.innerHTML = "(Mensagem de erro para todos os campos em branco)";
        return false;
    }

    fetch("/cadastro_funcionario/cadastrar", {
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
            console.log("resposta: ", resposta);

            if (resposta.ok) {
                // Regra de negócio: o gestor cadastra o funcionário, mas não é
                // ele quem vai logar com essa conta — por isso não redireciona
                // pro login. Só confirma o sucesso e limpa o formulário.
                // (Futuro: redirecionar pra uma listagem de funcionários,
                // que ainda não existe nesse escopo.)
                const nomeCadastrado = nomeVar;
                document.getElementById("form-cadastro").reset();

                cardErro.style.display = "block";
                mensagem_erro.innerHTML = `Funcionário "${nomeCadastrado}" cadastrado com sucesso!`;
            } else {
                cardErro.style.display = "block";
                mensagem_erro.innerHTML = "Houve um erro ao tentar realizar o cadastro!";
            }
        })
        .catch(function (resposta) {
            console.log(`#ERRO: ${resposta}`);
        });

    return false;
}

function aplicarMascara(id, mascara) {
    const campo = document.querySelector(`#${id}`);

    campo.addEventListener("input", () => {
        campo.value = mascara(campo.value);
    });
}

/* Máscara de CPF */
aplicarMascara("cpf", valor => {
    return valor
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
});

/* Máscara de telefone */
aplicarMascara("telefone", valor => {
    return valor
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
});

function limparCpf(cpf) {
    return cpf.replace(/\D/g, "");
}

function validarCpf(cpf) {
    const cpfLimpo = limparCpf(cpf);
    return cpfLimpo.length === 11;
}

function limparTelefone(telefone) {
    return telefone.replace(/\D/g, "");
}

function validarTelefone(telefone) {
    const telefoneLimpo = limparTelefone(telefone);
    return telefoneLimpo.length === 11;
}

/* Exibe nome e cargo do gestor logado na sidebar */
if (sessionStorage.NOME_USUARIO) {
    const nomeUsuario = sessionStorage.NOME_USUARIO;
    document.getElementById("userNameDisplay").textContent = nomeUsuario;
    document.getElementById("userAvatar").textContent = nomeUsuario
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(parte => parte[0])
        .join("")
        .toUpperCase();
}
