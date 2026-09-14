const formulario = document.querySelector("#company-form");

// Access control: ensure only the AirPulse admin can view this page
const requiredEmail = "air.pulse@airpulse.com";
if (sessionStorage.EMAIL_USUARIO !== requiredEmail) {
  // Redirect to login if not authorized
  window.location.href = "login.html";
}
const etapas = document.querySelectorAll(".step");
const progresso = document.querySelectorAll("[data-progress]");
const voltar = document.querySelector("#back-button");
const avancar = document.querySelector("#next-button");
const acoes = document.querySelector("#actions");
const revisao = document.querySelector("#review-content");

let etapaAtual = 1;

/* Mostra a etapa escolhida e esconde as outras */
function mostrarEtapa(numero) {
  etapaAtual = numero;

  etapas.forEach(etapa => {
    etapa.hidden = Number(etapa.dataset.step) !== numero;
  });

  const etapa = document.querySelector(
    `[data-step="${numero}"]`
  );

  if (etapa) {
    etapa.animate(
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 300 }
    );
  }

  progresso.forEach(item => {
    const posicao = Number(item.dataset.progress);

    item.classList.toggle(
      "active",
      posicao === numero
    );

    item.classList.toggle(
      "done",
      posicao < numero
    );
  });

  voltar.hidden = numero === 1 || numero === 5;
  acoes.hidden = numero === 5;

  avancar.textContent =
    numero === 4
      ? "Finalizar cadastro"
      : "Próximo passo ➔";

  if (numero === 4) {
    montarRevisao();
  }

  // Rolar suavemente para o topo do formulário ao mudar de etapa
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Valida os campos da etapa atual */
function validarEtapa() {
  const etapa = document.querySelector(
    `[data-step="${etapaAtual}"]`
  );

  if (!etapa) return true;

  const campos = etapa.querySelectorAll(
    "input, select, textarea"
  );

  for (const campo of campos) {
    if (!campo.checkValidity()) {
      campo.reportValidity();
      return false;
    }
  }

  if (etapaAtual === 3) {
    const senha = document.querySelector("#senha");
    const confirmar = document.querySelector(
      "#confirmar-senha"
    );

    if (senha && confirmar && senha.value !== confirmar.value) {
      alert("As senhas não coincidem.");
      confirmar.focus();
      return false;
    }
  }

  return true;
}

/* Pega o valor de um campo */
function valor(id) {
  const campo = document.querySelector(`#${id}`);

  if (!campo || !campo.value) {
    return "Não informado";
  }

  return campo.value;
}

/* Monta a tela de confirmação */
function montarRevisao() {
  if (!revisao) return;

  revisao.innerHTML = `
    <div class="review-section">
      <div class="review-heading">
        <h3>Dados da empresa</h3>
        <button type="button" class="edit-button" onclick="mostrarEtapa(1)">Editar</button>
      </div>
      <dl class="review-list">
        <dt>Razão social:</dt><dd>${valor("razao-social")}</dd>
        <dt>Nome fantasia:</dt><dd>${valor("nome-fantasia")}</dd>
        <dt>CNPJ:</dt><dd>${valor("cnpj")}</dd>
        <dt>Segmento:</dt><dd>${valor("segmento")}</dd>
        <dt>E-mail:</dt><dd>${valor("email-empresa")}</dd>
      </dl>
    </div>

    <div class="review-section">
      <div class="review-heading">
        <h3>Endereço</h3>
        <button type="button" class="edit-button" onclick="mostrarEtapa(2)">Editar</button>
      </div>
      <dl class="review-list">
        <dt>CEP:</dt><dd>${valor("cep")}</dd>
        <dt>Logradouro:</dt><dd>${valor("logradouro")}</dd>
        <dt>Bairro:</dt><dd>${valor("bairro")}</dd>
        <dt>Número:</dt><dd>${valor("numero")}</dd>
        <dt>Estado:</dt><dd>${valor("estado")}</dd>
        <dt>Cidade:</dt><dd>${valor("cidade")}</dd>
      </dl>
    </div>

    <div class="review-section full">
      <div class="review-heading">
        <h3>Responsável</h3>
        <button type="button" class="edit-button" onclick="mostrarEtapa(3)">Editar</button>
      </div>
      <dl class="review-list">
        <dt>Nome:</dt><dd>${valor("responsavel")}</dd>
        <dt>E-mail:</dt><dd>${valor("email-responsavel")}</dd>
        <dt>Telefone:</dt><dd>${valor("telefone")}</dd>
        <dt>Cargo:</dt><dd>${valor("cargo")}</dd>
        <dt>CPF:</dt><dd>${valor("cpf")}</dd>
        <dt>Senha:</dt><dd>••••••••</dd>
      </dl>
    </div>
  `;
}

/* Aplica uma máscara em um campo */
function aplicarMascara(id, mascara) {
  const campo = document.querySelector(`#${id}`);

  if (campo) {
    campo.addEventListener("input", () => {
      campo.value = mascara(campo.value);
    });
  }
}

/* Máscara de CNPJ */
aplicarMascara("cnpj", val => {
  return val
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
});

