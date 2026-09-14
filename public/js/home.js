// Garante que só usuário logado acesse esta página.
validarSessao();

const nomeUsuario = sessionStorage.NOME_USUARIO || "Usuário";
const ehGestor = sessionStorage.ADM_USUARIO === "true";

document.getElementById("b_usuario").innerHTML = nomeUsuario;
document.getElementById("userNameDisplay").textContent = nomeUsuario;
document.getElementById("userRoleDisplay").textContent = ehGestor ? "Gestor da Empresa" : "Funcionário";
document.getElementById("userAvatar").textContent = nomeUsuario
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte[0])
    .join("")
    .toUpperCase();

// Só o gestor da empresa pode cadastrar novos funcionários.
restringirItemSidebarAGestor("itemCadastrarFuncionario");
