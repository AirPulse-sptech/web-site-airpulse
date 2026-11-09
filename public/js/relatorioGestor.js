var relatorios = []
var analiseEmAndamento = false

var nomesConclusao = {
    NORMAL: "Normal",
    ATENCAO: "Atenção",
    CRITICO: "Crítico"
}

var nomesCategorias = {
    DESEMPENHO: "Desempenho",
    FALHA_HARDWARE: "Falha de hardware",
    ARMAZENAMENTO: "Armazenamento",
    MEMORIA_RAM: "Memória RAM",
    PROCESSADOR: "Processador",
    PERDA_CONEXAO: "Perda de conexão"
}

var coresCategorias = {
    DESEMPENHO: "#0755ff",
    FALHA_HARDWARE: "#ff354f",
    ARMAZENAMENTO: "#ffa000",
    MEMORIA_RAM: "#7b5cff",
    PROCESSADOR: "#18be70",
    PERDA_CONEXAO: "#12b5cb"
}

function carregarRelatorios() {
    var idFuncionario = sessionStorage.getItem("idUsuario")

    return fetch(`/relatorio/gestor/${idFuncionario}`)
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("Erro ao buscar os relatórios.")
            }
            return resposta.json()
        })
        .then(function (dados) {
            relatorios = dados
            document.getElementById("erroRelatorios").hidden = true
            preencherAeronaves()
            preencherComponentes()
            atualizarDashboard()
        })
        .catch(function (erro) {
            console.log(erro)
            document.getElementById("erroRelatorios").textContent = "N\u00e3o foi poss\u00edvel carregar os relat\u00f3rios. Recarregue a p\u00e1gina para tentar novamente."
            document.getElementById("erroRelatorios").hidden = false
            document.getElementById("contextoFiltros").textContent = "Dados indispon\u00edveis"
            document.getElementById("coberturaAnalise").textContent = "Dados indispon\u00edveis."
            document.getElementById("semPontos").textContent = "Dados indispon\u00edveis."
            document.getElementById("listaRelatorios").innerHTML = ""
            document.getElementById("contagem").textContent = ""
            document.getElementById("semRelatorios").textContent = "Não foi possível carregar os relatórios."
            document.getElementById("semRelatorios").hidden = false
        })
}

function preencherAeronaves() {
    var select = document.getElementById("filtroAeronave")
    var selecionado = select.value
    var aeronaves = new Map()
    relatorios.forEach(function (relatorio) {
        aeronaves.set(String(relatorio.fkAeronave || relatorio.aeronave), relatorio.aeronave)
    })
    select.innerHTML = '<option value="">Todas as aeronaves</option>'
    Array.from(aeronaves)
        .sort(function (a, b) { return a[1].localeCompare(b[1]) })
        .forEach(function (item) {
            var opcao = document.createElement("option")
            opcao.value = item[0]
            opcao.textContent = item[1]
            select.appendChild(opcao)
        })
    if (aeronaves.has(selecionado)) select.value = selecionado
}

function atualizarResumo(visiveis) {
    var aeronaves = new Set()
    var atencao = 0
    var critico = 0

    for (var i = 0; i < visiveis.length; i++) {
        if (visiveis[i].criticidade == "ATENCAO") {
            atencao++
        } else if (visiveis[i].criticidade == "CRITICO") {
            critico++
            aeronaves.add(String(visiveis[i].fkAeronave || visiveis[i].aeronave))
        }
    }

    document.getElementById("totalAeronavesCriticas").textContent = aeronaves.size
    document.getElementById("totalAtencao").textContent = atencao
    document.getElementById("totalCritico").textContent = critico
}

