function iniciarGerenciarFuncionario() {
    if (!verificarSessao() || sessionStorage.getItem("cargoUsuario") !== "GESTOR") return

    const busca = document.getElementById("buscaFuncionarios")
    const lista = document.getElementById("listaFuncionarios")
    const mensagem = document.getElementById("mensagemFuncionarios")
    const contagem = document.getElementById("contagemFuncionarios")
    const paginas = document.getElementById("paginasFuncionarios")
    const recarregar = document.getElementById("recarregarFuncionarios")
    const filtros = document.querySelectorAll(".gfFiltro[data-status]")
    const abas = document.querySelectorAll(".gfFiltro[data-cargo]")
    const tabela = document.querySelector(".gfTabela")
    const tituloAeronaves = document.getElementById("tituloAeronaves")
    const idGestor = Number(sessionStorage.getItem("idUsuario"))
    const operacoesPendentes = new Set()
    const porPagina = 7
    let funcionarios = []
    let filtroStatus = "TODOS"
    let filtroCargo = "ANALISTA"
    let pagina = 1

    function atualizarTabela() {
        const texto = normalizar(busca.value.trim())
        tabela.classList.toggle("gestores", filtroCargo === "GESTOR")
        tituloAeronaves.hidden = filtroCargo === "GESTOR"
        mensagem.classList.remove("erro")
        const filtrados = []
        funcionarios.forEach(function (funcionario) {
            const ativo = String(funcionario.statusSistema) === "1"
            const correspondeBusca = normalizar(`${funcionario.nome} ${funcionario.email}`).includes(texto)
            const correspondeFiltro = filtroStatus === "TODOS"
                || (filtroStatus === "ATIVOS" ? ativo : !ativo)
            if (funcionario.cargo === filtroCargo && correspondeBusca && correspondeFiltro) filtrados.push(funcionario)
        })
        const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
        pagina = Math.min(pagina, totalPaginas)
        const inicio = (pagina - 1) * porPagina
        lista.innerHTML = filtrados.slice(inicio, inicio + porPagina).map(funcionario => {
            const ativo = String(funcionario.statusSistema) === "1"
            const gestor = funcionario.cargo === "GESTOR"
            const propriaConta = Number(funcionario.idFuncionario) === idGestor
            const pendente = operacoesPendentes.has(Number(funcionario.idFuncionario))
            return `<div class="gfLinha">
                <div class="gfUsuario">
                    <div class="gfAvatar">${escapar(iniciais(funcionario.nome))}</div>
                    <div><span class="gfNome">${escapar(funcionario.nome || "Sem nome")}</span>
                        <span class="gfEmail">${escapar(funcionario.email || "Sem e-mail")}</span></div>
                </div>
                <div><span class="gfStatus ${ativo ? "ativo" : "inativo"}">${ativo ? "Ativo" : "Inativo"}</span></div>
                <div>${gestor
                    ? `<button type="button" class="gfBtnEditar" data-funcionario="${Number(funcionario.idFuncionario)}"
                        ${propriaConta || pendente ? "disabled" : ""}
                        aria-label="${propriaConta ? "Sua conta" : `${ativo ? "Desativar" : "Ativar"} conta de ${escapar(funcionario.nome)}`}">${propriaConta ? "Sua conta" : pendente ? "Salvando..." : ativo ? "Desativar" : "Ativar"}</button>`
                    : `<a href="EditarUsuario.html?id=${Number(funcionario.idFuncionario)}" class="gfBtnEditar"
                        aria-label="Editar aeronaves de ${escapar(funcionario.nome)}">Editar</a>`}</div>
                ${gestor ? "" : `<div><span class="gfAeronaves">${textoAeronaves(Number(funcionario.totalAeronaves))}</span></div>`}
            </div>`
        }).join("")
        mensagem.hidden = filtrados.length > 0
        mensagem.textContent = funcionarios.some(funcionario => funcionario.cargo === filtroCargo)
            ? "Nenhum funcionário encontrado para os filtros selecionados."
            : `Nenhum ${filtroCargo === "GESTOR" ? "gestor" : "analista"} cadastrado nesta empresa.`
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
        abas.forEach(botao => { botao.disabled = true })
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
            abas.forEach(botao => { botao.disabled = false })
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
    abas.forEach(botao => botao.addEventListener("click", () => {
        filtroCargo = botao.dataset.cargo
        pagina = 1
        abas.forEach(aba => {
            const ativa = aba === botao
            aba.classList.toggle("ativo", ativa)
            aba.setAttribute("aria-pressed", String(ativa))
        })
        atualizarTabela()
    }))
    lista.addEventListener("click", async evento => {
        const botao = evento.target.closest("button[data-funcionario]")
        if (!botao || botao.disabled) return
        const id = Number(botao.dataset.funcionario)
        const funcionario = funcionarios.find(item => Number(item.idFuncionario) === id)
        if (!funcionario || funcionario.cargo !== "GESTOR" || id === idGestor || operacoesPendentes.has(id)) return
        const ativo = String(funcionario.statusSistema) === "1"
        if (!window.confirm(`Deseja ${ativo ? "desativar" : "ativar"} a conta de ${funcionario.nome}?`)) return
        operacoesPendentes.add(id)
        atualizarTabela()
        try {
            await buscarJson(`/usuario/funcionarios/${idGestor}/${id}${ativo ? "" : "/ativar"}`, {
                method: ativo ? "DELETE" : "PUT"
            })
            funcionario.statusSistema = ativo ? "0" : "1"
        } catch (erro) {
            operacoesPendentes.delete(id)
            atualizarTabela()
            mensagem.hidden = false
            mensagem.textContent = erro.message
            mensagem.classList.add("erro")
            return
        }
        operacoesPendentes.delete(id)
        atualizarTabela()
    })
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
