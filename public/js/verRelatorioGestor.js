var idUsuario = sessionStorage.getItem("idUsuario")
var idRelatorio = new URLSearchParams(window.location.search).get("id")

var nomesComponente = { CPU: "CPU", RAM: "Memória RAM", DISCO: "Disco" }
var iconesComponente = { CPU: "bi-cpu", RAM: "bi-memory", DISCO: "bi-device-hdd" }
var nomesStatusFmc = { ATIVO: "Ativo", INATIVO: "Inativo", MANUTENCAO: "Em manutenção" }
var conclusoes = {
    NORMAL: { texto: "Normal", classe: "normal" },
    ATENCAO: { texto: "Atenção", classe: "atencao" },
    CRITICO: { texto: "Crítico", classe: "critico" }
}

function escapar(texto) {
    return String(texto == undefined ? "" : texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function iniciais(nome) {
    return nome.split(" ").map(function (parte) { return parte[0] }).slice(0, 2).join("").toUpperCase()
}

function buscarJson(url) {
    return fetch(url).then(function (resposta) {
        if (!resposta.ok) {
            throw new Error(`Erro ${resposta.status} em ${url}`)
        }
        return resposta.json()
    })
}

function mostrarErro(mensagem) {
    document.getElementById("relatorioForm").hidden = true
    document.getElementById("mensagemErro").textContent = mensagem
    document.getElementById("mensagemErro").hidden = false
}

function carregarRelatorio() {
    if (!idRelatorio) {
        mostrarErro("Nenhum relatório foi informado.")
        return
    }

    buscarJson(`/relatorio/gestor/detalhe/${idRelatorio}/${idUsuario}`)
        .then(function (relatorio) {
            preencherRelatorio(relatorio)
            carregarMonitoramento(relatorio.fkAeronave)
            carregarAnteriores(relatorio.fkAeronave)
        })
        .catch(function (erro) {
            console.log(erro)
            mostrarErro("Não foi possível abrir este relatório. Ele pode não existir ou não estar publicado.")
        })
}

function preencherRelatorio(relatorio) {
    document.getElementById("subtitulo").textContent = `Relatório publicado, criado em ${relatorio.dataCriacao}.`
    document.getElementById("aeronave").value = `${relatorio.aeronave} · ${relatorio.modelo}`
    document.getElementById("titulo").value = relatorio.titulo
    document.getElementById("periodoInicio").value = relatorio.periodoInicio
    document.getElementById("periodoFim").value = relatorio.periodoFim
    document.getElementById("texto").value = relatorio.texto

    var opcao = document.querySelector(`input[name="criticidade"][value="${relatorio.criticidade}"]`)
    if (opcao) {
        opcao.checked = true
    }

    var pessoas = []

    if (relatorio.autor) {
        pessoas.push({ nome: relatorio.autor.nome, papel: "Autor" })
    }

    for (var i = 0; i < relatorio.coautores.length; i++) {
        pessoas.push({ nome: relatorio.coautores[i].nome, papel: "Coautor" })
    }

    var html = ""

    for (var j = 0; j < pessoas.length; j++) {
        html += `
            <div class="analista">
                <span class="avatarAnalista">${escapar(iniciais(pessoas[j].nome))}</span>
                <span class="dadosAnalista">
                    <strong>${escapar(pessoas[j].nome)}</strong>
                    <small>${pessoas[j].papel}</small>
                </span>
            </div>
        `
    }

    document.getElementById("listaAnalistas").innerHTML = html || '<p class="semDados">Nenhum analista vinculado.</p>'

    document.getElementById("nomeAeronave").textContent = relatorio.aeronave
    document.getElementById("modeloAeronave").textContent = [relatorio.modelo, relatorio.companhiaAerea].filter(Boolean).join(" · ")
    document.getElementById("nomeAeronaveLista").textContent = relatorio.aeronave
}

function carregarMonitoramento(idAeronave) {
    var lista = document.getElementById("listaFmcs")
    lista.innerHTML = '<p class="semDados">Carregando...</p>'

    buscarJson(`/computador/monitoramento/${idAeronave}/${idUsuario}`)
        .then(function (computadores) {
            if (computadores.length == 0) {
                lista.innerHTML = '<p class="semDados">Nenhum FMC monitorado nesta aeronave ainda.</p>'
                return
            }

            var html = ""

            for (var i = 0; i < computadores.length; i++) {
                var computador = computadores[i]
                var tipo = computador.tipoFmc == "MESTRE" ? "Mestre" : "Spare"
                var status = nomesStatusFmc[computador.statusComputador] || computador.statusComputador
                var componentes = ""

                for (var j = 0; j < computador.componentes.length; j++) {
                    var componente = computador.componentes[j]

                    componentes += `
                        <li>
                            <i class="bi ${iconesComponente[componente.tipo] || "bi-cpu"}" aria-hidden="true"></i>
                            <span>${nomesComponente[componente.tipo] || escapar(componente.tipo)}</span>
                            <span class="limites"><b class="valorAlerta">${componente.limiteAtencao}%</b> · <b class="valorCritico">${componente.limiteCritico}%</b></span>
                        </li>
                    `
                }

                html += `
                    <div class="blocoFmc">
                        <div class="cabecalhoFmc">
                            <strong>FMC ${tipo} · ${escapar(status)}</strong>
                            <span>alerta · crítico</span>
                        </div>
                        <ul class="listaComponentes">${componentes}</ul>
                    </div>
                `
            }

            lista.innerHTML = html
        })
        .catch(function (erro) {
            console.log(erro)
            lista.innerHTML = '<p class="semDados">Não foi possível carregar os dados da aeronave.</p>'
        })
}

function carregarAnteriores(idAeronave) {
    var lista = document.getElementById("listaRelatorios")
    var vazio = document.getElementById("semRelatorios")

    buscarJson(`/relatorio/anteriores/${idAeronave}/${idUsuario}`)
        .then(function (relatorios) {
            var html = ""
            var total = 0

            for (var i = 0; i < relatorios.length; i++) {
                var relatorio = relatorios[i]

                if (String(relatorio.idRelatorio) == idRelatorio) {
                    continue
                }

                var conclusao = conclusoes[relatorio.criticidade] || { texto: "—", classe: "" }
                total++

                html += `
                    <li>
                        <div>
                            <a class="linkRelatorio" href="verRelatorioGestor.html?id=${relatorio.idRelatorio}">
                                <strong>${escapar(relatorio.titulo)}</strong>
                            </a>
                            <small>${escapar(relatorio.autor || "Sem autor")} · ${escapar(relatorio.dataCriacao)}</small>
                        </div>
                        <span class="statusTag ${conclusao.classe}">${conclusao.texto}</span>
                    </li>
                `
            }

            lista.innerHTML = html
            vazio.hidden = total > 0
        })
        .catch(function (erro) {
            console.log(erro)
            vazio.textContent = "Não foi possível carregar os outros relatórios."
            vazio.hidden = false
        })
}

carregarRelatorio()
