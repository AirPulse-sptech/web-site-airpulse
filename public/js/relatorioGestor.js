var relatorios = []
var analiseEmAndamento = false
var aeronavesCobertura = []
var consultaCobertura = 0
var relatoriosCarregando = false
var coberturaCarregando = false
var relatoriosComErro = false
var atualizacaoEmAndamento = false
var ultimaAtualizacao = null
var paginaRelatorios = 1

function atualizarCarregamento() {
    var visiveis = filtrar()
    var pagina = obterPaginaRelatorios(visiveis, paginaRelatorios)
    document.getElementById("indicadoresRelatorios").setAttribute("aria-busy", relatoriosCarregando || coberturaCarregando)
    document.getElementById("cardCobertura").setAttribute("aria-busy", coberturaCarregando)
    document.getElementById("resultadosRelatorios").setAttribute("aria-busy", relatoriosCarregando)
    document.querySelector("#erroRelatorios button").disabled = relatoriosCarregando
    document.getElementById("analisarPendentes").disabled = relatoriosCarregando || relatoriosComErro || analiseEmAndamento || !visiveis.some(podeAnalisar)
    document.getElementById("paginaAnteriorRelatorios").disabled = relatoriosCarregando || pagina.pagina == 1
    document.getElementById("proximaPaginaRelatorios").disabled = relatoriosCarregando || pagina.pagina == pagina.totalPaginas
}

function carregarCoberturaAlertas() {
    var consulta = ++consultaCobertura
    var numero = document.getElementById("percentualCoberturaAlertas")
    var quantidade = document.getElementById("quantidadeCoberturaAlertas")
    var resumo = document.getElementById("resumoCoberturaAlertas")
    var progresso = document.getElementById("progressoCobertura")
    var meta = document.getElementById("metaCobertura")
    coberturaCarregando = true
    document.getElementById("cardCobertura").dataset.estado = "carregando"
    document.getElementById("tentarCobertura").hidden = true
    atualizarCarregamento()
    numero.textContent = "—"
    numero.hidden = true
    quantidade.textContent = "—"
    resumo.textContent = "Carregando alertas…"
    progresso.hidden = true
    meta.textContent = "Aguardando dados"
    var filtros = new URLSearchParams({ dias: document.getElementById("filtroPeriodo").value, aeronave: document.getElementById("filtroAeronave").value })
    return fetch(`/relatorio/gestor/cobertura/${sessionStorage.getItem("idUsuario")}?${filtros}`)
        .then(function (resposta) {
            if (!resposta.ok) throw new Error("Cobertura indisponível")
            return resposta.json()
        })
        .then(function (dados) {
            if (consulta !== consultaCobertura) return
            aeronavesCobertura = dados.aeronaves
            preencherAeronaves()
            numero.textContent = dados.total ? (Math.floor(dados.percentual * 10) / 10).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%" : "—"
            numero.hidden = !dados.total
            quantidade.textContent = dados.total ? `${dados.cobertos} de ${dados.total}` : "—"
            resumo.textContent = dados.total
                ? "alertas documentados"
                : "Nenhum alerta no período"
            progresso.hidden = !dados.total
            progresso.setAttribute("aria-valuenow", dados.total ? dados.percentual : 0)
            document.getElementById("barraCobertura").style.width = (dados.total ? dados.percentual : 0) + "%"
            meta.textContent = !dados.total ? "Sem alertas" : dados.pendentes ? `${dados.pendentes} pendentes` : "Meta atingida"
            document.getElementById("cardCobertura").dataset.estado = !dados.total ? "vazio" : dados.pendentes ? "pendente" : "completo"
        })
        .catch(function () {
            if (consulta !== consultaCobertura) return
            resumo.textContent = "Cobertura indisponível. Tente Atualizar."
            meta.textContent = "Dados indisponíveis"
            document.getElementById("cardCobertura").dataset.estado = "indisponivel"
            document.getElementById("tentarCobertura").hidden = false
        })
        .finally(function () {
            if (consulta !== consultaCobertura) return
            coberturaCarregando = false
            atualizarCarregamento()
        })
}

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
    DESEMPENHO: "#4F46E5",
    FALHA_HARDWARE: "#1A237E",
    ARMAZENAMENTO: "#7B74EE",
    MEMORIA_RAM: "#818CF8",
    PROCESSADOR: "#64748B",
    PERDA_CONEXAO: "#A5B4FC"
}

