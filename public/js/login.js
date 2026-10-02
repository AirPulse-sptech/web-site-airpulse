const loginForm = document.getElementById("loginForm")
const emailInput = document.getElementById("emailInput")
const passwordInput = document.getElementById("passwordInput")
const loginSubmitButton = document.getElementById("loginSubmitButton")

emailInput.addEventListener('input', () => {
    document.getElementById('emailError').style.display = 'none';
    emailInput.classList.remove('inputError');
});

passwordInput.addEventListener('input', () => {
    document.getElementById('passwordError').style.display = 'none';
    passwordInput.classList.remove('inputError');
});

loginForm.addEventListener('submit', (event) => {
    event.preventDefault()
    handleLogin()
})

function handleLogin() {
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");

    emailError.style.display = "none";
    passwordError.style.display = "none";
    emailInput.classList.remove("inputError");
    passwordInput.classList.remove("inputError");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        if (!email) {
            emailError.innerText = "Preencha este campo.";
            emailError.style.display = "block";
            emailInput.classList.add("inputError");
        }
        if (!password) {
            passwordError.innerText = "Preencha este campo.";
            passwordError.style.display = "block";
            passwordInput.classList.add("inputError");
        }
        return;
    }

    loginSubmitButton.disabled = true
    loginSubmitButton.innerText = "ENTRANDO..."

    fetch("/usuario/autenticar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            emailServer: email,
            senhaServer: password
        })
    }).then(function (resposta) {
        if (resposta.ok) {
            return resposta.json().then(usuario => {
                salvarSessao(usuario.id, usuario.nome, usuario.email, usuario.cargo);
                window.location.href = obterPaginaInicial();
            });
        } else {
            console.log("houve um erro ao tentar realizar o login!");
            resposta.text().then(texto => {
                console.error(texto);
                const passwordError = document.getElementById("passwordError");
                passwordError.innerText = "E-mail ou senha inválidos!";
                passwordError.style.display = "block";
                passwordInput.classList.add("inputError");
                emailInput.classList.add("inputError");


                loginSubmitButton.disabled = false;
                loginSubmitButton.innerText = "entrar na plataforma";
            });
        }
    }).catch(function (erro) {
        console.log(erro);
        const passwordError = document.getElementById("passwordError");
        passwordError.innerText = "Erro inesperado ao conectar com o servidor.";
        passwordError.style.display = "block";

        loginSubmitButton.disabled = false;
        loginSubmitButton.innerText = "entrar na plataforma";
    });
}