function atualizarCategorias(visiveis) {
    var totais = {}

    for (var i = 0; i < visiveis.length; i++) {
        var categoria = visiveis[i].categoria
        totais[categoria] = (totais[categoria] || 0) + 1
    }

    var distribuicao = []
    var categorias = Object.keys(totais)
    for (var j = 0; j < categorias.length; j++) {
        distribuicao.push({ categoria: categorias[j], total: totais[categorias[j]] })
    }
    distribuicao.sort(function (a, b) {
        return b.total - a.total || a.categoria.localeCompare(b.categoria)
    })

    var total = visiveis.length
    var grafico = document.getElementById("graficoRoscaCategoria")
    var legendaEl = document.getElementById("legendaCategorias")
    legendaEl.innerHTML = ""
    var faixas = []
    var inicio = 0

    for (var k = 0; k < distribuicao.length; k++) {
        var item = distribuicao[k]
        var cor = coresCategorias[item.categoria] || "#9ca3af"
        var fim = inicio + item.total / total * 360
        var nome = nomesCategorias[item.categoria] || item.categoria
        faixas.push(cor + " " + inicio + "deg " + fim + "deg")
        inicio = fim
        var linha = document.createElement("li")
        linha.innerHTML = `<span class="rgPontoCategoria" style="--rgCategoriaCor: ${cor}"></span>
            <span class="rgNomeCategoria"></span><strong>${item.total}</strong>
            <span>${Math.round(item.total / total * 100)}%</span>`
        linha.querySelector(".rgNomeCategoria").textContent = nome
        legendaEl.appendChild(linha)
    }

    grafico.style.background = faixas.length
        ? "conic-gradient(" + faixas.join(", ") + ")"
        : "conic-gradient(#eef0ff 0deg 360deg)"
    document.getElementById("totalCentroGrafico").textContent = total
    if (!distribuicao.length) legendaEl.innerHTML = '<li class="rgLegendaVazia">Sem relatórios publicados.</li>'
}

function atualizarTabela(visiveis) {
    var lista = document.getElementById("listaRelatorios")
    lista.innerHTML = ""

    for (var i = 0; i < visiveis.length; i++) {
        var relatorio = visiveis[i]
        var nomeConclusao = nomesConclusao[relatorio.criticidade] || "—"
        var classeConclusao = nomesConclusao[relatorio.criticidade] ? relatorio.criticidade.toLowerCase() : ""
        var statusAnalise = { PENDENTE: "Texto pendente de análise", PROCESSANDO: "Analisando texto…", CONCLUIDO: "Texto analisado", ERRO: "Falha na análise do texto" }
        var acaoAnalise = podeAnalisar(relatorio) ? `<button type="button" class="rgAcaoAnalise" onclick="processarAnalises([${Number(relatorio.idRelatorio)}])" ${analiseEmAndamento ? "disabled" : ""}>${relatorio.statusAnalise === "ERRO" || relatorio.statusAnalise === "PROCESSANDO" ? "Tentar análise novamente" : "Analisar texto"}</button>` : ""

        var linha = document.createElement("div")
        linha.className = "rgLinha"
        linha.innerHTML = `
                <div>
                    <span class="rgNomeRel"></span>
                    <span class="rgAutor rgAutorNome"></span>
                    <span class="rgAutor rgStatusAnalise"></span>
                    <span class="rgAutor rgErroAnalise" hidden></span>${acaoAnalise}
                </div>
                <div>
                    <span class="rgAeronave"></span>
                    <span class="rgModelo"></span>
                </div>
                <div class="rgTexto rgPeriodo"></div>
                <div><span class="rgTag ${classeConclusao}">${nomeConclusao}</span></div>
                <div class="rgTexto rgCriado"></div>
                <div><a href="verRelatorioGestor.html?id=${encodeURIComponent(relatorio.idRelatorio)}" class="rgBtnVer">Ver relatório</a></div>
        `
        linha.querySelector(".rgNomeRel").textContent = relatorio.titulo || ""
        linha.querySelector(".rgAutorNome").textContent = "Autor: " + (relatorio.autor || "—")
        linha.querySelector(".rgStatusAnalise").textContent = statusAnalise[relatorio.statusAnalise] || "Análise ainda não disponível"
        linha.querySelector(".rgErroAnalise").textContent = relatorio.erroAnalise || ""
        linha.querySelector(".rgErroAnalise").hidden = relatorio.statusAnalise !== "ERRO" || !relatorio.erroAnalise
        linha.querySelector(".rgAeronave").textContent = relatorio.aeronave || ""
        linha.querySelector(".rgModelo").textContent = relatorio.modelo || ""
        linha.querySelector(".rgPeriodo").textContent = (relatorio.periodoInicio || "") + " a " + (relatorio.periodoFim || "")
        linha.querySelector(".rgCriado").textContent = relatorio.dataCriacao || ""
        lista.appendChild(linha)
    }

    document.getElementById("semRelatorios").textContent = "Nenhum relatório encontrado."
    document.getElementById("semRelatorios").hidden = visiveis.length > 0
    document.getElementById("contagem").textContent = `Mostrando ${visiveis.length} de ${relatorios.length} relatórios`
}

