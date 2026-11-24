const params = new URLSearchParams(window.location.search)
const idComputador = params.get("idComputador")
const idUsuario = sessionStorage.getItem("idUsuario")

const periodosAlertas = { "7": { dias: 7, descricao: "Últimos 7 dias" }, "30": { dias: 30, descricao: "Últimos 30 dias" } }
const metricas = {
    cpu_pct: { nome: "CPU", icone: "bi-cpu" },
    ram_pct: { nome: "RAM", icone: "bi-memory" },
    flash_pct: { nome: "Armazenamento", icone: "bi-hdd" }
}

function formatarDataAlerta(iso, ano = false) {
    const data = new Date(iso)
    const dia = String(data.getUTCDate()).padStart(2, "0")
    const mes = String(data.getUTCMonth() + 1).padStart(2, "0")
    return ano ? `${dia}/${mes}/${data.getUTCFullYear()}` : `${dia}/${mes}`
}

function dataIsoParaCampo(data) {
    return data.toLocaleDateString("sv-SE")
}

function periodoAtual() {
    const periodo = periodosAlertas[document.getElementById("filtroPeriodo").value] || periodosAlertas["7"]
    const fim = new Date()
    const inicio = new Date()
    inicio.setDate(fim.getDate() - periodo.dias + 1)
    return { inicio: dataIsoParaCampo(inicio), fim: dataIsoParaCampo(fim), descricao: periodo.descricao }
}

function listarDias(inicioIso, fimIso) {
    const dias = []
    for (let data = new Date(inicioIso + "T12:00:00Z"); data <= new Date(fimIso + "T12:00:00Z"); data.setUTCDate(data.getUTCDate() + 1)) {
        dias.push(dataIsoParaCampo(data))
    }
    return dias
}

function mostrarErro(mensagem) {
    document.getElementById("mapaAlertas").innerHTML = ""
    document.getElementById("historicoAlertas").innerHTML = `<tr><td colspan="6">${mensagem}</td></tr>`
    document.getElementById("semAlertas").hidden = true
}

function montarMapaAlertas(componentesVisiveis, alertas, dias) {
    const passo = dias.length > 15 ? 5 : dias.length > 7 ? 2 : 1
    const niveis = { ATENCAO: 2, CRITICO: 4 }

    const cabecalho = `
        <div class="mapaLinha">
            <span class="mapaSubtitulo">Data</span>
            <div class="mapaDatas" style="--totalCelulas:${dias.length}">
                ${dias.map((dia, indice) => indice % passo === 0
                    ? `<span style="grid-column:${indice + 1} / span ${Math.min(passo, dias.length - indice)}">${formatarDataAlerta(dia)}</span>` : "").join("")}
            </div>
        </div>`

    const linhas = componentesVisiveis.map(chave => {
        const info = metricas[chave]
        const piorPorDia = Object.fromEntries(dias.map(dia => [dia, 0]))
        alertas.filter(alerta => alerta.metrica === chave).forEach(alerta => {
            const dia = dataIsoParaCampo(new Date(alerta.ts_abertura))
            if (dia in piorPorDia) piorPorDia[dia] = Math.max(piorPorDia[dia], niveis[alerta.nivel] || 0)
        })
        return `
            <div class="mapaLinha">
                <div class="mapaRotulo"><i class="bi ${info.icone}" aria-hidden="true"></i><span>${info.nome}</span></div>
                <div class="mapaCelulas" style="--totalCelulas:${dias.length}">
                    ${dias.map(dia => {
                        const nivel = piorPorDia[dia]
                        const descricao = `${info.nome} · ${formatarDataAlerta(dia, true)} · ${nivel === 4 ? "Crítico" : nivel === 2 ? "Atenção" : "Sem alerta"}`
                        return `<div class="celula nivel${nivel}" role="img" tabindex="0" title="${descricao}" aria-label="${descricao}"></div>`
                    }).join("")}
                </div>
            </div>`
    }).join("")

    document.getElementById("mapaAlertas").innerHTML = cabecalho + linhas
}

