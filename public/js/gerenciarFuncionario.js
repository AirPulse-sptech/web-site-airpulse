function iniciarGerenciarFuncionario() {
    if (!verificarSessao() || sessionStorage.getItem("cargoUsuario") !== "GESTOR") return

    const busca = document.getElementById("buscaFuncionarios")
    const lista = document.getElementById("listaFuncionarios")
    const mensagem = document.getElementById("mensagemFuncionarios")
    const contagem = document.getElementById("contagemFuncionarios")
    const paginas = document.getElementById("paginasFuncionarios")
    const recarregar = document.getElementById("recarregarFuncionarios")
    const filtros = document.querySelectorAll(".gfFiltro[data-status]")
    const porPagina = 7
    let funcionarios = []
    let filtroStatus = "TODOS"
    let pagina = 1

    function atualizarTabela() {
        const texto = normalizar(busca.value.trim())
        const filtrados = []
        funcionarios.forEach(function (funcionario) {
            const ativo = String(funcionario.statusSistema) === "1"
            const correspondeBusca = normalizar(`${funcionario.nome} ${funcionario.email}`).includes(texto)
            const correspondeFiltro = filtroStatus === "TODOS"
                || (filtroStatus === "ATIVOS" ? ativo : !ativo)
            if (correspondeBusca && correspondeFiltro) filtrados.push(funcionario)
        })
        const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
        pagina = Math.min(pagina, totalPaginas)
        const inicio = (pagina - 1) * porPagina
        lista.innerHTML = filtrados.slice(inicio, inicio + porPagina).map(funcionario => {
            const ativo = String(funcionario.statusSistema) === "1"
            return `<div class="gfLinha">
                <div class="gfUsuario">
                    <div class="gfAvatar">${escapar(iniciais(funcionario.nome))}</div>
                    <div><span class="gfNome">${escapar(funcionario.nome || "Sem nome")}</span>
                        <span class="gfEmail">${escapar(funcionario.email || "Sem e-mail")}</span></div>
                </div>
                <div><span class="gfStatus ${ativo ? "ativo" : "inativo"}">${ativo ? "Ativo" : "Inativo"}</span></div>
                <div><a href="EditarUsuario.html?id=${Number(funcionario.idFuncionario)}" class="gfBtnEditar"
                    aria-label="Editar aeronaves de ${escapar(funcionario.nome)}">Editar</a></div>
                <div><span class="gfAeronaves">${textoAeronaves(Number(funcionario.totalAeronaves))}</span></div>
            </div>`
        }).join("")
        mensagem.hidden = filtrados.length > 0
        mensagem.textContent = funcionarios.length ? "Nenhum funcionário encontrado para os filtros selecionados." : "Nenhum analista cadastrado nesta empresa."
        contagem.textContent = filtrados.length
            ? `Mostrando ${inicio + 1}–${Math.min(inicio + porPagina, filtrados.length)} de ${filtrados.length} funcionários`
            : "0 funcionários"
        paginas.innerHTML = ""
        if (totalPaginas > 1) {
            adicionarPagina("Anterior", pagina - 1, pagina === 1)
            const primeira = Math.max(1, Math.min(pagina - 2, totalPaginas - 4))
            for (let numero = primeira; numero <= Math.min(totalPaginas, primeira + 4); numero++) {
                adicionarPagina(String(numero), numero, false)
            }
            adicionarPagina("Próxima", pagina + 1, pagina === totalPaginas)
        }
    }

    function adicionarPagina(texto, numero, desabilitado) {
        const botao = document.createElement("button")
        botao.type = "button"
        botao.className = "gfPagina"
        botao.textContent = texto
        botao.disabled = desabilitado
        if (numero === pagina && /^\d+$/.test(texto)) {
            botao.classList.add("ativo")
            botao.setAttribute("aria-current", "page")
        }
        botao.addEventListener("click", () => {
            pagina = numero
            atualizarTabela()
        })
        paginas.appendChild(botao)
    }

    async function carregarFuncionarios() {
        busca.disabled = true
        filtros.forEach(botao => { botao.disabled = true })
        lista.setAttribute("aria-busy", "true")
        lista.innerHTML = ""
        paginas.innerHTML = ""
        contagem.textContent = ""
        mensagem.hidden = false
        mensagem.textContent = "Carregando funcionários..."
        mensagem.classList.remove("erro")
        recarregar.hidden = true
        try {
            funcionarios = await buscarJson(`/usuario/funcionarios/${sessionStorage.getItem("idUsuario")}`)
            busca.disabled = false
            filtros.forEach(botao => { botao.disabled = false })
            atualizarTabela()
        } catch (erro) {
            mensagem.textContent = erro.message
            mensagem.classList.add("erro")
            recarregar.hidden = false
        } finally {
            lista.setAttribute("aria-busy", "false")
        }
    }

    busca.addEventListener("input", () => { pagina = 1; atualizarTabela() })
    filtros.forEach(botao => botao.addEventListener("click", () => {
        filtroStatus = botao.dataset.status
        pagina = 1
        filtros.forEach(filtro => {
            const ativo = filtro === botao
            filtro.classList.toggle("ativo", ativo)
            filtro.setAttribute("aria-pressed", String(ativo))
        })
        atualizarTabela()
    }))
    recarregar.addEventListener("click", carregarFuncionarios)
    window.addEventListener("pageshow", evento => {
        if (evento.persisted) carregarFuncionarios()
    })
    carregarFuncionarios()
}
