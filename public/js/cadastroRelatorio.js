const formulario = document.querySelector("#relatorioForm")
const selectAeronave = document.querySelector("#fkAeronave")
const texto = document.querySelector("#texto")
const contador = document.querySelector("#contadorCaracteres")
const botaoRascunho = document.querySelector("#botaoRascunho")
const botaoPublicar = document.querySelector("#botaoPublicar")
const botaoNovoRelatorio = document.querySelector("#botaoNovoRelatorio")
const listaAnalistas = document.querySelector("#listaAnalistas")
const botaoAdicionarAnalista = document.querySelector("#botaoAdicionarAnalista")
const escolherAnalista = document.querySelector("#escolherAnalista")
const selectAnalista = document.querySelector("#selectAnalista")
const campoInicio = document.querySelector("#periodoInicio")
const campoFim = document.querySelector("#periodoFim")

const idUsuario = sessionStorage.getItem("idUsuario")
const nomeUsuario = sessionStorage.getItem("nomeUsuario") || "Usuário"

const nomesComponente = { CPU: "CPU", RAM: "Memória RAM", DISCO: "Disco" }
const iconesComponente = { CPU: "bi-cpu", RAM: "bi-memory", DISCO: "bi-device-hdd" }
const nomesStatusFmc = { ATIVO: "Ativo", INATIVO: "Inativo", MANUTENCAO: "Em manutenção" }
const statusRelatorio = {
  RASCUNHO: { texto: "Rascunho", classe: "rascunho" },
  EM_REVISAO: { texto: "Em revisão", classe: "revisao" },
  PUBLICADO: { texto: "Publicado", classe: "publicado" }
}

let aeronaves = []
let analistasEmpresa = []
let coautores = []          
let autor = { id: Number(idUsuario), nome: nomeUsuario }
let papelUsuario = "AUTOR"  
let idRelatorio = null    
let somenteLeitura = false
let alterado = false       
let meusRelatorios = []
let filtroAtual = "TODOS"
let aeronavesCarregadas = Promise.resolve()

const estruturaSugerida = `Resumo
[Em poucas linhas, qual é a situação da aeronave no período.]

O que foi observado
[O que os dados mostram: picos, tendências, componentes fora do normal.]

Causa provável
[O que pode explicar o comportamento observado.]

Recomendação
[O que deve ser feito: manter, acompanhar, ajustar limites, manutenção.]`



function escaparHtml(valor) {
  const div = document.createElement("div")
  div.textContent = valor == null ? "" : valor
  return div.innerHTML
}

function iniciais(nome) {
  return nome.split(" ").map(parte => parte[0]).slice(0, 2).join("").toUpperCase()
}

function buscarJson(url) {
  return fetch(url).then(function (resposta) {
    if (!resposta.ok) throw new Error(`Erro ${resposta.status} em ${url}`)
    return resposta.json()
  })
}