function carregarRelatorios() {
    if (relatoriosCarregando) return Promise.resolve()
    relatoriosCarregando = true
    atualizarCarregamento()
    var idFuncionario = sessionStorage.getItem("idUsuario")

    return fetch(`/relatorio/gestor/${idFuncionario}`)
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("Erro ao buscar os relatórios.")
            }
            return resposta.json()
        })
        .then(function (dados) {
            if (!Array.isArray(dados)) throw new Error("Resposta inválida de relatórios.")
            relatorios = dados
            relatoriosComErro = false
            ultimaAtualizacao = new Date()
            document.getElementById("erroRelatorios").hidden = true
            preencherAeronaves()
            preencherComponentes()
            atualizarDashboard()
        })
        .catch(function (erro) {
            console.log(erro)
            mostrarErroRelatorios()
        })
        .finally(function () {
            relatoriosCarregando = false
            atualizarCarregamento()
        })
}

function mostrarErroRelatorios() {
    relatoriosComErro = true
    relatorios = []
    paginaRelatorios = 1
    document.getElementById("paginacaoRelatorios").hidden = true
    document.getElementById("mensagemErroRelatorios").textContent = "Não foi possível carregar os relatórios. Tente novamente."
    document.getElementById("erroRelatorios").hidden = false
    document.getElementById("contextoFiltros").textContent = "Relatórios indisponíveis"
    document.getElementById("coberturaAnalise").textContent = "Relatórios indisponíveis."
        ;["totalAtencao", "totalCritico", "totalAeronavesCriticas", "totalCentroGrafico"].forEach(function (id) { document.getElementById(id).textContent = "—" })
        ;["listaRelatorios", "pontosAtencao", "componentesMencionados", "sintomasRecorrentes", "legendaCategorias"].forEach(function (id) { document.getElementById(id).replaceChildren() })
        ;["Atencao", "Critico", "Aeronaves"].forEach(function (sufixo) { mostrarVariacaoHora(sufixo, null) })
        ;["Atencao", "Critico", "Aeronaves"].forEach(function (sufixo) {
            document.getElementById("medidor" + sufixo).hidden = true
            document.getElementById("proporcao" + sufixo).textContent = "Dados indisponíveis"
        })
        ;["semPontos", "semComponentes", "semSintomas"].forEach(function (id) {
            document.getElementById(id).hidden = false
            document.getElementById(id).textContent = "Dados indisponíveis. Tente carregar os relatórios novamente."
        })
    document.getElementById("tabelaRelatorios").hidden = true
    document.getElementById("tabelaPontosAtencao").hidden = true
    document.getElementById("graficoRoscaCategoria").style.background = "var(--borderSoft)"
    document.getElementById("graficoRoscaCategoria").setAttribute("aria-label", "Distribuição indisponível")
    document.getElementById("estadoResultados").hidden = false
    document.getElementById("semRelatorios").textContent = "Os relatórios não foram carregados."
    document.getElementById("acaoSemRelatorios").hidden = true
    document.getElementById("totalResultados").textContent = "Indisponível"
    document.getElementById("contagem").textContent = ""
}