function atualizarAlertas() {
    if (!idComputador) {
        mostrarErro("Nenhum computador informado. Abra esta tela a partir de um FMC (?idComputador=ID).")
        return
    }

    const periodo = periodoAtual()
    const chaveSelecionada = document.getElementById("filtroComponente").value
    const componentesVisiveis = Object.keys(metricas).filter(chave => chaveSelecionada === "todos" || chave === chaveSelecionada)

    fetch(`/alertasDash/historico/${idComputador}/${idUsuario}?inicio=${periodo.inicio}&fim=${periodo.fim}`)
        .then(resposta => resposta.json().then(dados => ({ ok: resposta.ok, dados })))
        .then(({ ok, dados }) => {
            if (!ok) throw new Error(dados.mensagem || "Erro ao carregar alertas.")

            const alertas = dados
                .filter(alerta => chaveSelecionada === "todos" || alerta.metrica === chaveSelecionada)
                .sort((a, b) => b.ts_abertura.localeCompare(a.ts_abertura))

            const criticos = alertas.filter(a => a.nivel === "CRITICO").length
            const atencao = alertas.length - criticos
            const percentual = total => `${alertas.length ? Math.round(total / alertas.length * 100) : 0}% do total`

            document.getElementById("totalAlertas").textContent = alertas.length
            document.getElementById("totalCriticos").textContent = criticos
            document.getElementById("totalAtencao").textContent = atencao
            document.getElementById("percentualCriticos").textContent = percentual(criticos)
            document.getElementById("percentualAtencao").textContent = percentual(atencao)
            document.getElementById("periodoResumo").textContent = periodo.descricao
            document.getElementById("periodoMapa").textContent = `${periodo.descricao} · uma célula por dia`
            document.getElementById("descricaoMapaAlertas").textContent =
                "Cada célula mostra o maior nível atingido pelo componente no dia, entre todas as placas deste FMC."

            const dias = listarDias(periodo.inicio, periodo.fim)
            montarMapaAlertas(componentesVisiveis, alertas, dias)

            document.getElementById("historicoAlertas").innerHTML = alertas.map(alerta => `
                <tr>
                    <td><time datetime="${alerta.ts_abertura}">${formatarDataAlerta(alerta.ts_abertura, true)} · ${new Date(alerta.ts_abertura).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</time></td>
                    <td>${metricas[alerta.metrica]?.nome || alerta.metrica} · Placa ${alerta.placa_serie}</td>
                    <td><span class="severidadeAlerta ${alerta.nivel === "CRITICO" ? "textoCritico" : "textoModerado"}">${alerta.nivel === "CRITICO" ? "Crítico" : "Atenção"}</span></td>
                    <td>${alerta.valor != null ? alerta.valor.toFixed(1) : "—"}%</td>
                    <td>${alerta.limiar_violado != null ? alerta.limiar_violado : "—"}%</td>
                    <td>${alerta.em_aberto_apos_evento ? "Ativo" : "Encerrado"}</td>
                </tr>`).join("")
            document.getElementById("semAlertas").hidden = alertas.length > 0
        })
        .catch(erro => mostrarErro(erro.message))
}

function inicializarAlertas() {
    if (!verificarSessao() || !podeAcessarPagina("alertas.html")) return
    document.getElementById("referenciaHistorico").textContent = "Histórico de alertas do FMC"
    document.getElementById("filtroPeriodo").innerHTML = `
        <option value="7">Últimos 7 dias</option>
        <option value="30">Últimos 30 dias</option>`
    document.getElementById("filtroPeriodo").addEventListener("change", atualizarAlertas)
    document.getElementById("filtroComponente").addEventListener("change", atualizarAlertas)
    atualizarAlertas()
}

inicializarAlertas()