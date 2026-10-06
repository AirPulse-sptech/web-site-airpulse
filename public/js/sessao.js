function salvarSessao(id, nome, email, cargo) {
    if (id == null || !String(id).trim() || !nome || !email
        || (cargo !== "ADMIN" && cargo !== "GESTOR" && cargo !== "ANALISTA")) {
        sessionStorage.clear()
        throw new Error("Dados de sessão inválidos.")
    }

    sessionStorage.clear()
    sessionStorage.setItem("idUsuario", id)
    sessionStorage.setItem("nomeUsuario", nome)
    sessionStorage.setItem("emailUsuario", email)
    sessionStorage.setItem("cargoUsuario", cargo)
}

function verificarSessao() {
    const cargo = sessionStorage.getItem("cargoUsuario")
    return !!sessionStorage.getItem("idUsuario")
        && !!sessionStorage.getItem("nomeUsuario")
        && !!sessionStorage.getItem("emailUsuario")
        && (cargo === "ADMIN" || cargo === "GESTOR" || cargo === "ANALISTA")
}

function obterPaginaInicial() {
    switch (sessionStorage.getItem("cargoUsuario")) {
        case "ADMIN": return "cadastroEmpresa.html"
        case "GESTOR": return "cadastroFuncionario.html"
        case "ANALISTA": return "dashboardPrincipalAnalista.html"
        default: return "login.html"
    }
}

function podeAcessarPagina(pagina) {
    const cargo = sessionStorage.getItem("cargoUsuario")
    switch (pagina) {
        case "cadastroEmpresa.html": return cargo === "ADMIN"
        case "cadastroFuncionario.html": return cargo === "GESTOR"
        case "gerenciarFuncionario.html": return cargo === "GESTOR"
        case "EditarUsuario.html": return cargo === "GESTOR"
        case "cadastroAeronave.html": return cargo === "GESTOR"
        case "cadastroFmc.html": return cargo === "GESTOR"
        case "dashboardPrincipalAnalista.html":
        case "dashboardAnaliseFmcAnalista.html":
        case "telaAnalista.html": return cargo === "ANALISTA"
        case "alertas.html": return cargo === "GESTOR" || cargo === "ANALISTA"
        default: return false
    }
}

function preencherPerfil() {
    const nome = sessionStorage.getItem("nomeUsuario")
    const cargo = sessionStorage.getItem("cargoUsuario")
    const saudacao = document.getElementById("bUsuario")
    const nomePerfil = document.getElementById("userNameDisplay")
    const cargoPerfil = document.getElementById("userRoleDisplay")
    const avatar = document.getElementById("userAvatar")

    if (saudacao) saudacao.textContent = nome
    if (nomePerfil) nomePerfil.textContent = nome
    if (cargoPerfil) cargoPerfil.textContent = cargo
    if (avatar) {
        avatar.textContent = nome.trim().split(/\s+/).slice(0, 2)
            .map(parte => parte[0]).join("").toUpperCase()
    }
}

function atualizarMenu() {
    const marca = document.querySelector('.sidebarBrand')
    if (marca) marca.setAttribute("href", obterPaginaInicial())

    for (const item of document.querySelectorAll('.sidebarNav .navItem.disabled')) {
        item.remove()
    }

    const links = document.querySelectorAll('.sidebarNav a[href]')
    for (const link of links) {
        const pagina = link.getAttribute("href").split("/").pop()
        if (!podeAcessarPagina(pagina)) link.remove()
    }
}

function validarSessao() {
    if (!verificarSessao()) {
        limparSessao()
        return false
    }

    const pagina = window.location.pathname.split("/").pop()
    if (!podeAcessarPagina(pagina)) {
        window.location.replace(obterPaginaInicial())
        return false
    }

    preencherPerfil()
    atualizarMenu()
    return true
}

function limparSessao() {
    sessionStorage.clear()
    window.location.replace("login.html")
}

function aguardar() {
    var divAguardar = document.getElementById("divAguardar")
    divAguardar.style.display = "flex"
}

function finalizarAguardar(texto) {
    var divAguardar = document.getElementById("divAguardar")
    divAguardar.style.display = "none"

    var divErrosLogin = document.getElementById("divErrosLogin")
    if (texto) {
        divErrosLogin.style.display = "flex"
        divErrosLogin.innerHTML = texto
    }
}
