function inicializarMenuLateral() {
    const mobileToggle = document.getElementById("mobileToggle")
    const sidebar = document.getElementById("sidebar")
    const backdrop = document.getElementById("sidebarBackdrop")

    function fecharSidebar() {
        if (sidebar) sidebar.classList.remove("open")
        if (backdrop) backdrop.classList.remove("open")
    }

    function alternarSidebar() {
        if (sidebar) sidebar.classList.toggle("open")
        if (backdrop) backdrop.classList.toggle("open")
    }

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener("click", alternarSidebar)
    }

    if (backdrop) {
        backdrop.addEventListener("click", fecharSidebar)
    }
}

inicializarMenuLateral()
