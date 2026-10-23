function escapar(valor) {
    return String(valor == null ? "" : valor).replace(/[&<>"']/g, function (caractere) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[caractere]
    })
}

function iniciais(nome) {
    return String(nome || "").trim().split(/\s+/).slice(0, 2)
        .map(function (parte) { return parte.charAt(0) }).join("").toUpperCase() || "--"
}

function normalizar(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function textoAeronaves(total) {
    return `${total} ${total === 1 ? "aeronave associada" : "aeronaves associadas"}`
}

async function buscarJson(url, opcoes = {}) {
    let resposta
    try {
        resposta = await fetch(url, {
            ...opcoes,
            headers: { Accept: "application/json", ...opcoes.headers }
        })
    } catch (erro) {
        throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.")
    }
    const dados = await resposta.json().catch(function () { return null })
    if (!resposta.ok || dados === null) {
        throw new Error(dados && dados.mensagem || "Não foi possível concluir a operação. Tente novamente.")
    }
    return dados
}

