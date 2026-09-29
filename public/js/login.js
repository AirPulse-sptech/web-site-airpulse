const loginForm = document.getElementById("loginForm")
const emailInput = document.getElementById("emailInput")
const passwordInput = document.getElementById("passwordInput")
const loginSubmitButton = document.getElementById("loginSubmitButton")

emailInput.addEventListener('input', () => {
    document.getElementById('emailError').style.display = 'none';
    emailInput.classList.remove('input-error');
});

passwordInput.addEventListener('input', () => {
    document.getElementById('passwordError').style.display = 'none';
    passwordInput.classList.remove('input-error');
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
    emailInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        if (!email) {
            emailError.innerText = "Preencha este campo.";
            emailError.style.display = "block";
            emailInput.classList.add("input-error");
        }
        if (!password) {
            passwordError.innerText = "Preencha este campo.";
            passwordError.style.display = "block";
            passwordInput.classList.add("input-error");
        }
        return;
    }

    loginSubmitButton.disabled = true
    loginSubmitButton.innerText = "ENTRANDO..."

    // Aqui entra a chamada pra API de autenticação
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
            resposta.json().then(json => {
                sessionStorage.EMAIL_USUARIO = json.email;
                sessionStorage.CARGO_USUARIO = json.cargo;
                sessionStorage.NOME_USUARIO = json.nome;
                sessionStorage.ID_USUARIO = json.id;

                // redireciona administrador AIRPULSE para a página de cadastro de empresa
                if (json.cargo === "ADMIN") {
                  window.location.href = "cadastro_empresa.html";
                } else {

                    window.location.href = "home.html";
                }
            });
        } else {
            console.log("houve um erro ao tentar realizar o login!");
            resposta.text().then(texto => {
                console.error(texto);
                const passwordError = document.getElementById("passwordError");
                passwordError.innerText = "E-mail ou senha inválidos!";
                passwordError.style.display = "block";
                passwordInput.classList.add("input-error");
                emailInput.classList.add("input-error");


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