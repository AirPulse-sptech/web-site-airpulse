const dadosPlaca = {
    identificacao: "P01",
    fmc: "FMC 1",
    aeronave: "PR-GOL",
    modeloAeronave: "Boeing 737",
    dataReferencia: "2026-10-29",
    ciclosVoo: [
        { inicio: 0, fim: 5, fase: "Desligado", cor: "#94a3b8" },
        { inicio: 6, fim: 6, fase: "Decolagem", cor: "#7B74EE" },
        { inicio: 7, fim: 10, fase: "Voo", cor: "#059669" },
        { inicio: 11, fim: 11, fase: "Pouso", cor: "#f97316" },
        { inicio: 12, fim: 17, fase: "Desligado", cor: "#94a3b8" },
        { inicio: 18, fim: 18, fase: "Decolagem", cor: "#7B74EE" },
        { inicio: 19, fim: 22, fase: "Voo", cor: "#059669" },
        { inicio: 23, fim: 23, fase: "Pouso", cor: "#f97316" }
    ],
    componentes: {
        cpu: {
            nome: "CPU", titulo: "Uso da CPU", detalhe: "Detalhes da CPU",
            limiteAtencao: 70, limiteCritico: 90,
            leituras: [0, 0, 0, 0, 0, 0, 78.2, 48.6, 49.1, 48.8, 49.3, 88.2,
                0, 0, 0, 0, 0, 0, 82, 49.5, 50.2, 49.8, 50.4, 95]
        },
        ram: {
            nome: "RAM", titulo: "Uso da RAM", detalhe: "Detalhes da RAM",
            limiteAtencao: 70, limiteCritico: 90,
            leituras: [0, 0, 0, 0, 0, 0, 68, 49.2, 49.8, 49.4, 49.7, 92.4,
                0, 0, 0, 0, 0, 0, 66, 49.3, 49.9, 49.5, 50.1, 68]
        },
        disco: {
            nome: "Armazenamento", titulo: "Uso de armazenamento", detalhe: "Detalhes do Armazenamento",
            limiteAtencao: 70, limiteCritico: 90,
            usoDiaAnterior: 52.7,
            leituras: [52.7, 53, 53.4, 53.7, 54.1, 54.4, 54.8, 55.1,
                55.5, 55.8, 56.2, 56.5, 56.9, 57.2, 57.6, 57.9,
                58.3, 58.6, 59, 59.3, 59.7, 60, 60.4, 60.7]
        }
    }
}

function obterFaseVoo(hora) {
    const horaInteira = Math.floor(hora)
    return dadosPlaca.ciclosVoo.find(ciclo => horaInteira >= ciclo.inicio && horaInteira <= ciclo.fim)
}

function obterLeiturasMinuto(componente) {
    if (componente.leiturasMinuto) return componente.leiturasMinuto
    const armazenamento = componente.usoDiaAnterior !== undefined
    componente.leiturasMinuto = componente.leituras.flatMap((valor, hora) => {
        const anterior = hora > 0 ? componente.leituras[hora - 1] : valor
        const fase = obterFaseVoo(hora).fase
        return Array.from({ length: 60 }, (_, minuto) => {
            const fracao = (minuto + 1) / 60
            if (!armazenamento && fase === "Desligado") return 0
            const leitura = armazenamento || fase === "Decolagem" || fase === "Pouso"
                ? anterior + (valor - anterior) * fracao
                : valor + Math.sin(fracao * Math.PI * 2) * 0.15
            return Number(leitura.toFixed(3))
        })
    })
    return componente.leiturasMinuto
}

function horarioUltimaLeitura() {
    return (obterLeiturasMinuto(dadosPlaca.componentes.cpu).length - 1) / 60
}

function formatarNumero(valor, casas = 1) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

