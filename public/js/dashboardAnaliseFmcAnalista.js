function obterFmcsDemonstrativos() {
    const aeronave = obterFrotaDemonstrativa().find(item => item.identificacao === dadosPlaca.aeronave)
    const ultimaHora = horarioUltimaLeitura()
    return aeronave.fmcs.map(fmc => ({
        nome: fmc.nome,
        identificacao: fmc.identificacao,
        posicao: fmc.posicao,
        ultimaHora,
        placas: fmc.placas.map(placa => ({
            nome: placa.identificacao,
            status: obterEstadoPlacas([placa], ultimaHora),
            alertas: listarAlertasPlaca(placa),
            resumo: placa === dadosPlaca ? "" : "Sem alertas nas últimas 24 horas"
        }))
    }))
}

function montarCartaoFmc(fmc) {
    const alertas = fmc.placas.flatMap(placa => placa.alertas)
    const emAlerta = fmc.placas.some(placa => placa.status.classe !== "normal")
    return `<article class="cartaoFmc" aria-labelledby="tituloFmc${fmc.posicao}">
        <header class="cabecalhoFmc">
            <div class="iconeFmc"><i class="bi bi-box iconeAnalise" aria-hidden="true"></i></div>
            <div><h2 id="tituloFmc${fmc.posicao}">${fmc.nome}</h2><p>Identificação ${fmc.identificacao} · Posição ${fmc.posicao}</p></div>
            <span class="seloFmc ${emAlerta ? "comAlertas" : "semAlertas"}"><span class="pontoStatus" aria-hidden="true"></span>${emAlerta ? "Em alerta agora" : "Normal agora"}</span>
        </header>
        <div class="metricasFmc">
            <div class="metricaFmc">
                <div class="iconeMetrica"><i class="bi bi-bell iconeAnalise" aria-hidden="true"></i></div>
                <dl><dt>Ocorrências nas últimas 24h</dt><dd>${alertas.length}</dd></dl>
            </div>
            <div class="metricaFmc">
                <div class="iconeMetrica"><i class="bi bi-database iconeAnalise" aria-hidden="true"></i></div>
                <dl><dt>Última coleta</dt><dd><span class="coletaAtualizada"><span class="pontoStatus" aria-hidden="true"></span>Atualizada</span><time datetime="${formatarHora(fmc.ultimaHora)}">${formatarHora(fmc.ultimaHora)}</time></dd></dl>
            </div>
        </div>
        <h3 class="tituloPlacas">Placas monitoradas neste FMC</h3>
        <ul class="listaPlacas">
            ${fmc.placas.map(placa => {
                const classe = placa.status.classe === "moderado" ? "atencao" : placa.status.classe
                return `<li>
                    <a class="placaMonitorada ${classe}" href="telaAnalista.html" aria-label="Ver detalhes da placa ${placa.nome} do ${fmc.nome}, estado atual ${placa.status.nome}">
                        <span class="pontoStatus" aria-hidden="true"></span>
                        <div class="dadosPlaca">
                            <div class="cabecalhoPlaca"><h4>${placa.nome}</h4><span class="seloPlaca">${placa.status.nome}</span></div>
                            ${placa.resumo ? `<p class="recursosPlaca"><span>${placa.resumo}</span></p>` : ""}
                            ${placa.alertas.length ? `<p class="recursosPlaca"><span>${placa.alertas.length} ocorrências nas últimas 24h · ${placa.alertas.filter(alerta => alerta.status.classe === "critico").length} críticas</span></p>` : ""}
                        </div>
                        <i class="bi bi-chevron-right iconeAnalise" aria-hidden="true"></i>
                    </a>
                </li>`
            }).join("")}
        </ul>
    </article>`
}

function inicializarDashboardAnaliseFmcAnalista() {
    if (!verificarSessao() || !podeAcessarPagina("dashboardAnaliseFmcAnalista.html")) return
    const fmcs = obterFmcsDemonstrativos()
    const placas = fmcs.flatMap(fmc => fmc.placas)
    const emAlerta = placas.filter(placa => placa.status.classe !== "normal").length
    const criticos = placas.flatMap(placa => placa.alertas).filter(alerta => alerta.status.classe === "critico").length

    document.getElementById("tituloAeronave").textContent = `Aeronave ${dadosPlaca.aeronave}`
    document.getElementById("totalPlacasAlerta").innerHTML = `${emAlerta} <span>de ${placas.length} placas</span>`
    document.getElementById("totalCriticosFmc").textContent = criticos
    document.getElementById("listaFmcs").innerHTML = fmcs.map(montarCartaoFmc).join("")
}

inicializarDashboardAnaliseFmcAnalista()