function preencherAeronaves() {
    var select = document.getElementById("filtroAeronave")
    var selecionado = select.value
    var aeronaves = new Map()
    aeronavesCobertura.forEach(function (aeronave) { aeronaves.set(String(aeronave.id), aeronave.nome) })
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
    var aeronavesCitadas = new Set()
    var atencao = 0
    var critico = 0

    for (var i = 0; i < visiveis.length; i++) {
        aeronavesCitadas.add(String(visiveis[i].fkAeronave || visiveis[i].aeronave))
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
    atualizarProporcao("Atencao", atencao, visiveis.length, "dos relatórios")
    atualizarProporcao("Critico", critico, visiveis.length, "dos relatórios")
    atualizarProporcao("Aeronaves", aeronaves.size, aeronavesCitadas.size, "das aeronaves citadas")
    var horas = resumirUltimasHoras(visiveis, Date.now())
    mostrarVariacaoHora("Atencao", horas, "atencao")
    mostrarVariacaoHora("Critico", horas, "critico")
    mostrarVariacaoHora("Aeronaves", horas, "aeronaves")
}

function atualizarProporcao(sufixo, quantidade, total, legenda) {
    var percentual = total ? quantidade / total * 100 : 0
    var medidor = document.getElementById("medidor" + sufixo)
    medidor.value = percentual
    medidor.hidden = total == 0
    medidor.setAttribute("aria-valuetext", `${quantidade} de ${total} · ${legenda}`)
    document.getElementById("proporcao" + sufixo).textContent = total
        ? percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "% " + legenda
        : "Sem dados no período"
}

function resumirUltimasHoras(lista, agora) {
    if (lista.some(function (relatorio) { return !Number.isFinite(Number(relatorio.dataCriacaoTimestamp)) || Number(relatorio.dataCriacaoTimestamp) <= 0 })) return null
    var ultima = { atencao: 0, critico: 0, aeronaves: new Set() }
    var anterior = { atencao: 0, critico: 0, aeronaves: new Set() }
    lista.forEach(function (relatorio) {
        var idade = agora - Number(relatorio.dataCriacaoTimestamp)
        if (idade < 0 || idade >= 7200000) return
        var hora = idade < 3600000 ? ultima : anterior
        if (relatorio.criticidade === "ATENCAO") hora.atencao++
        if (relatorio.criticidade === "CRITICO") {
            hora.critico++
            hora.aeronaves.add(String(relatorio.fkAeronave || relatorio.aeronave))
        }
    })
    ultima.aeronaves = ultima.aeronaves.size
    anterior.aeronaves = anterior.aeronaves.size
    return { ultima: ultima, anterior: anterior }
}

function mostrarVariacaoHora(sufixo, horas, campo) {
    var variacao = document.getElementById("variacao" + sufixo)
    var referencia = document.getElementById("hora" + sufixo)
    if (!horas) {
        variacao.textContent = "—"
        variacao.dataset.tendencia = "indisponivel"
        referencia.textContent = "Comparação indisponível"
        referencia.title = ""
        return
    }
    var atual = horas.ultima[campo]
    var antes = horas.anterior[campo]
    var diferenca = atual - antes
    variacao.textContent = diferenca > 0 ? "↑ " + diferenca + " a mais" : diferenca < 0 ? "↓ " + Math.abs(diferenca) + " a menos" : atual ? "Quantidade mantida" : "Sem novos registros"
    variacao.dataset.tendencia = diferenca > 0 ? "alta" : diferenca < 0 ? "baixa" : "igual"
    referencia.textContent = atual || antes ? `${atual} na última hora · ${antes} na anterior` : "Nas últimas 2 horas"
    referencia.title = `${atual} na última hora · ${antes} na hora anterior`
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
    grafico.setAttribute("aria-label", total ? `Distribuição de ${total} relatórios: ` + distribuicao.map(function (item) { return (nomesCategorias[item.categoria] || item.categoria) + ": " + item.total }).join(", ") : "Nenhum relatório neste recorte")
    document.getElementById("totalCentroGrafico").textContent = total
    if (!distribuicao.length) legendaEl.innerHTML = '<li class="rgLegendaVazia">Sem relatórios publicados.</li>'
}

function obterPaginaRelatorios(lista, pagina) {
    var quantidadePorPagina = 4
    var totalPaginas = Math.max(1, Math.ceil(lista.length / quantidadePorPagina))
    var atual = Math.min(Math.max(1, pagina), totalPaginas)
    var inicio = (atual - 1) * quantidadePorPagina
    return {
        pagina: atual,
        totalPaginas: totalPaginas,
        inicio: lista.length ? inicio + 1 : 0,
        fim: Math.min(inicio + quantidadePorPagina, lista.length),
        itens: lista.slice(inicio, inicio + quantidadePorPagina)
    }
}

function atualizarTabela(visiveis) {
    var lista = document.getElementById("listaRelatorios")
    lista.innerHTML = ""
    var pagina = obterPaginaRelatorios(visiveis, paginaRelatorios)
    paginaRelatorios = pagina.pagina

    for (var i = 0; i < pagina.itens.length; i++) {
        var relatorio = pagina.itens[i]
        var nomeConclusao = nomesConclusao[relatorio.criticidade] || "—"
        var classeConclusao = nomesConclusao[relatorio.criticidade] ? relatorio.criticidade.toLowerCase() : ""
        var statusAnalise = { PENDENTE: "Texto pendente de análise", PROCESSANDO: "Analisando texto…", CONCLUIDO: "Texto analisado", ERRO: "Falha na análise do texto" }
        var acaoAnalise = podeAnalisar(relatorio) ? `<button type="button" class="rgAcaoAnalise" onclick="processarAnalises([${Number(relatorio.idRelatorio)}])" ${analiseEmAndamento ? "disabled" : ""}>${relatorio.statusAnalise === "ERRO" || relatorio.statusAnalise === "PROCESSANDO" ? "Tentar análise novamente" : "Analisar texto"}</button>` : ""

        var linha = document.createElement("tr")
        linha.className = "rgLinha"
        linha.innerHTML = `
                <td data-label="Relatório">
                    <span class="rgNomeRel"></span>
                    <span class="rgAutor rgAutorNome"></span>
                    <span class="rgAutor rgStatusAnalise"></span>
                    <span class="rgAutor rgErroAnalise" hidden></span>${acaoAnalise}
                </td>
                <td data-label="Aeronave">
                    <span class="rgAeronave"></span>
                    <span class="rgModelo"></span>
                </td>
                <td data-label="Período" class="rgTexto rgPeriodo"></td>
                <td data-label="Criticidade"><span class="rgTag ${classeConclusao}">${nomeConclusao}</span></td>
                <td data-label="Criado em" class="rgTexto rgCriado"></td>
                <td class="rgAcoesRelatorio"><a href="verRelatorioGestor.html?id=${encodeURIComponent(relatorio.idRelatorio)}" class="rgBtnVer">Ver relatório <i class="bi bi-arrow-up-right" aria-hidden="true"></i></a></td>
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
        linha.querySelector(".rgBtnVer").setAttribute("aria-label", "Ver relatório: " + (relatorio.titulo || "Sem título"))
        lista.appendChild(linha)
    }

    document.getElementById("tabelaRelatorios").hidden = visiveis.length == 0
    document.getElementById("estadoResultados").hidden = visiveis.length > 0
    document.getElementById("semRelatorios").textContent = relatorios.length ? "Nenhum relatório corresponde aos filtros." : "Sua equipe ainda não publicou relatórios."
    document.getElementById("acaoSemRelatorios").hidden = visiveis.length > 0
    document.getElementById("acaoSemRelatorios").textContent = relatorios.length ? "Limpar filtros" : "Atualizar"
    document.getElementById("acaoSemRelatorios").onclick = relatorios.length ? limparFiltrosRelatorios : carregarRelatorios
    document.getElementById("totalResultados").textContent = visiveis.length + (visiveis.length == 1 ? " resultado" : " resultados")
    document.getElementById("contagem").textContent = visiveis.length
        ? `Mostrando ${pagina.inicio}–${pagina.fim} de ${visiveis.length} relatórios`
        : "Nenhum relatório para exibir"
    document.getElementById("paginacaoRelatorios").hidden = pagina.totalPaginas <= 1
    document.getElementById("paginaAtualRelatorios").textContent = `Página ${pagina.pagina} de ${pagina.totalPaginas}`
    document.getElementById("paginaAnteriorRelatorios").disabled = relatoriosCarregando || pagina.pagina == 1
    document.getElementById("proximaPaginaRelatorios").disabled = relatoriosCarregando || pagina.pagina == pagina.totalPaginas
}

function mudarPaginaRelatorios(deslocamento) {
    if (relatoriosCarregando || relatoriosComErro) return
    paginaRelatorios += deslocamento
    atualizarTabela(filtrar())
    document.getElementById("tituloRelatoriosPublicados").scrollIntoView({ block: "start", behavior: "instant" })
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
        ? "Nenhum relatório publicado."
        : !integrado ? "Análise dos textos indisponível."
            : `${concluidos.length} de ${visiveis.length} analisados` + (pendentes ? ` · ${pendentes} pendentes` : "")
            + (processando ? ` · ${processando} em processamento` : "") + (erros ? ` · ${erros} com erro` : "")

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
                <td data-label="Aeronave e relatório"><strong class="rgPontoAeronave"></strong><small class="rgPontoTitulo"></small><a href="${link}">Ver relatório</a></td>
                <td data-label="Componente e sintoma"><strong class="rgPontoComponente"></strong><small class="rgPontoSintoma"></small></td>
                <td data-label="Criticidade"><span class="rgTag ${nomesConclusao[relatorio.criticidade] ? relatorio.criticidade.toLowerCase() : ""}"></span></td>
                <td data-label="Situação no texto" class="rgPontoSituacao"></td>
                <td data-label="Recomendação"><span class="rgPontoRecomendacao"></span>
                <details><summary>Consultar evidência</summary><blockquote></blockquote><a href="${link}">Ler análise completa</a></details></td>`
            linha.querySelector(".rgPontoAeronave").textContent = relatorio.aeronave || ""
            linha.querySelector(".rgPontoTitulo").textContent = relatorio.titulo || ""
            linha.querySelector("a").setAttribute("aria-label", "Ver relatório: " + (relatorio.titulo || "Sem título"))
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
    document.getElementById("tabelaPontosAtencao").hidden = pontos.children.length == 0
    document.getElementById("semPontos").textContent = !visiveis.length ? "Nenhum relatório corresponde aos filtros."
        : !concluidos.length ? "Analise os relatórios para ver os pontos de atenção."
            : "Nenhum ponto de atenção neste recorte."

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
        var aeronaves = new Map()
        fontes.forEach(function (relatorio) { aeronaves.set(relatorio.fkAeronave || relatorio.aeronave, relatorio.aeronave || "Aeronave não informada") })
        var linha = document.createElement("li")
        linha.className = "rgSintomaCard"
        linha.innerHTML = `<div class="rgSintomaCabecalho">
            <span class="rgSintomaIcone"><i class="bi bi-arrow-repeat" aria-hidden="true"></i></span>
            <h3 class="rgSintomaNome"></h3><span class="rgSintomaContagem">${fontes.length} relatórios</span>
            </div><div class="rgSintomaAeronaves" aria-label="Aeronaves citadas"></div>
            <details class="rgSintomaFontes"><summary>Consultar relatórios</summary><ul></ul></details>`
        linha.querySelector(".rgSintomaNome").textContent = item.nome
        aeronaves.forEach(function (nome) {
            var etiqueta = document.createElement("span")
            etiqueta.textContent = nome
            linha.querySelector(".rgSintomaAeronaves").appendChild(etiqueta)
        })
        fontes.forEach(function (relatorio) {
            var fonte = document.createElement("li")
            var link = document.createElement("a")
            link.href = "verRelatorioGestor.html?id=" + encodeURIComponent(relatorio.idRelatorio)
            link.innerHTML = '<span class="rgFonteTitulo"></span><span class="rgFonteAeronave"></span><i class="bi bi-arrow-up-right" aria-hidden="true"></i>'
            link.querySelector(".rgFonteTitulo").textContent = relatorio.titulo || "Ver relatório"
            link.querySelector(".rgFonteAeronave").textContent = relatorio.aeronave || ""
            fonte.appendChild(link)
            linha.querySelector(".rgSintomaFontes ul").appendChild(fonte)
        })
        listaSintomas.appendChild(linha)
    })
    document.getElementById("semSintomas").hidden = recorrentes.length > 0
    document.getElementById("semSintomas").textContent = concluidos.length ? "Nenhum sintoma citado em dois ou mais relatórios neste recorte." : "Sem análises dos textos neste recorte."
}

