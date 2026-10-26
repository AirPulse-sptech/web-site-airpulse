const formulario = document.querySelector("#companyForm")

const etapas = document.querySelectorAll(".step")
const progresso = document.querySelectorAll("[data-progress]")
const voltar = document.querySelector("#backButton")
const avancar = document.querySelector("#nextButton")
const acoes = document.querySelector("#actions")
const revisao = document.querySelector("#reviewContent")

let etapaAtual = 1

const idEmpresa = new URLSearchParams(window.location.search).get("id")

const baseUrl = (window.location.protocol === "file:" || (window.location.port && window.location.port !== "3333"))
  ? "http://localhost:3333"
  : ""

function mostrarEtapa(numero) {
  etapaAtual = numero

  etapas.forEach(etapa => {
    etapa.hidden = Number(etapa.dataset.step) !== numero
  })

  const etapa = document.querySelector(
    `[data-step="${numero}"]`
  )

  if (etapa) {
    etapa.animate(
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 300 }
    )
  }

  progresso.forEach(item => {
    const posicao = Number(item.dataset.progress)

    item.classList.toggle(
      "active",
      posicao === numero
    )

    item.classList.toggle(
      "done",
      posicao < numero
    )
  })

  voltar.hidden = numero === 1 || numero === 4
  acoes.hidden = numero === 4

  avancar.textContent =
    numero === 3
      ? "Salvar alterações"
      : "Próximo passo ➔"

  if (numero === 3) {
    montarRevisao()
  }

  window.scrollTo({ top: 0, behavior: "smooth" })
}

function validarEtapa() {
  const etapa = document.querySelector(
    `[data-step="${etapaAtual}"]`
  )

  if (!etapa) return true

  const campos = etapa.querySelectorAll(
    "input, select, textarea"
  )

  for (const campo of campos) {
    if (!campo.checkValidity()) {
      campo.reportValidity()
      return false
    }
  }

  return true
}

function valor(id) {
  const campo = document.querySelector(`#${id}`)

  if (!campo || !campo.value) {
    return "Não informado"
  }

  return campo.value
}

function montarRevisao() {
  if (!revisao) return

  revisao.innerHTML = `
    <div class="reviewSection">
      <div class="reviewHeading">
        <h3>Dados da empresa</h3>
        <button type="button" class="editButton" onclick="mostrarEtapa(1)">Editar</button>
      </div>
      <dl class="reviewList">
        <dt>Razão social:</dt><dd>${valor("razaoSocial")}</dd>
        <dt>Nome fantasia:</dt><dd>${valor("nomeFantasia")}</dd>
        <dt>CNPJ:</dt><dd>${valor("cnpj")}</dd>
        <dt>Segmento:</dt><dd>${valor("segmento")}</dd>
        <dt>E-mail:</dt><dd>${valor("emailEmpresa")}</dd>
        <dt>Telefone:</dt><dd>${valor("telefone")}</dd>
      </dl>
    </div>

    <div class="reviewSection">
      <div class="reviewHeading">
        <h3>Endereço</h3>
        <button type="button" class="editButton" onclick="mostrarEtapa(2)">Editar</button>
      </div>
      <dl class="reviewList">
        <dt>CEP:</dt><dd>${valor("cep")}</dd>
        <dt>Logradouro:</dt><dd>${valor("logradouro")}</dd>
        <dt>Bairro:</dt><dd>${valor("bairro")}</dd>
        <dt>Número:</dt><dd>${valor("numero")}</dd>
        <dt>Complemento:</dt><dd>${valor("complemento")}</dd>
        <dt>Estado:</dt><dd>${valor("estado")}</dd>
        <dt>Cidade:</dt><dd>${valor("cidade")}</dd>
      </dl>
    </div>
  `
}

function aplicarMascara(id, mascara) {
  const campo = document.querySelector(`#${id}`)

  if (campo) {
    campo.addEventListener("input", () => {
      campo.value = mascara(campo.value)
    })
  }
}

aplicarMascara("cnpj", val => {
  return val
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
})

aplicarMascara("cep", val => {
  return val
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2")
})

aplicarMascara("telefone", val => {
  return val
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
})

if (avancar) {
  avancar.addEventListener("click", () => {
    if (!validarEtapa()) {
      return
    }

    if (etapaAtual === 3) {
      salvarAlteracoes()
    } else {
      mostrarEtapa(etapaAtual + 1)
    }
  })
}

