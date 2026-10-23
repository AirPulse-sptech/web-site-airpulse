const formulario = document.querySelector("#fmcForm")

const etapas = document.querySelectorAll(".step")
const progresso = document.querySelectorAll("[data-progress]")
const voltar = document.querySelector("#backButton")
const avancar = document.querySelector("#nextButton")
const acoes = document.querySelector("#actions")
const revisao = document.querySelector("#reviewContent")

const selectAeronave = document.querySelector("#fkAeronave")
const monitorarMestre = document.querySelector("#monitorarMestre")
const monitorarSpare = document.querySelector("#monitorarSpare")

const replicar = document.querySelector("#replicarPlacas")
const placasMestre = document.querySelector("#placasMestre")
const placasSpare = document.querySelector("#placasSpare")
const placasReplicadas = document.querySelector("#placasReplicadas")
const modeloPlaca = document.querySelector("#modeloPlaca")
const personalizarSpare = document.querySelector("#personalizarSpare")
const maximoPlacas = 10
const nomesStatus = { ATIVO: "Ativo", INATIVO: "Inativo", MANUTENCAO: "Em manutenção" }
const nomesComponentes = { CPU: "CPU", RAM: "RAM", DISCO: "Armazenamento" }

let etapaAtual = 1
let aeronaves = []


function etapasAtivas() {
  const lista = [1]
  if (monitorarMestre.checked) lista.push(2)
  if (monitorarSpare.checked) lista.push(3)
  lista.push(4)
  return lista
}

function proximaEtapa() {
  const lista = etapasAtivas()
  return lista[lista.indexOf(etapaAtual) + 1]
}

function etapaAnterior() {
  const lista = etapasAtivas()
  return lista[lista.indexOf(etapaAtual) - 1]
}


function mostrarEtapa(numero) {
  etapaAtual = numero
  const ativas = etapasAtivas()

  etapas.forEach(etapa => {
    etapa.hidden = Number(etapa.dataset.step) !== numero
  })

  progresso.forEach(item => {
    const posicao = Number(item.dataset.progress)
    item.classList.toggle("active", posicao === numero)
    item.classList.toggle("done", posicao < numero && ativas.includes(posicao))
    item.classList.toggle("pulada", !ativas.includes(posicao))
  })

  voltar.hidden = numero === 1 || numero === 5
  acoes.hidden = numero === 5

  avancar.textContent = numero === 4 ? "Cadastrar computadores ✓" : "Próximo passo ➔"

  if (numero === 3) prepararSpare()
  if (numero === 4) montarRevisao()

  window.scrollTo({ top: 0, behavior: "smooth" })
}


function carregarAeronaves() {
  fetch(`/aeronave/listar/${sessionStorage.getItem("idUsuario")}`)
    .then(function (resposta) {
      if (!resposta.ok) throw new Error("Erro ao listar as aeronaves")
      return resposta.json()
    })
    .then(function (lista) {
      aeronaves = lista

      if (lista.length == 0) {
        selectAeronave.innerHTML = '<option value="">Nenhuma aeronave cadastrada na sua empresa</option>'
        return
      }

      selectAeronave.innerHTML = '<option value="">Selecione a aeronave</option>' + lista.map(function (aeronave) {
        const completa = aeronave.possuiMestre && aeronave.possuiSpare
        return `<option value="${aeronave.id}"${completa ? " disabled" : ""}>` +
          `${aeronave.nome} · ${aeronave.modelo}${completa ? " (FMCs já cadastrados)" : ""}</option>`
      }).join("")
    })
    .catch(function (erro) {
      console.error(erro)
      selectAeronave.innerHTML = '<option value="">Não foi possível carregar as aeronaves</option>'
    })
}

function atualizarAeronave() {
  const aeronave = aeronaves.find(item => String(item.id) === selectAeronave.value)

  const situacoes = [
    [monitorarMestre, "#situacaoMestre", aeronave && aeronave.possuiMestre, "Computador principal da aeronave"],
    [monitorarSpare, "#situacaoSpare", aeronave && aeronave.possuiSpare, "Computador reserva da aeronave"]
  ]

  situacoes.forEach(([checkbox, idTexto, jaCadastrado, textoPadrao]) => {
    checkbox.disabled = !!jaCadastrado
    if (jaCadastrado) checkbox.checked = false
    const texto = document.querySelector(idTexto)
    if (texto) texto.textContent = jaCadastrado ? "Já cadastrado nesta aeronave" : textoPadrao  })

  atualizarEscolhaFmc()
}

