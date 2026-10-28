var aeronaves = []
var aeronaveEditando = null

var nomesStatusAeronave = {
    ATIVA: "Ativa",
    MANUTENCAO: "Em manutenção",
    INATIVA: "Inativa"
}

function escapar(texto) {
    return String(texto == undefined ? "" : texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function mostrarMensagem(texto) {
    cardErro.style.display = "block"
    mensagemErro.innerHTML = texto
}

function carregarAeronaves() {
    var idFuncionario = sessionStorage.getItem("idUsuario")

    fetch(`/gerenciarAeronave/listar/${idFuncionario}`)
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("Erro ao buscar as aeronaves.")
            }
            return resposta.json()
        })
        .then(function (dados) {
            aeronaves = dados
            atualizarTabela()
        })
        .catch(function (erro) {
            console.log(erro)
            listaAeronaves.innerHTML = ""
            contagem.textContent = ""
            mostrarMensagem("Não foi possível carregar as aeronaves.")
        })
}

var nomesTipoFmc = {
    MESTRE: "Mestre",
    SPARE: "Spare"
}

function montarFmc(computador) {
    if (!computador) {
        return `<div class="gaFmc"><span class="gaVazio">Não cadastrado</span></div>`
    }

    var ativo = computador.statusComputador == "ATIVO"

    return `
        <div class="gaFmc">
            <div class="gaNome">
                <span class="gaBolinha ${ativo ? "ativo" : ""}" title="${ativo ? "Ativo" : "Inativo"}"></span>
                <span class="gfNome">${escapar(computador.nome)}</span>
            </div>
            <span class="gfEmail">${nomesTipoFmc[computador.tipoFmc] || escapar(computador.tipoFmc)}</span>
            <button type="button" class="gaBtnStatus gaBtnStatusPequeno" onclick="alterarStatusFmc(${computador.idComputador}, '${ativo ? "INATIVO" : "ATIVO"}')">
                ${ativo ? "Desativar" : "Ativar"}
            </button>
        </div>
    `
}

function atualizarTabela() {
    var html = ""

    for (var i = 0; i < aeronaves.length; i++) {
        var aeronave = aeronaves[i]
        var ativa = aeronave.statusAeronave == "ATIVA"

        html += `
            <div class="gfLinha gaLinha">
                <div>
                    <div class="gaNome">
                        <span class="gaBolinha ${ativa ? "ativo" : ""}"></span>
                        <span class="gfNome">${escapar(aeronave.nome)}</span>
                    </div>
                    <span class="gfEmail">${escapar(aeronave.modelo)}</span>
                </div>
                <div><span class="gaTextoStatus ${ativa ? "ativo" : ""}">${nomesStatusAeronave[aeronave.statusAeronave] || escapar(aeronave.statusAeronave)}</span></div>
                ${montarFmc(aeronave.computadores[0])}
                ${montarFmc(aeronave.computadores[1])}
                <div class="gaAcoes">
                    <button type="button" class="gfBtnEditar" onclick="abrirEdicao(${aeronave.idAeronave})">Editar</button>
                    <button type="button" class="gaBtnStatus" onclick="alterarStatusAeronave(${aeronave.idAeronave}, '${ativa ? "INATIVA" : "ATIVA"}')">
                        ${ativa ? "Desativar" : "Ativar"}
                    </button>
                </div>
            </div>
        `
    }

    if (aeronaves.length == 0) {
        html = `<div class="gfLinha"><span class="gaVazio">Nenhuma aeronave cadastrada.</span></div>`
    }

    listaAeronaves.innerHTML = html
    contagem.textContent = `${aeronaves.length} aeronave(s) cadastrada(s)`
}

function alterarStatusAeronave(idAeronave, status) {
    fetch(`/gerenciarAeronave/status-aeronave/${idAeronave}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            idFuncionarioServer: sessionStorage.getItem("idUsuario"),
            statusServer: status
        })
    })
        .then(function (resposta) {
            if (resposta.ok) {
                cardErro.style.display = "none"
                carregarAeronaves()
            } else {
                mostrarMensagem("Houve um erro ao alterar o status da aeronave!")
            }
        })
        .catch(function (erro) {
            console.log(`#ERRO: ${erro}`)
        })
}

function alterarStatusFmc(idComputador, status) {
    fetch(`/gerenciarAeronave/status-fmc/${idComputador}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            idFuncionarioServer: sessionStorage.getItem("idUsuario"),
            statusServer: status
        })
    })
        .then(function (resposta) {
            if (resposta.ok) {
                cardErro.style.display = "none"
                carregarAeronaves()
            } else {
                mostrarMensagem("Houve um erro ao alterar o status do FMC!")
            }
        })
        .catch(function (erro) {
            console.log(`#ERRO: ${erro}`)
        })
}