function dataParaCampo(data) {
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${data.getFullYear()}-${mes}-${dia}`
}

function dataParaTexto(valor) {
  const [ano, mes, dia] = valor.split("-")
  return `${dia}/${mes}/${ano}`
}



function atualizarContador() {
  if (somenteLeitura) {
    contador.textContent = "Relatório publicado. Ele já aparece para a equipe."
    return
  }
  const total = texto.value.length
  contador.textContent = `${total.toLocaleString("pt-BR")} ${total === 1 ? "caractere" : "caracteres"}`
}

function inserirEstrutura() {
  texto.value = texto.value.trim() ? `${estruturaSugerida}\n\n${texto.value}` : estruturaSugerida
  texto.focus()
  alterado = true
  atualizarContador()
}



function validarPeriodo() {
  campoFim.min = campoInicio.value
  campoFim.setCustomValidity(campoInicio.value && campoFim.value && campoFim.value < campoInicio.value
    ? "O fim do período não pode ser antes do início."
    : "")

  const resumo = document.querySelector("#resumoPeriodo")
  if (campoInicio.value && campoFim.value && campoFim.value >= campoInicio.value) {
    const dias = Math.round((new Date(campoFim.value) - new Date(campoInicio.value)) / 86400000) + 1
    resumo.textContent = `${dataParaTexto(campoInicio.value)} a ${dataParaTexto(campoFim.value)} · ${dias} ${dias === 1 ? "dia" : "dias"}`
  } else {
    resumo.textContent = ""
  }

  document.querySelectorAll(".atalho").forEach(botao => {
    botao.classList.toggle("ativo", botao.dataset.periodoAplicado === `${campoInicio.value}|${campoFim.value}`)
  })
}

function definirPeriodo(inicio, fim) {
  campoInicio.value = dataParaCampo(inicio)
  campoFim.value = dataParaCampo(fim)
}

function aplicarAtalho(botao) {
  const hoje = new Date()
  const tipo = botao.dataset.periodo

  if (tipo === "mes") {
    definirPeriodo(new Date(hoje.getFullYear(), hoje.getMonth(), 1), hoje)
  } else if (tipo === "mesPassado") {
    definirPeriodo(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1), new Date(hoje.getFullYear(), hoje.getMonth(), 0))
  } else {
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - Number(tipo) + 1)
    definirPeriodo(inicio, hoje)
  }

  botao.dataset.periodoAplicado = `${campoInicio.value}|${campoFim.value}`
  validarPeriodo()
}

function iniciarPeriodo() {
  const hoje = dataParaCampo(new Date())
  campoInicio.max = hoje
  campoFim.max = hoje

  aplicarAtalho(document.querySelector('.atalho[data-periodo="30"]'))
}



function carregarAeronaves() {
  aeronavesCarregadas = buscarJson(`/aeronave/listar/${idUsuario}`)
    .then(function (lista) {
      aeronaves = lista

      if (lista.length === 0) {
        selectAeronave.innerHTML = '<option value="">Nenhuma aeronave cadastrada na sua empresa</option>'
        return
      }

      selectAeronave.innerHTML = '<option value="">Selecione a aeronave</option>' + lista.map(aeronave =>
        `<option value="${aeronave.id}">${escaparHtml(aeronave.nome)} · ${escaparHtml(aeronave.modelo)}</option>`
      ).join("")
    })
    .catch(function (erro) {
      console.error(erro)
      selectAeronave.innerHTML = '<option value="">Não foi possível carregar as aeronaves</option>'
    })
}

function atualizarPainel() {
  const aeronave = aeronaves.find(item => String(item.id) === selectAeronave.value)

  document.querySelector("#painelVazio").hidden = !!aeronave
  document.querySelector("#painelAeronave").hidden = !aeronave
  document.querySelector("#relatoriosAnteriores").hidden = !aeronave

  if (!aeronave) return

  document.querySelector("#nomeAeronave").textContent = aeronave.nome
  document.querySelector("#modeloAeronave").textContent =
    [aeronave.modelo, aeronave.companhiaAerea].filter(Boolean).join(" · ")
  document.querySelector("#nomeAeronaveLista").textContent = aeronave.nome

  carregarMonitoramento(aeronave.id)
  carregarAnteriores(aeronave.id)
}

function carregarMonitoramento(idAeronave) {
  const lista = document.querySelector("#listaFmcs")
  lista.innerHTML = '<p class="semDados">Carregando...</p>'

  buscarJson(`/computador/monitoramento/${idAeronave}/${idUsuario}`)
    .then(function (computadores) {
      if (computadores.length === 0) {
        lista.innerHTML = '<p class="semDados">Nenhum FMC monitorado nesta aeronave ainda.</p>'
        return
      }

      lista.innerHTML = computadores.map(computador => `
        <div class="blocoFmc">
          <div class="cabecalhoFmc">
            <strong>FMC ${computador.tipoFmc === "MESTRE" ? "Mestre" : "Spare"} · ${nomesStatusFmc[computador.statusComputador] || computador.statusComputador}</strong>
            <span>alerta · crítico</span>
          </div>
          <ul class="listaComponentes">
            ${computador.componentes.map(componente => `
              <li>
                <i class="bi ${iconesComponente[componente.tipo] || "bi-cpu"}" aria-hidden="true"></i>
                <span>${nomesComponente[componente.tipo] || escaparHtml(componente.tipo)}</span>
                <span class="limites"><b class="valorAlerta">${componente.limiteAtencao}%</b> · <b class="valorCritico">${componente.limiteCritico}%</b></span>
              </li>`).join("")}
          </ul>
        </div>`).join("")
    })
    .catch(function (erro) {
      console.error(erro)
      lista.innerHTML = '<p class="semDados">Não foi possível carregar os dados da aeronave.</p>'
    })
}

function carregarAnteriores(idAeronave) {
  const lista = document.querySelector("#listaRelatorios")
  const vazio = document.querySelector("#semRelatorios")
  if (!idAeronave) return

  buscarJson(`/relatorio/anteriores/${idAeronave}/${idUsuario}`)
    .then(function (relatorios) {
      const anteriores = relatorios.filter(relatorio => relatorio.idRelatorio !== idRelatorio)

      vazio.hidden = anteriores.length > 0
      lista.innerHTML = anteriores.map(relatorio => {
        const status = statusRelatorio[relatorio.statusRelatorio] || statusRelatorio.RASCUNHO
        return `
          <li>
            <div>
              <strong>${escaparHtml(relatorio.titulo)}</strong>
              <small>${escaparHtml(relatorio.autor || "Sem autor")} · ${relatorio.dataCriacao}</small>
            </div>
            <span class="statusTag ${status.classe}">${status.texto}</span>
          </li>`
      }).join("")
    })
    .catch(function (erro) {
      console.error(erro)
      vazio.hidden = false
      vazio.textContent = "Não foi possível carregar os relatórios anteriores."
    })
}



function carregarAnalistas() {
  buscarJson(`/usuario/analistas/${idUsuario}`)
    .then(function (lista) {
      analistasEmpresa = lista
      atualizarListaAnalistas()
    })
    .catch(function (erro) {
      console.error(erro)
      botaoAdicionarAnalista.hidden = true
    })
}

function atualizarListaAnalistas() {
  document.querySelector("#nomeAutor").textContent = autor.nome
  document.querySelector("#avatarAutor").textContent = iniciais(autor.nome)

  const podeEditar = papelUsuario === "AUTOR" && !somenteLeitura

  listaAnalistas.querySelectorAll(".coautor").forEach(chip => chip.remove())

  coautores.forEach(analista => {
    const chip = document.createElement("div")
    chip.className = "analista coautor"
    chip.innerHTML = `
      <span class="avatarAnalista">${escaparHtml(iniciais(analista.nome))}</span>
      <span class="dadosAnalista">
        <strong>${escaparHtml(analista.nome)}</strong>
        <small>Coautor</small>
      </span>
      ${podeEditar ? `
      <button class="removerAnalista" type="button" data-remover="${analista.id}" aria-label="Remover ${escaparHtml(analista.nome)}">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>` : ""}`
    listaAnalistas.insertBefore(chip, botaoAdicionarAnalista)
  })


  const vinculados = coautores.map(analista => analista.id).concat(autor.id)
  const disponiveis = analistasEmpresa.filter(analista => !vinculados.includes(analista.id))
  selectAnalista.innerHTML = '<option value="">Selecione...</option>' + disponiveis.map(analista =>
    `<option value="${analista.id}">${escaparHtml(analista.nome)}</option>`).join("")

  botaoAdicionarAnalista.hidden = !podeEditar || disponiveis.length === 0
  if (botaoAdicionarAnalista.hidden) escolherAnalista.hidden = true
}

botaoAdicionarAnalista.addEventListener("click", function () {
  escolherAnalista.hidden = !escolherAnalista.hidden
  if (!escolherAnalista.hidden) selectAnalista.focus()
})

selectAnalista.addEventListener("change", function () {
  const analista = analistasEmpresa.find(item => item.id === Number(selectAnalista.value))
  if (!analista) return
  coautores.push({ id: analista.id, nome: analista.nome })
  escolherAnalista.hidden = true
  alterado = true
  atualizarListaAnalistas()
})

listaAnalistas.addEventListener("click", function (evento) {
  const botao = evento.target.closest("[data-remover]")
  if (!botao) return
  coautores = coautores.filter(analista => analista.id !== Number(botao.dataset.remover))
  alterado = true
  atualizarListaAnalistas()
})



function definirSomenteLeitura(ativo) {
  somenteLeitura = ativo
  formulario.classList.toggle("somenteLeitura", ativo)
  formulario.querySelectorAll("input, select, textarea, button").forEach(campo => { campo.disabled = ativo })
  document.querySelector("#botaoEstrutura").hidden = ativo
  document.querySelectorAll(".atalhosPeriodo .atalho").forEach(botao => { botao.hidden = ativo })
  atualizarListaAnalistas()
  atualizarContador()
}

function mostrarStatus(status) {
  const info = statusRelatorio[status] || statusRelatorio.RASCUNHO
  const tag = document.querySelector("#statusTag")

  document.querySelector("#statusRelatorio").hidden = false
  tag.textContent = info.texto
  tag.className = `statusTag ${info.classe}`

  document.querySelector("#tituloPagina").textContent =
    status === "PUBLICADO" ? "Relatório publicado" : "Editando relatório"
  document.querySelector("#subtituloPagina").textContent = status === "PUBLICADO"
    ? "Relatórios publicados não podem mais ser alterados."
    : "As alterações ficam salvas como rascunho até você publicar."

  botaoNovoRelatorio.hidden = false
  definirSomenteLeitura(status === "PUBLICADO")
}

function podeSairDoRelatorio() {
  return !alterado || somenteLeitura ||
    confirm("Há alterações que ainda não foram salvas. Deseja descartá-las?")
}



function novoRelatorio() {
  if (!podeSairDoRelatorio()) return

  formulario.reset()
  idRelatorio = null
  coautores = []
  autor = { id: Number(idUsuario), nome: nomeUsuario }
  papelUsuario = "AUTOR"
  alterado = false

  document.querySelector("#statusRelatorio").hidden = true
  document.querySelector("#rascunhoSalvo").hidden = true
  document.querySelector("#tituloPagina").textContent = "Novo relatório de análise"
  document.querySelector("#subtituloPagina").textContent = "Registre sua leitura sobre os dados monitorados de uma aeronave."
  botaoNovoRelatorio.hidden = true

  definirSomenteLeitura(false)
  iniciarPeriodo()
  atualizarPainel()
  renderizarMeusRelatorios()

  window.scrollTo({ top: 0, behavior: "smooth" })
  selectAeronave.focus({ preventScroll: true })
}



function carregarMeusRelatorios() {
  return buscarJson(`/relatorio/meus/${idUsuario}`)
    .then(function (lista) {
      meusRelatorios = lista
      renderizarMeusRelatorios()
    })
    .catch(function (erro) {
      console.error(erro)
      const vazio = document.querySelector("#semMeusRelatorios")
      vazio.hidden = false
      vazio.textContent = "Não foi possível carregar os seus relatórios."
    })
}

function renderizarMeusRelatorios() {
  const corpo = document.querySelector("#listaMeusRelatorios")
  const vazio = document.querySelector("#semMeusRelatorios")
  const lista = meusRelatorios.filter(relatorio => filtroAtual === "TODOS" || relatorio.statusRelatorio === filtroAtual)

  vazio.hidden = lista.length > 0
  vazio.textContent = meusRelatorios.length === 0
    ? "Você ainda não tem relatórios salvos."
    : "Nenhum relatório com este status."

  corpo.innerHTML = lista.map(relatorio => {
    const status = statusRelatorio[relatorio.statusRelatorio] || statusRelatorio.RASCUNHO
    const aberto = relatorio.idRelatorio === idRelatorio
    const acao = aberto ? "Aberto" : relatorio.statusRelatorio === "PUBLICADO" ? "Ver" : "Continuar"

    return `
      <tr class="${aberto ? "linhaAberta" : ""}">
        <td>
          <strong>${escaparHtml(relatorio.titulo)}</strong>
          <small>${relatorio.papel === "AUTOR" ? "Autor" : "Coautor"} · criado em ${relatorio.dataCriacao}</small>
        </td>
        <td>${escaparHtml(relatorio.aeronave)}</td>
        <td>${relatorio.periodoInicio} a ${relatorio.periodoFim}</td>
        <td><span class="statusTag ${status.classe}">${status.texto}</span></td>
        <td>
          <button class="botaoAbrir" type="button" data-abrir="${relatorio.idRelatorio}" ${aberto ? "disabled" : ""}>
            ${acao}
          </button>
        </td>
      </tr>`
  }).join("")
}


function abrirRelatorio(id) {
  if (!podeSairDoRelatorio()) return

  Promise.all([buscarJson(`/relatorio/detalhe/${id}/${idUsuario}`), aeronavesCarregadas])
    .then(function ([relatorio]) {
      formulario.reset()
      definirSomenteLeitura(false)

      idRelatorio = relatorio.idRelatorio
      papelUsuario = relatorio.papel
      autor = relatorio.autor || { id: null, nome: "Sem autor" }
      coautores = relatorio.coautores.map(pessoa => ({ id: pessoa.id, nome: pessoa.nome }))

      selectAeronave.value = String(relatorio.fkAeronave)
      document.querySelector("#titulo").value = relatorio.titulo
      campoInicio.value = relatorio.periodoInicio
      campoFim.value = relatorio.periodoFim
      texto.value = relatorio.texto

      const opcao = formulario.querySelector(`input[name="criticidade"][value="${relatorio.criticidade}"]`)
      if (opcao) opcao.checked = true

      validarPeriodo()
      atualizarPainel()
      mostrarStatus(relatorio.statusRelatorio)
      document.querySelector("#rascunhoSalvo").hidden = true
      alterado = false
      renderizarMeusRelatorios()

      window.scrollTo({ top: 0, behavior: "smooth" })
    })
    .catch(function (erro) {
      console.error(erro)
      alert("Não foi possível abrir este relatório.")
    })
}

document.querySelector(".filtrosRelatorios").addEventListener("click", function (evento) {
  const botao = evento.target.closest("[data-filtro]")
  if (!botao) return
  filtroAtual = botao.dataset.filtro
  document.querySelectorAll(".filtro").forEach(filtro => filtro.classList.toggle("ativo", filtro === botao))
  renderizarMeusRelatorios()
})

document.querySelector("#listaMeusRelatorios").addEventListener("click", function (evento) {
  const botao = evento.target.closest("[data-abrir]")
  if (botao) abrirRelatorio(Number(botao.dataset.abrir))
})



function validarParaSalvar(status) {
  const campos = status === "PUBLICADO"
    ? [...formulario.querySelectorAll("input, select, textarea")]
    : [selectAeronave, document.querySelector("#titulo"), campoInicio, campoFim]

  validarPeriodo()

  for (const campo of campos) {
    if (!campo.checkValidity()) {
      campo.reportValidity()
      return false
    }
  }
  return true
}

function montarDados(status) {
  const criticidade = formulario.querySelector('input[name="criticidade"]:checked')

  return {
    idFuncionarioServer: idUsuario,
    fkAeronaveServer: selectAeronave.value,
    tituloServer: document.querySelector("#titulo").value,
    periodoInicioServer: campoInicio.value,
    periodoFimServer: campoFim.value,
    textoServer: texto.value,
    criticidadeServer: criticidade ? criticidade.value : "",
    statusServer: status,
    coautoresServer: coautores.map(analista => analista.id)
  }
}

function salvarRelatorio(status) {
  if (!validarParaSalvar(status)) return

  const url = idRelatorio ? `/relatorio/atualizar/${idRelatorio}` : "/relatorio/cadastrar"
  const metodo = idRelatorio ? "PUT" : "POST"
  const botao = status === "PUBLICADO" ? botaoPublicar : botaoRascunho
  const textoBotao = botao.textContent

  botaoRascunho.disabled = true
  botaoPublicar.disabled = true
  botao.textContent = "Salvando..."

  fetch(url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(montarDados(status))
  })
    .then(function (resposta) {
      if (resposta.ok) {
        return resposta.json().then(function (dados) {
          idRelatorio = dados.idRelatorio
          alterado = false
          mostrarStatus(dados.statusRelatorio)

          const agora = new Date()
          document.querySelector("#horaSalvo").textContent =
            `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`
          document.querySelector("#rascunhoSalvo").hidden = dados.statusRelatorio === "PUBLICADO"

          carregarAnteriores(selectAeronave.value)
          carregarMeusRelatorios()
        })
      }

      return resposta.text().then(function (textoErro) {
        try {
          const erroJson = JSON.parse(textoErro)
          alert(erroJson.mensagem || erroJson || "Houve um erro ao salvar o relatório.")
        } catch (e) {
          alert(textoErro || "Houve um erro ao salvar o relatório.")
        }
      })
    })
    .catch(function (erro) {
      console.error("Erro na requisição:", erro)
      alert("Erro de conexão com o servidor. Verifique se o back-end está rodando (npm start).")
    })
    .finally(function () {
      botao.textContent = textoBotao
      if (!somenteLeitura) {
        botaoRascunho.disabled = false
        botaoPublicar.disabled = false
      }
    })
}



texto.addEventListener("input", atualizarContador)
document.querySelector("#botaoEstrutura").addEventListener("click", inserirEstrutura)
campoInicio.addEventListener("change", validarPeriodo)
campoFim.addEventListener("change", validarPeriodo)
document.querySelectorAll(".atalho").forEach(botao => botao.addEventListener("click", () => {
  aplicarAtalho(botao)
  alterado = true
}))
selectAeronave.addEventListener("change", atualizarPainel)
botaoRascunho.addEventListener("click", () => salvarRelatorio("RASCUNHO"))
botaoPublicar.addEventListener("click", () => salvarRelatorio("PUBLICADO"))
botaoNovoRelatorio.addEventListener("click", novoRelatorio)
formulario.addEventListener("input", () => { alterado = true })
formulario.addEventListener("change", () => { alterado = true })

window.addEventListener("beforeunload", function (evento) {
  if (alterado && !somenteLeitura) evento.preventDefault()
})

atualizarListaAnalistas()
atualizarContador()
iniciarPeriodo()
carregarAeronaves()
carregarAnalistas()
carregarMeusRelatorios()
