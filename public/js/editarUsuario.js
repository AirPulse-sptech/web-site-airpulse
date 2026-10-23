function iniciarEditarUsuario() {
    if (!verificarSessao() || sessionStorage.getItem("cargoUsuario") !== "GESTOR") return

    const idFuncionario = new URLSearchParams(window.location.search).get("id")
    const url = `/usuario/funcionarios/${sessionStorage.getItem("idUsuario")}/${idFuncionario}`
    const busca = document.getElementById("buscaAeronaves")
    const lista = document.getElementById("listaAeronaves")
    const mensagem = document.getElementById("mensagemEdicao")
    const recarregar = document.getElementById("recarregarEdicao")
    const salvar = document.getElementById("salvarAeronaves")
    const botaoInativar = document.getElementById("inativarFuncionario")
    const filtros = document.querySelectorAll(".eaFiltro[data-associacao]")
    let aeronaves = []
    let originais = new Set()
    let selecionadas = new Set()
    let filtroAssociacao = "TODAS"
    let carregado = false
    let salvando = false
    let descartando = false
    let funcionarioAtivo = false

    function alteracoesPendentes() {
        let total = 0
        originais.forEach(function (id) {
            if (!selecionadas.has(id)) total++
        })
        selecionadas.forEach(function (id) {
            if (!originais.has(id)) total++
        })
        return total
    }

    function mostrarMensagem(texto, erro = false) {
        mensagem.textContent = texto
        mensagem.hidden = !texto
        mensagem.classList.toggle("erro", erro)
    }

    function atualizarLista() {
        const texto = normalizar(busca.value.trim())
        const visiveis = []
        aeronaves.forEach(function (aeronave) {
            const associada = selecionadas.has(aeronave.idAeronave)
            const correspondeBusca = normalizar([aeronave.nome, aeronave.modelo, aeronave.numeroSerie, aeronave.companhiaAerea].join(" ")).includes(texto)
            const correspondeFiltro = filtroAssociacao === "TODAS"
                || (filtroAssociacao === "ASSOCIADAS" ? associada : !associada)
            if (correspondeBusca && correspondeFiltro) visiveis.push(aeronave)
        })
        lista.innerHTML = visiveis.map(aeronave => {
            const associada = selecionadas.has(aeronave.idAeronave)
            return `<div class="eaCard${associada ? " associada" : ""}">
                <div class="eaIcone">
                    <svg class="eaSvg" aria-hidden="true"><use href="#iconeAviao"></use></svg>
                    ${associada ? '<span class="eaCheck"><svg class="eaSvg" aria-hidden="true"><use href="#iconeCheck"></use></svg></span>' : ""}
                </div>
                <div class="eaInfo"><span class="eaNome">${escapar(aeronave.nome || "Aeronave sem nome")}</span>
                    <span class="eaModelo">${escapar(aeronave.modelo && aeronave.numeroSerie
                        ? `${aeronave.modelo} • ${aeronave.numeroSerie}`
                        : aeronave.modelo || aeronave.numeroSerie || "Sem identificação")}</span></div>
                <button type="button" class="eaBtnCard ${associada ? "remover" : "associar"}"
                    data-aeronave="${aeronave.idAeronave}" ${salvando ? "disabled" : ""}
                    aria-label="${associada ? "Remover associação de" : "Associar"} ${escapar(aeronave.nome)}">${associada ? "Remover" : "Associar"}</button>
            </div>`
        }).join("")
        if (!visiveis.length) {
            const vazio = document.createElement("p")
            vazio.className = "eaVazio"
            vazio.textContent = aeronaves.length ? "Nenhuma aeronave encontrada para os filtros selecionados." : "Nenhuma aeronave cadastrada nesta empresa."
            lista.appendChild(vazio)
        }
        const pendentes = alteracoesPendentes()
        document.getElementById("totalAeronaves").textContent = textoAeronaves(selecionadas.size)
        document.getElementById("resumoAeronaves").textContent = `${textoAeronaves(selecionadas.size)} • ${pendentes} ${pendentes === 1 ? "alteração pendente" : "alterações pendentes"}`
        salvar.disabled = !carregado || salvando || !pendentes
    }

    function bloquearControles(bloquear) {
        busca.disabled = bloquear
        filtros.forEach(botao => { botao.disabled = bloquear })
        lista.querySelectorAll("button").forEach(botao => { botao.disabled = bloquear })
        salvar.disabled = bloquear || !carregado || !alteracoesPendentes()
    }

    async function alterarStatusFuncionario() {
        const acao = funcionarioAtivo ? "inativar" : "ativar"
        if (!carregado || !window.confirm(`Deseja ${acao} este funcion\u00e1rio?`)) return
        botaoInativar.disabled = true
        botaoInativar.textContent = funcionarioAtivo ? "Inativando..." : "Ativando..."
        try {
            const endpoint = funcionarioAtivo ? url : `${url}/ativar`
            const metodo = funcionarioAtivo ? "DELETE" : "PUT"
            const resultado = await buscarJson(endpoint, { method: metodo })
            funcionarioAtivo = !funcionarioAtivo
            const status = document.getElementById("statusFuncionario")
            status.textContent = funcionarioAtivo ? "Ativo" : "Inativo"
            status.classList.toggle("inativo", !funcionarioAtivo)
            botaoInativar.textContent = funcionarioAtivo ? "Inativar funcion\u00e1rio" : "Ativar funcion\u00e1rio"
            botaoInativar.classList.toggle("reativar", !funcionarioAtivo)
            botaoInativar.disabled = false
            mostrarMensagem(resultado.mensagem)
        } catch (erro) {
            botaoInativar.disabled = false
            botaoInativar.textContent = funcionarioAtivo ? "Inativar funcion\u00e1rio" : "Ativar funcion\u00e1rio"
            mostrarMensagem(erro.message, true)
        }
    }

    async function carregarEdicao() {
        if (!/^[1-9]\d*$/.test(idFuncionario || "") || !Number.isSafeInteger(Number(idFuncionario))) {
            document.getElementById("nomeFuncionario").textContent = "Funcionário não selecionado"
            document.getElementById("resumoAeronaves").textContent = "Volte para a lista e selecione um funcionário."
            mostrarMensagem("Selecione um funcionário na tela de gerenciamento para editar suas aeronaves.", true)
            lista.setAttribute("aria-busy", "false")
            return
        }
        carregado = false
        bloquearControles(true)
        recarregar.hidden = true
        lista.setAttribute("aria-busy", "true")
        mostrarMensagem("Carregando aeronaves...")
        try {
            const dados = await buscarJson(url)
            const linhas = Array.isArray(dados) ? dados : []
            const primeiraLinha = linhas[0] || {}
            const funcionario = {
                idFuncionario: primeiraLinha.idFuncionario,
                nome: primeiraLinha.nomeFuncionario,
                email: primeiraLinha.emailFuncionario,
                statusSistema: primeiraLinha.statusSistema
            }
            document.getElementById("avatarFuncionario").textContent = iniciais(funcionario.nome)
            document.getElementById("nomeFuncionario").textContent = funcionario.nome || "Sem nome"
            document.getElementById("emailFuncionario").textContent = funcionario.email || "Sem e-mail"
            const ativo = String(funcionario.statusSistema) === "1"
            funcionarioAtivo = ativo
            botaoInativar.disabled = false
            botaoInativar.textContent = ativo ? "Inativar funcion\u00e1rio" : "Ativar funcion\u00e1rio"
            botaoInativar.classList.toggle("reativar", !ativo)
            const status = document.getElementById("statusFuncionario")
            status.textContent = ativo ? "Ativo" : "Inativo"
            status.classList.toggle("inativo", !ativo)
            aeronaves = linhas.map(aeronave => ({ ...aeronave, idAeronave: Number(aeronave.idAeronave) }))
            originais = new Set()
            aeronaves.forEach(function (aeronave) {
                if (Number(aeronave.associada) === 1) originais.add(aeronave.idAeronave)
            })
            selecionadas = new Set(originais)
            carregado = true
            mostrarMensagem("")
            atualizarLista()
            bloquearControles(false)
        } catch (erro) {
            document.getElementById("nomeFuncionario").textContent = "Não foi possível carregar o funcionário"
            document.getElementById("resumoAeronaves").textContent = "Associações indisponíveis"
            mostrarMensagem(erro.message, true)
            recarregar.hidden = false
        } finally {
            lista.setAttribute("aria-busy", "false")
        }
    }

    lista.addEventListener("click", evento => {
        const botao = evento.target.closest("button[data-aeronave]")
        if (!botao || !carregado || salvando) return
        const id = Number(botao.dataset.aeronave)
        const posicaoScroll = lista.scrollTop
        if (selecionadas.has(id)) selecionadas.delete(id)
        else selecionadas.add(id)
        mostrarMensagem("")
        atualizarLista()
        lista.scrollTop = posicaoScroll
        const proximo = lista.querySelector(`button[data-aeronave="${id}"]`)
        if (proximo) proximo.focus({ preventScroll: true })
        else busca.focus({ preventScroll: true })
    })
    busca.addEventListener("input", atualizarLista)
    filtros.forEach(botao => botao.addEventListener("click", () => {
        filtroAssociacao = botao.dataset.associacao
        filtros.forEach(filtro => {
            const ativo = filtro === botao
            filtro.classList.toggle("ativo", ativo)
            filtro.setAttribute("aria-pressed", String(ativo))
        })
        atualizarLista()
    }))
    salvar.addEventListener("click", async () => {
        if (!carregado || salvando || !alteracoesPendentes()) return
        salvando = true
        bloquearControles(true)
        salvar.textContent = "Salvando..."
        mostrarMensagem("")
        try {
            const dados = await buscarJson(`${url}/aeronaves`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ aeronaves: [...selecionadas] })
            })
            originais = new Set(dados.aeronaves)
            selecionadas = new Set(originais)
            mostrarMensagem(dados.mensagem)
        } catch (erro) {
            mostrarMensagem(erro.message, true)
        } finally {
            salvando = false
            salvar.textContent = "Salvar alterações"
            atualizarLista()
            bloquearControles(false)
        }
    })
    document.getElementById("cancelarEdicao").addEventListener("click", evento => {
        if (salvando) evento.preventDefault()
        else descartando = true
    })
    window.addEventListener("beforeunload", evento => {
        if (!descartando && alteracoesPendentes()) {
            evento.preventDefault()
            evento.returnValue = ""
        }
    })
    recarregar.addEventListener("click", carregarEdicao)
    botaoInativar.addEventListener("click", alterarStatusFuncionario)
    carregarEdicao()
}