function montarOpcoes(opcoes, selecionado) {
    var html = ""

    for (var valor in opcoes) {
        html += `<option value="${valor}" ${valor == selecionado ? "selected" : ""}>${opcoes[valor]}</option>`
    }

    return html
}

var opcoesStatusFmc = {
    ATIVO: "Ativo",
    MANUTENCAO: "Em manutenção",
    INATIVO: "Inativo"
}

var opcoesMonitoramento = {
    ATIVO: "Ativo",
    INATIVO: "Inativo"
}

var nomesComponente = {
    CPU: "Processador (CPU)",
    RAM: "Memória RAM",
    DISCO: "Armazenamento"
}

function montarCamposPlaca(placa, posicao) {
    var html = `
        <h4 class="gaSubsecao">Placa ${posicao}</h4>
        <div class="formGrid">
            <div class="inputGroup">
                <label for="placaNome${placa.idPlaca}">Nome da placa</label>
                <input type="text" id="placaNome${placa.idPlaca}" value="${escapar(placa.nome)}">
            </div>

            <div class="inputGroup">
                <label for="placaModelo${placa.idPlaca}">Modelo da placa</label>
                <input type="text" id="placaModelo${placa.idPlaca}" value="${escapar(placa.modelo)}">
            </div>

            <div class="inputGroup">
                <label for="placaNumeroSerie${placa.idPlaca}">Número de série da placa</label>
                <input type="text" id="placaNumeroSerie${placa.idPlaca}" value="${escapar(placa.numeroSerie)}">
            </div>
    `

    html += "</div>"

    for (var i = 0; i < placa.componentes.length; i++) {
        var componente = placa.componentes[i]
        var id = componente.idComponente

        html += `
        <h5 class="gaSubsecao">${nomesComponente[componente.tipo] || escapar(componente.tipo)}</h5>
        <div class="formGrid">
            <div class="inputGroup">
                <label for="componenteModelo${id}">Modelo do componente</label>
                <input type="text" id="componenteModelo${id}" value="${escapar(componente.modelo)}">
            </div>

            <div class="inputGroup">
                <label for="limiteAtencao${id}">Limite de atenção (%)</label>
                <input type="number" id="limiteAtencao${id}" value="${escapar(componente.limiteAtencao)}" min="1" max="100" step="0.01">
            </div>

            <div class="inputGroup">
                <label for="limiteCritico${id}">Limite crítico (%)</label>
                <input type="number" id="limiteCritico${id}" value="${escapar(componente.limiteCritico)}" min="1" max="100" step="0.01">
            </div>

            <div class="inputGroup">
                <label for="monitoramento${id}">Monitoramento</label>
                <select id="monitoramento${id}">${montarOpcoes(opcoesMonitoramento, componente.statusMonitoramento)}</select>
            </div>

            <div class="inputGroup">
                <label>Métricas monitoradas</label>
                <span class="gaMetricas">${componente.metricas.length ? escapar(componente.metricas.join(", ")) : "Nenhuma"}</span>
            </div>
        </div>
        `
    }

    return html
}

function montarCamposFmc(computador, posicao) {
    var html = `
        <h3 class="gaSecao">FMC ${posicao} (${nomesTipoFmc[computador.tipoFmc] || escapar(computador.tipoFmc)})</h3>
        <div class="formGrid">
            <div class="inputGroup">
                <label for="fmcNome${computador.idComputador}">Nome</label>
                <input type="text" id="fmcNome${computador.idComputador}" value="${escapar(computador.nome)}">
            </div>

            <div class="inputGroup">
                <label for="fmcModelo${computador.idComputador}">Modelo</label>
                <input type="text" id="fmcModelo${computador.idComputador}" value="${escapar(computador.modelo)}">
            </div>

            <div class="inputGroup">
                <label for="fmcDataInstalacao${computador.idComputador}">Data de instalação</label>
                <input type="date" id="fmcDataInstalacao${computador.idComputador}" value="${escapar(computador.dataInstalacao)}">
            </div>

            <div class="inputGroup">
                <label for="fmcStatus${computador.idComputador}">Status</label>
                <select id="fmcStatus${computador.idComputador}">${montarOpcoes(opcoesStatusFmc, computador.statusComputador)}</select>
            </div>
        </div>
    `

    for (var i = 0; i < computador.placas.length; i++) {
        html += montarCamposPlaca(computador.placas[i], i + 1) 
    }

    return html
}