function analisesDoRelatorio(relatorio) {
    return relatorio.statusAnalise === "CONCLUIDO" && Array.isArray(relatorio.analises)
        ? relatorio.analises : []
}

function preencherComponentes() {
    var selecionado = document.getElementById("filtroComponente").value
    var componentes = new Set()
    relatorios.forEach(function (relatorio) {
        analisesDoRelatorio(relatorio).forEach(function (analise) {
            if (analise.componente) componentes.add(analise.componente)
        })
    })
    var select = document.getElementById("filtroComponente")
    select.innerHTML = '<option value="">Todos os componentes</option>'
    Array.from(componentes).sort().forEach(function (nome) {
        var opcao = document.createElement("option")
        opcao.value = nome
        opcao.textContent = nome
        select.appendChild(opcao)
    })
    if (componentes.has(selecionado)) document.getElementById("filtroComponente").value = selecionado
}

function dataISO(data) {
    if (/^\d{4}-\d{2}-\d{2}/.test(data || "")) return data.slice(0, 10)
    var partes = String(data || "").split("/")
    return partes.length === 3 ? partes.reverse().join("-") : ""
}

function dataLocal(data) {
    return data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0")
        + "-" + String(data.getDate()).padStart(2, "0")
}

function filtrar() {
    var texto = document.getElementById("busca").value.trim().toLowerCase()
    var aeronave = document.getElementById("filtroAeronave").value
    var criticidade = document.getElementById("filtroCriticidade").value
    var componente = document.getElementById("filtroComponente").value
    var periodo = document.getElementById("filtroPeriodo").value
    var hoje = new Date()
    var inicio = new Date(hoje)
    inicio.setDate(inicio.getDate() - Number(periodo) + 1)

    return relatorios.filter(function (relatorio) {
        var data = dataISO(relatorio.dataCriacaoISO || relatorio.dataCriacao)
        return (relatorio.titulo + " " + (relatorio.autor || "")).toLowerCase().includes(texto)
            && (!aeronave || String(relatorio.fkAeronave || relatorio.aeronave) === aeronave)
            && (criticidade === "TODOS" || relatorio.criticidade === criticidade)
            && (!componente || analisesDoRelatorio(relatorio).some(function (item) { return item.componente === componente }))
            && (periodo === "TODOS" || (data >= dataLocal(inicio) && data <= dataLocal(hoje)))
    }).sort(function (a, b) {
        var ordem = { CRITICO: 0, ATENCAO: 1, NORMAL: 2 }
        var prioridadeA = ordem[a.criticidade] == undefined ? 3 : ordem[a.criticidade]
        var prioridadeB = ordem[b.criticidade] == undefined ? 3 : ordem[b.criticidade]
        return prioridadeA - prioridadeB
            || dataISO(b.dataCriacaoISO || b.dataCriacao).localeCompare(dataISO(a.dataCriacaoISO || a.dataCriacao))
            || Number(b.idRelatorio) - Number(a.idRelatorio)
    })
}

