var statusAtual = "ATIVO"

function carregarEmpresas() {
    fetch(`/empresas/empresasCadastradas?status=${statusAtual}`)
        .then(function (response) {
            if (response.ok) {
                response.json().then(function (resposta) {
                    plotarEmpresas(resposta)
                })
            } else {
                console.error("Nenhum dado encontrado ou erro na API")
            }
        })
        .catch(function (error) {
            console.error(`Erro na obtenção dos dados: ${error.message}`)
        })
}

function formatarCnpj(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
}

function plotarEmpresas(resposta) {
    var linhasEmpresas = document.getElementById("linhasEmpresas")
    linhasEmpresas.innerHTML = ""

    for (let i = 0; i < resposta.length; i++) {
        var ativa = resposta[i].statusSistema == "ATIVO"
        var botaoStatus = ""

        if (ativa) {
            botaoStatus = `<button type="button" class="botaoStatusEmpresa inativar" onclick="alterarStatus(${resposta[i].id}, 'INATIVO')">Inativar</button>`
        } else {
            botaoStatus = `<button type="button" class="botaoStatusEmpresa reativar" onclick="alterarStatus(${resposta[i].id}, 'ATIVO')">Reativar</button>`
        }

        linhasEmpresas.innerHTML += `
  <div class="empresaLinha ${ativa ? "" : "inativa"}">
    <div data-label="Razão social">${resposta[i].razaoSocial}</div>
    <div data-label="Nome fantasia">${resposta[i].nomeFantasia || "-"}</div>
    <div data-label="CNPJ">${formatarCnpj(resposta[i].cnpj)}</div>
    <div data-label="Segmento">${resposta[i].segmentoAtuacao}</div>
    <div data-label="Status"><span class="statusEmpresa ${ativa ? "ativo" : "inativo"}">${ativa ? "Ativa" : "Inativa"}</span></div>
    <div data-label="Ações" class="acoesEmpresa">
      <a class="botaoEditarEmpresa" href="editarEmpresa.html?id=${resposta[i].id}">Editar</a>
      ${botaoStatus}
    </div>
  </div>`
    }

    document.getElementById("semEmpresas").hidden = resposta.length > 0
}

function filtrar(status) {
    statusAtual = status

    document.querySelectorAll(".filtroEmpresa").forEach(function (botao) {
        botao.classList.remove("ativo")
    })

    document.getElementById(`filtro${status}`).classList.add("ativo")
    carregarEmpresas()
}

function alterarStatus(id, status) {
    var acao = status == "INATIVO" ? "inativar" : "reativar"

    if (!confirm(`Deseja ${acao} esta empresa?`)) {
        return
    }

    fetch(`/empresas/status/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ statusServer: status })
    })
        .then(function (resposta) {
            if (resposta.ok) {
                carregarEmpresas()
            } else {
                alert("Não foi possível alterar o status da empresa.")
            }
        })
        .catch(function (erro) {
            console.error(`Erro na requisição: ${erro.message}`)
            alert("Erro de conexão com o servidor.")
        })
}

carregarEmpresas()