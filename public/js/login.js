const loginForm = document.getElementById("loginForm")
const emailInput = document.getElementById("emailInput")
const passwordInput = document.getElementById("passwordInput")
const loginSubmitButton = document.getElementById("loginSubmitButton")

// Limpa erros ao digitar
emailInput.addEventListener('input', () => {
    document.getElementById('emailError').style.display = 'none';
    emailInput.classList.remove('input-error');
});

passwordInput.addEventListener('input', () => {
    document.getElementById('passwordError').style.display = 'none';
    passwordInput.classList.remove('input-error');
});

// adiciona um ouvinte de evento para quando o formulario for enviado
loginForm.addEventListener('submit', (event) => {
    event.preventDefault()
    handleLogin()
})

function handleLogin() {
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");

    // Reseta as mensagens de erro
    emailError.style.display = "none";
    passwordError.style.display = "none";
    emailInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");

    // pega os valores digitados e remove os espacos vazios do email
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

    // Admin shortcut: bypass backend for the known admin credentials
    if (email === "air.pulse@airpulse.com" && password === "urubu100") {
        console.log('Admin credentials detected, redirecting to admin registration page');
        sessionStorage.EMAIL_USUARIO = email;
        sessionStorage.NOME_USUARIO = "Admin AirPulse";
        sessionStorage.ID_USUARIO = "0";
        window.location.href = "./cadastro_empresa.html";
        return;
    }

    // Aqui entra a chamada pra API de autenticação
    fetch("/usuarios/autenticar", {
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
                sessionStorage.NOME_USUARIO = json.nome;
                sessionStorage.ID_USUARIO = json.id;
                // Flag que diferencia o gestor da empresa
                sessionStorage.ADM_USUARIO = json.admin ? "true" : "false";

                // Redirect admin to company registration page
                if (json.email === "air.pulse@airpulse.com") {
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

                // volta o botao ao normal em caso de erro
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