function atualizarAnalises(visiveis) {
    var concluidos = visiveis.filter(function (r) { return r.statusAnalise === "CONCLUIDO" })
    var erros = visiveis.filter(function (r) { return r.statusAnalise === "ERRO" }).length
    var processando = visiveis.filter(function (r) { return r.statusAnalise === "PROCESSANDO" }).length
    var pendentes = visiveis.length - concluidos.length - erros - processando
    var integrado = relatorios.some(function (r) { return r.statusAnalise != null })
    document.getElementById("coberturaAnalise").textContent = !relatorios.length
        ? "Nenhum relatório publicado disponível para análise."
        : !integrado ? "Análise automática dos textos ainda não disponível. Os relatórios podem ser consultados abaixo."
            : `${concluidos.length} de ${visiveis.length} relatórios analisados · ${pendentes} pendentes · ${processando} em processamento · ${erros} com erro.`

    var situacoes = { IDENTIFICADO: "Identificado", SUSPEITO: "Suspeito", CORRIGIDO: "Corrigido", NAO_INFORMADO: "Não informado" }
    var componenteSelecionado = document.getElementById("filtroComponente").value
    var pontos = document.getElementById("pontosAtencao")
    pontos.innerHTML = ""
    var componentes = new Map()
    var sintomas = new Map()
    concluidos.forEach(function (relatorio) {
        analisesDoRelatorio(relatorio).forEach(function (analise) {
            if (componenteSelecionado && analise.componente !== componenteSelecionado) return
            var link = `verRelatorioGestor.html?id=${encodeURIComponent(relatorio.idRelatorio)}`
            var linha = document.createElement("tr")
            linha.innerHTML = `
                <td><strong class="rgPontoAeronave"></strong><small class="rgPontoTitulo"></small><a href="${link}">Ver relatório</a></td>
                <td><strong class="rgPontoComponente"></strong><small class="rgPontoSintoma"></small></td>
                <td><span class="rgTag ${nomesConclusao[relatorio.criticidade] ? relatorio.criticidade.toLowerCase() : ""}"></span></td>
                <td class="rgPontoSituacao"></td>
                <td><span class="rgPontoRecomendacao"></span>
                <details><summary>Consultar evidência</summary><blockquote></blockquote><a href="${link}">Ler análise completa</a></details></td>`
            linha.querySelector(".rgPontoAeronave").textContent = relatorio.aeronave || ""
            linha.querySelector(".rgPontoTitulo").textContent = relatorio.titulo || ""
            linha.querySelector(".rgPontoComponente").textContent = analise.componente || "Não informado"
            linha.querySelector(".rgPontoSintoma").textContent = analise.sintoma || "Não informado"
            linha.querySelector(".rgTag").textContent = nomesConclusao[relatorio.criticidade] || "Não informada"
            linha.querySelector(".rgPontoSituacao").textContent = situacoes[analise.situacao] || "Não informado"
            linha.querySelector(".rgPontoRecomendacao").textContent = analise.recomendacao || "Recomendação não informada."
            linha.querySelector("blockquote").textContent = analise.trechoEvidencia || "Trecho de evidência não disponível."
            pontos.appendChild(linha)
            if (analise.componente) {
                if (!componentes.has(analise.componente)) componentes.set(analise.componente, new Set())
                componentes.get(analise.componente).add(relatorio.idRelatorio)
            }
            if (analise.sintoma) {
                var chave = analise.sintoma.trim().toLocaleLowerCase("pt-BR")
                if (!sintomas.has(chave)) sintomas.set(chave, { nome: analise.sintoma, relatorios: new Map() })
                sintomas.get(chave).relatorios.set(relatorio.idRelatorio, relatorio)
            }
        })
    })
    document.getElementById("semPontos").hidden = pontos.children.length > 0
    document.getElementById("semPontos").textContent = !visiveis.length ? "Nenhum relatório corresponde aos filtros."
        : !concluidos.length ? "Os pontos de atenção aparecerão quando os textos forem analisados. Consulte os relatórios publicados."
            : "Nenhum ponto de atenção extraído dos relatórios selecionados."

    var ranking = Array.from(componentes).sort(function (a, b) { return b[1].size - a[1].size || a[0].localeCompare(b[0]) })
    var maior = ranking.length ? ranking[0][1].size : 1
    var listaComponentes = document.getElementById("componentesMencionados")
    listaComponentes.innerHTML = ""
    ranking.forEach(function (item) {
        var linha = document.createElement("li")
        linha.innerHTML = `<div class="rgBarraTitulo"><span></span><strong>${item[1].size} relatório(s)</strong></div><div class="rgTrilho" aria-hidden="true"><div class="rgPreenchimento" style="width:${item[1].size / maior * 100}%"></div></div>`
        linha.querySelector("span").textContent = item[0]
        listaComponentes.appendChild(linha)
    })
    document.getElementById("semComponentes").hidden = ranking.length > 0
    document.getElementById("semComponentes").textContent = concluidos.length ? "Nenhum componente identificado neste recorte." : "Sem análises dos textos neste recorte."
    var recorrentes = Array.from(sintomas.values()).filter(function (item) { return item.relatorios.size >= 2 })
        .sort(function (a, b) { return b.relatorios.size - a.relatorios.size || a.nome.localeCompare(b.nome) })
    var listaSintomas = document.getElementById("sintomasRecorrentes")
    listaSintomas.innerHTML = ""
    recorrentes.forEach(function (item) {
        var fontes = Array.from(item.relatorios.values())
        var aeronaves = new Set(fontes.map(function (r) { return r.fkAeronave || r.aeronave }))
        var linha = document.createElement("li")
        linha.innerHTML = `<strong></strong><span>${fontes.length} relatórios · ${aeronaves.size} aeronave(s)</span>`
        linha.querySelector("strong").textContent = item.nome
        fontes.forEach(function (relatorio) {
            var link = document.createElement("a")
            link.href = "verRelatorioGestor.html?id=" + encodeURIComponent(relatorio.idRelatorio)
            link.textContent = relatorio.titulo || "Ver relatório"
            linha.appendChild(link)
        })
        listaSintomas.appendChild(linha)
    })
    document.getElementById("semSintomas").hidden = recorrentes.length > 0
    document.getElementById("semSintomas").textContent = concluidos.length ? "Nenhum sintoma citado em dois ou mais relatórios neste recorte." : "Sem análises dos textos neste recorte."
}

