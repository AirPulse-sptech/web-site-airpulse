validarSessao();

if (sessionStorage.CARGO_USUARIO !== "Analista de monitoramento") {
    window.location.href = "login.html";
}

var nomeUsuario = sessionStorage.NOME_USUARIO;

if (nomeUsuario) {
    document.getElementById("userNameDisplay").textContent = nomeUsuario;
    document.getElementById("userAvatar").textContent = nomeUsuario
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(function (parte) { return parte[0]; })
        .join("")
        .toUpperCase();
}