function atualizarDashboard() {
    if (relatoriosComErro) return
    var visiveis = filtrar()
    atualizarResumo(visiveis)
    atualizarCategorias(visiveis)
    atualizarTabela(visiveis)
    atualizarAnalises(visiveis)
    document.getElementById("analisarPendentes").disabled = relatoriosCarregando || analiseEmAndamento || !visiveis.some(podeAnalisar)
    document.getElementById("analisarPendentes").hidden = !analiseEmAndamento && !visiveis.some(podeAnalisar)
    var periodo = document.getElementById("filtroPeriodo")
    var horario = ultimaAtualizacao ? ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : ""
    document.getElementById("contextoFiltros").textContent = `${visiveis.length} relatórios · ${periodo.selectedOptions[0].textContent}` + (horario ? ` · Atualizado às ${horario}` : "")
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
    if (analiseEmAndamento || atualizacaoEmAndamento) return Promise.resolve()
    atualizacaoEmAndamento = true
    var botao = document.getElementById("atualizarAnalises")
    botao.disabled = true
    botao.textContent = "Atualizando…"
    return Promise.all([carregarRelatorios(), carregarCoberturaAlertas()]).finally(function () {
        atualizacaoEmAndamento = false
        botao.disabled = false
        botao.innerHTML = '<i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Atualizar'
    })
}

document.getElementById("busca").addEventListener("input", function () {
    paginaRelatorios = 1
    atualizarDashboard()
})
var filtrosDashboard = ["filtroPeriodo", "filtroAeronave", "filtroCriticidade", "filtroComponente"]
filtrosDashboard.forEach(function (id) {
    document.getElementById(id).addEventListener("change", function () {
        paginaRelatorios = 1
        atualizarDashboard()
    })
})
    ;["filtroPeriodo", "filtroAeronave"].forEach(function (id) {
        document.getElementById(id).addEventListener("change", carregarCoberturaAlertas)
    })
function limparFiltrosRelatorios() {
    paginaRelatorios = 1
    document.getElementById("filtroPeriodo").value = "7"
    document.getElementById("filtroCriticidade").value = "TODOS"
    document.getElementById("filtroAeronave").value = ""
    document.getElementById("filtroComponente").value = ""
    document.getElementById("busca").value = ""
    atualizarDashboard()
    carregarCoberturaAlertas()
}

if (verificarSessao() && podeAcessarPagina("relatorioGestor.html")) {
    carregarRelatorios()
    carregarCoberturaAlertas()
}
