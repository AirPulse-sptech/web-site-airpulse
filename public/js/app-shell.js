// Comportamento compartilhado da casca do app autenticado (sidebar + topbar),
// usado em home.html, cadastro_empresa.html e cadastro_funcionario.html.

// Abre/fecha a sidebar em telas menores através do botão hamburguer da topbar,
// com um fundo escurecido (backdrop) que também fecha o menu ao ser tocado.
(function () {
    const mobileToggle = document.getElementById("mobileToggle");
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    function fecharSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (backdrop) backdrop.classList.remove("open");
    }

    function alternarSidebar() {
        if (sidebar) sidebar.classList.toggle("open");
        if (backdrop) backdrop.classList.toggle("open");
    }

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener("click", alternarSidebar);
    }

    if (backdrop) {
        backdrop.addEventListener("click", fecharSidebar);
    }
})();

// Marca visualmente um item da sidebar como restrito ao perfil de gestor.
// Usado em páginas onde a opção existe, mas só é permitida pra quem
// administra a empresa (ex.: Cadastrar Funcionário).
function restringirItemSidebarAGestor(elementId) {
    const item = document.getElementById(elementId);
    if (!item) return;

    const ehGestor = sessionStorage.ADM_USUARIO === "true";

    if (!ehGestor) {
        item.classList.add("disabled");
        item.removeAttribute("href");
        item.title = "Apenas o gestor da empresa pode acessar esta opção.";

        const badge = document.createElement("span");
        badge.className = "nav-item-badge";
        badge.textContent = "Restrito";
        item.appendChild(badge);
    }
}