if (voltar) {
  voltar.addEventListener("click", () => {
    mostrarEtapa(etapaAtual - 1)
  })
}

function preencher(id, texto) {
  const campo = document.querySelector(`#${id}`)

  campo.value = texto || ""
  campo.dispatchEvent(new Event("input"))
}

function carregarEmpresa() {
  fetch(`${baseUrl}/empresas/buscar/${idEmpresa}`)
    .then(function (resposta) {
      if (resposta.ok) {
        return resposta.json().then(function (lista) {
          if (lista.length === 0) {
            alert("Empresa não encontrada.")
            window.location.href = "empresasCadastradas.html"
          } else {
            preencherCampos(lista[0])
          }
        })
      } else {
        alert("Não foi possível carregar os dados da empresa.")
        window.location.href = "empresasCadastradas.html"
      }
    })
    .catch(function (erro) {
      console.error("Erro na requisição:", erro)
      alert("Erro de conexão com o servidor.")
    })
}

function preencherCampos(empresa) {
  const segmento = document.querySelector("#segmento")
  let existe = false

  for (const opcao of segmento.options) {
    if (opcao.value === empresa.segmentoAtuacao) {
      existe = true
    }
  }

  if (!existe) {
    segmento.innerHTML += `<option>${empresa.segmentoAtuacao}</option>`
  }

  preencher("razaoSocial", empresa.razaoSocial)
  preencher("nomeFantasia", empresa.nomeFantasia)
  preencher("cnpj", empresa.cnpj)
  segmento.value = empresa.segmentoAtuacao
  preencher("emailEmpresa", empresa.email)
  preencher("telefone", empresa.telefone)

  preencher("cep", empresa.cep)
  preencher("logradouro", empresa.logradouro)
  preencher("bairro", empresa.bairro)
  preencher("numero", empresa.numero)
  preencher("complemento", empresa.complemento)
  document.querySelector("#estado").value = empresa.estado || ""
  preencher("cidade", empresa.cidade)
}

function salvarAlteracoes() {
  const cnpjLimpo = (document.querySelector("#cnpj")?.value || "").replace(/\D/g, "")
  const cepLimpo = (document.querySelector("#cep")?.value || "").replace(/\D/g, "")
  const telefoneLimpo = (document.querySelector("#telefone")?.value || "").replace(/\D/g, "")

  const payload = {
    razaoSocialServer: document.querySelector("#razaoSocial")?.value || "",
    nomeFantasiaServer: document.querySelector("#nomeFantasia")?.value || "",
    cnpjServer: cnpjLimpo,
    segmentoServer: document.querySelector("#segmento")?.value || "",
    emailEmpresaServer: document.querySelector("#emailEmpresa")?.value || "",
    telefoneEmpresaServer: telefoneLimpo,

    cepServer: cepLimpo,
    logradouroServer: document.querySelector("#logradouro")?.value || "",
    bairroServer: document.querySelector("#bairro")?.value || "",
    numeroServer: document.querySelector("#numero")?.value || "",
    complementoServer: document.querySelector("#complemento")?.value || "",
    estadoServer: document.querySelector("#estado")?.value || "",
    cidadeServer: document.querySelector("#cidade")?.value || ""
  }

  avancar.disabled = true
  avancar.textContent = "Salvando..."

  fetch(`${baseUrl}/empresas/atualizar/${idEmpresa}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
  .then(function (resposta) {
    if (resposta.ok) {
      return resposta.json().then(function () {
        mostrarEtapa(4)
        setTimeout(function () {
          window.location.href = "empresasCadastradas.html"
        }, 3000)
      })
    } else {
      return resposta.text().then(function (textoErro) {
        try {
          var erroJson = JSON.parse(textoErro)
          alert(erroJson.mensagem || textoErro)
        } catch (e) {
          alert(textoErro || "Houve um erro ao salvar as alterações.")
        }
        avancar.disabled = false
        avancar.textContent = "Salvar alterações"
      })
    }
  })
  .catch(function (erro) {
    console.error("Erro na requisição:", erro)
    alert("Erro de conexão com o servidor. Verifique se o servidor backend está rodando no terminal (npm start ou node app.js em http://localhost:3333).")
    avancar.disabled = false
    avancar.textContent = "Salvar alterações"
  })
}

if (formulario) {
  formulario.addEventListener("submit", evento => {
    evento.preventDefault()
  })
}

mostrarEtapa(1)
carregarEmpresa()