/* Máscara de CPF */
aplicarMascara("cpf", val => {
  return val
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
});

/* Máscara de CEP */
aplicarMascara("cep", val => {
  return val
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
});

/* Máscara de telefone */
aplicarMascara("telefone", val => {
  return val
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
});

/* Botão mostrar / ocultar senha */
document.querySelectorAll(".show-password").forEach(button => {
  button.addEventListener("click", () => {
    const inputId = button.getAttribute("data-password");
    const input = document.getElementById(inputId);
    if (input) {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "Ocultar" : "Mostrar";
    }
  });
});

/* Avança para a próxima etapa ou finaliza */
if (avancar) {
  avancar.addEventListener("click", () => {
    if (!validarEtapa()) {
      return;
    }

    if (etapaAtual === 4) {
      cadastrarEmpresa();
    } else {
      mostrarEtapa(etapaAtual + 1);
    }
  });
}

/* Volta para a etapa anterior */
if (voltar) {
  voltar.addEventListener("click", () => {
    mostrarEtapa(etapaAtual - 1);
  });
}

/* Função que realiza o envio dos dados para o backend */
function cadastrarEmpresa() {
  const cnpjLimpo = (document.querySelector("#cnpj")?.value || "").replace(/\D/g, "");
  const cpfLimpo = (document.querySelector("#cpf")?.value || "").replace(/\D/g, "");
  const cepLimpo = (document.querySelector("#cep")?.value || "").replace(/\D/g, "");
  const telefoneResponsavelLimpo = (document.querySelector("#telefone")?.value || "").replace(/\D/g, "");

  const telefoneEmpresaEl = document.querySelector("#telefone-empresa");
  const telefoneEmpresaLimpo = telefoneEmpresaEl ? telefoneEmpresaEl.value.replace(/\D/g, "") : telefoneResponsavelLimpo;

  const complementoEl = document.querySelector("#complemento");
  const complementoVal = complementoEl ? complementoEl.value : "";

  const payload = {
    razaoSocialServer: document.querySelector("#razao-social")?.value || "",
    nomeFantasiaServer: document.querySelector("#nome-fantasia")?.value || "",
    cnpjServer: cnpjLimpo,
    segmentoServer: document.querySelector("#segmento")?.value || "",
    websiteServer: document.querySelector("#website")?.value || "",
    emailEmpresaServer: document.querySelector("#email-empresa")?.value || "",
    telefoneEmpresaServer: telefoneEmpresaLimpo,

    cepServer: cepLimpo,
    logradouroServer: document.querySelector("#logradouro")?.value || "",
    bairroServer: document.querySelector("#bairro")?.value || "",
    numeroServer: document.querySelector("#numero")?.value || "",
    complementoServer: complementoVal,
    estadoServer: document.querySelector("#estado")?.value || "",
    cidadeServer: document.querySelector("#cidade")?.value || "",

    nomeResponsavelServer: document.querySelector("#responsavel")?.value || "",
    emailResponsavelServer: document.querySelector("#email-responsavel")?.value || "",
    telefoneResponsavelServer: telefoneResponsavelLimpo,
    cargoResponsavelServer: document.querySelector("#cargo")?.value || "",
    cpfResponsavelServer: cpfLimpo,
    senhaResponsavelServer: document.querySelector("#senha")?.value || ""
  };

  avancar.disabled = true;
  avancar.textContent = "Cadastrando...";

  const baseUrl = (window.location.protocol === "file:" || (window.location.port && window.location.port !== "3333"))
    ? "http://localhost:3333"
    : "";

  fetch(`${baseUrl}/empresas/cadastrar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
  .then(function (resposta) {
    if (resposta.ok) {
      return resposta.json().then(function () {
        mostrarEtapa(5);
        setTimeout(function () {
          window.location.href = "login.html";
        }, 4000);
      });
    } else {
      return resposta.text().then(function (textoErro) {
        try {
          var erroJson = JSON.parse(textoErro);
          alert(erroJson.mensagem || textoErro);
        } catch (e) {
          alert(textoErro || "Houve um erro ao realizar o cadastro.");
        }
        avancar.disabled = false;
        avancar.textContent = "Finalizar cadastro";
      });
    }
  })
  .catch(function (erro) {
    console.error("Erro na requisição:", erro);
    alert("Erro de conexão com o servidor. Verifique se o servidor backend está rodando no terminal (npm start ou node app.js em http://localhost:3333).");
    avancar.disabled = false;
    avancar.textContent = "Finalizar cadastro";
  });
}

/* Impede que a página seja recarregada no submit */
if (formulario) {
  formulario.addEventListener("submit", evento => {
    evento.preventDefault();
  });
}

/* Exibe nome do usuário logado na sidebar*/
if (sessionStorage.NOME_USUARIO) {
  const displayNome = document.getElementById("userNameDisplay");
  if (displayNome) {
    displayNome.textContent = sessionStorage.NOME_USUARIO;
  }
}

/* Inicia o formulário na primeira etapa */
mostrarEtapa(1);