function atualizarDashboard() {
    var visiveis = filtrar()
    atualizarResumo(visiveis)
    atualizarCategorias(visiveis)
    atualizarTabela(visiveis)
    atualizarAnalises(visiveis)
    document.getElementById("analisarPendentes").disabled = analiseEmAndamento || !visiveis.some(podeAnalisar)
    var periodo = document.getElementById("filtroPeriodo")
    document.getElementById("contextoFiltros").textContent = `${visiveis.length} de ${relatorios.length} relatórios publicados · ${periodo.selectedOptions[0].textContent} · Filtros aplicados a toda a tela`
}

function podeAnalisar(relatorio) {
    return relatorio.statusAnalise === "PENDENTE" || relatorio.statusAnalise === "ERRO" || !!relatorio.podeAnalisar
}

function processarAnalises(ids) {
    if (analiseEmAndamento || !ids.length) return
    analiseEmAndamento = true
    var mensagem = document.getElementById("mensagemAnalise")
    mensagem.hidden = false
    atualizarDashboard()
    var processamento = Promise.resolve()
    ids.forEach(function (idRelatorio, indice) {
        processamento = processamento.then(function () {
            mensagem.textContent = `Analisando relatório ${indice + 1} de ${ids.length}…`
            return fetch(`/relatorio/gestor/analise/${idRelatorio}/${sessionStorage.getItem("idUsuario")}`, { method: "POST" })
                .then(function (resposta) {
                    return resposta.json().then(function (dados) {
                        if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível analisar o relatório.")
                    })
                })
        })
    })
    return processamento
        .then(function () {
            mensagem.textContent = "Processamento concluído. Consulte as evidências e recomendações abaixo."
        })
        .catch(function (erro) {
            mensagem.textContent = erro.message === "Failed to fetch" ? "Não foi possível conectar ao servidor. Tente novamente." : erro.message
        })
        .then(function () {
            analiseEmAndamento = false
            return carregarRelatorios()
        })
}

function analisarRelatoriosPendentes() {
    return processarAnalises(filtrar().filter(podeAnalisar).map(function (r) { return r.idRelatorio }))
}

function atualizarAnalisesRelatorios() {
    if (!analiseEmAndamento) return carregarRelatorios()
}

document.getElementById("busca").addEventListener("input", atualizarDashboard)
var filtrosDashboard = ["filtroPeriodo", "filtroAeronave", "filtroCriticidade", "filtroComponente"]
filtrosDashboard.forEach(function (id) {
    document.getElementById(id).addEventListener("change", atualizarDashboard)
})
function limparFiltrosRelatorios() {
    document.getElementById("filtroPeriodo").value = "7"
    document.getElementById("filtroCriticidade").value = "TODOS"
    document.getElementById("filtroAeronave").value = ""
    document.getElementById("filtroComponente").value = ""
    document.getElementById("busca").value = ""
    atualizarDashboard()
}

if (verificarSessao() && podeAcessarPagina("relatorioGestor.html")) carregarRelatorios()
