const dadosDisco = "011111" + "113432" + "222232" + "232221" + "111111" + "112111" + "123333" + "344421";
const dadosRam   = "011111" + "112111" + "111111" + "111211" + "112221" + "111111" + "111112" + "334441";
const dadosCpu   = "011111" + "111211" + "111222" + "221111" + "111211" + "211112" + "221111" + "111100";
function montarLinha(idElemento, dados) {
    const linha = document.getElementById(idElemento);

    for (let i = 0; i < dados.length; i++) {
        linha.innerHTML += '<div class="celula nivel' + dados[i] + '"></div>';
    }
}

montarLinha("celulasDisco", dadosDisco);
montarLinha("celulasRam", dadosRam);
montarLinha("celulasCpu", dadosCpu);
