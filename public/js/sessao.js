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
        case "GESTOR": return "dashboardGeral.html"
        case "ANALISTA": return "dashboardPrincipalAnalista.html"
        default: return "login.html"
    }
}

function podeAcessarPagina(pagina) {
    const cargo = sessionStorage.getItem("cargoUsuario")
    switch (pagina) {
        case "cadastroEmpresa.html": return cargo === "ADMIN"
        case "empresasCadastradas.html": return cargo === "ADMIN"
        case "cadastroFuncionario.html": return cargo === "GESTOR"
        case "dashboardRelatorios.html": return cargo === "GESTOR"
        case "gerenciarFuncionario.html": return cargo === "GESTOR"
        case "gerenciarAeronave.html": return cargo === "GESTOR"
        case "EditarUsuario.html": return cargo === "GESTOR"
        case "cadastroAeronave.html": return cargo === "GESTOR"
        case "cadastroFmc.html": return cargo === "GESTOR"
        case "relatorioGestor.html": return cargo === "GESTOR"
        case "verRelatorioGestor.html": return cargo === "GESTOR"
        case "dashboardGeral.html": return cargo === "GESTOR"
        case "cadastroRelatorio.html": return cargo === "ANALISTA"
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

    const menu = document.querySelector('.sidebarNav')
    if (menu && sessionStorage.getItem("cargoUsuario") === "GESTOR") {
        const pagina = window.location.pathname.split("/").pop()
        const paginasRelacionadas = {
            "EditarUsuario.html": "gerenciarFuncionario.html",
            "verRelatorioGestor.html": "relatorioGestor.html",
            "alertas.html": "dashboardGeral.html"
        }
        const paginaAtiva = paginasRelacionadas[pagina] || pagina
        const itens = [
            { pagina: "dashboardGeral.html", nome: "Dashboard", icone: "bi-grid-1x2" },
            { pagina: "cadastroFmc.html", nome: "Cadastrar FMC", icone: "bi-hdd-rack", id: "itemCadastrarFmc" },
            { pagina: "cadastroFuncionario.html", nome: "Cadastrar Funcionário", icone: "bi-people", id: "itemCadastrarFuncionario" },
            { pagina: "gerenciarFuncionario.html", nome: "Gerenciar Funcionário", icone: "bi-gear", id: "itemGerenciarFuncionario" },
            { pagina: "cadastroAeronave.html", nome: "Cadastrar Aeronave", icone: "bi-airplane" },
            { pagina: "relatorioGestor.html", nome: "Relatórios", icone: "bi-file-earmark-text", id: "itemRelatorios" },
            { pagina: "dashboardRelatorios.html", nome: "Produtividade Funcionarios", icone: "bi-file-earmark-bar-graph", id: "itemProdutividadeFuncionarios" }
        ]

        menu.setAttribute("aria-label", "Menu principal")
        menu.innerHTML = itens.map(item => {
            const ativo = item.pagina === paginaAtiva
            return `
                <a href="${item.pagina}" class="navItem${ativo ? ' active' : ''}"${item.id ? ` id="${item.id}"` : ''}${ativo ? ' aria-current="page"' : ''}>
                    <i class="bi ${item.icone} navIcon" style="font-size: 18px" aria-hidden="true"></i>
                    <span>${item.nome}</span>
                </a>`
        }).join("")
    }

    for (const item of document.querySelectorAll('.sidebarNav .navItem.disabled')) {
        item.remove()
    }

    const links = document.querySelectorAll('.sidebarNav a[href]')
    for (const link of links) {
        let pagina = link.getAttribute("href").split("/").pop()
        if (sessionStorage.getItem("cargoUsuario") === "GESTOR"
            && pagina === "dashboardPrincipalAnalista.html") {
            pagina = "dashboardGeral.html"
            link.setAttribute("href", pagina)
        }
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
