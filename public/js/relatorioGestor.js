var relatorios = []
var filtroConclusao = "TODOS"

var nomesConclusao = {
    NORMAL: "Normal",
    ATENCAO: "Atenção",
    CRITICO: "Crítico"
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
    var normal = 0
    var atencao = 0
    var critico = 0

    for (var i = 0; i < relatorios.length; i++) {
        if (relatorios[i].criticidade == "NORMAL") {
            normal++
        } else if (relatorios[i].criticidade == "ATENCAO") {
            atencao++
        } else if (relatorios[i].criticidade == "CRITICO") {
            critico++
        }
    }

    document.getElementById("totalRelatorios").textContent = relatorios.length
    document.getElementById("totalNormal").textContent = normal
    document.getElementById("totalAtencao").textContent = atencao
    document.getElementById("totalCritico").textContent = critico
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