selectAeronave.addEventListener("change", atualizarAeronave)


function atualizarEscolhaFmc() {
  document.querySelector("#dadosMestre").hidden = !monitorarMestre.checked

  const ativas = etapasAtivas()
  progresso.forEach(item => item.classList.toggle("pulada", !ativas.includes(Number(item.dataset.progress))))
}

monitorarMestre.addEventListener("change", atualizarEscolhaFmc)
monitorarSpare.addEventListener("change", atualizarEscolhaFmc)


function validarEtapa() {
  const etapa = document.querySelector(`.step[data-step="${etapaAtual}"]`)

  monitorarMestre.setCustomValidity(
    !monitorarMestre.checked && !monitorarSpare.checked ? "Escolha pelo menos um FMC para monitorar." : ""
  )

  const placasDaEtapa = [...etapa.querySelectorAll(".placa")].filter(placa => !placa.closest("[hidden]"))

  placasDaEtapa.forEach(placa => {
    const componentes = [...placa.querySelectorAll(".componentePlaca")]
    const primeiroCheckbox = componentes[0].querySelector("[data-monitorar-componente]")

    primeiroCheckbox.setCustomValidity(
      componentes.some(monitorado) ? "" : "Marque pelo menos um componente para monitorar nesta placa."
    )

    componentes.filter(monitorado).forEach(componente => {
      const { atencao, critico } = limites(componente)
      componente.querySelector('[data-limite="critico"]').setCustomValidity(
        critico <= atencao ? "O limite crítico deve ser maior que o limite de alerta." : ""
      )

      const primeiraMetrica = componente.querySelector(".metrica input")
      primeiraMetrica.setCustomValidity(
        componente.querySelector(".metrica input:checked") ? "" : "Marque pelo menos uma métrica para este componente."
      )
    })
  })

  if (etapaAtual === 3) {
    const serieSpare = document.querySelector("#spareNumeroSerie")
    serieSpare.setCustomValidity(
      monitorarMestre.checked && mesmoTexto(serieSpare.value, valor("mestreNumeroSerie"))
        ? "Informe um número de série diferente do FMC Mestre."
        : ""
    )

    const series = [...document.querySelectorAll("[data-serie-placa]")]
      .filter(campo => !campo.disabled && !campo.closest("[hidden]"))

    series.forEach(campo => {
      const repetido = series.some(outro => outro !== campo && campo.value && mesmoTexto(outro.value, campo.value))
      campo.setCustomValidity(repetido ? "Este número de série já foi usado em outra placa." : "")
    })
  }

  const campos = [...etapa.querySelectorAll("input, select")]
  if (etapaAtual === 1) campos.unshift(monitorarMestre)

  for (const campo of campos) {
    if (campo.disabled || campo.closest("[hidden]")) continue

    if (!campo.checkValidity()) {
      campo.reportValidity()
      return false
    }
  }

  return true
}


function valor(id) {
  const campo = document.querySelector(`#${id}`)
  return campo ? campo.value.trim() : ""
}

