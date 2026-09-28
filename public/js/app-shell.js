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

function restringirItemSidebarAGestor(elementId) {
    const item = document.getElementById(elementId);
    if (!item) return;

    const ehGestor = sessionStorage.CARGO_USUARIO === "Gestor de operações";

    if (!ehGestor) {
        item.remove();
    }
}