function formatarHora(hora) {
    const minutos = Math.round(hora * 60)
    return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`
}

function obterStatus(valor, componente) {
    if (valor >= componente.limiteCritico) return { classe: "critico", nome: "Crítico" }
    if (valor >= componente.limiteAtencao) return { classe: "moderado", nome: "Atenção" }
    return { classe: "normal", nome: "Normal" }
}

function listarAlertasPlaca(placa = dadosPlaca) {
    const alertas = []
    for (const [chave, componente] of Object.entries(placa.componentes)) {
        const leituras = obterLeiturasMinuto(componente)
        leituras.forEach((valor, minuto) => {
            const status = obterStatus(valor, componente)
            const anterior = minuto > 0 ? obterStatus(leituras[minuto - 1], componente) : null
            if (status.classe === "normal" || anterior?.classe === status.classe) return
            const ativo = leituras.slice(minuto).every(leitura =>
                obterStatus(leitura, componente).classe === status.classe)
            alertas.push({ chave, componente, valor, hora: minuto / 60, minuto, status, ativo })
        })
    }
    return alertas.sort((a, b) => b.hora - a.hora)
}

function obterHistoricoPlaca() {
    return Array.from({ length: 30 }, (_, indice) => {
        const diasAtras = 29 - indice
        const data = new Date(`${dadosPlaca.dataReferencia}T12:00:00Z`)
        data.setUTCDate(data.getUTCDate() - diasAtras)
        const dataRegistro = data.toISOString().slice(0, 10)
        if (diasAtras === 0) return { data: dataRegistro, placa: dadosPlaca }

        const componentes = Object.fromEntries(Object.entries(dadosPlaca.componentes).map(([chave, componente]) => {
            const leituras = componente.leituras.map((valor, hora) => {
                if (chave === "disco") {
                    return Number((componente.usoDiaAnterior - (diasAtras - 1) * 0.4 - (23 - hora) / 23 * 0.4).toFixed(2))
                }
                if (chave === "cpu" && diasAtras % 6 === 0 && hora === 18) return 78.2
                if (chave === "ram" && diasAtras % 10 === 0 && hora === 11) return 91
                return Math.min(valor, chave === "cpu" ? 62 : 64)
            })
            return [chave, { ...componente, leituras, leiturasMinuto: undefined }]
        }))
        return { data: dataRegistro, placa: { ...dadosPlaca, componentes } }
    })
}

function obterFrotaDemonstrativa() {
    const aeronaves = [
        { identificacao: dadosPlaca.aeronave, modelo: dadosPlaca.modeloAeronave, operador: "GOL" },
        { identificacao: "PR-TAM", modelo: "Airbus A320", operador: "LATAM" },
        { identificacao: "PR-AZU", modelo: "Embraer E195-E2", operador: "Azul" },
        { identificacao: "PT-LAT", modelo: "Boeing 787-9", operador: "LATAM" }
    ]
    return aeronaves.map(aeronave => ({
        ...aeronave,
        fmcs: [1, 2].map(posicao => ({
            nome: `FMC ${posicao}`,
            identificacao: `FMC-00${posicao}`,
            posicao,
            placas: [1, 2, 3, 4].map(indice => {
                if (aeronave.identificacao === dadosPlaca.aeronave && posicao === 1 && indice === 1) return dadosPlaca
                const valores = { cpu: 18 + indice * 3 + posicao * 2, ram: 35 + indice * 2 + posicao * 3, disco: 38 + indice + posicao }
                return {
                    identificacao: `P0${indice}`,
                    fmc: `FMC ${posicao}`,
                    aeronave: aeronave.identificacao,
                    modeloAeronave: aeronave.modelo,
                    componentes: Object.fromEntries(Object.entries(dadosPlaca.componentes).map(([chave, componente]) => [chave, {
                        ...componente,
                        leiturasMinuto: undefined,
                        ...(chave === "disco" ? { usoDiaAnterior: valores.disco } : {}),
                        leituras: componente.leituras.map((_, hora) => {
                            if (chave === "disco") return valores.disco
                            const fase = obterFaseVoo(hora).fase
                            if (fase === "Desligado") return 0
                            const fator = fase === "Decolagem" ? 1.3 : fase === "Pouso" ? 1.35 : 1
                            return Number((valores[chave] * fator).toFixed(2))
                        })
                    }]))
                }
            })
        }))
    }))
}

function obterEstadoPlacas(placas, hora) {
    const ordem = { normal: 0, moderado: 1, critico: 2 }
    return placas.flatMap(placa => Object.values(placa.componentes)).reduce((pior, componente) => {
        const leituras = obterLeiturasMinuto(componente)
        const estado = obterStatus(leituras[Math.min(Math.round(hora * 60), leituras.length - 1)], componente)
        return ordem[estado.classe] > ordem[pior.classe] ? estado : pior
    }, { classe: "normal", nome: "Normal" })
}

function resumirAeronaveAtual(aeronave) {
    const placas = aeronave.fmcs.flatMap(fmc => fmc.placas)
    const ultimoMinuto = obterLeiturasMinuto(Object.values(placas[0].componentes)[0]).length - 1
    const ultimaHora = ultimoMinuto / 60
    const atual = obterEstadoPlacas(placas, ultimaHora).classe
    let inicioEstado = ultimoMinuto
    while (inicioEstado > 0 && obterEstadoPlacas(placas, (inicioEstado - 1) / 60).classe === atual) inicioEstado--
    return { status: atual === "moderado" ? "atencao" : atual, inicioEstado: inicioEstado / 60, ultimaHora }
}