function mesmoTexto(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function textoAeronave() {
  const select = document.querySelector("#fkAeronave")
  return select.value ? select.options[select.selectedIndex].text : "Não informada"
}

function statusSelecionado(computador) {
  const marcado = document.querySelector(`input[name="${computador}StatusComputador"]:checked`)
  return marcado ? marcado.value : ""
}

function formatarData(data) {
  if (!data) return "Não informada"
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}

function limites(componente) {
  return {
    atencao: Number(componente.querySelector('[data-limite="atencao"]').value) || 0,
    critico: Number(componente.querySelector('[data-limite="critico"]').value) || 0
  }
}

function monitorado(componente) {
  return componente.querySelector("[data-monitorar-componente]").checked
}

function metricasMarcadas(componente) {
  return [...componente.querySelectorAll(".metrica input:checked")].map(campo => ({
    nome: campo.value,
    unidadeMedida: campo.dataset.unidade,
    descricao: campo.dataset.descricao
  }))
}

function campoPlaca(placa, nome) {
  return placa.querySelector(`[data-campo="${nome}"]`).value.trim()
}

function placasDoSpare() {
  return replicar.checked ? placasMestre : placasSpare
}

function listaDe(computador) {
  return computador === "mestre" ? placasMestre : placasSpare
}

function criarPlaca(computador, numero) {
  const html = modeloPlaca.innerHTML
    .replaceAll("{{id}}", `${computador}${numero}`)
    .replaceAll("{{computador}}", computador)
    .replaceAll("{{numero}}", numero)
    .replaceAll("{{fmc}}", computador === "mestre" ? "Mestre" : "Spare")

  const caixa = document.createElement("div")
  caixa.innerHTML = html.trim()
  const placa = caixa.firstElementChild

  placa.querySelectorAll(".componentePlaca").forEach(componente => {
    alternarComponente(componente)
    atualizarBarra(componente)
  })
  return placa
}

function ajustarQuantidade(computador) {
  const campo = document.querySelector(`#${computador}QuantidadePlacas`)
  const lista = listaDe(computador)
  const quantidade = Math.min(Math.max(Math.round(Number(campo.value)) || 1, 1), maximoPlacas)

  let atuais = lista.querySelectorAll(".placa").length
  while (atuais < quantidade) {
    atuais++
    lista.appendChild(criarPlaca(computador, atuais))
  }
  while (atuais > quantidade) {
    lista.lastElementChild.remove()
    atuais--
  }
}

document.querySelectorAll("[data-quantidade-placas]").forEach(campo => {
  campo.addEventListener("change", () => {
    const quantidade = Math.min(Math.max(Math.round(Number(campo.value)) || 1, 1), maximoPlacas)
    const atuais = listaDe(campo.dataset.quantidadePlacas).querySelectorAll(".placa").length

    if (quantidade < atuais && !confirm(`As últimas ${atuais - quantidade} placa(s) e o que foi preenchido nelas serão removidos. Continuar?`)) {
      campo.value = atuais
      return
    }

    campo.value = quantidade
    ajustarQuantidade(campo.dataset.quantidadePlacas)
  })
})


function atualizarBarra(componente) {
  const { atencao, critico } = limites(componente)
  const barra = componente.querySelector(".barraLimites")

  barra.style.setProperty("--alerta", Math.min(atencao, 100))
  barra.style.setProperty("--critico", Math.min(Math.max(critico, atencao), 100))

  componente.querySelector(".legendaLimites").innerHTML = `
    <span>Normal &lt; ${atencao}%</span>
    <span>Alerta ${atencao}–${Math.max(critico - 1, atencao)}%</span>
    <span>Crítico ≥ ${critico}%</span>`
}

function alternarComponente(componente) {
  const ligado = monitorado(componente)
  const detalhes = componente.querySelector(".detalhesComponente")

  detalhes.hidden = !ligado
  detalhes.querySelectorAll("input").forEach(campo => {
    campo.disabled = !ligado
  })
}

formulario.addEventListener("input", evento => {
  if (evento.target.matches("[data-limite]")) atualizarBarra(evento.target.closest(".componentePlaca"))
})

formulario.addEventListener("change", evento => {
  if (evento.target.matches("[data-monitorar-componente]")) {
    alternarComponente(evento.target.closest(".componentePlaca"))
    evento.target.setCustomValidity("")
  }
})

function resumoComponentes(placa) {
  const marcados = [...placa.querySelectorAll(".componentePlaca")].filter(monitorado)
  return marcados.length
    ? marcados.map(componente => nomesComponentes[componente.dataset.tipo] || componente.dataset.tipo).join(" · ")
    : "Nenhum componente marcado"
}


function prepararSpare() {
  document.querySelector("#spareAeronave").value = textoAeronave()

  document.querySelector("#cardResumoMestre").hidden = !monitorarMestre.checked
  document.querySelector("#cardPlacasReplicadas").hidden = !monitorarMestre.checked

  if (!monitorarMestre.checked) {
    if (replicar.checked) {
      replicar.checked = false
    }
    alternarReplicacao()
    return
  }

  const placas = [...placasMestre.querySelectorAll(".placa")]

  document.querySelector("#resumoMestre").innerHTML = `
    <div><dt>Nome</dt><dd>${valor("mestreNome")}</dd></div>
    <div><dt>Aeronave</dt><dd>${textoAeronave()}</dd></div>
    <div><dt>Placas</dt><dd>${placasMonitoradas.map(placa => placa.dataset.tipo).join(", ")}</dd></div>
    <div><dt>Status</dt><dd>${nomesStatus[statusSelecionado("mestre")]}</dd></div>`

  const seriesDigitadas = {}
  placasReplicadas.querySelectorAll("[data-serie-replicada]").forEach(campo => {
    seriesDigitadas[campo.dataset.serieReplicada] = campo.value
  })

  placasReplicadas.innerHTML = placas.map(placa => {
    const numero = placa.dataset.numero
    const nome = campoPlaca(placa, "nome") || `Placa ${numero}`

    return `
      <div class="placaSpare" data-numero="${numero}">
        <h3>
          <i class="bi bi-motherboard" aria-hidden="true"></i>
          Placa ${numero}
          <small>Igual a “${escaparTexto(nome)}” do Mestre</small>
        </h3>
        <p class="resumoPlaca"><span>${resumoComponentes(placa)}</span></p>
        <div class="field">
          <label for="spareSerieReplicada${numero}">Número de série da placa *</label>
          <input id="spareSerieReplicada${numero}" type="text" placeholder="Nº de série da placa do Spare"
            maxlength="45" data-serie-placa data-serie-replicada="${numero}" required>
        </div>
      </div>`
  }).join("")

  placasReplicadas.querySelectorAll("[data-serie-replicada]").forEach(campo => {
    campo.value = seriesDigitadas[campo.dataset.serieReplicada] || ""
  })
}

function escaparTexto(texto) {
  const div = document.createElement("div")
  div.textContent = texto
  return div.innerHTML
}

function alternarReplicacao() {
  placasReplicadas.hidden = !replicar.checked
  personalizarSpare.hidden = replicar.checked

  if (replicar.checked) return

  if (!monitorarMestre.checked) {
    if (!placasSpare.querySelector(".placa")) ajustarQuantidade("spare")
    return
  }

  const quantidade = placasMestre.querySelectorAll(".placa").length
  document.querySelector("#spareQuantidadePlacas").value = quantidade
  placasSpare.innerHTML = ""
  ajustarQuantidade("spare")

  const camposMestre = placasMestre.querySelectorAll("input")
  placasSpare.querySelectorAll("input").forEach((campo, i) => {
    campo.value = camposMestre[i].value
    campo.checked = camposMestre[i].checked
  })

  placasSpare.querySelectorAll(".placa").forEach(placa => {
    const serie = placasReplicadas.querySelector(`[data-serie-replicada="${placa.dataset.numero}"]`)
    placa.querySelector('[data-campo="numeroSerie"]').value = serie ? serie.value : ""

    placa.querySelectorAll(".componentePlaca").forEach(componente => {
      alternarComponente(componente)
      atualizarBarra(componente)
    })
  })
}

replicar.addEventListener("change", alternarReplicacao)


function montarPlacas(computador) {
  const lista = computador === "mestre" ? placasMestre : placasDoSpare()
  const usarLinhaReplicada = computador === "spare" && replicar.checked

  return [...lista.querySelectorAll(".placa")].map(placa => {
    const linhaReplicada = placasReplicadas.querySelector(`[data-serie-replicada="${placa.dataset.numero}"]`)

    return {
      nome: campoPlaca(placa, "nome"),
      modelo: campoPlaca(placa, "modelo"),
      numeroSerie: usarLinhaReplicada && linhaReplicada ? linhaReplicada.value.trim() : campoPlaca(placa, "numeroSerie"),
      componentes: [...placa.querySelectorAll(".componentePlaca")].filter(monitorado).map(componente => ({
        tipo: componente.dataset.tipo,
        modelo: componente.querySelector('[data-campo="modeloComponente"]').value.trim(),
        statusMonitoramento: "ATIVO",
        limiteAtencao: limites(componente).atencao,
        limiteCritico: limites(componente).critico,
        metricas: metricasMarcadas(componente)
      }))
    }
  })
}

function montarComputador(computador) {
  return {
    nome: valor(`${computador}Nome`),
    tipoFmc: computador === "mestre" ? "MESTRE" : "SPARE",
    numeroSerie: valor(`${computador}NumeroSerie`),
    modelo: valor(`${computador}Modelo`),
    statusComputador: statusSelecionado(computador),
    dataInstalacao: valor(`${computador}DataInstalacao`),
    entradaSistema: valor(`${computador}EntradaSistema`),
    fkAeronave: Number(valor("fkAeronave")),
    placas: montarPlacas(computador)
  }
}

function montarComputadores() {
  const lista = []
  if (monitorarMestre.checked) lista.push(montarComputador("mestre"))
  if (monitorarSpare.checked) lista.push(montarComputador("spare"))
  return lista
}


function tabelaPlacas(placas) {
  const linhas = placas.map(placa => {
    const componentes = placa.componentes.map(componente => `
      <small>
        <strong>${nomesComponentes[componente.tipo] || componente.tipo}</strong> ${escaparTexto(componente.modelo)} ·
        <span class="valorAlerta">${componente.limiteAtencao}%</span> /
        <span class="valorCritico">${componente.limiteCritico}%</span> ·
        ${componente.metricas.length} métricas
      </small>`).join("")

    return `
      <tr>
        <td><strong>${placa.nome}</strong><small>${placa.numeroSerie}</small></td>
        <td><strong>${componente.tipo}</strong><small>${componente.modelo}</small></td>
        <td>${componente.metricas.length}</td>
        <td class="valorAlerta">${componente.limiteAtencao}%</td>
        <td class="valorCritico">${componente.limiteCritico}%</td>
      </tr>`
  })

  return `
    <table>
      <thead>
        <tr><th>Placa</th><th>Componentes (alerta / crítico)</th></tr>
      </thead>
      <tbody>${linhas.join("")}</tbody>
    </table>`
}

function secaoRevisao(dados) {
  const mestre = dados.tipoFmc === "MESTRE"

  return `
    <div class="reviewSection">
      <div class="reviewHeading">
        <h3>${mestre ? "FMC Mestre" : "FMC Spare"}</h3>
        <button class="editButton" type="button" data-ir-para="${mestre ? 1 : 3}">Editar</button>
      </div>
      <dl class="reviewList">
        <dt>Nome do computador</dt><dd>${dados.nome}</dd>
        <dt>Aeronave associada</dt><dd>${textoAeronave()}</dd>
        <dt>Número de série</dt><dd>${dados.numeroSerie}</dd>
        <dt>Modelo</dt><dd>${dados.modelo}</dd>
        <dt>Data de instalação</dt><dd>${formatarData(dados.dataInstalacao)}</dd>
        <dt>Entrada no sistema</dt><dd>${formatarData(dados.entradaSistema)}</dd>
        <dt>Status</dt><dd>${nomesStatus[dados.statusComputador]}</dd>
      </dl>
      ${tabelaPlacas(dados.placas)}
    </div>`
}

function montarRevisao() {
  const computadores = montarComputadores()
  const placas = computadores.flatMap(computador => computador.placas)
  const componentes = placas.flatMap(placa => placa.componentes)
  const metricas = componentes.reduce((total, componente) => total + componente.metricas.length, 0)

  document.querySelector("#resumoTotal").textContent =
    `Serão cadastrados ${computadores.length} ${computadores.length === 1 ? "computador" : "computadores"}, ` +
    `${placas.length} ${placas.length === 1 ? "placa" : "placas"}, ${componentes.length} componentes e ${metricas} métricas.`
  // FIM DA ALTERAÇÃO

  revisao.innerHTML = computadores.map(secaoRevisao).join("")
}


function cadastrarComputadores() {
  const payload = {
    idFuncionarioServer: sessionStorage.getItem("idUsuario"),
    fkAeronaveServer: selectAeronave.value,
    computadoresServer: montarComputadores()
  }

  avancar.disabled = true
  avancar.textContent = "Cadastrando..."

  fetch("/computador/cadastrar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(function (resposta) {
      if (resposta.ok) {
        return resposta.json().then(function () {
          mostrarEtapa(5)
          carregarAeronaves()
        })
      }

      return resposta.text().then(function (textoErro) {
        try {
          const erroJson = JSON.parse(textoErro)
          alert(erroJson.mensagem || erroJson || "Houve um erro ao cadastrar os FMCs.")
        } catch (e) {
          alert(textoErro || "Houve um erro ao cadastrar os FMCs.")
        }
      })
    })
    .catch(function (erro) {
      console.error("Erro na requisição:", erro)
      alert("Erro de conexão com o servidor. Verifique se o back-end está rodando (npm start).")
    })
    .finally(function () {
      avancar.disabled = false
      if (etapaAtual === 4) avancar.textContent = "Cadastrar computadores ✓"
    })
}


avancar.addEventListener("click", () => {
  if (!validarEtapa()) return

  if (etapaAtual === 4) cadastrarComputadores()
  else mostrarEtapa(proximaEtapa())
})

voltar.addEventListener("click", () => mostrarEtapa(etapaAnterior()))

formulario.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-ir-para]")
  if (botao) mostrarEtapa(Number(botao.dataset.irPara))
})


const hoje = new Date()
const dataHoje = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

document.querySelector("#mestreEntradaSistema").value = dataHoje
document.querySelector("#spareEntradaSistema").value = dataHoje

ajustarQuantidade("mestre")
carregarAeronaves()