function abrirEdicao(idAeronave) {
    aeronaveEditando = null

    for (var i = 0; i < aeronaves.length; i++) {
        if (aeronaves[i].idAeronave == idAeronave) {
            aeronaveEditando = aeronaves[i]
        }
    }

    if (!aeronaveEditando) return

    editNome.value = aeronaveEditando.nome
    editModelo.value = aeronaveEditando.modelo
    editNumeroSerie.value = aeronaveEditando.numeroSerie
    editCompanhiaAerea.value = aeronaveEditando.companhiaAerea
    editStatus.value = aeronaveEditando.statusAeronave

    var html = ""
    for (var j = 0; j < aeronaveEditando.computadores.length; j++) {
        html += montarCamposFmc(aeronaveEditando.computadores[j], j + 1)
    }
    editFmcs.innerHTML = html

    cardErroModal.style.display = "none"
    bootstrap.Modal.getOrCreateInstance(modalEditar).show()
}

function valorCampo(id) {
    return document.getElementById(id).value
}

function salvarEdicao() {
    var computadores = []
    var vazio = false

    if (editNome.value.trim() == "" || editModelo.value.trim() == ""
        || editNumeroSerie.value.trim() == "" || editCompanhiaAerea.value.trim() == "") {
        vazio = true
    }

    for (var i = 0; i < aeronaveEditando.computadores.length; i++) {
        var computador = aeronaveEditando.computadores[i]
        var id = computador.idComputador
        var placas = []

        if (valorCampo(`fmcNome${id}`).trim() == "" || valorCampo(`fmcModelo${id}`).trim() == ""
            || valorCampo(`fmcDataInstalacao${id}`) == "") {
            vazio = true
        }

        for (var j = 0; j < computador.placas.length; j++) {
            var placa = computador.placas[j]
            var idPlaca = placa.idPlaca
            var componentes = []

            if (valorCampo(`placaNome${idPlaca}`).trim() == "" || valorCampo(`placaModelo${idPlaca}`).trim() == ""
                || valorCampo(`placaNumeroSerie${idPlaca}`).trim() == "") {
                vazio = true
            }

            for (var k = 0; k < placa.componentes.length; k++) {
                var idComponente = placa.componentes[k].idComponente
                var atencao = Number(valorCampo(`limiteAtencao${idComponente}`))
                var critico = Number(valorCampo(`limiteCritico${idComponente}`))

                if (valorCampo(`componenteModelo${idComponente}`).trim() == "") {
                    vazio = true
                }

                if (!(atencao > 0 && critico > atencao && critico <= 100)) {
                    cardErroModal.style.display = "block"
                    mensagemErroModal.innerHTML = "Os limites estão inválidos: o crítico deve ser maior que o de atenção e no máximo 100%."
                    return false
                }

                componentes.push({
                    idComponente: idComponente,
                    modelo: valorCampo(`componenteModelo${idComponente}`),
                    statusMonitoramento: valorCampo(`monitoramento${idComponente}`),
                    limiteAtencao: atencao,
                    limiteCritico: critico
                })
            }

            placas.push({
                idPlaca: idPlaca,
                nome: valorCampo(`placaNome${idPlaca}`),
                modelo: valorCampo(`placaModelo${idPlaca}`),
                numeroSerie: valorCampo(`placaNumeroSerie${idPlaca}`),
                componentes: componentes
            })
        }

        computadores.push({
            idComputador: id,
            nome: valorCampo(`fmcNome${id}`),
            modelo: valorCampo(`fmcModelo${id}`),
            dataInstalacao: valorCampo(`fmcDataInstalacao${id}`),
            statusComputador: valorCampo(`fmcStatus${id}`),
            placas: placas
        })
    }

    if (vazio) {
        cardErroModal.style.display = "block"
        mensagemErroModal.innerHTML = "Preencha todos os campos para salvar."
        return false
    }

    fetch(`/gerenciarAeronave/editar/${aeronaveEditando.idAeronave}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            idFuncionarioServer: sessionStorage.getItem("idUsuario"),
            nomeServer: editNome.value,
            modeloServer: editModelo.value,
            numeroSerieServer: editNumeroSerie.value,
            companhiaAereaServer: editCompanhiaAerea.value,
            statusServer: editStatus.value,
            computadoresServer: computadores
        })
    })
        .then(function (resposta) {
            if (resposta.ok) {
                bootstrap.Modal.getOrCreateInstance(modalEditar).hide()
                mostrarMensagem(`Aeronave "${editNome.value}" atualizada com sucesso!`)
                carregarAeronaves()
            } else {
                return resposta.text().then(function (texto) {
                    cardErroModal.style.display = "block"
                    mensagemErroModal.innerHTML = texto || "Houve um erro ao tentar salvar as alterações!"
                })
            }
        })
        .catch(function (erro) {
            console.log(`#ERRO: ${erro}`)
        })

    return false
}

carregarAeronaves()