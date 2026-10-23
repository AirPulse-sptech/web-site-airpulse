var relatorios = []
var filtroConclusao = "TODOS"

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

function escapar(texto) {
    return String(texto == undefined ? "" : texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function carregarRelatorios() {
    var idFuncionario = sessionStorage.getItem("idUsuario")

    fetch(`/relatorio/gestor/${idFuncionario}`)
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("Erro ao buscar os relatórios.")
            }
            return resposta.json()
        })
        .then(function (dados) {
            relatorios = dados
            preencherAeronaves()
            atualizarResumo()
            atualizarCategorias()
            atualizarTabela()
        })
        .catch(function (erro) {
            console.log(erro)
            document.getElementById("listaRelatorios").innerHTML = ""
            document.getElementById("contagem").textContent = ""
            document.getElementById("semRelatorios").textContent = "Não foi possível carregar os relatórios."
            document.getElementById("semRelatorios").hidden = false
        })
}

function preencherAeronaves() {
    var select = document.getElementById("filtroAeronave")
    var nomes = []

    for (var i = 0; i < relatorios.length; i++) {
        if (!nomes.includes(relatorios[i].aeronave)) {
            nomes.push(relatorios[i].aeronave)
        }
    }

    nomes.sort()

    for (var j = 0; j < nomes.length; j++) {
        select.innerHTML += `<option value="${escapar(nomes[j])}">${escapar(nomes[j])}</option>`
    }
}

function atualizarResumo() {
    var atencao = 0
    var critico = 0

    for (var i = 0; i < relatorios.length; i++) {
        if (relatorios[i].criticidade == "ATENCAO") {
            atencao++
        } else if (relatorios[i].criticidade == "CRITICO") {
            critico++
        }
    }

    document.getElementById("totalAtencao").textContent = atencao
    document.getElementById("totalCritico").textContent = critico
}

function atualizarCategorias() {
    var totais = {}

    for (var i = 0; i < relatorios.length; i++) {
        var categoria = relatorios[i].categoria
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

    var total = relatorios.length
    var categoriaPrincipal = distribuicao[0]
    var categoriaPrincipalEl = document.getElementById("categoriaMaisFrequente")
    var detalheCategoriaEl = document.getElementById("detalheCategoriaMaisFrequente")
    var grafico = document.getElementById("graficoRoscaCategoria")
    var legenda = ""
    var faixas = []
    var inicio = 0

    if (categoriaPrincipal) {
        categoriaPrincipalEl.textContent = nomesCategorias[categoriaPrincipal.categoria] || categoriaPrincipal.categoria
        detalheCategoriaEl.textContent = categoriaPrincipal.total + " relatórios · "
            + Math.round(categoriaPrincipal.total / total * 100) + "%"
    } else {
        categoriaPrincipalEl.textContent = "Sem dados"
        detalheCategoriaEl.textContent = "Sem relatórios publicados"
    }

    for (var k = 0; k < distribuicao.length; k++) {
        var item = distribuicao[k]
        var cor = coresCategorias[item.categoria] || "#9ca3af"
        var fim = inicio + item.total / total * 360
        var nome = nomesCategorias[item.categoria] || item.categoria
        faixas.push(cor + " " + inicio + "deg " + fim + "deg")
        inicio = fim
        legenda += `<li><span class="rgPontoCategoria" style="--rgCategoriaCor: ${cor}"></span>
            <span>${escapar(nome)}</span><strong>${item.total}</strong>
            <span>${Math.round(item.total / total * 100)}%</span></li>`
    }

    grafico.style.background = faixas.length
        ? "conic-gradient(" + faixas.join(", ") + ")"
        : "conic-gradient(#eef0ff 0deg 360deg)"
    document.getElementById("totalCentroGrafico").textContent = total
    var legendaEl = document.getElementById("legendaCategorias")
    legendaEl.innerHTML = legenda || '<li class="rgLegendaVazia">Sem relatórios publicados.</li>'
}

function filtrar() {
    var texto = document.getElementById("busca").value.trim().toLowerCase()
    var aeronave = document.getElementById("filtroAeronave").value
    var resultado = []

    for (var i = 0; i < relatorios.length; i++) {
        var relatorio = relatorios[i]
        var textoRelatorio = (relatorio.titulo + " " + (relatorio.autor || "")).toLowerCase()

        var combinaTexto = textoRelatorio.includes(texto)
        var combinaAeronave = aeronave == "" || relatorio.aeronave == aeronave
        var combinaConclusao = filtroConclusao == "TODOS" || relatorio.criticidade == filtroConclusao

        if (combinaTexto && combinaAeronave && combinaConclusao) {
            resultado.push(relatorio)
        }
    }

    return resultado
}

function atualizarTabela() {
    var visiveis = filtrar()
    var html = ""

    for (var i = 0; i < visiveis.length; i++) {
        var relatorio = visiveis[i]
        var nomeConclusao = nomesConclusao[relatorio.criticidade] || "—"
        var classeConclusao = String(relatorio.criticidade || "").toLowerCase()

        html += `
            <div class="rgLinha">
                <div>
                    <span class="rgNomeRel">${escapar(relatorio.titulo)}</span>
                    <span class="rgAutor">Autor: ${escapar(relatorio.autor || "—")}</span>
                </div>
                <div>
                    <span class="rgAeronave">${escapar(relatorio.aeronave)}</span>
                    <span class="rgModelo">${escapar(relatorio.modelo)}</span>
                </div>
                <div class="rgTexto">${escapar(relatorio.periodoInicio)} a ${escapar(relatorio.periodoFim)}</div>
                <div><span class="rgTag ${classeConclusao}">${nomeConclusao}</span></div>
                <div class="rgTexto">${escapar(relatorio.dataCriacao)}</div>
                <div><a href="verRelatorioGestor.html?id=${relatorio.idRelatorio}" class="rgBtnVer">Ver relatório</a></div>
            </div>
        `
    }

    document.getElementById("listaRelatorios").innerHTML = html
    document.getElementById("semRelatorios").textContent = "Nenhum relatório encontrado."
    document.getElementById("semRelatorios").hidden = visiveis.length > 0
    document.getElementById("contagem").textContent = `Mostrando ${visiveis.length} de ${relatorios.length} relatórios`
}

document.getElementById("busca").addEventListener("input", atualizarTabela)
document.getElementById("filtroAeronave").addEventListener("change", atualizarTabela)

var botoesFiltro = document.querySelectorAll(".rgFiltro")

for (var i = 0; i < botoesFiltro.length; i++) {
    botoesFiltro[i].addEventListener("click", function () {
        for (var j = 0; j < botoesFiltro.length; j++) {
            botoesFiltro[j].classList.remove("ativo")
        }

        this.classList.add("ativo")
        filtroConclusao = this.dataset.filtro
        atualizarTabela()
    })
}

carregarRelatorios()
